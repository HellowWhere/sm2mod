package com.deepduel.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Keeps all server data in JSON files inside one folder (on the phone: the app's private storage). */
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

    public static class Data {
        public Map<String, PlayerData> players = new LinkedHashMap<>();
        public List<Order> orders = new ArrayList<>();
        public long nextOrderId = 1;
        public long battlesPlayed = 0;
    }

    private final File dir;
    private final Gson gson = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    public Data data = new Data();
    public ServerConfig config = new ServerConfig();

    public Storage(File dir) {
        this.dir = dir;
    }

    public File dir() {
        return dir;
    }

    public void load() throws IOException {
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Не удалось создать папку " + dir);
        ServerConfig c = read(new File(dir, "config.json"), ServerConfig.class);
        if (c != null) config = c;
        Data d = read(new File(dir, "data.json"), Data.class);
        if (d == null) d = read(new File(dir, "data.json.bak"), Data.class);
        if (d != null) data = d;
        if (data.players == null) data.players = new LinkedHashMap<>();
        if (data.orders == null) data.orders = new ArrayList<>();
    }

    private <T> T read(File f, Class<T> type) {
        if (!f.isFile()) return null;
        try (Reader r = new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8)) {
            return gson.fromJson(r, type);
        } catch (Exception e) {
            System.out.println("[deepduel] cannot read " + f + ": " + e);
            return null;
        }
    }

    public void saveConfig() {
        write(new File(dir, "config.json"), gson.toJson(config));
    }

    public void saveData() {
        write(new File(dir, "data.json"), gson.toJson(data));
    }

    private void write(File target, String json) {
        File tmp = new File(target.getPath() + ".tmp");
        File bak = new File(target.getPath() + ".bak");
        try (Writer w = new OutputStreamWriter(new FileOutputStream(tmp), StandardCharsets.UTF_8)) {
            w.write(json);
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
