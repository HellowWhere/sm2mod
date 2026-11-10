package com.deepduel.server;

import com.deepduel.server.net.StaticFiles;

import java.io.File;

/**
 * Stand-alone server for a PC / VPS:
 * java -jar deepduel-server.jar [--port 8765] [--data ./data] [--web ./client/web]
 */
public final class ServerMain {
    public static void main(String[] args) throws Exception {
        System.setOut(new java.io.PrintStream(new java.io.FileOutputStream(java.io.FileDescriptor.out), true, "UTF-8"));
        int port = 0;
        File data = new File("data");
        StaticFiles files = StaticFiles.classpath();
        for (int i = 0; i + 1 < args.length; i += 2) {
            switch (args[i]) {
                case "--port":
                    port = Integer.parseInt(args[i + 1]);
                    break;
                case "--data":
                    data = new File(args[i + 1]);
                    break;
                case "--web":
                    files = StaticFiles.directory(new File(args[i + 1]));
                    break;
                default:
                    System.out.println("unknown option " + args[i]);
            }
        }
        GameServer server = new GameServer(data, files, port);
        server.start();
        System.out.println("Глубинная дуэль: сервер запущен. Порт " + server.port()
                + ". Откройте http://<ip-адрес>:" + server.port() + "/ в браузере или подключитесь из приложения.");
        System.out.println("Ключ администратора: " + server.adminKey());
        Runtime.getRuntime().addShutdownHook(new Thread(server::stop));
        Thread.currentThread().join();
    }
}
