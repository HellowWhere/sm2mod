package com.deepduel.server;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * All game balance lives here, on the server. The client receives it as JSON on login,
 * so balance changes only need a server update.
 */
public final class Catalog {
    private Catalog() {
    }

    // ------------------------------------------------------------------ rarities
    public static final String[] RARITIES = {"common", "rare", "epic", "legendary"};
    public static final String[] RARITY_NAMES = {"Обычное", "Редкое", "Эпическое", "Легендарное"};
    public static final String[] RARITY_COLORS = {"#9fb3c8", "#3fa9f5", "#b46cff", "#ffb52e"};

    public static int rarityIndex(String r) {
        for (int i = 0; i < RARITIES.length; i++) if (RARITIES[i].equals(r)) return i;
        return 0;
    }

    // ------------------------------------------------------------------ parts
    public static final String[] PART_IDS = {"hull", "armor", "propeller", "rudders", "sonar", "battery"};
    public static final int MAX_PART = 10;

    public static double hullHp(int l) { return 1000 + 180 * (l - 1); }
    public static double hullRadius(int l) { return 30 + 1.6 * (l - 1); }
    public static int gunSlots(int hullL) { return 1 + (hullL >= 3 ? 1 : 0) + (hullL >= 7 ? 1 : 0); }
    public static int torpSlots(int hullL) { return 1 + (hullL >= 5 ? 1 : 0) + (hullL >= 9 ? 1 : 0); }
    public static double armor(int l) { return 0.035 * (l - 1); }
    public static double propSpeed(int l) { return 160 + 14 * (l - 1); }
    public static double propAccel(int l) { return 230 + 22 * (l - 1); }
    public static double hullPenalty(int hullL) { return 1 - 0.012 * (hullL - 1); }
    public static double turnRate(int l) { return 1.9 + 0.16 * (l - 1); }
    public static double vision(int l) { return 520 + 45 * (l - 1); }
    public static double sonarCd(int l) { return 14 - 0.6 * (l - 1); }
    public static double energyRegen(int l) { return 12 + 2.5 * (l - 1); }
    public static double boostMul(int l) { return 1.5 + 0.04 * (l - 1); }

    public static int partCost(String part, int fromLevel) {
        double base = part.equals("hull") ? 180 : 150;
        return round10(base * Math.pow(1.55, fromLevel - 1));
    }

    static int round10(double v) {
        return (int) (Math.round(v / 10.0) * 10);
    }

    // ------------------------------------------------------------------ weapons
    public static final class WeaponDef {
        public String id, name, desc, type, rarity, kind;
        public double dmg, cd, speed, life, radius = 5, spread, splashR, splashFrac, homing, seek, stun, slow, proximity, arm;
        /** sinking speed gain (mortar shells, depth charges) */
        public double grav;
        /** acid: damage per second and duration */
        public double burn, burnTime;
        /** energy removed from the target's battery */
        public double drain;
        /** push given to the target on hit */
        public double knock;
        public int count = 1;
        /** pierce: flies through rocks; drop: released behind the stern; parallel: twin barrels;
         *  stealth: the enemy sees it only up close */
        public boolean pierce, drop, parallel, stealth;

        public double dmgAt(int l) { return dmg * (1 + 0.1 * (l - 1)); }
        public double cdAt(int l) { return cd * (1 - 0.02 * (l - 1)); }
        public double range() { return speed * life; }
    }

    public static final Map<String, WeaponDef> WEAPONS = new LinkedHashMap<>();

    private static WeaponDef w(String id, String type, String rarity, String kind, String name, String desc) {
        WeaponDef d = new WeaponDef();
        d.id = id;
        d.type = type;
        d.rarity = rarity;
        d.kind = kind;
        d.name = name;
        d.desc = desc;
        WEAPONS.put(id, d);
        return d;
    }

    static {
        WeaponDef d;
        // ---- guns (fire along the nose while the button is held)
        d = w("harpoon", "gun", "common", "shell", "Гарпунная пушка", "Надёжное орудие среднего калибра.");
        d.dmg = 70; d.cd = 0.55; d.speed = 720; d.life = 1.05; d.radius = 5; d.spread = 0.02;
        d = w("rapid", "gun", "common", "bullet", "Скорострел", "Низкий урон, огромная скорострельность.");
        d.dmg = 26; d.cd = 0.15; d.speed = 850; d.life = 0.85; d.radius = 4; d.spread = 0.07;
        d = w("twin", "gun", "common", "twin", "Спаренная пушка", "Два ствола стреляют одновременно.");
        d.dmg = 38; d.count = 2; d.parallel = true; d.cd = 0.6; d.speed = 740; d.life = 1.0; d.radius = 5; d.spread = 0.015;
        d = w("scatter", "gun", "rare", "pellet", "Картечница", "Веер из 5 зарядов. Страшна вблизи.");
        d.dmg = 24; d.count = 5; d.cd = 0.95; d.speed = 680; d.life = 0.55; d.radius = 4; d.spread = 0.32;
        d = w("sonic", "gun", "rare", "sonic", "Звуковая пушка", "Широкая волна проходит сквозь скалы.");
        d.dmg = 85; d.cd = 1.1; d.speed = 520; d.life = 1.3; d.radius = 20; d.pierce = true;
        d = w("mortar", "gun", "rare", "mortar", "Бомбомёт", "Тонущие бомбы рвутся и бьют по площади. Стреляйте сверху.");
        d.dmg = 110; d.cd = 1.4; d.speed = 430; d.life = 1.8; d.radius = 8; d.splashR = 80; d.splashFrac = 0.6; d.grav = 260;
        d = w("acid", "gun", "rare", "acid", "Кислотник", "Кислота разъедает корпус: 14 урона в секунду ещё 4 с.");
        d.dmg = 30; d.cd = 0.65; d.speed = 620; d.life = 1.0; d.radius = 7; d.burn = 14; d.burnTime = 4;
        d = w("cryo", "gun", "epic", "cryo", "Крио-пушка", "Замораживает винт: цель замедляется на 1,5 с.");
        d.dmg = 60; d.cd = 0.7; d.speed = 650; d.life = 1.0; d.radius = 7; d.slow = 1.5;
        d = w("ion", "gun", "epic", "ion", "Ионная пушка", "Разряжает аккумулятор цели — враг не сможет уйти на форсаже.");
        d.dmg = 75; d.cd = 0.8; d.speed = 900; d.life = 0.9; d.radius = 6; d.drain = 30;
        d = w("vortex", "gun", "epic", "vortex", "Вихревая пушка", "Водоворот отбрасывает подлодку врага.");
        d.dmg = 90; d.cd = 1.2; d.speed = 560; d.life = 1.2; d.radius = 14; d.knock = 280;
        d = w("rail", "gun", "epic", "rail", "Рельсотрон", "Сверхбыстрый снаряд с огромным уроном.");
        d.dmg = 240; d.cd = 2.3; d.speed = 1700; d.life = 0.75; d.radius = 4;
        d = w("plasma", "gun", "legendary", "plasma", "Плазмомёт", "Сгусток плазмы взрывается и бьёт по площади.");
        d.dmg = 140; d.cd = 1.3; d.speed = 600; d.life = 1.4; d.radius = 9; d.splashR = 95; d.splashFrac = 0.6;
        d = w("tesla", "gun", "legendary", "tesla", "Тесла-разрядник", "Молния сама находит цель вблизи и бьёт без промаха.");
        d.dmg = 115; d.cd = 0.95; d.speed = 2600; d.life = 0.15; d.radius = 12; d.homing = 14; d.seek = 420;
        // ---- torpedoes (one shot per button press, long reload)
        d = w("mk1", "torp", "common", "torp", "Торпеда МК-1", "Классическая торпеда. Мощный взрыв.");
        d.dmg = 260; d.cd = 4.0; d.speed = 400; d.life = 3.6; d.radius = 8; d.splashR = 60; d.splashFrac = 0.5;
        d = w("swift", "torp", "common", "torp_fast", "Торпеда «Стриж»", "Быстрая и лёгкая, перезаряжается быстрее.");
        d.dmg = 170; d.cd = 3.0; d.speed = 640; d.life = 2.4; d.radius = 7; d.splashR = 40; d.splashFrac = 0.4;
        d = w("depth", "torp", "common", "depth", "Глубинная бомба", "Сбрасывается за кормой, тонет и взрывается рядом с врагом.");
        d.dmg = 280; d.cd = 5.0; d.speed = 40; d.life = 6; d.radius = 10; d.splashR = 90; d.splashFrac = 0.7;
        d.drop = true; d.grav = 140; d.proximity = 70; d.arm = 0.6;
        d = w("homing", "torp", "rare", "torp_homing", "Самонаводящаяся", "Сама находит цель в секторе впереди.");
        d.dmg = 210; d.cd = 5.5; d.speed = 330; d.life = 5.0; d.radius = 8; d.splashR = 55; d.splashFrac = 0.5;
        d.homing = 1.9; d.seek = 650;
        d = w("mine", "torp", "rare", "mine", "Мина-ловушка", "Сбрасывается за кормой и взрывается рядом с врагом.");
        d.dmg = 330; d.cd = 6.5; d.speed = 60; d.life = 25; d.radius = 12; d.splashR = 85; d.splashFrac = 0.7;
        d.proximity = 75; d.arm = 1.0; d.drop = true;
        d = w("net", "torp", "rare", "torp_net", "Сетевая торпеда", "Опутывает винт сетью: враг замедлен на 3 с.");
        d.dmg = 120; d.cd = 6.0; d.speed = 460; d.life = 3.0; d.radius = 10; d.slow = 3.0;
        d = w("cluster", "torp", "epic", "torp_cluster", "Кассетная торпеда", "Через мгновение распадается на 4 боеголовки.");
        d.dmg = 110; d.cd = 6.5; d.speed = 420; d.life = 3.0; d.radius = 7; d.splashR = 45; d.splashFrac = 0.5; d.arm = 0.7;
        d = w("heavy", "torp", "epic", "torp_heavy", "Тяжёлая торпеда «Кит»", "Медленная, но разносит всё вокруг.");
        d.dmg = 520; d.cd = 8.5; d.speed = 250; d.life = 6.0; d.radius = 11; d.splashR = 110; d.splashFrac = 0.6;
        d = w("ghost", "torp", "epic", "torp_ghost", "Торпеда-призрак", "Не видна врагу, пока не подойдёт вплотную.");
        d.dmg = 300; d.cd = 7.0; d.speed = 380; d.life = 4.0; d.radius = 8; d.splashR = 60; d.splashFrac = 0.5; d.stealth = true;
        d = w("emp", "torp", "legendary", "torp_emp", "ЭМИ-торпеда", "Наводится и выключает системы врага на 2 с.");
        d.dmg = 190; d.cd = 7.5; d.speed = 430; d.life = 3.5; d.radius = 8; d.splashR = 50; d.splashFrac = 0.5;
        d.homing = 0.9; d.seek = 600; d.stun = 2.2;
        d = w("swarm", "torp", "legendary", "torp_swarm", "Рой", "Залп из трёх мини-торпед с самонаведением.");
        d.dmg = 120; d.count = 3; d.spread = 0.35; d.cd = 8.0; d.speed = 380; d.life = 4.0; d.radius = 6;
        d.splashR = 40; d.splashFrac = 0.5; d.homing = 2.4; d.seek = 700;
        d = w("shkval", "torp", "legendary", "torp_shkval", "Суперторпеда «Шквал»", "Суперкавитация: почти мгновенно долетает до цели.");
        d.dmg = 380; d.cd = 8.0; d.speed = 1100; d.life = 1.6; d.radius = 8; d.splashR = 70; d.splashFrac = 0.5;
    }

    public static List<WeaponDef> weaponsOfRarity(int rarity) {
        List<WeaponDef> list = new ArrayList<>();
        for (WeaponDef d : WEAPONS.values()) if (rarityIndex(d.rarity) == rarity) list.add(d);
        return list;
    }

    private static final int[][] CARDS = {
            {2, 4, 8, 15, 30, 60, 110, 180, 300},
            {2, 3, 5, 10, 20, 35, 60, 100, 160},
            {1, 2, 3, 6, 10, 18, 30, 50, 80},
            {1, 1, 2, 3, 5, 8, 12, 18, 25},
    };
    private static final int[] WEAPON_COINS = {60, 150, 300, 600, 1200, 2400, 4500, 8000, 13000};
    private static final double[] RARITY_COIN_MUL = {1, 1.2, 1.5, 2};
    public static final int MAX_WEAPON = 10;

    public static int weaponCards(String rarity, int fromLevel) {
        return CARDS[rarityIndex(rarity)][fromLevel - 1];
    }

    public static int weaponCoins(String rarity, int fromLevel) {
        return round10(WEAPON_COINS[fromLevel - 1] * RARITY_COIN_MUL[rarityIndex(rarity)]);
    }

    // ------------------------------------------------------------------ crates
    public static final class CrateDef {
        public String id, name, color;
        public int coinsMin, coinsMax, stacks, guarantee;
        public int[] weights;
        public int[][] counts;
        public double gemChance;
        public int gemsMin, gemsMax;
    }

    public static final Map<String, CrateDef> CRATES = new LinkedHashMap<>();

    private static void crate(String id, String name, String color, int cMin, int cMax, int stacks, int[] weights,
                              int[][] counts, double gemChance, int gMin, int gMax, int guarantee) {
        CrateDef c = new CrateDef();
        c.id = id;
        c.name = name;
        c.color = color;
        c.coinsMin = cMin;
        c.coinsMax = cMax;
        c.stacks = stacks;
        c.weights = weights;
        c.counts = counts;
        c.gemChance = gemChance;
        c.gemsMin = gMin;
        c.gemsMax = gMax;
        c.guarantee = guarantee;
        CRATES.put(id, c);
    }

    static {
        // weights are per mille: common / rare / epic / legendary weapon cards
        crate("common", "Обычный ящик", "#8fa7bd", 60, 120, 2, new int[]{800, 185, 15, 0},
                new int[][]{{3, 5}, {1, 2}, {1, 1}, {1, 1}}, 0.05, 2, 5, -1);
        crate("rare", "Редкий ящик", "#3fa9f5", 200, 350, 3, new int[]{600, 330, 68, 2},
                new int[][]{{6, 10}, {2, 4}, {1, 2}, {1, 1}}, 0.15, 5, 10, 1);
        crate("epic", "Эпический ящик", "#b46cff", 600, 900, 4, new int[]{380, 420, 185, 15},
                new int[][]{{12, 20}, {5, 8}, {2, 4}, {1, 1}}, 0.3, 10, 20, 2);
        crate("legendary", "Легендарный ящик", "#ffb52e", 1800, 2600, 5, new int[]{280, 380, 300, 40},
                new int[][]{{25, 40}, {10, 15}, {4, 8}, {1, 1}}, 0.5, 25, 50, 2);
    }

    // ------------------------------------------------------------------ player level
    public static int xpForNext(int level) {
        return 50 + 25 * (level - 1);
    }

    public static String levelUpCrate(int newLevel) {
        if (newLevel % 10 == 0) return "legendary";
        if (newLevel % 5 == 0) return "epic";
        if (newLevel % 3 == 0) return "rare";
        return "common";
    }

    public static final int LEVEL_UP_GEMS = 10;

    // ------------------------------------------------------------------ skins
    public static final class Skin {
        public String id, name, hull, dark, accent, glow, source;
    }

    public static final Map<String, Skin> SKINS = new LinkedHashMap<>();

    private static void skin(String id, String name, String hull, String dark, String accent, String glow, String source) {
        Skin s = new Skin();
        s.id = id;
        s.name = name;
        s.hull = hull;
        s.dark = dark;
        s.accent = accent;
        s.glow = glow;
        s.source = source;
        SKINS.put(id, s);
    }

    static {
        skin("classic", "Классика", "#f2b632", "#8a5a12", "#e85d2a", "#fff2a8", "Доступна сразу");
        skin("navy", "Флотский", "#4a6a8c", "#1d2f44", "#c9d6e3", "#9fd3ff", "Боевой пропуск, ур. 8");
        skin("coral", "Коралловый", "#ff7a6b", "#a33a33", "#ffd1b8", "#ffd6cc", "Боевой пропуск, ур. 15");
        skin("camo", "Камуфляж", "#6b7a40", "#2f3a1c", "#b5aa6a", "#e0f0a0", "Премиум пропуск, ур. 5");
        skin("abyss", "Глубоководный", "#22345a", "#0b1226", "#22e3ff", "#5ff8ff", "Премиум пропуск, ур. 10");
        skin("neon", "Неон", "#3a1566", "#12052a", "#ff3df2", "#3dfcff", "Премиум пропуск, ур. 20");
        skin("kraken", "Золотой Кракен", "#e0b020", "#3a2a05", "#1a1a1a", "#ffe680", "Премиум пропуск, ур. 30");
        skin("shark", "Акула", "#9fb2bf", "#46525b", "#f0f4f7", "#ffffff", "Магазин, 300 жемчуга");
    }

    // ------------------------------------------------------------------ leagues
    public static final String[] LEAGUE_NAMES = {"Бронза", "Серебро", "Золото", "Платина", "Алмаз", "Легенда глубин"};
    public static final int[] LEAGUE_MIN = {0, 300, 800, 1500, 2500, 4000};
    public static final String[] LEAGUE_COLORS = {"#cd7f32", "#c0c7d0", "#ffcc33", "#5fe0d0", "#7ab8ff", "#ff5fa2"};

    public static int league(int trophies) {
        int l = 0;
        for (int i = 0; i < LEAGUE_MIN.length; i++) if (trophies >= LEAGUE_MIN[i]) l = i;
        return l;
    }

    // ------------------------------------------------------------------ rewards
    /** A reward cell: coins, gems, crate (id + n), skin (id). */
    public static final class Reward {
        public String type;
        public String id;
        public int n;

        Reward(String type, String id, int n) {
            this.type = type;
            this.id = id;
            this.n = n;
        }

        JsonObject toJson() {
            JsonObject o = new JsonObject();
            o.addProperty("type", type);
            if (id != null) o.addProperty("id", id);
            o.addProperty("n", n);
            return o;
        }
    }

    static Reward coins(int n) { return new Reward("coins", null, n); }
    static Reward gems(int n) { return new Reward("gems", null, n); }
    static Reward crates(String id, int n) { return new Reward("crate", id, n); }
    static Reward skinR(String id) { return new Reward("skin", id, 1); }

    // ------------------------------------------------------------------ battle pass
    public static final int BP_LEVELS = 30;
    public static final int BP_XP_PER_LEVEL = 100;
    public static final int BP_XP_WIN = 50, BP_XP_LOSS = 25, BP_XP_DRAW = 35;

    public static final Reward[] BP_FREE = {
            coins(300), crates("common", 1), gems(10), coins(400), crates("rare", 1),
            coins(500), crates("common", 2), skinR("navy"), gems(15), crates("epic", 1),
            coins(700), crates("rare", 1), gems(20), coins(800), skinR("coral"),
            crates("rare", 1), coins(1000), gems(25), crates("rare", 1), crates("epic", 1),
            coins(1200), crates("rare", 1), gems(30), coins(1500), crates("epic", 1),
            coins(1800), crates("rare", 2), gems(40), coins(2500), crates("legendary", 1),
    };
    public static final Reward[] BP_PREMIUM = {
            gems(50), crates("rare", 1), coins(1000), crates("rare", 1), skinR("camo"),
            gems(60), crates("epic", 1), coins(2000), crates("rare", 2), skinR("abyss"),
            gems(80), crates("epic", 1), coins(3000), crates("rare", 2), crates("legendary", 1),
            gems(100), crates("epic", 1), coins(4000), crates("epic", 1), skinR("neon"),
            gems(120), crates("epic", 2), coins(5000), crates("rare", 3), crates("legendary", 1),
            gems(150), crates("epic", 2), coins(8000), gems(200), skinR("kraken"),
    };

    // ------------------------------------------------------------------ shop
    /** Real-money product. */
    public static final class Product {
        public String id, name, desc, section, icon;
        /** price in US cents */
        public int priceCents;
        public boolean hidden;
        public List<Reward> rewards = new ArrayList<>();
    }

    public static final Map<String, Product> PRODUCTS = new LinkedHashMap<>();

    private static Product product(String id, String section, String icon, int price, String name, String desc, Reward... rewards) {
        Product p = new Product();
        p.id = id;
        p.section = section;
        p.icon = icon;
        p.priceCents = price;
        p.name = name;
        p.desc = desc;
        for (Reward r : rewards) p.rewards.add(r);
        PRODUCTS.put(id, p);
        return p;
    }

    static {
        product("gems_80", "currency", "gems1", 199, "Горсть жемчуга", "80 жемчужин", gems(80));
        product("gems_550", "currency", "gems2", 999, "Мешочек жемчуга", "500 + 50 в подарок", gems(550));
        product("gems_1400", "currency", "gems3", 1999, "Шкатулка жемчуга", "1200 + 200 в подарок", gems(1400));
        product("gems_3200", "currency", "gems4", 4999, "Сундук жемчуга", "2600 + 600 в подарок", gems(3200));
        product("gems_8500", "currency", "gems5", 9999, "Сокровищница", "6500 + 2000 в подарок", gems(8500));
        product("gems_20000", "currency", "gems6", 19999, "Королевская сокровищница", "14 000 + 6 000 в подарок", gems(20000));
        product("coins_20000", "currency", "coins", 499, "Мешок монет", "20 000 монет на улучшения", coins(20000));
        product("bp_premium", "offers", "bp", 999, "Премиум боевой пропуск",
                "Вторая линия наград сезона: эксклюзивные окраски, ящики и жемчуг.");
        product("bp_premium_plus", "offers", "bp_plus", 2499, "Премиум пропуск + 10 уровней",
                "Премиум-линия и сразу +10 уровней пропуска.");
        product("reward_day", "offers", "ext1", 299, "Продление наград на сегодня",
                "+10 ящиков к дневному лимиту за бои.");
        product("reward_week", "offers", "ext7", 999, "Продление наград на 7 дней",
                "Дневной лимит ящиков за бои 20 вместо 10 целую неделю.");
        product("pack_rare", "chests", "pack1", 499, "3 редких ящика", "Оружие, монеты и шанс на жемчуг.",
                crates("rare", 3));
        product("pack_epic", "chests", "pack2", 1999, "Набор «Эпический»", "3 эпических и 5 редких ящиков.",
                crates("epic", 3), crates("rare", 5));
        product("pack_legend", "chests", "pack3", 4999, "Набор «Легенда»", "2 легендарных и 5 эпических ящиков.",
                crates("legendary", 2), crates("epic", 5));
        Product p = product("instant_upgrade", "upgrade", "upgrade", 399, "Мгновенное улучшение",
                "+1 уровень выбранной детали без затрат монет.");
        p.hidden = true;
        p = product("loss_bonus", "offers", "loss", 199, "Утешительный набор",
                "Только сейчас: 4 000 монет, 2 редких ящика и 60 жемчуга.", coins(4000), crates("rare", 2), gems(60));
        p.hidden = true;
    }

    private static String fmt1(double v) {
        return v == Math.floor(v) ? String.valueOf((int) v) : String.valueOf(Math.round(v * 10) / 10.0).replace('.', ',');
    }

    public static String usd(int cents) {
        return "$" + (cents / 100) + "." + String.format("%02d", cents % 100);
    }

    /** Purchase for in-game gems. */
    public static final class GemItem {
        public String id, name, icon;
        public int price;
        public Reward reward;
    }

    public static final Map<String, GemItem> GEM_ITEMS = new LinkedHashMap<>();

    private static void gemItem(String id, String icon, int price, String name, Reward r) {
        GemItem g = new GemItem();
        g.id = id;
        g.icon = icon;
        g.price = price;
        g.name = name;
        g.reward = r;
        GEM_ITEMS.put(id, g);
    }

    static {
        gemItem("g_crate_rare", "crate_rare", 60, "Редкий ящик", crates("rare", 1));
        gemItem("g_crate_epic", "crate_epic", 180, "Эпический ящик", crates("epic", 1));
        gemItem("g_crate_legendary", "crate_legendary", 450, "Легендарный ящик", crates("legendary", 1));
        gemItem("g_coins_1000", "coins", 50, "1 000 монет", coins(1000));
        gemItem("g_coins_6000", "coins", 250, "6 000 монет", coins(6000));
        gemItem("g_coins_15000", "coins", 550, "15 000 монет", coins(15000));
        gemItem("g_skin_shark", "skin", 300, "Окраска «Акула»", skinR("shark"));
    }

    // ------------------------------------------------------------------ JSON for the client
    private static JsonArray nums(double... v) {
        JsonArray a = new JsonArray();
        for (double d : v) a.add(Math.round(d * 100) / 100.0);
        return a;
    }

    private static JsonObject stat(String name, String unit, double[] values) {
        JsonObject o = new JsonObject();
        o.addProperty("n", name);
        o.addProperty("u", unit);
        o.add("v", nums(values));
        return o;
    }

    private interface LevelFn {
        double at(int l);
    }

    private static double[] per(LevelFn f) {
        double[] v = new double[MAX_PART];
        for (int i = 0; i < MAX_PART; i++) v[i] = f.at(i + 1);
        return v;
    }

    private static JsonObject part(String id, String name, String desc, JsonObject... stats) {
        JsonObject o = new JsonObject();
        o.addProperty("id", id);
        o.addProperty("name", name);
        o.addProperty("desc", desc);
        o.addProperty("max", MAX_PART);
        JsonArray costs = new JsonArray();
        for (int l = 1; l < MAX_PART; l++) costs.add(partCost(id, l));
        o.add("costs", costs);
        JsonArray st = new JsonArray();
        for (JsonObject s : stats) st.add(s);
        o.add("stats", st);
        return o;
    }

    private static JsonObject cached;

    public static synchronized JsonObject toJson() {
        if (cached != null) return cached;
        JsonObject c = new JsonObject();
        JsonArray parts = new JsonArray();
        parts.add(part("hull", "Корпус", "Размер и прочность лодки. Больше корпус — больше слотов под оружие, но лодка тяжелее и заметнее.",
                stat("Прочность", "", per(Catalog::hullHp)),
                stat("Размер", "%", per(l -> hullRadius(l) / hullRadius(1) * 100)),
                stat("Слоты пушек", "", per(Catalog::gunSlots)),
                stat("Слоты торпед", "", per(Catalog::torpSlots))));
        parts.add(part("armor", "Броня", "Снижает весь получаемый урон.",
                stat("Снижение урона", "%", per(l -> armor(l) * 100))));
        parts.add(part("propeller", "Винт", "Максимальная скорость и разгон лодки.",
                stat("Скорость", "", per(Catalog::propSpeed)),
                stat("Разгон", "", per(Catalog::propAccel))));
        parts.add(part("rudders", "Рули глубины", "Как быстро лодка поворачивает.",
                stat("Поворот", "°/с", per(l -> Math.toDegrees(turnRate(l))))));
        parts.add(part("sonar", "Сонар", "Дальность обзора в тёмной воде и перезарядка сонарного импульса.",
                stat("Обзор", "", per(Catalog::vision)),
                stat("Перезарядка импульса", "с", per(Catalog::sonarCd))));
        parts.add(part("battery", "Аккумулятор", "Энергия для форсажа и его мощность.",
                stat("Восстановление", "/с", per(Catalog::energyRegen)),
                stat("Сила форсажа", "%", per(l -> boostMul(l) * 100))));
        c.add("parts", parts);

        JsonArray weapons = new JsonArray();
        for (WeaponDef d : WEAPONS.values()) {
            JsonObject o = new JsonObject();
            o.addProperty("id", d.id);
            o.addProperty("name", d.name);
            o.addProperty("desc", d.desc);
            o.addProperty("type", d.type);
            o.addProperty("rarity", d.rarity);
            o.addProperty("kind", d.kind);
            o.addProperty("dmg", d.dmg);
            o.addProperty("count", d.count);
            o.addProperty("cd", d.cd);
            o.addProperty("range", Math.round(d.range()));
            o.addProperty("splash", d.splashR);
            JsonArray fx = new JsonArray();
            if (d.homing > 0) fx.add(d.homing > 5 ? "автонаведение" : "самонаведение");
            if (d.stun > 0) fx.add("отключает системы на " + fmt1(d.stun) + " с");
            if (d.slow > 0) fx.add("замедляет на " + fmt1(d.slow) + " с");
            if (d.burn > 0) fx.add("кислота " + Math.round(d.burn) + "/с, " + fmt1(d.burnTime) + " с");
            if (d.drain > 0) fx.add("−" + Math.round(d.drain) + " энергии");
            if (d.knock > 0) fx.add("отбрасывает");
            if (d.stealth) fx.add("невидима для врага");
            if (d.pierce) fx.add("сквозь скалы");
            if (d.grav > 0) fx.add("тонет");
            if (d.drop) fx.add("сброс за корму");
            if (d.kind.equals("torp_cluster")) fx.add("4 боеголовки");
            o.add("effects", fx);
            JsonArray cards = new JsonArray();
            JsonArray coins = new JsonArray();
            for (int l = 1; l < MAX_WEAPON; l++) {
                cards.add(weaponCards(d.rarity, l));
                coins.add(weaponCoins(d.rarity, l));
            }
            o.add("cards", cards);
            o.add("coins", coins);
            weapons.add(o);
        }
        c.add("weapons", weapons);
        c.addProperty("weaponDmgPerLevel", 0.1);
        c.addProperty("weaponCdPerLevel", 0.02);

        JsonArray rar = new JsonArray();
        for (int i = 0; i < RARITIES.length; i++) {
            JsonObject o = new JsonObject();
            o.addProperty("id", RARITIES[i]);
            o.addProperty("name", RARITY_NAMES[i]);
            o.addProperty("color", RARITY_COLORS[i]);
            rar.add(o);
        }
        c.add("rarities", rar);

        JsonArray crates = new JsonArray();
        for (CrateDef d : CRATES.values()) {
            JsonObject o = new JsonObject();
            o.addProperty("id", d.id);
            o.addProperty("name", d.name);
            o.addProperty("color", d.color);
            o.addProperty("coins", d.coinsMin + "–" + d.coinsMax);
            o.addProperty("stacks", d.stacks);
            JsonArray wts = new JsonArray();
            int sum = 0;
            for (int x : d.weights) sum += x;
            for (int x : d.weights) wts.add(Math.round(x * 1000.0 / sum) / 10.0);
            o.add("odds", wts);
            o.addProperty("gemChance", Math.round(d.gemChance * 100));
            crates.add(o);
        }
        c.add("crates", crates);

        JsonArray skins = new JsonArray();
        for (Skin s : SKINS.values()) {
            JsonObject o = new JsonObject();
            o.addProperty("id", s.id);
            o.addProperty("name", s.name);
            o.addProperty("hull", s.hull);
            o.addProperty("dark", s.dark);
            o.addProperty("accent", s.accent);
            o.addProperty("glow", s.glow);
            o.addProperty("source", s.source);
            skins.add(o);
        }
        c.add("skins", skins);

        JsonArray leagues = new JsonArray();
        for (int i = 0; i < LEAGUE_NAMES.length; i++) {
            JsonObject o = new JsonObject();
            o.addProperty("name", LEAGUE_NAMES[i]);
            o.addProperty("min", LEAGUE_MIN[i]);
            o.addProperty("color", LEAGUE_COLORS[i]);
            leagues.add(o);
        }
        c.add("leagues", leagues);

        JsonObject bp = new JsonObject();
        bp.addProperty("levels", BP_LEVELS);
        bp.addProperty("xpPerLevel", BP_XP_PER_LEVEL);
        bp.addProperty("xpWin", BP_XP_WIN);
        bp.addProperty("xpLoss", BP_XP_LOSS);
        JsonArray free = new JsonArray();
        for (Reward r : BP_FREE) free.add(r.toJson());
        JsonArray prem = new JsonArray();
        for (Reward r : BP_PREMIUM) prem.add(r.toJson());
        bp.add("free", free);
        bp.add("premium", prem);
        c.add("bp", bp);

        JsonArray products = new JsonArray();
        for (Product p : PRODUCTS.values()) {
            JsonObject o = new JsonObject();
            o.addProperty("id", p.id);
            o.addProperty("name", p.name);
            o.addProperty("desc", p.desc);
            o.addProperty("section", p.section);
            o.addProperty("icon", p.icon);
            o.addProperty("price", p.priceCents);
            o.addProperty("priceText", usd(p.priceCents));
            o.addProperty("hidden", p.hidden);
            JsonArray rw = new JsonArray();
            for (Reward r : p.rewards) rw.add(r.toJson());
            o.add("rewards", rw);
            products.add(o);
        }
        c.add("products", products);

        JsonArray gemItems = new JsonArray();
        for (GemItem g : GEM_ITEMS.values()) {
            JsonObject o = new JsonObject();
            o.addProperty("id", g.id);
            o.addProperty("name", g.name);
            o.addProperty("icon", g.icon);
            o.addProperty("price", g.price);
            o.add("reward", g.reward.toJson());
            gemItems.add(o);
        }
        c.add("gemItems", gemItems);

        JsonArray xp = new JsonArray();
        for (int l = 1; l <= 60; l++) xp.add(xpForNext(l));
        c.add("xpTable", xp);
        cached = c;
        return c;
    }
}
