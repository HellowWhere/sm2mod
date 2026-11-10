package com.deepduel.server;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/** All operations that change a player's progress. Called only from the game thread. */
public final class Economy {
    public static final class GameException extends RuntimeException {
        public GameException(String msg) {
            super(msg);
        }
    }

    private final ServerConfig cfg;
    private final Random rng = new Random();

    public Economy(ServerConfig cfg) {
        this.cfg = cfg;
    }

    private int rand(int min, int max) {
        return min + rng.nextInt(Math.max(1, max - min + 1));
    }

    // ------------------------------------------------------------------ setup

    public PlayerData newPlayer(String id, String token, String name, long now) {
        PlayerData p = new PlayerData();
        p.id = id;
        p.token = token;
        p.name = name;
        p.created = now;
        p.lastSeen = now;
        PlayerData.WeaponOwn w1 = new PlayerData.WeaponOwn();
        PlayerData.WeaponOwn w2 = new PlayerData.WeaponOwn();
        p.weapons.put("harpoon", w1);
        p.weapons.put("mk1", w2);
        p.guns.add("harpoon");
        p.torps.add("mk1");
        p.crates.put("common", 1);
        p.crates.put("rare", 1);
        normalize(p, now);
        return p;
    }

    /** Fills missing fields and applies daily / seasonal resets. */
    public void normalize(PlayerData p, long now) {
        for (String part : Catalog.PART_IDS) {
            Integer l = p.parts.get(part);
            if (l == null || l < 1) p.parts.put(part, 1);
            else if (l > Catalog.MAX_PART) p.parts.put(part, Catalog.MAX_PART);
        }
        if (!p.skins.contains("classic")) p.skins.add(0, "classic");
        if (!p.skins.contains(p.skin)) p.skin = "classic";
        fitSlots(p);
        ensureDaily(p);
        ensureSeason(p);
    }

    private void fitSlots(PlayerData p) {
        int hull = p.part("hull");
        fitList(p, p.guns, Catalog.gunSlots(hull), "gun");
        fitList(p, p.torps, Catalog.torpSlots(hull), "torp");
    }

    private void fitList(PlayerData p, List<String> list, int slots, String type) {
        for (int i = 0; i < list.size(); i++) {
            String id = list.get(i);
            Catalog.WeaponDef d = id == null ? null : Catalog.WEAPONS.get(id);
            if (d == null || !d.type.equals(type) || !p.weapons.containsKey(id)) list.set(i, "");
        }
        while (list.size() > slots) list.remove(list.size() - 1);
        while (list.size() < slots) {
            // a new slot opened up: put the best weapon that is not equipped yet into it
            String best = "";
            int bestScore = -1;
            for (Map.Entry<String, PlayerData.WeaponOwn> e : p.weapons.entrySet()) {
                Catalog.WeaponDef d = Catalog.WEAPONS.get(e.getKey());
                if (d == null || !d.type.equals(type) || list.contains(d.id)) continue;
                int score = Catalog.rarityIndex(d.rarity) * 100 + e.getValue().level;
                if (score > bestScore) {
                    bestScore = score;
                    best = d.id;
                }
            }
            list.add(best);
        }
    }

    public String today() {
        return LocalDate.now().toString();
    }

    public void ensureDaily(PlayerData p) {
        String t = today();
        if (!t.equals(p.dailyDate)) {
            p.dailyDate = t;
            p.dailyCrates = 0;
            p.dailyBonus = 0;
        }
    }

    private LocalDate seasonStart() {
        try {
            return LocalDate.parse(cfg.seasonStart);
        } catch (Exception e) {
            return LocalDate.of(2026, 1, 1);
        }
    }

    public int currentSeason() {
        long days = ChronoUnit.DAYS.between(seasonStart(), LocalDate.now());
        if (days < 0) return 1;
        return (int) (days / Math.max(1, cfg.seasonLengthDays)) + 1;
    }

    public long seasonEndMs(int season) {
        LocalDate end = seasonStart().plusDays((long) season * Math.max(1, cfg.seasonLengthDays));
        return end.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    public void ensureSeason(PlayerData p) {
        int s = currentSeason();
        if (p.bpSeason != s) {
            p.bpSeason = s;
            p.bpXp = 0;
            p.bpPremium = false;
            p.bpFree.clear();
            p.bpPrem.clear();
        }
    }

    public int dailyLimit(PlayerData p, long now) {
        int base = p.extUntil > now ? cfg.extendedDailyCrateLimit : cfg.dailyCrateLimit;
        return base + p.dailyBonus;
    }

    public int bpLevel(PlayerData p) {
        return Math.min(Catalog.BP_LEVELS, p.bpXp / Catalog.BP_XP_PER_LEVEL);
    }

    private void addBpXp(PlayerData p, int xp) {
        p.bpXp = Math.min(Catalog.BP_LEVELS * Catalog.BP_XP_PER_LEVEL, p.bpXp + xp);
    }

    // ------------------------------------------------------------------ xp & rewards

    /** Adds player experience (earned by upgrading the submarine) and hands out level-up crates. */
    public void addXp(PlayerData p, int amount, JsonArray levelUps) {
        p.xp += amount;
        while (p.xp >= Catalog.xpForNext(p.level)) {
            p.xp -= Catalog.xpForNext(p.level);
            p.level++;
            String crate = Catalog.levelUpCrate(p.level);
            addCrate(p, crate, 1);
            p.gems += Catalog.LEVEL_UP_GEMS;
            JsonObject o = new JsonObject();
            o.addProperty("level", p.level);
            o.addProperty("crate", crate);
            o.addProperty("gems", Catalog.LEVEL_UP_GEMS);
            levelUps.add(o);
        }
    }

    public void addCrate(PlayerData p, String type, int n) {
        p.crates.merge(type, n, Integer::sum);
    }

    /** Applies one reward cell. Duplicate skins turn into coins. */
    public JsonObject grant(PlayerData p, Catalog.Reward r) {
        JsonObject o = new JsonObject();
        o.addProperty("type", r.type);
        o.addProperty("n", r.n);
        if (r.id != null) o.addProperty("id", r.id);
        switch (r.type) {
            case "coins":
                p.coins += r.n;
                break;
            case "gems":
                p.gems += r.n;
                break;
            case "crate":
                addCrate(p, r.id, r.n);
                break;
            case "skin":
                if (p.skins.contains(r.id)) {
                    p.coins += 1500;
                    o.addProperty("type", "coins");
                    o.addProperty("n", 1500);
                    o.addProperty("dupSkin", r.id);
                } else {
                    p.skins.add(r.id);
                }
                break;
            default:
                break;
        }
        return o;
    }

    // ------------------------------------------------------------------ hangar

    public JsonObject upgradePart(PlayerData p, String part) {
        boolean known = false;
        for (String id : Catalog.PART_IDS) if (id.equals(part)) known = true;
        if (!known) throw new GameException("Неизвестная деталь");
        int l = p.part(part);
        if (l >= Catalog.MAX_PART) throw new GameException("Деталь уже максимального уровня");
        int cost = Catalog.partCost(part, l);
        if (p.coins < cost) throw new GameException("Не хватает монет: нужно " + cost);
        p.coins -= cost;
        return levelPart(p, part);
    }

    private JsonObject levelPart(PlayerData p, String part) {
        int l = p.part(part) + 1;
        p.parts.put(part, l);
        if (part.equals("hull")) fitSlots(p);
        JsonArray ups = new JsonArray();
        addXp(p, 10 * l, ups);
        JsonObject r = new JsonObject();
        r.addProperty("part", part);
        r.addProperty("level", l);
        r.addProperty("xp", 10 * l);
        r.add("levelUps", ups);
        return r;
    }

    public JsonObject upgradeWeapon(PlayerData p, String wid) {
        Catalog.WeaponDef d = Catalog.WEAPONS.get(wid);
        PlayerData.WeaponOwn own = p.weapons.get(wid);
        if (d == null || own == null) throw new GameException("Это оружие ещё не получено");
        if (own.level >= Catalog.MAX_WEAPON) throw new GameException("Оружие уже максимального уровня");
        int cards = Catalog.weaponCards(d.rarity, own.level);
        int coins = Catalog.weaponCoins(d.rarity, own.level);
        if (own.cards < cards) throw new GameException("Не хватает чертежей: нужно " + cards);
        if (p.coins < coins) throw new GameException("Не хватает монет: нужно " + coins);
        own.cards -= cards;
        p.coins -= coins;
        own.level++;
        JsonArray ups = new JsonArray();
        addXp(p, 8 * own.level, ups);
        JsonObject r = new JsonObject();
        r.addProperty("weapon", wid);
        r.addProperty("level", own.level);
        r.addProperty("xp", 8 * own.level);
        r.add("levelUps", ups);
        return r;
    }

    public void equip(PlayerData p, String type, int index, String wid) {
        List<String> list = "gun".equals(type) ? p.guns : "torp".equals(type) ? p.torps : null;
        if (list == null) throw new GameException("Неверный слот");
        if (index < 0 || index >= list.size()) throw new GameException("Этот слот закрыт — улучшите корпус");
        if (wid == null) wid = "";
        if (!wid.isEmpty()) {
            Catalog.WeaponDef d = Catalog.WEAPONS.get(wid);
            if (d == null || !p.weapons.containsKey(wid)) throw new GameException("Это оружие ещё не получено");
            if (!d.type.equals(type)) throw new GameException("Оружие не подходит для этого слота");
            int other = list.indexOf(wid);
            if (other >= 0) list.set(other, list.get(index)); // swap places
        }
        list.set(index, wid);
    }

    public void setSkin(PlayerData p, String skin) {
        if (!p.skins.contains(skin)) throw new GameException("Окраска ещё не открыта");
        p.skin = skin;
    }

    // ------------------------------------------------------------------ crates

    private int weightedPick(int[] weights) {
        int sum = 0;
        for (int w : weights) sum += w;
        int r = rng.nextInt(Math.max(1, sum));
        for (int i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r < 0) return i;
        }
        return 0;
    }

    public JsonObject openCrate(PlayerData p, String type) {
        Catalog.CrateDef d = Catalog.CRATES.get(type);
        Integer have = p.crates.get(type);
        if (d == null || have == null || have <= 0) throw new GameException("Нет такого ящика");
        if (have == 1) p.crates.remove(type);
        else p.crates.put(type, have - 1);

        int coins = rand(d.coinsMin, d.coinsMax);
        int gems = rng.nextDouble() < d.gemChance ? rand(d.gemsMin, d.gemsMax) : 0;
        Map<String, Integer> cards = new LinkedHashMap<>();
        boolean guaranteed = d.guarantee < 0;
        for (int i = 0; i < d.stacks; i++) {
            int r = weightedPick(d.weights);
            if (i == d.stacks - 1 && !guaranteed && r < d.guarantee) r = d.guarantee;
            if (r >= d.guarantee) guaranteed = true;
            List<Catalog.WeaponDef> pool = Catalog.weaponsOfRarity(r);
            while (pool.isEmpty() && r > 0) pool = Catalog.weaponsOfRarity(--r);
            Catalog.WeaponDef w = pool.get(rng.nextInt(pool.size()));
            int n = rand(d.counts[r][0], d.counts[r][1]);
            cards.merge(w.id, n, Integer::sum);
        }
        p.coins += coins;
        p.gems += gems;
        JsonArray list = new JsonArray();
        JsonArray ups = new JsonArray();
        for (Map.Entry<String, Integer> e : cards.entrySet()) {
            PlayerData.WeaponOwn own = p.weapons.get(e.getKey());
            boolean isNew = own == null;
            if (isNew) {
                own = new PlayerData.WeaponOwn();
                own.cards = e.getValue() - 1;
                p.weapons.put(e.getKey(), own);
                addXp(p, 20, ups);
            } else {
                own.cards += e.getValue();
            }
            JsonObject c = new JsonObject();
            c.addProperty("id", e.getKey());
            c.addProperty("n", e.getValue());
            c.addProperty("isNew", isNew);
            list.add(c);
        }
        fitSlots(p);
        JsonObject res = new JsonObject();
        res.addProperty("crate", type);
        res.addProperty("coins", coins);
        res.addProperty("gems", gems);
        res.add("cards", list);
        res.add("levelUps", ups);
        return res;
    }

    // ------------------------------------------------------------------ battle pass

    public JsonObject claimBp(PlayerData p, int level, String track) {
        ensureSeason(p);
        if (level < 1 || level > Catalog.BP_LEVELS) throw new GameException("Неверный уровень");
        if (bpLevel(p) < level) throw new GameException("Этот уровень пропуска ещё не открыт");
        boolean prem = "premium".equals(track);
        if (prem && !p.bpPremium) throw new GameException("Нужен премиум боевой пропуск");
        List<Integer> claimed = prem ? p.bpPrem : p.bpFree;
        if (claimed.contains(level)) throw new GameException("Награда уже получена");
        claimed.add(level);
        Catalog.Reward r = (prem ? Catalog.BP_PREMIUM : Catalog.BP_FREE)[level - 1];
        JsonObject res = new JsonObject();
        res.add("reward", grant(p, r));
        return res;
    }

    // ------------------------------------------------------------------ shop

    public JsonObject gemBuy(PlayerData p, String itemId) {
        Catalog.GemItem g = Catalog.GEM_ITEMS.get(itemId);
        if (g == null) throw new GameException("Товар не найден");
        if (g.reward.type.equals("skin") && p.skins.contains(g.reward.id))
            throw new GameException("Эта окраска у вас уже есть");
        if (p.gems < g.price) throw new GameException("Не хватает жемчуга");
        p.gems -= g.price;
        JsonObject res = new JsonObject();
        res.add("reward", grant(p, g.reward));
        return res;
    }

    /** Throws if the product cannot be bought right now. */
    public void validateProduct(PlayerData p, String productId, String param, long now) {
        Catalog.Product pr = Catalog.PRODUCTS.get(productId);
        if (pr == null) throw new GameException("Товар не найден");
        ensureSeason(p);
        switch (productId) {
            case "bp_premium":
            case "bp_premium_plus":
                if (p.bpPremium) throw new GameException("Премиум-пропуск этого сезона уже активен");
                break;
            case "instant_upgrade": {
                boolean known = false;
                for (String id : Catalog.PART_IDS) if (id.equals(param)) known = true;
                if (!known) throw new GameException("Неизвестная деталь");
                if (p.part(param) >= Catalog.MAX_PART) throw new GameException("Деталь уже максимального уровня");
                break;
            }
            case "loss_bonus":
                if (p.lossOfferUntil < now) throw new GameException("Предложение уже закончилось");
                break;
            default:
                break;
        }
    }

    /** Hands out a real-money product (after payment was confirmed). */
    public JsonArray grantProduct(PlayerData p, String productId, String param, long now) {
        Catalog.Product pr = Catalog.PRODUCTS.get(productId);
        JsonArray given = new JsonArray();
        if (pr == null) return given;
        ensureDaily(p);
        ensureSeason(p);
        for (Catalog.Reward r : pr.rewards) given.add(grant(p, r));
        switch (productId) {
            case "bp_premium":
                p.bpPremium = true;
                break;
            case "bp_premium_plus":
                p.bpPremium = true;
                addBpXp(p, 10 * Catalog.BP_XP_PER_LEVEL);
                break;
            case "reward_day":
                p.dailyBonus += 10;
                break;
            case "reward_week":
                p.extUntil = Math.max(now, p.extUntil) + 7L * 24 * 3600 * 1000;
                break;
            case "instant_upgrade":
                if (param != null && p.part(param) < Catalog.MAX_PART) {
                    JsonObject r = levelPart(p, param);
                    given.add(r);
                }
                break;
            case "loss_bonus":
                p.lossOfferUntil = 0;
                break;
            default:
                break;
        }
        return given;
    }

    // ------------------------------------------------------------------ battles

    private String rollBattleCrate(int outcome) {
        // per mille: common / rare / epic / legendary crate
        int[] w = outcome > 0 ? new int[]{740, 215, 42, 3} : outcome == 0 ? new int[]{800, 180, 20, 0} : new int[]{860, 130, 10, 0};
        return Catalog.RARITIES[weightedPick(w)];
    }

    /**
     * @param outcome 1 = win, 0 = draw, -1 = defeat
     */
    public JsonObject battleReward(PlayerData p, int outcome, int oppTrophies, boolean vsBot, long now) {
        ensureDaily(p);
        ensureSeason(p);
        int me = p.trophies;
        int delta;
        if (outcome > 0) delta = clamp(30 + (oppTrophies - me) / 25, 15, 45);
        else if (outcome < 0) delta = -clamp(20 + (me - oppTrophies) / 30, 8, 35);
        else delta = 0;
        if (vsBot) delta = (int) Math.round(delta * cfg.botTrophyFactor);
        int before = p.trophies;
        p.trophies = Math.max(0, p.trophies + delta);
        p.maxTrophies = Math.max(p.maxTrophies, p.trophies);
        if (outcome > 0) p.wins++;
        else if (outcome < 0) p.losses++;
        else p.draws++;

        JsonObject res = new JsonObject();
        res.addProperty("outcome", outcome);
        res.addProperty("trophies", p.trophies - before);
        res.addProperty("trophiesNow", p.trophies);
        int limit = dailyLimit(p, now);
        if (p.dailyCrates < limit) {
            int coins = (outcome > 0 ? 90 + 10 * Catalog.league(p.trophies) : outcome == 0 ? 60 : 35) + rng.nextInt(21);
            String crate = rollBattleCrate(outcome);
            p.coins += coins;
            addCrate(p, crate, 1);
            p.dailyCrates++;
            res.addProperty("coins", coins);
            res.addProperty("crate", crate);
            res.addProperty("limitReached", false);
        } else {
            res.addProperty("coins", 0);
            res.addProperty("limitReached", true);
        }
        res.addProperty("dailyUsed", p.dailyCrates);
        res.addProperty("dailyLimit", limit);
        int bpBefore = bpLevel(p);
        int bpXp = outcome > 0 ? Catalog.BP_XP_WIN : outcome == 0 ? Catalog.BP_XP_DRAW : Catalog.BP_XP_LOSS;
        addBpXp(p, bpXp);
        res.addProperty("bpXp", bpXp);
        res.addProperty("bpLevelUp", bpLevel(p) > bpBefore);
        if (outcome < 0) {
            p.lossOfferUntil = now + cfg.lossOfferMinutes * 60_000L;
            res.addProperty("lossOfferUntil", p.lossOfferUntil);
        }
        return res;
    }

    private static int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    // ------------------------------------------------------------------ profile JSON

    public JsonObject profile(PlayerData p, long now) {
        normalize(p, now);
        JsonObject o = new JsonObject();
        o.addProperty("id", p.id);
        o.addProperty("name", p.name);
        o.addProperty("coins", p.coins);
        o.addProperty("gems", p.gems);
        o.addProperty("trophies", p.trophies);
        o.addProperty("maxTrophies", p.maxTrophies);
        o.addProperty("league", Catalog.league(p.trophies));
        o.addProperty("level", p.level);
        o.addProperty("xp", p.xp);
        o.addProperty("xpNext", Catalog.xpForNext(p.level));
        JsonObject parts = new JsonObject();
        for (String id : Catalog.PART_IDS) parts.addProperty(id, p.part(id));
        o.add("parts", parts);
        JsonObject weapons = new JsonObject();
        for (Map.Entry<String, PlayerData.WeaponOwn> e : p.weapons.entrySet()) {
            JsonObject w = new JsonObject();
            w.addProperty("level", e.getValue().level);
            w.addProperty("cards", e.getValue().cards);
            weapons.add(e.getKey(), w);
        }
        o.add("weapons", weapons);
        o.add("guns", strings(p.guns));
        o.add("torps", strings(p.torps));
        JsonObject crates = new JsonObject();
        for (Map.Entry<String, Integer> e : p.crates.entrySet()) crates.addProperty(e.getKey(), e.getValue());
        o.add("crates", crates);
        o.add("skins", strings(p.skins));
        o.addProperty("skin", p.skin);
        JsonObject bp = new JsonObject();
        bp.addProperty("season", p.bpSeason);
        bp.addProperty("xp", p.bpXp);
        bp.addProperty("level", bpLevel(p));
        bp.addProperty("premium", p.bpPremium);
        bp.add("free", ints(p.bpFree));
        bp.add("prem", ints(p.bpPrem));
        bp.addProperty("endsAt", seasonEndMs(p.bpSeason));
        o.add("bp", bp);
        JsonObject daily = new JsonObject();
        daily.addProperty("used", p.dailyCrates);
        daily.addProperty("limit", dailyLimit(p, now));
        daily.addProperty("extUntil", p.extUntil);
        o.add("daily", daily);
        o.addProperty("lossOfferUntil", p.lossOfferUntil);
        JsonObject stats = new JsonObject();
        stats.addProperty("wins", p.wins);
        stats.addProperty("losses", p.losses);
        stats.addProperty("draws", p.draws);
        o.add("stats", stats);
        o.addProperty("now", now);
        return o;
    }

    private static JsonArray strings(List<String> l) {
        JsonArray a = new JsonArray();
        for (String s : l) a.add(s == null ? "" : s);
        return a;
    }

    private static JsonArray ints(List<Integer> l) {
        JsonArray a = new JsonArray();
        for (Integer i : new ArrayList<>(l)) a.add(i);
        return a;
    }
}
