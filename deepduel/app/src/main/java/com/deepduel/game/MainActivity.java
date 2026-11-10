package com.deepduel.game;

import android.Manifest;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.deepduel.server.GameServer;
import com.deepduel.server.net.MiniWebServer;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.InputStream;

/** Full-screen WebView with the HTML5 game client plus a small bridge to the embedded server. */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        web = new WebView(this);
        web.setBackgroundColor(0xFF020B17);
        setContentView(web);
        hideSystemUi();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "DeepDuelAndroid");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
                try {
                    InputStream in = getAssets().open("web" + path);
                    String mime = MiniWebServer.mime(path);
                    int semi = mime.indexOf(';');
                    return new WebResourceResponse(semi > 0 ? mime.substring(0, semi) : mime, "utf-8", in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true;
            }
        });
        // http (not https) on purpose: the game talks to servers over plain ws:// in the local network
        web.loadUrl("http://" + HOST + "/index.html");
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.ddBack ? window.ddBack() : false)", v -> {
            if (!"true".equals(v)) moveTaskToBack(true); // never kill the activity: the server may be running
        });
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    /** Methods callable from JavaScript as window.DeepDuelAndroid.* */
    private final class Bridge {
        @JavascriptInterface
        public String startServer(int port) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1));
            }
            String err = ServerHolder.start(MainActivity.this, port);
            JsonObject o = new JsonObject();
            if (err != null) {
                o.addProperty("ok", false);
                o.addProperty("error", err);
                return o.toString();
            }
            try {
                startForegroundService(new Intent(MainActivity.this, ServerService.class));
            } catch (Exception e) {
                // the server keeps running while the app is in front
            }
            o.addProperty("ok", true);
            return o.toString();
        }

        @JavascriptInterface
        public void stopServer() {
            ServerHolder.stop(MainActivity.this);
            try {
                startService(new Intent(MainActivity.this, ServerService.class).setAction(ServerService.ACTION_STOP));
            } catch (Exception e) {
                stopService(new Intent(MainActivity.this, ServerService.class));
            }
        }

        @JavascriptInterface
        public String serverInfo() {
            GameServer gs = ServerHolder.get();
            JsonObject o = new JsonObject();
            o.addProperty("running", gs != null);
            o.addProperty("port", gs != null ? gs.port() : ServerHolder.lastPort(MainActivity.this));
            if (gs != null) {
                o.addProperty("adminKey", gs.adminKey());
                o.addProperty("name", gs.serverName());
                o.addProperty("online", gs.onlineCount());
                o.addProperty("battles", gs.battleCount());
                o.addProperty("players", gs.playerCount());
                JsonArray ips = new JsonArray();
                for (String[] a : ServerHolder.addresses()) {
                    JsonObject ip = new JsonObject();
                    ip.addProperty("ip", a[0]);
                    ip.addProperty("name", a[1]);
                    ips.add(ip);
                }
                o.add("ips", ips);
            }
            return o.toString();
        }

        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void vibrate(int ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null || !v.hasVibrator()) return;
                v.vibrate(VibrationEffect.createOneShot(Math.max(5, Math.min(400, ms)), VibrationEffect.DEFAULT_AMPLITUDE));
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public void keepScreenOn(boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public void copyText(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Deep Duel", text));
            });
        }

        @JavascriptInterface
        public String version() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }
    }
}
