package com.deepduel.server;

import com.deepduel.server.battle.Battle;
import com.deepduel.server.battle.BotBrain;
import com.deepduel.server.battle.Sub;
import com.deepduel.server.battle.SubStats;
import com.deepduel.server.net.MiniWebServer;
import com.deepduel.server.net.StaticFiles;
import com.deepduel.server.net.WsConnection;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.File;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * The whole game server. Network threads only parse frames; every piece of game state is
 * touched exclusively from the single "dd-logic" thread, so no locking is needed.
 */
public final class GameServer implements MiniWebServer.Handler {
    public static final String VERSION = "1.1.0";
    public static final int PROTOCOL = 2;
    private static final int TICK_HZ = Battle.TICK_HZ;
    /** a snapshot goes out every N simulation ticks (30 / 2 = 15 per second) */
    private static final int SNAPSHOT_EVERY = Battle.SNAP_EVERY;
    private static final double DT = 1.0 / TICK_HZ;

    private static final class Session {
        final WsConnection c;
        PlayerData p;
        int badAdmin;
        String catalogVersion = "";

        Session(WsConnection c) {
            this.c = c;
        }
    }

    private final Storage storage;
    private final StaticFiles files;
    private final int portOverride;
    private Economy eco;
    private MiniWebServer web;
    private ScheduledExecutorService loop;
    private final SecureRandom secure = new SecureRandom();
    private final Random rng = new Random();

    private final Map<WsConnection, Session> sessions = new HashMap<>();
    private final Map<String, Session> online = new HashMap<>();
    private final Map<String, PlayerData> byToken = new HashMap<>();
    private final LinkedHashMap<String, Long> queue = new LinkedHashMap<>();
    private final Map<String, Battle> battleOf = new HashMap<>();
    private final List<Battle> battles = new ArrayList<>();
    /** players whose file must be rewritten on the next save */
    private final Set<PlayerData> dirtyPlayers = new HashSet<>();
    private boolean ordersDirty, metaDirty;
    private long lastSave;
    private java.util.concurrent.ScheduledFuture<?> tickTask;
    /** leaderboard is sorted at most every few seconds, not on every request */
    private List<PlayerData> lbCache;
    private long lbTime;
    private long slowTicks;

    private volatile int statOnline, statBattles, statPlayers;
    private volatile boolean running;

    public GameServer(File dataDir, StaticFiles files, int portOverride) {
        this.storage = new Storage(dataDir);
        this.files = files;
        this.portOverride = portOverride;
    }

    // ------------------------------------------------------------------ lifecycle

    public synchronized void start() throws IOException {
        if (running) return;
        storage.load();
        ServerConfig cfg = storage.config;
        if (cfg.adminKey == null || cfg.adminKey.isEmpty()) cfg.adminKey = randomHex(4).toUpperCase();
        if (cfg.serverId == null || cfg.serverId.isEmpty()) cfg.serverId = randomHex(8);
        if (cfg.seasonStart == null || cfg.seasonStart.isEmpty()) cfg.seasonStart = java.time.LocalDate.now().toString();
        if (portOverride > 0) cfg.port = portOverride;
        cfg.migrate();
        storage.saveConfig();
        eco = new Economy(cfg);
        byToken.clear();
        for (PlayerData p : storage.data.players.values()) byToken.put(p.token, p);
        statPlayers = storage.data.players.size();
        web = new MiniWebServer(cfg.port, files, this);
        web.start();
        loop = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "dd-logic");
            t.setDaemon(true);
            return t;
        });
        running = true;
        // the 30 Hz battle loop only runs while at least one battle is going (saves battery on a phone server)
        loop.scheduleAtFixedRate(safe(this::slowTick), 500, 500, TimeUnit.MILLISECONDS);
        if (storage.needsFullSave()) {
            dirtyPlayers.addAll(storage.data.players.values());
            ordersDirty = metaDirty = true;
        }
        log("server started on port " + cfg.port + ", admin key " + cfg.adminKey + ", data " + storage.dir());
    }

    public synchronized void stop() {
        if (!running) return;
        running = false;
        try {
            Future<?> f = loop.submit(this::saveNow);
            f.get(5, TimeUnit.SECONDS);
            storage.flush(5000);
        } catch (Exception e) {
            log("final save failed: " + e);
        }
        web.stop();
        loop.shutdownNow();
        log("server stopped");
    }

    public boolean isRunning() {
        return running;
    }

    public int port() {
        return storage.config.port;
    }

    public String adminKey() {
        return storage.config.adminKey;
    }

    public String serverName() {
        return storage.config.serverName;
    }

    public int onlineCount() {
        return statOnline;
    }

    public int battleCount() {
        return statBattles;
    }

    public int playerCount() {
        return statPlayers;
    }

    private Runnable safe(Runnable r) {
        return () -> {
            try {
                r.run();
            } catch (Throwable t) {
                log("error: " + t);
                t.printStackTrace();
            }
        };
    }

    private void post(Runnable r) {
        if (!running) return;
        try {
            loop.execute(safe(r));
        } catch (Exception ignored) {
        }
    }

    private static void log(String s) {
        System.out.println("[deepduel] " + s);
    }

    private String randomHex(int bytes) {
        byte[] b = new byte[bytes];
        secure.nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format("%02x", x & 0xff));
        return sb.toString();
    }

    // ------------------------------------------------------------------ network callbacks (network threads)

    @Override
    public void onOpen(WsConnection c) {
        post(() -> {
            sessions.put(c, new Session(c));
            JsonObject w = new JsonObject();
            w.addProperty("t", "welcome");
            w.addProperty("name", storage.config.serverName);
            w.addProperty("serverId", storage.config.serverId);
            w.addProperty("version", VERSION);
            w.addProperty("protocol", PROTOCOL);
            w.addProperty("paymentMode", storage.config.paymentMode);
            w.addProperty("catalogVersion", Catalog.version());
            c.send(w.toString());
        });
    }

    @Override
    public void onMessage(WsConnection c, String text) {
        post(() -> {
            Session s = sessions.get(c);
            if (s != null) handle(s, text);
        });
    }

    @Override
    public void onClose(WsConnection c) {
        post(() -> {
            Session s = sessions.remove(c);
            if (s == null || s.p == null) return;
            if (online.get(s.p.id) == s) {
                online.remove(s.p.id);
                queue.remove(s.p.id);
                Battle b = battleOf.get(s.p.id);
                if (b != null) for (Sub sub : b.subs) if (s.p.id.equals(sub.playerId)) sub.connected = false;
                s.p.lastSeen = System.currentTimeMillis();
                dirtyPlayers.add(s.p);
            }
        });
    }

    // ------------------------------------------------------------------ ticking (game thread)

    private void startTicking() {
        if (tickTask == null) tickTask = loop.scheduleAtFixedRate(safe(this::tick), 0, 1_000_000 / TICK_HZ, TimeUnit.MICROSECONDS);
    }

    private void tick() {
        for (Battle b : new ArrayList<>(battles)) {
            b.tick(DT);
            // the world is simulated 30 times a second, but sent only 15 times: clients interpolate
            // between snapshots and simulate straight-flying projectiles themselves
            if (b.ticks % SNAPSHOT_EVERY == 0 || b.finished()) {
                for (Sub sub : b.subs) {
                    if (sub.isBot()) continue;
                    Session ss = online.get(sub.playerId);
                    if (ss != null && battleOf.get(sub.playerId) == b) ss.c.send(b.snapshot(sub.idx));
                }
                b.clearEvents();
            }
            if (b.finished()) finishBattle(b);
        }
        if (battles.isEmpty() && tickTask != null) {
            tickTask.cancel(false);
            tickTask = null;
        }
    }

    private void slowTick() {
        slowTicks++;
        matchmake();
        long now = System.currentTimeMillis();
        if (slowTicks % 4 == 0 && !queue.isEmpty()) {
            for (String pid : queue.keySet()) {
                Session s = online.get(pid);
                if (s == null) continue;
                JsonObject q = new JsonObject();
                q.addProperty("t", "queue");
                q.addProperty("searching", queue.size());
                q.addProperty("online", online.size());
                q.addProperty("waited", (now - queue.get(pid)) / 1000);
                q.addProperty("botAfter", storage.config.showBotTag ? storage.config.botWaitSeconds : 0);
                s.c.send(q.toString());
            }
        }
        if ((!dirtyPlayers.isEmpty() || ordersDirty || metaDirty) && now - lastSave > 10_000) saveNow();
        statOnline = online.size();
        statBattles = battles.size();
        statPlayers = storage.data.players.size();
    }

    /** Writes only what changed since the last save (disk IO happens on a background thread). */
    private void saveNow() {
        storage.save(new ArrayList<>(dirtyPlayers), ordersDirty, metaDirty);
        dirtyPlayers.clear();
        ordersDirty = metaDirty = false;
        lastSave = System.currentTimeMillis();
    }

    // ------------------------------------------------------------------ matchmaking & battles

    private void matchmake() {
        if (queue.isEmpty()) return;
        long now = System.currentTimeMillis();
        List<String> ids = new ArrayList<>(queue.keySet());
        Set<String> used = new HashSet<>();
        for (int i = 0; i < ids.size(); i++) {
            String a = ids.get(i);
            if (used.contains(a)) continue;
            PlayerData pa = storage.data.players.get(a);
            if (pa == null || !online.containsKey(a)) {
                used.add(a);
                continue;
            }
            double waitA = (now - queue.get(a)) / 1000.0;
            String best = null;
            int bestDiff = Integer.MAX_VALUE;
            for (int j = i + 1; j < ids.size(); j++) {
                String bId = ids.get(j);
                if (used.contains(bId)) continue;
                PlayerData pb = storage.data.players.get(bId);
                if (pb == null || !online.containsKey(bId)) continue;
                double waitB = (now - queue.get(bId)) / 1000.0;
                int diff = Math.abs(pa.trophies - pb.trophies);
                double allowed = 150 + 40 * Math.max(waitA, waitB);
                if (diff <= allowed && diff < bestDiff) {
                    bestDiff = diff;
                    best = bId;
                }
            }
            if (best != null) {
                used.add(a);
                used.add(best);
                startBattle(pa, storage.data.players.get(best));
            } else if (storage.config.botWaitSeconds > 0 && waitA >= storage.config.botWaitSeconds) {
                used.add(a);
                startBotBattle(pa);
            }
        }
        for (String u : used) queue.remove(u);
    }

    private Sub subOf(int idx, PlayerData p) {
        return new Sub(idx, p.id, p.name, p.trophies, p.level, SubStats.of(p));
    }

    private void register(Battle b) {
        battles.add(b);
        startTicking();
        for (Sub s : b.subs) {
            if (s.isBot()) continue;
            battleOf.put(s.playerId, b);
            Session ss = online.get(s.playerId);
            if (ss != null) ss.c.send(b.startJson(s.idx, storage.config.showBotTag));
        }
    }

    private void startBattle(PlayerData a, PlayerData b) {
        if (rng.nextBoolean()) {
            PlayerData t = a;
            a = b;
            b = t;
        }
        Battle bt = new Battle(randomHex(6), rng.nextLong(), subOf(0, a), subOf(1, b), storage.config.battleSeconds);
        register(bt);
        log("battle " + a.name + " vs " + b.name);
    }

    private void startBotBattle(PlayerData p) {
        int sum = 0;
        for (String part : Catalog.PART_IDS) sum += p.part(part);
        double avg = sum / (double) Catalog.PART_IDS.length;
        double skill = Math.min(1, 0.1 + p.trophies / 2500.0);
        Map<String, Integer> parts = new HashMap<>();
        for (String part : Catalog.PART_IDS) {
            int l = (int) Math.round(avg + rng.nextInt(3) - (p.trophies < 200 ? 1.5 : 1));
            parts.put(part, Math.max(1, Math.min(Catalog.MAX_PART, l)));
        }
        int maxRarity = 0, wlSum = 0, wlCount = 0;
        for (Map.Entry<String, PlayerData.WeaponOwn> e : p.weapons.entrySet()) {
            Catalog.WeaponDef d = Catalog.WEAPONS.get(e.getKey());
            if (d == null) continue;
            maxRarity = Math.max(maxRarity, Catalog.rarityIndex(d.rarity));
            wlSum += e.getValue().level;
            wlCount++;
        }
        int wLevel = Math.max(1, wlCount == 0 ? 1 : Math.round(wlSum / (float) wlCount));
        int hull = parts.get("hull");
        Map<String, Integer> levels = new HashMap<>();
        List<String> guns = pickWeapons("gun", Catalog.gunSlots(hull), maxRarity, wLevel, levels);
        List<String> torps = pickWeapons("torp", Catalog.torpSlots(hull), maxRarity, wLevel, levels);
        List<String> skins = new ArrayList<>(Catalog.SKINS.keySet());
        String skin = rng.nextInt(10) < 5 ? "classic" : skins.get(rng.nextInt(skins.size()));
        SubStats st = SubStats.of(parts, levels, guns, torps, skin);
        Set<String> taken = new HashSet<>();
        for (PlayerData x : storage.data.players.values()) taken.add(x.name.toLowerCase());
        String name = BotNames.generate(rng, taken);
        int trophies = Math.max(0, p.trophies + rng.nextInt(81) - 40);
        Sub bot = new Sub(1, null, name, trophies, Math.max(1, p.level + rng.nextInt(3) - 1), st);
        bot.brain = new BotBrain(rng.nextLong(), skill);
        Battle bt = new Battle(randomHex(6), rng.nextLong(), subOf(0, p), bot, storage.config.battleSeconds);
        register(bt);
        log("battle " + p.name + " vs " + name);
    }

    private List<String> pickWeapons(String type, int slots, int maxRarity, int level, Map<String, Integer> levels) {
        List<Catalog.WeaponDef> pool = new ArrayList<>();
        for (Catalog.WeaponDef d : Catalog.WEAPONS.values())
            if (d.type.equals(type) && Catalog.rarityIndex(d.rarity) <= maxRarity) pool.add(d);
        List<String> out = new ArrayList<>();
        for (int i = 0; i < slots && !pool.isEmpty(); i++) {
            Catalog.WeaponDef d = pool.remove(rng.nextInt(pool.size()));
            out.add(d.id);
            levels.put(d.id, Math.max(1, Math.min(Catalog.MAX_WEAPON, level + rng.nextInt(3) - 1)));
        }
        return out;
    }

    private void finishBattle(Battle b) {
        battles.remove(b);
        storage.data.battlesPlayed++;
        metaDirty = true;
        long now = System.currentTimeMillis();
        for (Sub s : b.subs) {
            if (s.isBot()) continue;
            battleOf.remove(s.playerId);
            PlayerData p = storage.data.players.get(s.playerId);
            if (p == null) continue;
            Sub o = b.other(s);
            int outcome = b.winner == -1 ? 0 : (b.winner == s.idx ? 1 : -1);
            JsonObject r = eco.battleReward(p, outcome, o.trophies, b.vsBot, now);
            r.addProperty("reason", b.endReason);
            r.addProperty("damage", Math.round(s.damageDealt));
            r.addProperty("taken", Math.round(s.st.maxHp - s.hp));
            r.addProperty("shots", s.shots);
            r.addProperty("hits", s.hits);
            r.addProperty("oppName", o.name);
            r.addProperty("oppBot", o.isBot() && storage.config.showBotTag);
            Session ss = online.get(s.playerId);
            if (ss != null) {
                JsonObject m = new JsonObject();
                m.addProperty("t", "end");
                m.add("result", r);
                m.add("profile", eco.profile(p, now));
                ss.c.send(m.toString());
            }
            dirtyPlayers.add(p);
        }
    }

    // ------------------------------------------------------------------ requests

    private static String str(JsonObject m, String k) {
        JsonElement e = m.get(k);
        return e == null || e.isJsonNull() ? "" : e.getAsString();
    }

    private static int num(JsonObject m, String k) {
        JsonElement e = m.get(k);
        try {
            return e == null || e.isJsonNull() ? 0 : e.getAsInt();
        } catch (Exception ex) {
            return 0;
        }
    }

    private static double dbl(JsonObject m, String k) {
        JsonElement e = m.get(k);
        try {
            double v = e == null || e.isJsonNull() ? 0 : e.getAsDouble();
            return Double.isNaN(v) ? 0 : v;
        } catch (Exception ex) {
            return 0;
        }
    }

    private static boolean bool(JsonObject m, String k) {
        JsonElement e = m.get(k);
        try {
            return e != null && !e.isJsonNull() && (e.getAsJsonPrimitive().isBoolean() ? e.getAsBoolean() : e.getAsInt() != 0);
        } catch (Exception ex) {
            return false;
        }
    }

    private void reply(Session s, JsonElement id, JsonObject data) {
        if (id == null) return;
        JsonObject r = new JsonObject();
        r.addProperty("t", "res");
        r.add("id", id);
        r.addProperty("ok", true);
        r.add("d", data == null ? new JsonObject() : data);
        s.c.send(r.toString());
    }

    private void replyError(Session s, JsonElement id, String err) {
        if (id == null) {
            notice(s, err);
            return;
        }
        JsonObject r = new JsonObject();
        r.addProperty("t", "res");
        r.add("id", id);
        r.addProperty("ok", false);
        r.addProperty("err", err);
        s.c.send(r.toString());
    }

    private void notice(Session s, String text) {
        JsonObject n = new JsonObject();
        n.addProperty("t", "notice");
        n.addProperty("text", text);
        s.c.send(n.toString());
    }

    private JsonObject withProfile(JsonObject result, PlayerData p) {
        JsonObject d = new JsonObject();
        if (result != null) d.add("result", result);
        d.add("profile", eco.profile(p, System.currentTimeMillis()));
        dirtyPlayers.add(p);
        return d;
    }

    private Sub battleSub(PlayerData p) {
        Battle b = battleOf.get(p.id);
        if (b == null) return null;
        for (Sub s : b.subs) if (p.id.equals(s.playerId)) return s;
        return null;
    }

    private void handle(Session s, String text) {
        JsonObject m;
        try {
            m = JsonParser.parseString(text).getAsJsonObject();
        } catch (Exception e) {
            return;
        }
        String t = str(m, "t");
        JsonElement id = m.get("id");
        try {
            switch (t) {
                case "ping": {
                    JsonObject o = new JsonObject();
                    o.addProperty("t", "pong");
                    o.add("c", m.get("c"));
                    s.c.send(o.toString());
                    return;
                }
                case "register":
                    s.catalogVersion = str(m, "cv");
                    register(s, id, str(m, "name"));
                    return;
                case "auth":
                    s.catalogVersion = str(m, "cv");
                    auth(s, id, str(m, "token"));
                    return;
                case "admin":
                    admin(s, id, m);
                    return;
                default:
                    break;
            }
            if (s.p == null) throw new Economy.GameException("Сначала войдите в игру");
            PlayerData p = s.p;
            long now = System.currentTimeMillis();
            switch (t) {
                case "input": {
                    Sub sub = battleSub(p);
                    if (sub == null) return;
                    sub.jx = Math.max(-1, Math.min(1, dbl(m, "x")));
                    sub.jy = Math.max(-1, Math.min(1, dbl(m, "y")));
                    sub.fire = bool(m, "f");
                    sub.boost = bool(m, "b");
                    return;
                }
                case "act": {
                    Sub sub = battleSub(p);
                    if (sub == null) return;
                    String a = str(m, "a");
                    if (a.equals("torp")) sub.torpReq = num(m, "i");
                    else if (a.equals("sonar")) sub.sonarReq = true;
                    return;
                }
                case "profile":
                    reply(s, id, withProfile(null, p));
                    return;
                case "rename": {
                    String name = cleanName(str(m, "name"));
                    PlayerData other = findByName(name);
                    if (other != null && other != p) throw new Economy.GameException("Это имя уже занято");
                    p.name = name;
                    reply(s, id, withProfile(null, p));
                    return;
                }
                case "upgrade_part":
                    reply(s, id, withProfile(eco.upgradePart(p, str(m, "part")), p));
                    return;
                case "upgrade_weapon":
                    reply(s, id, withProfile(eco.upgradeWeapon(p, str(m, "weapon")), p));
                    return;
                case "equip":
                    eco.equip(p, str(m, "slot"), num(m, "index"), str(m, "weapon"));
                    reply(s, id, withProfile(null, p));
                    return;
                case "skin":
                    eco.setSkin(p, str(m, "skin"));
                    reply(s, id, withProfile(null, p));
                    return;
                case "open_crate":
                    reply(s, id, withProfile(eco.openCrate(p, str(m, "crate")), p));
                    return;
                case "bp_claim":
                    reply(s, id, withProfile(eco.claimBp(p, num(m, "level"), str(m, "track")), p));
                    return;
                case "gem_buy":
                    reply(s, id, withProfile(eco.gemBuy(p, str(m, "item")), p));
                    return;
                case "buy":
                    buy(s, id, p, str(m, "product"), str(m, "param"), now);
                    return;
                case "my_orders": {
                    JsonArray list = new JsonArray();
                    for (Storage.Order o : storage.data.orders)
                        if (o.playerId.equals(p.id) && !o.test) list.add(orderJson(o));
                    JsonObject d = new JsonObject();
                    d.add("orders", list);
                    reply(s, id, d);
                    return;
                }
                case "queue_join": {
                    if (battleOf.containsKey(p.id)) throw new Economy.GameException("Вы уже в бою");
                    if (!queue.containsKey(p.id)) queue.put(p.id, now);
                    JsonObject d = new JsonObject();
                    d.addProperty("botAfter", storage.config.showBotTag ? storage.config.botWaitSeconds : 0);
                    d.addProperty("online", online.size());
                    reply(s, id, d);
                    return;
                }
                case "queue_leave":
                    queue.remove(p.id);
                    reply(s, id, null);
                    return;
                case "surrender": {
                    Battle b = battleOf.get(p.id);
                    Sub sub = battleSub(p);
                    if (b != null && sub != null && !b.finished()) b.finish(1 - sub.idx, "surrender");
                    reply(s, id, null);
                    return;
                }
                case "leaderboard":
                    reply(s, id, leaderboard(p));
                    return;
                default:
                    throw new Economy.GameException("Неизвестная команда: " + t);
            }
        } catch (Economy.GameException e) {
            replyError(s, id, e.getMessage());
        } catch (Exception e) {
            log("request " + t + " failed: " + e);
            e.printStackTrace();
            replyError(s, id, "Ошибка сервера");
        }
    }

    private String cleanName(String raw) {
        String name = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
        if (name.length() < 3 || name.length() > 16) throw new Economy.GameException("Имя должно быть от 3 до 16 символов");
        if (!name.matches("[\\p{L}\\p{N}_\\- ]+")) throw new Economy.GameException("Имя может содержать только буквы, цифры, пробел, _ и -");
        if (name.toLowerCase().startsWith("бот")) throw new Economy.GameException("Это имя зарезервировано");
        return name;
    }

    private PlayerData findByName(String name) {
        for (PlayerData p : storage.data.players.values()) if (p.name.equalsIgnoreCase(name)) return p;
        return null;
    }

    private void register(Session s, JsonElement id, String rawName) {
        String name = cleanName(rawName);
        if (findByName(name) != null) throw new Economy.GameException("Это имя уже занято");
        long now = System.currentTimeMillis();
        String pid;
        do {
            pid = randomHex(6);
        } while (storage.data.players.containsKey(pid));
        PlayerData p = eco.newPlayer(pid, randomHex(16), name, now);
        storage.data.players.put(pid, p);
        byToken.put(p.token, p);
        dirtyPlayers.add(p);
        saveNow();
        log("new player " + name);
        login(s, id, p);
    }

    private void auth(Session s, JsonElement id, String token) {
        PlayerData p = byToken.get(token);
        if (p == null) throw new Economy.GameException("unknown_token");
        login(s, id, p);
    }

    private void login(Session s, JsonElement id, PlayerData p) {
        Session old = online.get(p.id);
        if (old != null && old != s) {
            JsonObject k = new JsonObject();
            k.addProperty("t", "kicked");
            k.addProperty("text", "В этот аккаунт вошли с другого устройства");
            old.c.send(k.toString());
            old.p = null;
            old.c.closeGracefully();
        }
        s.p = p;
        online.put(p.id, s);
        long now = System.currentTimeMillis();
        p.lastSeen = now;
        JsonObject d = new JsonObject();
        d.addProperty("token", p.token);
        d.add("profile", eco.profile(p, now));
        // the catalog (~20 KB) is cached by the client and only sent when it changed
        String cv = Catalog.version();
        d.addProperty("catalogVersion", cv);
        if (!cv.equals(s.catalogVersion)) d.add("catalog", Catalog.toJson());
        JsonObject srv = new JsonObject();
        srv.addProperty("name", storage.config.serverName);
        srv.addProperty("serverId", storage.config.serverId);
        srv.addProperty("paymentMode", storage.config.paymentMode);
        srv.addProperty("version", VERSION);
        srv.addProperty("dailyLimit", storage.config.dailyCrateLimit);
        d.add("server", srv);
        reply(s, id, d);
        dirtyPlayers.add(p);
        Battle b = battleOf.get(p.id);
        if (b != null) {
            for (Sub sub : b.subs) {
                if (p.id.equals(sub.playerId)) {
                    sub.connected = true;
                    s.c.send(b.startJson(sub.idx, storage.config.showBotTag));
                }
            }
        }
    }

    private void buy(Session s, JsonElement id, PlayerData p, String product, String param, long now) {
        String mode = storage.config.paymentMode;
        if ("off".equals(mode)) throw new Economy.GameException("Покупки на этом сервере отключены");
        eco.validateProduct(p, product, param, now);
        Catalog.Product pr = Catalog.PRODUCTS.get(product);
        Storage.Order o = new Storage.Order();
        o.id = storage.data.nextOrderId++;
        o.playerId = p.id;
        o.playerName = p.name;
        o.product = product;
        o.param = param;
        o.priceCents = pr.priceCents;
        o.created = now;
        JsonObject res = new JsonObject();
        res.addProperty("orderId", o.id);
        if ("test".equals(mode)) {
            o.status = "granted";
            o.test = true;
            o.closed = now;
            res.add("given", eco.grantProduct(p, product, param, now));
            res.addProperty("status", "granted");
            res.addProperty("test", true);
        } else {
            o.status = "pending";
            if (product.equals("loss_bonus")) p.lossOfferUntil = 0;
            res.addProperty("status", "pending");
        }
        storage.data.orders.add(o);
        trimOrders();
        ordersDirty = metaDirty = true;
        JsonObject d = withProfile(res, p);
        saveNow();
        reply(s, id, d);
    }

    private void trimOrders() {
        List<Storage.Order> list = storage.data.orders;
        while (list.size() > 3000) {
            int idx = -1;
            for (int i = 0; i < list.size(); i++) {
                if (!"pending".equals(list.get(i).status)) {
                    idx = i;
                    break;
                }
            }
            if (idx < 0) break;
            list.remove(idx);
        }
    }

    private JsonObject orderJson(Storage.Order o) {
        JsonObject j = new JsonObject();
        j.addProperty("id", o.id);
        j.addProperty("player", o.playerName);
        j.addProperty("product", o.product);
        Catalog.Product pr = Catalog.PRODUCTS.get(o.product);
        j.addProperty("productName", pr == null ? o.product : pr.name);
        j.addProperty("param", o.param == null ? "" : o.param);
        j.addProperty("price", o.priceCents > 0 ? Catalog.usd(o.priceCents) : o.priceRub + " ₽");
        j.addProperty("status", o.status);
        j.addProperty("test", o.test);
        j.addProperty("created", o.created);
        return j;
    }

    private JsonObject leaderboard(PlayerData me) {
        long nowMs = System.currentTimeMillis();
        if (lbCache == null || nowMs - lbTime > 5000) {
            lbCache = new ArrayList<>(storage.data.players.values());
            lbCache.sort((a, b) -> b.trophies != a.trophies ? b.trophies - a.trophies : a.name.compareTo(b.name));
            lbTime = nowMs;
        }
        List<PlayerData> all = lbCache;
        JsonArray top = new JsonArray();
        int myRank = 0;
        for (int i = 0; i < all.size(); i++) {
            PlayerData p = all.get(i);
            if (p == me) myRank = i + 1;
            if (i < 50) {
                JsonObject o = new JsonObject();
                o.addProperty("rank", i + 1);
                o.addProperty("name", p.name);
                o.addProperty("trophies", p.trophies);
                o.addProperty("level", p.level);
                o.addProperty("league", Catalog.league(p.trophies));
                o.addProperty("me", p == me);
                o.addProperty("online", online.containsKey(p.id));
                top.add(o);
            }
        }
        JsonObject d = new JsonObject();
        d.add("top", top);
        d.addProperty("myRank", myRank);
        d.addProperty("total", all.size());
        return d;
    }

    // ------------------------------------------------------------------ admin

    private void admin(Session s, JsonElement id, JsonObject m) {
        if (s.badAdmin >= 5) throw new Economy.GameException("Слишком много неверных попыток");
        if (!storage.config.adminKey.equalsIgnoreCase(str(m, "key"))) {
            s.badAdmin++;
            throw new Economy.GameException("Неверный ключ администратора");
        }
        ServerConfig cfg = storage.config;
        String op = str(m, "op");
        JsonObject d = new JsonObject();
        long now = System.currentTimeMillis();
        switch (op) {
            case "stats": {
                int pending = 0, revenue = 0;
                for (Storage.Order o : storage.data.orders) {
                    if ("pending".equals(o.status)) pending++;
                    if ("granted".equals(o.status) && !o.test) revenue += o.priceCents;
                }
                d.addProperty("players", storage.data.players.size());
                d.addProperty("online", online.size());
                d.addProperty("battles", battles.size());
                d.addProperty("queue", queue.size());
                d.addProperty("battlesPlayed", storage.data.battlesPlayed);
                d.addProperty("pendingOrders", pending);
                d.addProperty("revenue", Catalog.usd(revenue));
                JsonObject c = new JsonObject();
                c.addProperty("serverName", cfg.serverName);
                c.addProperty("paymentMode", cfg.paymentMode);
                c.addProperty("dailyCrateLimit", cfg.dailyCrateLimit);
                c.addProperty("extendedDailyCrateLimit", cfg.extendedDailyCrateLimit);
                c.addProperty("botWaitSeconds", cfg.botWaitSeconds);
                c.addProperty("showBotTag", cfg.showBotTag);
                c.addProperty("battleSeconds", cfg.battleSeconds);
                c.addProperty("lossOfferMinutes", cfg.lossOfferMinutes);
                d.add("config", c);
                break;
            }
            case "orders": {
                JsonArray list = new JsonArray();
                List<Storage.Order> orders = storage.data.orders;
                for (Storage.Order o : orders) if ("pending".equals(o.status)) list.add(orderJson(o));
                int added = 0;
                for (int i = orders.size() - 1; i >= 0 && added < 60; i--) {
                    Storage.Order o = orders.get(i);
                    if (!"pending".equals(o.status)) {
                        list.add(orderJson(o));
                        added++;
                    }
                }
                d.add("orders", list);
                break;
            }
            case "approve":
            case "reject": {
                long oid = num(m, "order");
                Storage.Order o = null;
                for (Storage.Order x : storage.data.orders) if (x.id == oid) o = x;
                if (o == null || !"pending".equals(o.status)) throw new Economy.GameException("Заказ не найден или уже обработан");
                PlayerData p = storage.data.players.get(o.playerId);
                o.closed = now;
                if (op.equals("approve") && p != null) {
                    o.status = "granted";
                    eco.grantProduct(p, o.product, o.param, now);
                    p.spentCents += o.priceCents;
                    Session ps = online.get(p.id);
                    if (ps != null) {
                        JsonObject push = new JsonObject();
                        push.addProperty("t", "profile");
                        push.add("profile", eco.profile(p, now));
                        ps.c.send(push.toString());
                        Catalog.Product pr = Catalog.PRODUCTS.get(o.product);
                        notice(ps, "Покупка подтверждена: " + (pr == null ? o.product : pr.name));
                    }
                } else {
                    o.status = "rejected";
                    Session ps = p == null ? null : online.get(p.id);
                    if (ps != null) notice(ps, "Заказ #" + o.id + " отклонён администратором");
                }
                if (p != null) dirtyPlayers.add(p);
                ordersDirty = true;
                saveNow();
                break;
            }
            case "set_config": {
                String setting = str(m, "name");
                String val = str(m, "value");
                switch (setting) {
                    case "paymentMode":
                        if (!val.equals("test") && !val.equals("manual") && !val.equals("off"))
                            throw new Economy.GameException("Режим: test, manual или off");
                        cfg.paymentMode = val;
                        break;
                    case "serverName":
                        if (val.trim().isEmpty() || val.length() > 40) throw new Economy.GameException("Неверное имя");
                        cfg.serverName = val.trim();
                        break;
                    case "dailyCrateLimit":
                        cfg.dailyCrateLimit = clampInt(val, 0, 1000);
                        break;
                    case "extendedDailyCrateLimit":
                        cfg.extendedDailyCrateLimit = clampInt(val, 0, 1000);
                        break;
                    case "botWaitSeconds":
                        cfg.botWaitSeconds = clampInt(val, 0, 3600);
                        break;
                    case "showBotTag":
                        cfg.showBotTag = val.equals("true") || val.equals("1");
                        break;
                    case "battleSeconds":
                        cfg.battleSeconds = clampInt(val, 30, 1800);
                        break;
                    case "lossOfferMinutes":
                        cfg.lossOfferMinutes = clampInt(val, 1, 1440);
                        break;
                    default:
                        throw new Economy.GameException("Неизвестная настройка");
                }
                storage.saveConfig();
                break;
            }
            case "grant": {
                PlayerData p = findByName(str(m, "name"));
                if (p == null) throw new Economy.GameException("Игрок не найден");
                p.coins += Math.max(0, num(m, "coins"));
                p.gems += Math.max(0, num(m, "gems"));
                String crate = str(m, "crate");
                if (Catalog.CRATES.containsKey(crate)) eco.addCrate(p, crate, Math.max(1, num(m, "crates")));
                Session ps = online.get(p.id);
                if (ps != null) {
                    JsonObject push = new JsonObject();
                    push.addProperty("t", "profile");
                    push.add("profile", eco.profile(p, now));
                    ps.c.send(push.toString());
                    notice(ps, "Администратор отправил вам подарок!");
                }
                dirtyPlayers.add(p);
                saveNow();
                break;
            }
            case "players": {
                List<PlayerData> all = new ArrayList<>(storage.data.players.values());
                all.sort((a, b) -> Long.compare(b.lastSeen, a.lastSeen));
                JsonArray list = new JsonArray();
                for (int i = 0; i < Math.min(100, all.size()); i++) {
                    PlayerData p = all.get(i);
                    JsonObject o = new JsonObject();
                    o.addProperty("name", p.name);
                    o.addProperty("level", p.level);
                    o.addProperty("trophies", p.trophies);
                    o.addProperty("coins", p.coins);
                    o.addProperty("gems", p.gems);
                    o.addProperty("online", online.containsKey(p.id));
                    o.addProperty("lastSeen", p.lastSeen);
                    o.addProperty("spent", Catalog.usd(p.spentCents));
                    list.add(o);
                }
                d.add("players", list);
                break;
            }
            default:
                throw new Economy.GameException("Неизвестная операция");
        }
        reply(s, id, d);
    }

    private static int clampInt(String v, int lo, int hi) {
        try {
            return Math.max(lo, Math.min(hi, Integer.parseInt(v.trim())));
        } catch (NumberFormatException e) {
            throw new Economy.GameException("Нужно число");
        }
    }
}
