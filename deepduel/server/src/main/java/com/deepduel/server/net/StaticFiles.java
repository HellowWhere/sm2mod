package com.deepduel.server.net;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/** Source of the web client files that the server hands out over plain HTTP. */
public interface StaticFiles {
    /** @param path relative path without leading slash, e.g. "js/app.js". Returns null if missing. */
    InputStream open(String path) throws IOException;

    /** May the server keep the file in memory (true for files packed into the jar / APK)? */
    default boolean cacheable() {
        return true;
    }

    /** Files packed into the jar under /web. */
    static StaticFiles classpath() {
        return path -> StaticFiles.class.getResourceAsStream("/web/" + path);
    }

    /** Files from a folder on disk (handy while developing the client). */
    static StaticFiles directory(File root) {
        return new StaticFiles() {
            @Override
            public InputStream open(String path) throws IOException {
                File f = new File(root, path);
                if (!f.isFile()) return null;
                String canonRoot = root.getCanonicalPath();
                if (!f.getCanonicalPath().startsWith(canonRoot)) return null;
                return new FileInputStream(f);
            }

            @Override
            public boolean cacheable() {
                return false; // files may be edited while developing
            }
        };
    }
}
