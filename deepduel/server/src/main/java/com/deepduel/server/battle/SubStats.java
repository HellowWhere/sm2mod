package com.deepduel.server.battle;

import com.deepduel.server.Catalog;
import com.deepduel.server.PlayerData;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Combat numbers of one submarine, derived from its part levels and equipped weapons. */
public final class SubStats {
    public static final class Slot {
        public final Catalog.WeaponDef def;
        public final int level;

        public Slot(Catalog.WeaponDef def, int level) {
            this.def = def;
            this.level = level;
        }
    }

    public double maxHp, radius, armor, maxSpeed, accel, turnRate, vision, sonarCd, energyRegen, boostMul;
    public String skin = "classic";
    public int hullLevel;
    public final List<Slot> guns = new ArrayList<>();
    public final List<Slot> torps = new ArrayList<>();

    public static SubStats of(Map<String, Integer> parts, Map<String, Integer> weaponLevels,
                              List<String> guns, List<String> torps, String skin) {
        SubStats s = new SubStats();
        int hull = lv(parts, "hull"), armor = lv(parts, "armor"), prop = lv(parts, "propeller");
        int rud = lv(parts, "rudders"), sonar = lv(parts, "sonar"), bat = lv(parts, "battery");
        s.hullLevel = hull;
        s.maxHp = Catalog.hullHp(hull);
        s.radius = Catalog.hullRadius(hull);
        s.armor = Catalog.armor(armor);
        double pen = Catalog.hullPenalty(hull);
        s.maxSpeed = Catalog.propSpeed(prop) * pen;
        s.accel = Catalog.propAccel(prop) * pen;
        s.turnRate = Catalog.turnRate(rud) * (1 - 0.015 * (hull - 1));
        s.vision = Catalog.vision(sonar);
        s.sonarCd = Catalog.sonarCd(sonar);
        s.energyRegen = Catalog.energyRegen(bat);
        s.boostMul = Catalog.boostMul(bat);
        s.skin = skin == null ? "classic" : skin;
        for (String id : guns) addSlot(s.guns, id, weaponLevels, "gun");
        for (String id : torps) addSlot(s.torps, id, weaponLevels, "torp");
        return s;
    }

    public static SubStats of(PlayerData p) {
        java.util.HashMap<String, Integer> wl = new java.util.HashMap<>();
        for (Map.Entry<String, PlayerData.WeaponOwn> e : p.weapons.entrySet()) wl.put(e.getKey(), e.getValue().level);
        return of(p.parts, wl, p.guns, p.torps, p.skin);
    }

    private static void addSlot(List<Slot> list, String id, Map<String, Integer> levels, String type) {
        if (id == null || id.isEmpty()) return;
        Catalog.WeaponDef d = Catalog.WEAPONS.get(id);
        Integer l = levels.get(id);
        if (d == null || l == null || !d.type.equals(type)) return;
        list.add(new Slot(d, l));
    }

    private static int lv(Map<String, Integer> parts, String id) {
        Integer v = parts.get(id);
        return v == null ? 1 : Math.max(1, Math.min(Catalog.MAX_PART, v));
    }
}
