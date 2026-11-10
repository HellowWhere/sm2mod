package com.deepduel.server.battle;

import com.deepduel.server.Catalog;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Server-authoritative 1v1 submarine duel. Clients only send controls; everything else is
 * simulated here and streamed back as snapshots (with fog of war applied per player).
 */
public final class Battle {
    public static final double COUNTDOWN = 3.5;
    private static final int MAX_MINES = 3;

    public final String id;
    public final BattleMap map;
    public final Sub[] subs;
    public final boolean vsBot;
    private final List<Projectile> projs = new ArrayList<>();
    private final List<Projectile> spawned = new ArrayList<>();
    private final StringBuilder events = new StringBuilder();
    private final Random rng;
    private int nextId = 1;

    /** Simulation step counter, sent with every snapshot for client-side interpolation. */
    public int ticks = 0;
    /** 0 = countdown, 1 = fight, 2 = finished */
    public int phase = 0;
    public double countdown = COUNTDOWN;
    public double timeLeft;
    public final double duration;
    /** -1 = draw */
    public int winner = -1;
    public String endReason = "";

    public Battle(String id, long seed, Sub a, Sub b, double duration) {
        this.id = id;
        this.rng = new Random(seed ^ 0x5DEECE66DL);
        this.map = new BattleMap(seed);
        this.subs = new Sub[]{a, b};
        this.duration = duration;
        this.timeLeft = duration;
        this.vsBot = a.isBot() || b.isBot();
        a.x = 340;
        a.y = 480;
        a.a = 0;
        b.x = map.w - 340;
        b.y = 480;
        b.a = Math.PI;
    }

    public Sub other(Sub s) {
        return subs[1 - s.idx];
    }

    public boolean finished() {
        return phase == 2;
    }

    // ------------------------------------------------------------------ simulation

    public void tick(double dt) {
        if (phase == 2) return;
        ticks++;
        events.setLength(0);
        if (phase == 0) {
            countdown -= dt;
            if (countdown <= 0) {
                phase = 1;
                countdown = 0;
            }
            return;
        }
        timeLeft -= dt;
        for (Sub s : subs) {
            if (s.brain != null) s.brain.update(this, s, other(s), dt);
            else if (!s.connected) {
                s.jx = s.jy = 0;
                s.fire = s.boost = false;
            }
        }
        for (Sub s : subs) updateSub(s, dt);
        collideSubs();
        updateProjectiles(dt);

        boolean d0 = subs[0].hp <= 0, d1 = subs[1].hp <= 0;
        if (d0 || d1) {
            finish(d0 && d1 ? -1 : (d0 ? 1 : 0), "destroyed");
        } else if (timeLeft <= 0) {
            double f0 = subs[0].hp / subs[0].st.maxHp, f1 = subs[1].hp / subs[1].st.maxHp;
            finish(Math.abs(f0 - f1) < 0.005 ? -1 : (f0 > f1 ? 0 : 1), "time");
        }
    }

    public void finish(int winnerIdx, String reason) {
        if (phase == 2) return;
        phase = 2;
        winner = winnerIdx;
        endReason = reason;
    }

    private static double wrap(double a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }

    private void updateSub(Sub s, double dt) {
        s.sonarRevealed = Math.max(0, s.sonarRevealed - dt);
        s.flashRevealed = Math.max(0, s.flashRevealed - dt);
        s.stun = Math.max(0, s.stun - dt);
        s.slow = Math.max(0, s.slow - dt);
        s.sonarCd = Math.max(0, s.sonarCd - dt);
        for (int i = 0; i < s.gunCd.length; i++) s.gunCd[i] = Math.max(0, s.gunCd[i] - dt);
        for (int i = 0; i < s.torpCd.length; i++) s.torpCd[i] = Math.max(0, s.torpCd[i] - dt);
        boolean stunned = s.stun > 0;
        SubStats st = s.st;

        double m = Math.min(1, Math.hypot(s.jx, s.jy));
        if (stunned) m = 0;
        if (s.boostLock && s.energy >= 25) s.boostLock = false;
        s.boosting = s.boost && m > 0.2 && !s.boostLock && s.energy > 0;
        if (s.boosting) {
            s.energy -= 32 * dt;
            if (s.energy <= 0) {
                s.energy = 0;
                s.boostLock = true;
            }
        } else {
            s.energy = Math.min(100, s.energy + st.energyRegen * dt);
        }
        if (m > 0.15) {
            double desired = Math.atan2(s.jy, s.jx);
            double diff = wrap(desired - s.a);
            double maxTurn = st.turnRate * dt * (s.slow > 0 ? 0.6 : 1) * (s.boosting ? 0.85 : 1);
            s.a = wrap(s.a + Math.max(-maxTurn, Math.min(maxTurn, diff)));
        }
        double speedMul = (s.boosting ? st.boostMul : 1) * (s.slow > 0 ? 0.55 : 1);
        double thrust = st.accel * m * speedMul;
        double k = st.accel / st.maxSpeed;
        s.vx += (Math.cos(s.a) * thrust - s.vx * k) * dt;
        s.vy += (Math.sin(s.a) * thrust - s.vy * k) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        double r = st.radius;
        if (s.y < r + 40) {
            s.y = r + 40;
            if (s.vy < 0) s.vy = 0;
        }
        if (s.x < r) {
            s.x = r;
            if (s.vx < 0) s.vx = -s.vx * 0.3;
        }
        if (s.x > map.w - r) {
            s.x = map.w - r;
            if (s.vx > 0) s.vx = -s.vx * 0.3;
        }
        double bed = map.bedY(s.x);
        if (s.y + r * 0.8 > bed) {
            s.y = bed - r * 0.8;
            if (s.vy > 0) s.vy = -s.vy * 0.2;
        }
        for (double[] rock : map.rocks) {
            double dx = s.x - rock[0], dy = s.y - rock[1];
            double d = Math.sqrt(dx * dx + dy * dy), min = rock[2] + r * 0.85;
            if (d < min && d > 0.001) {
                double nx = dx / d, ny = dy / d;
                s.x = rock[0] + nx * min;
                s.y = rock[1] + ny * min;
                double vn = s.vx * nx + s.vy * ny;
                if (vn < 0) {
                    s.vx -= 1.3 * vn * nx;
                    s.vy -= 1.3 * vn * ny;
                }
            }
        }

        if (phase != 1 || stunned) {
            s.torpReq = -1;
            s.sonarReq = false;
            return;
        }
        if (s.fire) {
            for (int i = 0; i < st.guns.size(); i++) {
                if (s.gunCd[i] > 0) continue;
                SubStats.Slot slot = st.guns.get(i);
                fire(s, slot);
                s.gunCd[i] = slot.def.cdAt(slot.level);
            }
        }
        if (s.torpReq >= 0) {
            int i = s.torpReq;
            s.torpReq = -1;
            if (i < st.torps.size() && s.torpCd[i] <= 0) {
                SubStats.Slot slot = st.torps.get(i);
                fire(s, slot);
                s.torpCd[i] = slot.def.cdAt(slot.level);
            }
        }
        if (s.sonarReq) {
            s.sonarReq = false;
            if (s.sonarCd <= 0) {
                s.sonarCd = st.sonarCd;
                other(s).sonarRevealed = 3.0;
                s.flashRevealed = Math.max(s.flashRevealed, 1.5); // an active ping gives away your position
                ev("ping", s.x, s.y, s.idx, 0);
            }
        }
    }

    private void fire(Sub s, SubStats.Slot slot) {
        Catalog.WeaponDef d = slot.def;
        double dmg = d.dmgAt(slot.level);
        double r = s.st.radius;
        double cos = Math.cos(s.a), sin = Math.sin(s.a);
        if (d.kind.equals("mine")) {
            int mines = 0;
            Projectile oldest = null;
            for (Projectile p : projs) {
                if (p.mine && p.owner == s.idx && !p.dead) {
                    mines++;
                    if (oldest == null || p.age > oldest.age) oldest = p;
                }
            }
            if (mines >= MAX_MINES && oldest != null) {
                oldest.dead = true;
                ev("spark", oldest.x, oldest.y, 0, 0);
            }
            Projectile p = make(s, d, dmg, s.x - cos * (r + 18), s.y - sin * (r + 18),
                    s.vx * 0.3 - cos * d.speed, s.vy * 0.3 - sin * d.speed);
            p.mine = true;
            spawned.add(p);
            ev("drop", p.x, p.y, s.idx, p.kind);
            return;
        }
        double px = s.x + cos * (r + 6), py = s.y + sin * (r + 6);
        for (int k = 0; k < d.count; k++) {
            double ang = s.a;
            if (d.count > 1) ang += d.spread * ((double) k / (d.count - 1) - 0.5) * 2 + (rng.nextDouble() - 0.5) * 0.05;
            else ang += (rng.nextDouble() - 0.5) * 2 * d.spread;
            Projectile p = make(s, d, dmg, px, py,
                    Math.cos(ang) * d.speed + s.vx * 0.6, Math.sin(ang) * d.speed + s.vy * 0.6);
            spawned.add(p);
        }
        s.shots++;
        s.flashRevealed = Math.max(s.flashRevealed, d.type.equals("gun") ? 1.0 : 1.4);
        ev(d.type.equals("gun") ? "fire" : "launch", px, py, s.idx, Projectile.kindCode(d.kind));
    }

    private Projectile make(Sub s, Catalog.WeaponDef d, double dmg, double x, double y, double vx, double vy) {
        Projectile p = new Projectile();
        p.id = nextId++;
        p.owner = s.idx;
        p.def = d;
        p.kind = Projectile.kindCode(d.kind);
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.life = d.life;
        p.dmg = dmg;
        p.radius = d.radius;
        p.splashR = d.splashR;
        p.splashFrac = d.splashFrac;
        p.homing = d.homing;
        p.seek = d.seek;
        p.stun = d.stun;
        p.slow = d.slow;
        p.proximity = d.proximity;
        p.arm = d.arm;
        p.pierce = d.pierce;
        p.cluster = d.kind.equals("torp_cluster");
        return p;
    }

    private void updateProjectiles(double dt) {
        projs.addAll(spawned);
        spawned.clear();
        for (Projectile p : projs) {
            if (p.dead) continue;
            p.age += dt;
            p.life -= dt;
            Sub target = subs[1 - p.owner];
            double tr = target.st.radius;
            if (p.mine) {
                double decay = Math.pow(0.2, dt);
                p.vx *= decay;
                p.vy = p.vy * decay + Math.sin(p.age * 1.7) * 3 * dt;
                if (p.age >= p.arm && dist(p.x, p.y, target.x, target.y) < p.proximity + tr) {
                    explode(p, target, true);
                    continue;
                }
            }
            if (p.homing > 0 && p.age > 0.25) {
                double dx = target.x - p.x, dy = target.y - p.y;
                double dd = Math.sqrt(dx * dx + dy * dy);
                if (dd < p.seek) {
                    double heading = Math.atan2(p.vy, p.vx);
                    double diff = wrap(Math.atan2(dy, dx) - heading);
                    if (Math.abs(diff) < 1.3) {
                        heading += Math.max(-p.homing * dt, Math.min(p.homing * dt, diff));
                        double sp = Math.hypot(p.vx, p.vy);
                        p.vx = Math.cos(heading) * sp;
                        p.vy = Math.sin(heading) * sp;
                    }
                }
            }
            if (p.cluster && p.age >= p.arm) {
                p.dead = true;
                double heading = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy);
                double[] offs = {-0.3, -0.1, 0.1, 0.3};
                for (double o : offs) {
                    Projectile b = new Projectile();
                    b.id = nextId++;
                    b.owner = p.owner;
                    b.def = p.def;
                    b.kind = Projectile.kindCode("bomblet");
                    b.x = p.x;
                    b.y = p.y;
                    b.vx = Math.cos(heading + o) * sp * 1.05;
                    b.vy = Math.sin(heading + o) * sp * 1.05;
                    b.life = 1.8;
                    b.dmg = p.dmg;
                    b.radius = 6;
                    b.splashR = p.splashR;
                    b.splashFrac = p.splashFrac;
                    spawned.add(b);
                }
                ev("split", p.x, p.y, p.owner, 0);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (dist(p.x, p.y, target.x, target.y) < p.radius + tr) {
                damage(target, p.dmg, p.owner);
                if (p.stun > 0) {
                    target.stun = Math.max(target.stun, p.stun);
                    ev("stun", target.x, target.y, target.idx, 0);
                }
                if (p.slow > 0) {
                    target.slow = Math.max(target.slow, p.slow);
                    ev("freeze", target.x, target.y, target.idx, 0);
                }
                subs[p.owner].hits++;
                p.dead = true;
                if (p.explosive()) ev("boom", p.x, p.y, p.splashR, p.owner);
                else ev("spark", p.x, p.y, 1, p.kind);
                continue;
            }
            boolean outside = p.x < -50 || p.x > map.w + 50 || p.y < 0 || p.y > map.h + 50;
            boolean solid = !p.pierce && (p.y > map.bedY(p.x) - 2 || map.rockAt(p.x, p.y, 0) != null || p.y < 8);
            if (outside || solid) {
                p.dead = true;
                if (p.explosive()) explode(p, target, false);
                else ev("spark", p.x, p.y, 0, p.kind);
                continue;
            }
            if (p.life <= 0) {
                p.dead = true;
                if (p.explosive()) explode(p, target, false);
            }
        }
        projs.removeIf(q -> q.dead);
    }

    private void explode(Projectile p, Sub target, boolean full) {
        p.dead = true;
        ev("boom", p.x, p.y, p.splashR, p.owner);
        double d = dist(p.x, p.y, target.x, target.y);
        double reach = p.splashR + target.st.radius;
        if (full) {
            damage(target, p.dmg, p.owner);
            subs[p.owner].hits++;
        } else if (d < reach) {
            double f = 1 - 0.6 * (d / reach);
            damage(target, p.dmg * p.splashFrac * f, p.owner);
            if (p.stun > 0) target.stun = Math.max(target.stun, p.stun * 0.5);
        }
    }

    private void damage(Sub target, double raw, int attacker) {
        if (phase != 1) return;
        double d = raw * (1 - target.st.armor);
        target.hp = Math.max(0, target.hp - d);
        subs[attacker].damageDealt += d;
        target.flashRevealed = Math.max(target.flashRevealed, 0.8);
        ev("hit", target.x, target.y - target.st.radius, Math.round(d), target.idx);
    }

    private void collideSubs() {
        Sub a = subs[0], b = subs[1];
        double dx = b.x - a.x, dy = b.y - a.y;
        double d = Math.sqrt(dx * dx + dy * dy), min = (a.st.radius + b.st.radius) * 0.85;
        if (d < min && d > 0.001) {
            double nx = dx / d, ny = dy / d, push = (min - d) / 2;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            double rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) {
                double j = -rv * 0.75;
                a.vx -= j * nx;
                a.vy -= j * ny;
                b.vx += j * nx;
                b.vy += j * ny;
            }
        }
    }

    private static double dist(double x1, double y1, double x2, double y2) {
        double dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ------------------------------------------------------------------ visibility & snapshots

    public boolean canSee(int viewer, int target) {
        if (phase == 0) return true;
        Sub v = subs[viewer], t = subs[target];
        if (t.sonarRevealed > 0 || t.flashRevealed > 0) return true;
        return dist(v.x, v.y, t.x, t.y) <= v.st.vision + t.st.radius;
    }

    private void ev(String type, double x, double y, double p1, double p2) {
        if (events.length() > 0) events.append(',');
        events.append("[\"").append(type).append("\",");
        num(events, x).append(',');
        num(events, y).append(',');
        num(events, p1).append(',');
        num(events, p2).append(']');
    }

    private static StringBuilder num(StringBuilder sb, double v) {
        long r = Math.round(v * 10);
        if (r % 10 == 0) return sb.append(r / 10);
        return sb.append(r / 10.0);
    }

    private static StringBuilder ang(StringBuilder sb, double v) {
        return sb.append(Math.round(v * 1000) / 1000.0);
    }

    private static void cds(StringBuilder sb, double[] cd, List<SubStats.Slot> slots) {
        sb.append('[');
        for (int i = 0; i < cd.length; i++) {
            if (i > 0) sb.append(',');
            SubStats.Slot s = slots.get(i);
            sb.append(Math.round(cd[i] / s.def.cdAt(s.level) * 100) / 100.0);
        }
        sb.append(']');
    }

    /** State as seen by subs[idx]. */
    public String snapshot(int idx) {
        Sub me = subs[idx], op = subs[1 - idx];
        StringBuilder sb = new StringBuilder(512);
        sb.append("{\"t\":\"s\",\"k\":").append(ticks).append(",\"ph\":").append(phase).append(",\"cd\":");
        num(sb, countdown).append(",\"tm\":");
        num(sb, Math.max(0, timeLeft)).append(",\"me\":[");
        num(sb, me.x).append(',');
        num(sb, me.y).append(',');
        ang(sb, me.a).append(',');
        num(sb, me.vx).append(',');
        num(sb, me.vy).append(',');
        num(sb, Math.ceil(me.hp)).append(',');
        num(sb, me.energy).append(',');
        sb.append(me.boosting ? 1 : 0).append(',').append(me.stun > 0 ? 1 : 0).append(',').append(me.slow > 0 ? 1 : 0)
                .append(',').append(me.boostLock ? 1 : 0).append("],\"gc\":");
        cds(sb, me.gunCd, me.st.guns);
        sb.append(",\"tc\":");
        cds(sb, me.torpCd, me.st.torps);
        sb.append(",\"sc\":").append(Math.round(me.sonarCd / me.st.sonarCd * 100) / 100.0);
        sb.append(",\"oh\":");
        num(sb, Math.ceil(op.hp));
        if (canSee(idx, op.idx)) {
            sb.append(",\"op\":[");
            num(sb, op.x).append(',');
            num(sb, op.y).append(',');
            ang(sb, op.a).append(',');
            num(sb, op.vx).append(',');
            num(sb, op.vy).append(',');
            sb.append(op.boosting ? 1 : 0).append(',').append(op.stun > 0 ? 1 : 0).append(',').append(op.slow > 0 ? 1 : 0)
                    .append(',').append(op.sonarRevealed > 0 ? 1 : 0).append(']');
        }
        sb.append(",\"det\":").append(me.sonarRevealed > 0 ? 1 : 0);
        sb.append(",\"pr\":[");
        boolean first = true;
        double vis2 = (me.st.vision + 80) * (me.st.vision + 80);
        for (Projectile p : projs) {
            if (p.dead) continue;
            if (p.owner != idx) {
                double dx = p.x - me.x, dy = p.y - me.y;
                if (dx * dx + dy * dy > vis2) continue;
            }
            if (!first) sb.append(',');
            first = false;
            sb.append('[').append(p.id).append(',').append(p.kind).append(',');
            num(sb, p.x).append(',');
            num(sb, p.y).append(',');
            ang(sb, Math.atan2(p.vy, p.vx)).append(',').append(p.owner == idx ? 1 : 0).append(']');
        }
        sb.append("],\"ev\":[").append(events).append("]}");
        return sb.toString();
    }

    /** Static info sent once when the battle starts (or when a player reconnects). */
    public String startJson(int idx) {
        StringBuilder sb = new StringBuilder(2048);
        sb.append("{\"t\":\"match\",\"bid\":\"").append(id).append("\",\"you\":").append(idx)
                .append(",\"bot\":").append(vsBot).append(",\"duration\":").append(duration)
                .append(",\"phase\":").append(phase).append(",\"map\":").append(map.toJson()).append(",\"subs\":[");
        for (int i = 0; i < 2; i++) {
            Sub s = subs[i];
            if (i > 0) sb.append(',');
            sb.append("{\"name\":").append(new com.google.gson.JsonPrimitive(s.name).toString());
            sb.append(",\"bot\":").append(s.isBot()).append(",\"trophies\":").append(s.trophies)
                    .append(",\"level\":").append(s.level)
                    .append(",\"league\":").append(Catalog.league(s.trophies))
                    .append(",\"skin\":\"").append(s.st.skin).append('"')
                    .append(",\"r\":");
            num(sb, s.st.radius);
            sb.append(",\"hull\":").append(s.st.hullLevel);
            sb.append(",\"maxHp\":");
            num(sb, s.st.maxHp);
            sb.append(",\"vision\":");
            num(sb, s.st.vision);
            sb.append(",\"guns\":[");
            for (int k = 0; k < s.st.guns.size(); k++) {
                if (k > 0) sb.append(',');
                sb.append('"').append(s.st.guns.get(k).def.id).append('"');
            }
            sb.append("],\"torps\":[");
            for (int k = 0; k < s.st.torps.size(); k++) {
                if (k > 0) sb.append(',');
                sb.append('"').append(s.st.torps.get(k).def.id).append('"');
            }
            sb.append("]}");
        }
        sb.append("],\"kinds\":[");
        for (int i = 0; i < Projectile.KINDS.length; i++) {
            if (i > 0) sb.append(',');
            sb.append('"').append(Projectile.KINDS[i]).append('"');
        }
        sb.append("]}");
        return sb.toString();
    }
}
