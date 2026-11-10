package com.deepduel.game;

import android.content.Context;
import android.content.SharedPreferences;

import com.deepduel.server.GameServer;

import java.io.File;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/** Keeps the single game server instance of this process. */
final class ServerHolder {
    private static GameServer server;

    private ServerHolder() {
    }

    static synchronized String start(Context ctx, int port) {
        if (server != null && server.isRunning()) return null;
        File dir = new File(ctx.getFilesDir(), "server");
        GameServer s = new GameServer(dir, new AssetFiles(ctx.getAssets()), port);
        try {
            s.start();
        } catch (Exception e) {
            String msg = e.getMessage() == null ? e.toString() : e.getMessage();
            if (msg.toLowerCase(Locale.ROOT).contains("in use")) msg = "порт " + port + " уже занят";
            return msg;
        }
        server = s;
        prefs(ctx).edit().putInt("port", port).putBoolean("running", true).apply();
        return null;
    }

    static synchronized void stop(Context ctx) {
        if (server != null) server.stop();
        server = null;
        prefs(ctx).edit().putBoolean("running", false).apply();
    }

    static synchronized GameServer get() {
        return server != null && server.isRunning() ? server : null;
    }

    static int lastPort(Context ctx) {
        return prefs(ctx).getInt("port", 8765);
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences("server", Context.MODE_PRIVATE);
    }

    /** IPv4 addresses other phones can use to reach this one, with a human readable network name. */
    static List<String[]> addresses() {
        List<String[]> out = new ArrayList<>();
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                String n = ni.getName().toLowerCase(Locale.ROOT);
                String label;
                if (n.startsWith("wlan0")) label = "Wi-Fi";
                else if (n.startsWith("ap") || n.startsWith("swlan") || n.startsWith("wlan") || n.contains("softap")) label = "точка доступа";
                else if (n.startsWith("rmnet") || n.startsWith("ccmni") || n.startsWith("pdp") || n.startsWith("v4-rmnet")) label = "мобильная сеть";
                else if (n.startsWith("tun") || n.startsWith("ppp")) label = "VPN";
                else if (n.startsWith("eth") || n.startsWith("rndis") || n.startsWith("usb")) label = "кабель/USB";
                else label = ni.getName();
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (a instanceof Inet4Address && !a.isLoopbackAddress()) out.add(new String[]{a.getHostAddress(), label});
                }
            }
        } catch (Exception ignored) {
        }
        // Wi-Fi and hotspot first, mobile network last (it is usually not reachable by friends)
        out.sort((x, y) -> rank(x[1]) - rank(y[1]));
        return out;
    }

    private static int rank(String label) {
        if (label.equals("Wi-Fi")) return 0;
        if (label.equals("точка доступа")) return 1;
        if (label.equals("мобильная сеть")) return 9;
        return 5;
    }
}
