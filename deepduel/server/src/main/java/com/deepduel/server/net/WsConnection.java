package com.deepduel.server.net;

import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * One WebSocket connection (RFC 6455, server side). Reading happens on the thread that accepted
 * the socket; writing goes through a queue drained by a dedicated writer thread so that a slow
 * client can never block the game loop.
 */
public final class WsConnection {
    private static final int MAX_MESSAGE = 256 * 1024;
    private static final int MAX_QUEUE = 600;

    private final Socket socket;
    private final InputStream in;
    private final OutputStream out;
    public final String remote;
    private final LinkedBlockingQueue<byte[]> queue = new LinkedBlockingQueue<>();
    private volatile boolean closed;
    private volatile boolean closing;
    private static final byte[] CLOSE_MARKER = new byte[0];
    /** Free slot for the game layer (session object). Only touched from the game thread. */
    public Object attachment;

    WsConnection(Socket socket, InputStream in, OutputStream out) {
        this.socket = socket;
        this.in = in;
        this.out = out;
        this.remote = String.valueOf(socket.getRemoteSocketAddress());
        Thread w = new Thread(this::writeLoop, "dd-ws-writer");
        w.setDaemon(true);
        w.start();
    }

    public boolean isOpen() {
        return !closed;
    }

    public void send(String text) {
        if (closed || closing) return;
        if (queue.size() > MAX_QUEUE) { // client stopped reading - drop it
            close();
            return;
        }
        queue.offer(frame(0x1, text.getBytes(StandardCharsets.UTF_8)));
    }

    /** Immediate close (never blocks). */
    public void close() {
        if (closed) return;
        closed = true;
        try {
            socket.close();
        } catch (IOException ignored) {
        }
    }

    /** Sends everything queued so far, then a close frame, then closes the socket. */
    public void closeGracefully() {
        if (closed || closing) return;
        closing = true;
        queue.offer(CLOSE_MARKER);
    }

    private void writeLoop() {
        try {
            while (!closed) {
                byte[] f = queue.poll(1, TimeUnit.SECONDS);
                if (f == null) continue;
                boolean finish = false;
                synchronized (out) {
                    do {
                        if (f == CLOSE_MARKER) {
                            out.write(frame(0x8, new byte[0]));
                            finish = true;
                            break;
                        }
                        out.write(f);
                    } while ((f = queue.poll()) != null);
                    out.flush();
                }
                if (finish) {
                    close();
                    return;
                }
            }
        } catch (Exception e) {
            close();
        }
    }

    static byte[] frame(int opcode, byte[] payload) {
        int len = payload.length;
        int headerLen = len < 126 ? 2 : (len < 65536 ? 4 : 10);
        byte[] f = new byte[headerLen + len];
        f[0] = (byte) (0x80 | opcode);
        if (len < 126) {
            f[1] = (byte) len;
        } else if (len < 65536) {
            f[1] = 126;
            f[2] = (byte) (len >>> 8);
            f[3] = (byte) len;
        } else {
            f[1] = 127;
            long l = len;
            for (int i = 0; i < 8; i++) f[2 + i] = (byte) (l >>> (56 - 8 * i));
        }
        System.arraycopy(payload, 0, f, headerLen, len);
        return f;
    }

    private int readByte() throws IOException {
        int b = in.read();
        if (b < 0) throw new EOFException();
        return b;
    }

    private byte[] readFully(int n) throws IOException {
        byte[] buf = new byte[n];
        int off = 0;
        while (off < n) {
            int r = in.read(buf, off, n - off);
            if (r < 0) throw new EOFException();
            off += r;
        }
        return buf;
    }

    /** Blocks until the connection is closed, delivering text messages to the handler. */
    void readLoop(MiniWebServer.Handler handler) throws IOException {
        ByteArrayOutputStream partial = null;
        int partialOpcode = 0;
        while (!closed) {
            int b0 = in.read();
            if (b0 < 0) break;
            int b1 = readByte();
            boolean fin = (b0 & 0x80) != 0;
            int opcode = b0 & 0x0F;
            boolean masked = (b1 & 0x80) != 0;
            long len = b1 & 0x7F;
            if (len == 126) {
                len = ((long) readByte() << 8) | readByte();
            } else if (len == 127) {
                len = 0;
                for (int i = 0; i < 8; i++) len = (len << 8) | readByte();
            }
            if (len < 0 || len > MAX_MESSAGE) {
                close();
                break;
            }
            byte[] mask = masked ? readFully(4) : null;
            byte[] payload = readFully((int) len);
            if (mask != null) {
                for (int i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
            }
            switch (opcode) {
                case 0x8: // close
                    close();
                    return;
                case 0x9: // ping -> pong
                    queue.offer(frame(0xA, payload));
                    break;
                case 0xA: // pong
                    break;
                case 0x1:
                case 0x2:
                    if (fin) {
                        if (opcode == 0x1) handler.onMessage(this, new String(payload, StandardCharsets.UTF_8));
                    } else {
                        partial = new ByteArrayOutputStream();
                        partial.write(payload);
                        partialOpcode = opcode;
                    }
                    break;
                case 0x0: // continuation
                    if (partial == null) break;
                    partial.write(payload);
                    if (partial.size() > MAX_MESSAGE) {
                        close();
                        return;
                    }
                    if (fin) {
                        if (partialOpcode == 0x1)
                            handler.onMessage(this, new String(partial.toByteArray(), StandardCharsets.UTF_8));
                        partial = null;
                    }
                    break;
                default:
                    close();
                    return;
            }
        }
    }
}
