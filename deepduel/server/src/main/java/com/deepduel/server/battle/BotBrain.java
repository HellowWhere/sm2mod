package com.deepduel.server.battle;

import java.util.Random;

/** Simple submarine AI used when no human opponent is available. */
public final class BotBrain {
    private final Random rng;
    /** 0..1, grows with the trophies of the human opponent */
    private final double skill;
    private double think;
    private double lastX = -1, lastY = -1, sinceSeen = 99;
    private double orbitSign = 1, orbitTimer;
    private double prefDist;
    private double aimError;
    private double torpDelay;
    private double wanderX, wanderY, wanderT;

    public BotBrain(long seed, double skill) {
        this.rng = new Random(seed);
        this.skill = Math.max(0, Math.min(1, skill));
        this.prefDist = 380 + rng.nextDouble() * 160;
        this.aimError = 0.22 - 0.16 * this.skill;
    }

    private static double wrap(double a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }

    public void update(Battle b, Sub me, Sub enemy, double dt) {
        boolean sees = b.canSee(me.idx, enemy.idx);
        if (sees) {
            lastX = enemy.x;
            lastY = enemy.y;
            sinceSeen = 0;
        } else {
            sinceSeen += dt;
        }
        if (!sees && sinceSeen > 1.5 && me.sonarCd <= 0 && rng.nextDouble() < dt * (0.6 + skill)) me.sonarReq = true;

        think -= dt;
        torpDelay -= dt;
        orbitTimer -= dt;
        if (orbitTimer <= 0) {
            orbitTimer = 2.5 + rng.nextDouble() * 3;
            if (rng.nextDouble() < 0.5) orbitSign = -orbitSign;
        }
        if (think > 0) return;
        think = 0.12 + (1 - skill) * 0.2 + rng.nextDouble() * 0.08;

        double tx, ty;
        boolean engage = sinceSeen < 5 && lastX >= 0;
        double dx = lastX - me.x, dy = lastY - me.y;
        double dist = Math.sqrt(dx * dx + dy * dy);
        if (engage) {
            // aim with a bit of lead on the target
            double lead = sees ? Math.min(0.6, dist / 900.0) : 0;
            double ax = lastX + enemy.vx * lead, ay = lastY + enemy.vy * lead;
            if (dist > prefDist + 120) {
                tx = ax;
                ty = ay;
            } else if (dist < prefDist - 160) {
                // too close: turn away diagonally
                double ang = Math.atan2(me.y - ay, me.x - ax) + orbitSign * 0.7;
                tx = me.x + Math.cos(ang) * 300;
                ty = me.y + Math.sin(ang) * 300;
            } else {
                double ang = Math.atan2(ay - me.y, ax - me.x) + orbitSign * 0.25;
                tx = me.x + Math.cos(ang) * 300;
                ty = me.y + Math.sin(ang) * 300;
            }
        } else {
            wanderT -= 0.2;
            if (wanderT <= 0 || Math.hypot(wanderX - me.x, wanderY - me.y) < 120) {
                wanderT = 4;
                wanderX = b.map.w * (0.25 + rng.nextDouble() * 0.5);
                wanderY = 250 + rng.nextDouble() * 600;
                if (lastX >= 0 && rng.nextDouble() < 0.6) {
                    wanderX = lastX;
                    wanderY = lastY;
                }
            }
            tx = wanderX;
            ty = wanderY;
        }

        double jx = tx - me.x, jy = ty - me.y;
        double len = Math.hypot(jx, jy);
        if (len > 1) {
            jx /= len;
            jy /= len;
        }
        // keep away from the sea bed, the walls, rocks and the surface
        double lookX = me.x + Math.cos(me.a) * 170, lookY = me.y + Math.sin(me.a) * 170;
        if (lookY > b.map.bedY(lookX) - me.st.radius - 50) jy -= 1.2;
        if (lookY < 120) jy += 0.8;
        if (lookX < 120) jx += 1;
        if (lookX > b.map.w - 120) jx -= 1;
        double[] rock = b.map.rockAt(lookX, lookY, me.st.radius + 40);
        if (rock != null) {
            double rx = me.x - rock[0], ry = me.y - rock[1];
            double rl = Math.hypot(rx, ry);
            if (rl > 1) {
                jx += rx / rl * 1.4;
                jy += ry / rl * 1.4;
            }
        }
        double jl = Math.hypot(jx, jy);
        double throttle = engage && Math.abs(dist - prefDist) < 140 ? 0.55 : 1.0;
        if (jl > 0.001) {
            me.jx = jx / jl * throttle;
            me.jy = jy / jl * throttle;
        }

        me.boost = (engage && dist > 950 && me.energy > 50) || (me.hp < me.st.maxHp * 0.3 && dist < 300 && me.energy > 30);

        if (sees) {
            double want = Math.atan2(enemy.y - me.y, enemy.x - me.x) + (rng.nextDouble() - 0.5) * aimError;
            double off = Math.abs(wrap(want - me.a));
            double gunRange = 0;
            for (SubStats.Slot s : me.st.guns) gunRange = Math.max(gunRange, s.def.range());
            me.fire = off < 0.2 + aimError && dist < gunRange * 0.92;
            if (torpDelay <= 0) {
                for (int i = 0; i < me.torpCd.length; i++) {
                    if (me.torpCd[i] > 0) continue;
                    SubStats.Slot s = me.st.torps.get(i);
                    boolean ok = s.def.drop ? (off > 2.2 && dist < 450) : (off < 0.3 && dist < Math.min(950, s.def.range() * 0.95));
                    if (!ok) continue;
                    me.torpReq = i;
                    torpDelay = 0.8 + rng.nextDouble() * (2.5 - skill * 1.5);
                    break;
                }
            }
        } else {
            me.fire = false;
        }
    }
}
