package com.deepduel.server.battle;

/** A submarine inside a running battle. */
public final class Sub {
    public final int idx;
    /** null for bots */
    public final String playerId;
    public final String name;
    public final int trophies;
    public final int level;
    public final SubStats st;
    public BotBrain brain;

    public double x, y, vx, vy, a, hp, energy = 100;
    public boolean boosting, boostLock;
    public final double[] gunCd, torpCd;
    public double sonarCd;
    /** Seconds this sub stays visible to the enemy: after a sonar ping / after shooting or being hit. */
    public double sonarRevealed, flashRevealed;
    public double stun, slow;

    // controls
    public double jx, jy;
    public boolean fire, boost, sonarReq;
    public int torpReq = -1;
    public boolean connected = true;
    public double idleTime;

    public double damageDealt;
    public int shots, hits;

    public Sub(int idx, String playerId, String name, int trophies, int level, SubStats st) {
        this.idx = idx;
        this.playerId = playerId;
        this.name = name;
        this.trophies = trophies;
        this.level = level;
        this.st = st;
        this.hp = st.maxHp;
        this.gunCd = new double[st.guns.size()];
        this.torpCd = new double[st.torps.size()];
        for (int i = 0; i < torpCd.length; i++) torpCd[i] = 1.0;
    }

    public boolean isBot() {
        return playerId == null;
    }
}
