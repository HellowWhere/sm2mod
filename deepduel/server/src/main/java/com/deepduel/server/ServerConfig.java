package com.deepduel.server;

/** Server settings, stored in data/config.json. Every field can be edited by hand. */
public class ServerConfig {
    public String serverName = "Глубинная дуэль";
    /** Random id of this server; clients use it to remember their account. */
    public String serverId = "";
    public int port = 8765;
    /** test - purchases are granted instantly (no real money); manual - admin confirms every order; off - shop closed. */
    public String paymentMode = "test";
    /** Crates per day for finished battles. */
    public int dailyCrateLimit = 10;
    /** Daily limit while the weekly "reward extension" is active. */
    public int extendedDailyCrateLimit = 20;
    /** Fight against a bot if no human opponent was found in this many seconds (0 = never). */
    public int botWaitSeconds = 120;
    /** false = bots look like ordinary players (human-like nickname, no "bot" label). */
    public boolean showBotTag = false;
    /** Trophy change multiplier for bot battles. */
    public double botTrophyFactor = 0.5;
    public int battleSeconds = 180;
    public int seasonLengthDays = 30;
    /** First day of season 1 (yyyy-mm-dd). Empty = the day the server is started for the first time. */
    public String seasonStart = "";
    /** Secret for the admin panel. Generated on first start. */
    public String adminKey = "";
    /** Minutes the "consolation pack" offer stays available after a defeat. */
    public int lossOfferMinutes = 5;
    /** Format version of this file, used to migrate old settings. */
    public int configVersion = 0;

    public static final int CURRENT_VERSION = 2;

    /** Brings settings saved by an older server version up to date. */
    public void migrate() {
        if (configVersion < 2) {
            if (botWaitSeconds == 15) botWaitSeconds = 120; // old default
        }
        configVersion = CURRENT_VERSION;
    }
}
