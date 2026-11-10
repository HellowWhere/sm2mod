package com.deepduel.server.battle;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/** Mirrored underwater arena: surface at y = 0, uneven sea bed at the bottom and a few rocks. */
public final class BattleMap {
    public final double w = 2600, h = 1500, step = 50;
    public final double[] bed;
    /** x, y, r */
    public final List<double[]> rocks = new ArrayList<>();
    public final int theme;

    public BattleMap(long seed) {
        Random rng = new Random(seed);
        theme = rng.nextInt(3);
        int n = (int) (w / step) + 1;
        bed = new double[n];
        double p1 = rng.nextDouble() * 6.28, p2 = rng.nextDouble() * 6.28, p3 = rng.nextDouble() * 6.28;
        double ridge = rng.nextDouble() < 0.7 ? 180 + rng.nextDouble() * 160 : 0;
        for (int i = 0; i <= n / 2; i++) {
            double x = i * step;
            double y = h - 150 + 50 * Math.sin(x * 0.004 + p1) + 32 * Math.sin(x * 0.011 + p2) + 16 * Math.sin(x * 0.027 + p3);
            double dc = (x - w / 2) / 230.0;
            y -= ridge * Math.exp(-dc * dc);
            if (x < 150) y -= (150 - x) * 0.8; // banks rise near the walls
            bed[i] = y;
            bed[n - 1 - i] = y;
        }
        int count = 2 + rng.nextInt(3);
        int guard = 0;
        while (rocks.size() < count * 2 && guard++ < 200) {
            double r = 45 + rng.nextDouble() * 55;
            double x = 600 + rng.nextDouble() * (w / 2 - 760);
            double maxY = bedY(x) - r - 120;
            if (maxY < 260) continue;
            double y = 240 + rng.nextDouble() * (maxY - 240);
            if (rng.nextDouble() < 0.35) y = bedY(x) - r * 0.4; // rock growing out of the bed
            boolean ok = true;
            for (double[] o : rocks) {
                double dx = o[0] - x, dy = o[1] - y;
                if (Math.sqrt(dx * dx + dy * dy) < o[2] + r + 140) ok = false;
            }
            if (!ok) continue;
            rocks.add(new double[]{x, y, r});
            rocks.add(new double[]{w - x, y, r});
        }
        if (ridge == 0 && rng.nextBoolean()) rocks.add(new double[]{w / 2, 380 + rng.nextDouble() * 400, 60 + rng.nextDouble() * 30});
    }

    public double bedY(double x) {
        if (x <= 0) return bed[0];
        if (x >= w) return bed[bed.length - 1];
        int i = (int) (x / step);
        if (i >= bed.length - 1) return bed[bed.length - 1];
        double t = (x - i * step) / step;
        return bed[i] * (1 - t) + bed[i + 1] * t;
    }

    public double[] rockAt(double x, double y, double pad) {
        for (double[] r : rocks) {
            double dx = x - r[0], dy = y - r[1];
            if (dx * dx + dy * dy < (r[2] + pad) * (r[2] + pad)) return r;
        }
        return null;
    }

    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"w\":").append(w).append(",\"h\":").append(h).append(",\"step\":").append(step)
                .append(",\"theme\":").append(theme).append(",\"bed\":[");
        for (int i = 0; i < bed.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(Math.round(bed[i]));
        }
        sb.append("],\"rocks\":[");
        for (int i = 0; i < rocks.size(); i++) {
            double[] r = rocks.get(i);
            if (i > 0) sb.append(',');
            sb.append('[').append(Math.round(r[0])).append(',').append(Math.round(r[1])).append(',').append(Math.round(r[2])).append(']');
        }
        sb.append("]}");
        return sb.toString();
    }
}
