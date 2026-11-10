package com.deepduel.server;

import java.util.Random;
import java.util.Set;

/** Generates nicknames for bots that look like the ones real players pick. */
final class BotNames {
    private BotNames() {
    }

    private static final String[] RU_NAMES = {"Димон", "Саня", "Артём", "Влад", "Макс", "Егор", "Никитос", "Лёха", "Кирилл",
            "Ваня", "Миша", "Денис", "Тимур", "Илья", "Серёга", "Паша", "Костя", "Рома", "Женя", "Олег", "Андрюха", "Стас",
            "Катя", "Настя", "Алина", "Даша", "Маша", "Лиза", "Соня", "Вика", "Полина", "Ксюша", "Глеб", "Матвей", "Арсений"};
    private static final String[] RU_ADJ = {"Злой", "Тихий", "Морской", "Тёмный", "Быстрый", "Стальной", "Ржавый", "Глубинный",
            "Безумный", "Ледяной", "Хитрый", "Старый", "Красный", "Чёрный", "Великий", "Северный", "Дикий", "Ночной"};
    private static final String[] RU_NOUN = {"Волк", "Кит", "Скат", "Краб", "Кальмар", "Капитан", "Адмирал", "Охотник", "Шторм",
            "Призрак", "Нагибатор", "Подводник", "Юнга", "Боцман", "Рыбак", "Тунец", "Окунь", "Пират", "Моряк", "Дельфин"};
    private static final String[] EN = {"Kraken", "DeepHunter", "Torpedo", "Shark", "Nemo", "Barracuda", "Abyss", "Poseidon",
            "Leviathan", "SeaWolf", "Orca", "Hydra", "Trident", "Marlin", "Sonar", "Riptide", "Tsunami", "Hunter", "Ghost",
            "Viper", "Storm", "Neptune", "Kapitan", "Bubble", "Moby", "Anchor", "Reef", "Coral", "Squid", "Mako", "Wave",
            "Destroyer", "Sniper", "Rocket", "Titan", "Phantom", "Blaze", "Frost", "Zenit", "Kirpich"};
    private static final String[] EN_SUFFIX = {"_pro", "_yt", "_rus", "X", "007", "_TTV", "Gamer", "_99", "228", "777",
            "1337", "_ru", "_king", "Boss", "_top", "2010", "2012", "2014", "_OG", "Pro"};

    static String generate(Random rng, Set<String> takenLower) {
        for (int attempt = 0; attempt < 40; attempt++) {
            String n = candidate(rng);
            if (n.length() < 3 || n.length() > 16) continue;
            if (n.toLowerCase().startsWith("бот")) continue;
            if (takenLower.contains(n.toLowerCase())) continue;
            return n;
        }
        return "Player" + (1000 + rng.nextInt(9000));
    }

    private static String pick(Random rng, String[] a) {
        return a[rng.nextInt(a.length)];
    }

    private static String digits(Random rng) {
        switch (rng.nextInt(5)) {
            case 0: return String.valueOf(2005 + rng.nextInt(12));
            case 1: return String.valueOf(rng.nextInt(100));
            case 2: return String.valueOf(100 + rng.nextInt(900));
            case 3: return pick(rng, new String[]{"228", "777", "1337", "666", "007", "69", "99", "11"});
            default: return "";
        }
    }

    private static String candidate(Random rng) {
        switch (rng.nextInt(7)) {
            case 0:
                return pick(rng, RU_NAMES) + digits(rng);
            case 1:
                return pick(rng, RU_NAMES) + (rng.nextBoolean() ? "_" : "") + pick(rng, RU_NOUN);
            case 2: {
                String sep = rng.nextInt(3) == 0 ? "_" : (rng.nextBoolean() ? " " : "");
                return pick(rng, RU_ADJ) + sep + pick(rng, RU_NOUN);
            }
            case 3:
                return pick(rng, RU_NOUN) + digits(rng);
            case 4:
                return pick(rng, EN) + pick(rng, EN_SUFFIX);
            case 5: {
                String n = pick(rng, EN) + digits(rng);
                return rng.nextInt(3) == 0 ? n.toLowerCase() : n;
            }
            default: {
                String n = pick(rng, EN);
                return rng.nextBoolean() ? "xX_" + n + "_Xx" : "The" + n;
            }
        }
    }
}
