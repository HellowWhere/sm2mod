package com.deepduel.game;

import android.content.res.AssetManager;

import com.deepduel.server.net.StaticFiles;

import java.io.FileNotFoundException;
import java.io.InputStream;

/** Serves the web client from the APK assets (assets/web/...). */
final class AssetFiles implements StaticFiles {
    private final AssetManager assets;

    AssetFiles(AssetManager assets) {
        this.assets = assets;
    }

    @Override
    public InputStream open(String path) {
        try {
            return assets.open("web/" + path);
        } catch (FileNotFoundException e) {
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
