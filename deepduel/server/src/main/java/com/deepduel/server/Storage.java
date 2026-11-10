package com.deepduel.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Keeps server data in a folder (on the phone: the app's private storage).
 * Every player is a separate small file, so a save only writes the players that changed,
 * and the actual disk writes happen on a background thread so the game loop never waits.
 *
 * Layout: config.json, meta.json, orders.json, players/&lt;id&gt;.json
 */
public final class Storage {
    public static class Order {
        public long id;
        public String playerId, playerName, product, param;
        /** old orders (before the switch to dollars) */
        public int priceRub;
        public int priceCents;
        /** pending / granted / rejected */
        public String status;
        public boolean test;
        public long created, closed;
    }

    public static class Meta {
        public long nextOrderId = 1;
        public long battlesPlayed = 0;
    }

    /** Old single-file format, still read for migration. */
    private static class LegacyData {
        Map<String, PlayerData> players;
        List<Order> orders;
        long nextOrderId = 1;
        long battlesPlayed = 0;
    }

    public static class Data {
        public Map<String, PlayerData> players = new LinkedHashMap<>();
        public List<Order> orders = new ArrayList<>();
        public long nextOrderId = 1;
        public long battlesPlayed = 0;
    }

    private final File dir;
    private final File playersDir;
    private final Gson pretty = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    private final Gson compact = new GsonBuilder().disableHtmlEscaping().create();
    private final ExecutorService io = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(null, r, "dd-io", 256 * 1024);
        t.setDaemon(true);
        return t;
    });
    public Data data = new Data();
    public ServerConfig config = new ServerConfig();
    /** true after loading the old data.json: everything has to be written in the new layout once */
    private boolean migrated;

    public Storage(File dir) {
        this.dir = dir;
        this.playersDir = new File(dir, "players");
    }

    public File dir() {
        return dir;
    }

    public boolean needsFullSave() {
        return migrated;
    }

    public void load() throws IOException {
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Не удалось создать папку " + dir);
        if (!playersDir.isDirectory() && !playersDir.mkdirs()) throw new IOException("Не удалось создать папку " + playersDir);
        ServerConfig c = read(new File(dir, "config.json"), ServerConfig.class);
        if (c != null) config = c;

        File[] files = playersDir.listFiles((d, n) -> n.endsWith(".json"));
        if (files != null && files.length > 0) {
            for (File f : files) {
                PlayerData p = read(f, PlayerData.class);
                if (p == null) p = read(new File(f.getPath() + ".bak"), PlayerData.class);
                if (p != null && p.id != null && !p.id.isEmpty()) data.players.put(p.id, p);
            }
            Meta m = read(new File(dir, "meta.json"), Meta.class);
            if (m != null) {
                data.nextOrderId = m.nextOrderId;
                data.battlesPlayed = m.battlesPlayed;
            }
            Type listType = new TypeToken<List<Order>>() {}.getType();
            List<Order> orders = readType(new File(dir, "orders.json"), listType);
            if (orders != null) data.orders = orders;
        } else {
            LegacyData d = read(new File(dir, "data.json"), LegacyData.class);
            if (d == null) d = read(new File(dir, "data.json.bak"), LegacyData.class);
            if (d != null) {
                if (d.players != null) data.players.putAll(d.players);
                if (d.orders != null) data.orders = d.orders;
                data.nextOrderId = d.nextOrderId;
                data.battlesPlayed = d.battlesPlayed;
                migrated = true;
            }
        }
        if (data.orders == null) data.orders = new ArrayList<>();
    }

    private <T> T read(File f, Class<T> type) {
        return readType(f, type);
    }

    private <T> T readType(File f, Type type) {
        if (!f.isFile()) return null;
        try (Reader r = new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8)) {
            return pretty.fromJson(r, type);
        } catch (Exception e) {
            System.out.println("[deepduel] cannot read " + f + ": " + e);
            return null;
        }
    }

    public void saveConfig() {
        byte[] bytes = pretty.toJson(config).getBytes(StandardCharsets.UTF_8);
        io.execute(() -> write(new File(dir, "config.json"), bytes));
    }

    /**
     * Serialises the given players (and optionally orders / counters) right now, on the calling
     * thread, so the snapshot is consistent; the files are written in the background.
     */
    public void save(Collection<PlayerData> players, boolean orders, boolean meta) {
        List<Object[]> jobs = new ArrayList<>();
        for (PlayerData p : players) {
            jobs.add(new Object[]{new File(playersDir, p.id + ".json"), compact.toJson(p).getBytes(StandardCharsets.UTF_8)});
        }
        if (orders) jobs.add(new Object[]{new File(dir, "orders.json"), compact.toJson(data.orders).getBytes(StandardCharsets.UTF_8)});
        if (meta) {
            Meta m = new Meta();
            m.nextOrderId = data.nextOrderId;
            m.battlesPlayed = data.battlesPlayed;
            jobs.add(new Object[]{new File(dir, "meta.json"), pretty.toJson(m).getBytes(StandardCharsets.UTF_8)});
        }
        if (jobs.isEmpty()) return;
        final boolean finishMigration = migrated;
        migrated = false;
        io.execute(() -> {
            for (Object[] j : jobs) write((File) j[0], (byte[]) j[1]);
            if (finishMigration) {
                File old = new File(dir, "data.json");
                if (old.exists()) old.renameTo(new File(dir, "data.json.migrated"));
            }
        });
    }

    /** Waits until everything queued so far is on disk. */
    public void flush(long timeoutMs) {
        try {
            io.submit(() -> { }).get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            System.out.println("[deepduel] flush: " + e);
        }
    }

    private void write(File target, byte[] bytes) {
        File tmp = new File(target.getPath() + ".tmp");
        File bak = new File(target.getPath() + ".bak");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(bytes);
        } catch (IOException e) {
            System.out.println("[deepduel] save failed: " + e);
            return;
        }
        if (target.exists()) {
            bak.delete();
            target.renameTo(bak);
        }
        if (!tmp.renameTo(target)) System.out.println("[deepduel] rename failed for " + target);
    }
}
