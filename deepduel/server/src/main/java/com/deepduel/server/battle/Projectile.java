package com.deepduel.server.battle;

import com.deepduel.server.Catalog;

/** Shell, torpedo or mine in flight. */
public final class Projectile {
    /** Render kinds understood by the client, index = code sent over the wire. */
    public static final String[] KINDS = {"shell", "bullet", "pellet", "sonic", "cryo", "rail", "plasma",
            "torp", "torp_fast", "torp_homing", "mine", "torp_cluster", "torp_heavy", "torp_emp", "bomblet",
            "twin", "mortar", "acid", "ion", "vortex", "tesla", "depth", "torp_net", "torp_ghost", "torp_swarm", "torp_shkval"};

    public static int kindCode(String kind) {
        for (int i = 0; i < KINDS.length; i++) if (KINDS[i].equals(kind)) return i;
        return 0;
    }

    public int id, owner, kind;
    public Catalog.WeaponDef def;
    public double x, y, vx, vy, life, age, dmg, radius, splashR, splashFrac, homing, seek, stun, slow, proximity, arm;
    public double grav, burn, burnTime, drain, knock;
    public boolean pierce, mine, cluster, stealth, dead;
    /** true: position is sent in every snapshot (homing, stealth, mines); false: client simulates it */
    public boolean streamed;

    public boolean explosive() {
        return splashR > 0;
    }
}
