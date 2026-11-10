package com.deepduel.server.net;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tiny dependency-free HTTP + WebSocket server. Works the same on a desktop JVM and on Android.
 * GET /ws with an Upgrade header becomes a WebSocket, any other GET serves the web client.
 */
public final class MiniWebServer {
    public interface Handler {
        void onOpen(WsConnection c);

        void onMessage(WsConnection c, String text);

        void onClose(WsConnection c);
    }

    private static final String WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

    private final int port;
    private final StaticFiles files;
    private final Handler handler;
    private final Set<Socket> sockets = ConcurrentHashMap.newKeySet();
    private volatile ServerSocket serverSocket;
    private volatile boolean running;

    public MiniWebServer(int port, StaticFiles files, Handler handler) {
        this.port = port;
        this.files = files;
        this.handler = handler;
    }

    public void start() throws IOException {
        ServerSocket ss = new ServerSocket();
        ss.setReuseAddress(true);
        ss.bind(new InetSocketAddress(port));
        serverSocket = ss;
        running = true;
        Thread t = new Thread(this::acceptLoop, "dd-accept");
        t.setDaemon(true);
        t.start();
    }

    public void stop() {
        running = false;
        try {
            if (serverSocket != null) serverSocket.close();
        } catch (IOException ignored) {
        }
        for (Socket s : sockets) {
            try {
                s.close();
            } catch (IOException ignored) {
            }
        }
    }

    private void acceptLoop() {
        while (running) {
            try {
                Socket s = serverSocket.accept();
                s.setTcpNoDelay(true);
                s.setSoTimeout(70_000);
                sockets.add(s);
                Thread t = new Thread(() -> handle(s), "dd-conn");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                if (!running) return;
            }
        }
    }

    private void handle(Socket s) {
        WsConnection ws = null;
        try {
            InputStream in = new BufferedInputStream(s.getInputStream());
            OutputStream out = new BufferedOutputStream(s.getOutputStream());
            String requestLine = readLine(in);
            if (requestLine == null) return;
            Map<String, String> headers = new HashMap<>();
            for (int i = 0; i < 100; i++) {
                String line = readLine(in);
                if (line == null || line.isEmpty()) break;
                int c = line.indexOf(':');
                if (c > 0) headers.put(line.substring(0, c).trim().toLowerCase(Locale.ROOT), line.substring(c + 1).trim());
            }
            String[] parts = requestLine.split(" ");
            if (parts.length < 2) return;
            String method = parts[0];
            String path = parts[1];
            String upgrade = headers.get("upgrade");
            if (upgrade != null && upgrade.equalsIgnoreCase("websocket")) {
                String key = headers.get("sec-websocket-key");
                if (key == null) {
                    writeSimple(out, 400, "Bad Request");
                    return;
                }
                String accept = Base64.getEncoder().encodeToString(
                        MessageDigest.getInstance("SHA-1").digest((key + WS_GUID).getBytes(StandardCharsets.ISO_8859_1)));
                String resp = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                        + "Sec-WebSocket-Accept: " + accept + "\r\n\r\n";
                out.write(resp.getBytes(StandardCharsets.ISO_8859_1));
                out.flush();
                s.setSoTimeout(60_000); // the client pings every few seconds
                ws = new WsConnection(s, in, out);
                handler.onOpen(ws);
                ws.readLoop(handler);
            } else if (method.equals("GET") || method.equals("HEAD")) {
                serveFile(out, path, method.equals("HEAD"));
            } else {
                writeSimple(out, 405, "Method Not Allowed");
            }
        } catch (Exception ignored) {
        } finally {
            if (ws != null) {
                ws.close();
                try {
                    handler.onClose(ws);
                } catch (Exception ignored) {
                }
            }
            sockets.remove(s);
            try {
                s.close();
            } catch (IOException ignored) {
            }
        }
    }

    private void serveFile(OutputStream out, String path, boolean headOnly) throws IOException {
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);
        path = java.net.URLDecoder.decode(path, "UTF-8");
        while (path.startsWith("/")) path = path.substring(1);
        if (path.isEmpty() || path.endsWith("/")) path = path + "index.html";
        if (path.contains("..") || path.contains("\\")) {
            writeSimple(out, 403, "Forbidden");
            return;
        }
        InputStream f = files == null ? null : files.open(path);
        if (f == null) {
            writeSimple(out, 404, "Not Found");
            return;
        }
        byte[] body;
        try (InputStream fin = f) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int r;
            while ((r = fin.read(buf)) > 0) bo.write(buf, 0, r);
            body = bo.toByteArray();
        }
        String head = "HTTP/1.1 200 OK\r\nContent-Type: " + mime(path) + "\r\nContent-Length: " + body.length
                + "\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n";
        out.write(head.getBytes(StandardCharsets.ISO_8859_1));
        if (!headOnly) out.write(body);
        out.flush();
    }

    public static String mime(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".html")) return "text/html; charset=utf-8";
        if (p.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (p.endsWith(".css")) return "text/css; charset=utf-8";
        if (p.endsWith(".json")) return "application/json; charset=utf-8";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".apk")) return "application/vnd.android.package-archive";
        return "application/octet-stream";
    }

    private static void writeSimple(OutputStream out, int code, String text) throws IOException {
        byte[] body = (code + " " + text).getBytes(StandardCharsets.UTF_8);
        String head = "HTTP/1.1 " + code + " " + text + "\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: "
                + body.length + "\r\nConnection: close\r\n\r\n";
        out.write(head.getBytes(StandardCharsets.ISO_8859_1));
        out.write(body);
        out.flush();
    }

    private static String readLine(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        int c;
        while ((c = in.read()) >= 0) {
            if (c == '\n') break;
            if (c != '\r') sb.append((char) c);
            if (sb.length() > 8192) throw new IOException("line too long");
        }
        if (c < 0 && sb.length() == 0) return null;
        return sb.toString();
    }
}
