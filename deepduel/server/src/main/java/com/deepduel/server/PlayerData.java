package com.deepduel.server;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Everything the server remembers about one player. Serialised with Gson. */
public class PlayerData {
    public String id = "";
    public String token = "";
    public String name = "";
    public long created;
    public long lastSeen;

    public int coins = 600;
    public int gems = 40;
    public int trophies = 0;
    public int maxTrophies = 0;
    public int level = 1;
    /** Experience collected towards the next level. */
    public int xp = 0;

    /** Part id -> level (1..10). */
    public Map<String, Integer> parts = new HashMap<>();
    /** Weapon id -> owned weapon. */
    public Map<String, WeaponOwn> weapons = new HashMap<>();
    /** Equipped weapon ids per slot ("" = empty slot). */
    public List<String> guns = new ArrayList<>();
    public List<String> torps = new ArrayList<>();
    /** Crate type -> amount waiting to be opened. */
    public Map<String, Integer> crates = new HashMap<>();
    public List<String> skins = new ArrayList<>();
    public String skin = "classic";

    public int bpSeason = 0;
    public int bpXp = 0;
    public boolean bpPremium = false;
    public List<Integer> bpFree = new ArrayList<>();
    public List<Integer> bpPrem = new ArrayList<>();

    public String dailyDate = "";
    public int dailyCrates = 0;
    /** Extra crates bought for today. */
    public int dailyBonus = 0;
    /** Weekly reward extension active until (epoch ms). */
    public long extUntil = 0;
    /** "Consolation pack" after a defeat available until (epoch ms). */
    public long lossOfferUntil = 0;

    public int wins, losses, draws;
    /** Total confirmed real-money spending (test purchases are not counted). */
    public int spentRub = 0;
    public int spentCents = 0;

    public static class WeaponOwn {
        public int level = 1;
        public int cards = 0;
    }

    public int part(String id) {
        Integer v = parts.get(id);
        return v == null ? 1 : v;
    }
}
