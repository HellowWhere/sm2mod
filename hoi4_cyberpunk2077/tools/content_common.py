"""Справочники: иконки, портреты, страны, косметические теги, идеи."""
from cp77core import loc

C = {
    "yellow": (252, 238, 10), "cyan": (0, 240, 255), "magenta": (255, 0, 150), "red": (255, 40, 60),
    "green": (60, 255, 120), "orange": (255, 140, 0), "violet": (170, 80, 255), "white": (235, 240, 255),
    "blue": (40, 120, 255), "gold": (230, 180, 60),
}

# имя иконки -> (глиф, цвет). Используется для фокусов (GFX_goal_cp77_*),
# идей (GFX_idea_cp77_*), решений и картинок событий.
ICON_CATALOG = {
    "city": ("⌂", "yellow"), "tower": ("♜", "red"), "yen": ("¥", "red"), "arasaka": ("荒", "red"),
    "militech": ("M", "orange"), "kangtao": ("康", "cyan"), "money": ("€$", "yellow"), "gear": ("⚙", "yellow"),
    "anchor": ("⚓", "cyan"), "chip": ("▣", "cyan"), "brain": ("✺", "magenta"), "eye": ("◉", "cyan"),
    "skull": ("☠", "red"), "nuke": ("☢", "yellow"), "bio": ("☣", "green"), "bolt": ("⚡", "yellow"),
    "plane": ("✈", "cyan"), "music": ("♫", "magenta"), "star": ("★", "yellow"), "moon": ("☾", "white"),
    "crown": ("♛", "gold"), "swords": ("⚔", "red"), "diamond": ("◈", "cyan"), "peace": ("☮", "green"),
    "yinyang": ("☯", "violet"), "hammer": ("⚒", "orange"), "flag": ("⚑", "red"), "wheel": ("☸", "orange"),
    "ice": ("❄", "cyan"), "net": ("⌘", "violet"), "ai": ("AI", "violet"), "ghost": ("❖", "violet"),
    "taxi": ("TX", "yellow"), "soda": ("☕", "blue"), "heart": ("♥", "magenta"), "rose": ("✿", "magenta"),
    "cross": ("✝", "gold"), "tiger": ("虎", "green"), "maelstrom": ("◎", "red"), "wave": ("≈", "cyan"),
    "sun": ("☼", "orange"), "target": ("⌖", "red"), "mask": ("☻", "white"), "dice": ("⚄", "white"),
    "flame": ("♨", "orange"), "rocket": ("⇑", "white"), "earth": ("♁", "cyan"), "infinity": ("∞", "violet"),
    "question": ("?", "magenta"), "hex": ("⬢", "yellow"), "medic": ("✚", "red"), "police": ("✪", "blue"),
    "mech": ("♞", "orange"), "pen": ("✎", "white"), "vote": ("☑", "green"), "handshake": ("⚭", "gold"),
    "glitch": ("▒", "magenta"), "wall": ("▓", "red"), "guitar": ("♬", "red"), "spade": ("♠", "white"),
    "corn": ("Ѱ", "yellow"), "tree": ("♣", "green"), "bigfoot": ("Ѫ", "orange"), "v": ("V", "cyan"),
    "jackie": ("J", "gold"), "fist": ("✊", "red"), "atom": ("⚛", "cyan"), "scales": ("⚖", "gold"),
    "phone": ("✆", "cyan"), "hourglass": ("⌛", "yellow"), "snake": ("§", "green"), "sandevistan": ("»", "green"),
    "bat": ("Ѵ", "red"), "pyramid": ("▲", "gold"), "kangaroo": ("ʞ", "orange"), "dragon": ("龍", "gold"),
}

# ----------------------------------------------------------------- портреты
PORTRAITS = {}


def portrait(pid, color, kind="human", initials=""):
    PORTRAITS[pid] = (C[color], kind, initials)
    return f"gfx/leaders/cp77/{pid}.dds"


def leader(name, desc_key, desc, pid, color, ideology, kind="human", initials=""):
    loc("cp77_leaders", desc_key, desc)
    pic = portrait(pid, color, kind, initials)
    return (
        "create_country_leader = {\n"
        f'\tname = "{name}"\n'
        f'\tdesc = "{desc_key}"\n'
        f'\tpicture = "{pic}"\n'
        '\texpire = "2150.1.1.1"\n'
        f"\tideology = {ideology}\n"
        "\ttraits = { }\n"
        "}"
    )


# ------------------------------------------------------- страны и косметика
IDEOLOGIES = ("democratic", "fascism", "communism", "neutrality")
FLAGS = {}


def country_names(tag, name, adj, def_name=None, flag=None):
    loc("cp77_countries", tag, name)
    loc("cp77_countries", tag + "_DEF", def_name or name)
    loc("cp77_countries", tag + "_ADJ", adj)
    for ide in IDEOLOGIES:
        loc("cp77_countries", f"{tag}_{ide}", name)
        loc("cp77_countries", f"{tag}_{ide}_DEF", def_name or name)
        loc("cp77_countries", f"{tag}_{ide}_ADJ", adj)
    if flag:
        FLAGS[tag] = flag


def flag(bg, glyph=None, glyph_color="white", stripes="h", canton=None, scale=0.62, offset=(0, 0)):
    return {
        "bg": [C[c] if isinstance(c, str) else c for c in bg], "glyph": glyph,
        "glyph_color": C[glyph_color] if isinstance(glyph_color, str) else glyph_color,
        "stripes": stripes, "canton": C[canton] if isinstance(canton, str) else canton,
        "glyph_scale": scale, "glyph_offset": offset,
    }


BLACK = (12, 10, 18)
DARK = (28, 24, 40)

# Реальные (новые) страны мода
NEW_TAGS = {
    "ZNU": dict(file="New United States", color=(40, 70, 160), gfx="western_european",
                name="Новые Соединённые Штаты Америки", adj="американский", def_name="Новые Соединённые Штаты Америки",
                flag=flag([(178, 34, 52), (240, 240, 240)] * 3 + [(178, 34, 52)], "★", "white", canton=(30, 40, 110), scale=0.35, offset=(-24, -12))),
    "ZJP": dict(file="Arasaka Japan", color=(230, 230, 235), gfx="asian",
                name="Корпоративная Япония Арасаки", adj="японский", def_name="Корпоративная Япония Арасаки",
                flag=flag([(240, 240, 240)], "荒", "red", scale=0.7)),
    "ZNC": dict(file="Night City", color=(240, 20, 140), gfx="western_european",
                name="Свободный город Найт-Сити", adj="найт-ситийский", def_name="Свободный город Найт-Сити",
                flag=flag([BLACK, (252, 238, 10)], "NC", "magenta", stripes="diag", scale=0.5)),
    "ZFT": dict(file="Free State of Texas", color=(200, 120, 40), gfx="western_european",
                name="Свободный штат Техас", adj="техасский",
                flag=flag([(235, 235, 235), (190, 30, 45)], "★", "white", canton=(20, 40, 120), scale=0.4, offset=(-24, -10))),
    "ZFP": dict(file="Free States Northwest", color=(40, 160, 110), gfx="western_european",
                name="Свободные Штаты Северо-Запада", adj="каскадский",
                flag=flag([(20, 90, 70), (30, 120, 160), (20, 90, 70)], "♣", "white", scale=0.5)),
    "ZBL": dict(file="Badlands Nomad Nation", color=(220, 150, 60), gfx="western_european",
                name="Нация кочевников Пустошей", adj="кочевой",
                flag=flag([(200, 110, 30), BLACK], "☸", "yellow", stripes="diag", scale=0.55)),
}

# Косметические теги (ключ -> (название, прилагательное, флаг))
COSMETIC = {
    "CP77_CORPO": ("Корпоративная зона Найт-Сити", "корпоративный", flag([BLACK, (200, 160, 50)], "¥", "gold", stripes="diag")),
    "CP77_ARASAKA_NC": ("Префектура Арасака Найт-Сити", "арасакский", flag([(240, 240, 240), (200, 20, 30)], "荒", BLACK, stripes="diag", scale=0.55)),
    "CP77_MILITECH": ("Республика Милитех", "милитеховский", flag([(60, 60, 64), (255, 140, 0)], "M", "white", stripes="h", scale=0.6)),
    "CP77_SAMURAI": ("Народная республика «Самурай»", "самурайский", flag([BLACK, (200, 0, 30)], "☠", "white", stripes="diag")),
    "CP77_AFTERLIFE": ("Республика «Посмертие»", "наёмничий", flag([BLACK, (20, 60, 90)], "♠", "cyan")),
    "CP77_NOMAD": ("Кочевая конфедерация Альдекальдо", "кочевой", flag([(200, 110, 30), (60, 40, 20)], "☸", "yellow")),
    "CP77_WHEELS": ("Нация на колёсах", "колёсный", flag([BLACK, (255, 140, 0), BLACK], "☸", "white", scale=0.7)),
    "CP77_MAELSTROM": ("Хромовая орда Мальстрёма", "мальстрёмский", flag([BLACK, (180, 0, 20)], "◎", "red", stripes="diag", scale=0.7)),
    "CP77_VALENTINOS": ("Республика Хейвуд", "валентинский", flag([(200, 160, 40), (150, 10, 30)], "✿", "white")),
    "CP77_TYGER": ("Сёгунат Тигриных Когтей", "когтистый", flag([BLACK, (40, 220, 120)], "虎", "green", stripes="diag", scale=0.6)),
    "CP77_VOODOO": ("Республика Вуду Пасифики", "пасификанский", flag([(10, 60, 70), BLACK], "≈", "cyan")),
    "CP77_BEYOND": ("Сущности за Чёрным Заслоном", "запредельный", flag([BLACK, (150, 0, 20)], "▓", "red", stripes="diag", scale=0.7)),
    "CP77_NETWATCH": ("Протекторат NetWatch", "нетвотчевский", flag([(20, 40, 120), (230, 230, 240)], "◉", "cyan")),
    "CP77_DELAMAIN": ("Таксократия Делямейна", "делямейновский", flag([BLACK], "TX", "yellow", scale=0.5)),
    "CP77_BRENDAN": ("Вендократия Брендана", "автоматный", flag([(30, 80, 200), (230, 230, 240)], "☕", BLACK)),
    "CP77_BLUE_EYES": ("Сон Синих Глаз", "сновидческий", flag([BLACK], "◉", "blue", scale=0.8)),
    "CP77_BRAINDANCE": ("Брейнданс-Республика", "брейндансовый", flag([(90, 20, 140), BLACK], "◉", "magenta", stripes="diag")),
    "CP77_LIZZY": ("Хромированная поп-империя Лиззи Уиззи", "попсовый", flag([(255, 0, 150), (200, 200, 220)], "♫", "white")),
    "CP77_REPUBLIC_V": ("Республика Ви", "ви-шный", flag([BLACK, (0, 200, 220)], "V", "yellow", stripes="diag", scale=0.7)),
    "CP77_CORN": ("Кукурузная империя Техас", "кукурузный", flag([(230, 200, 40), (60, 140, 40)], "Ѱ", "white")),
    "CP77_HORDE": ("Великая орда кочевников", "ордынский", flag([(120, 60, 20), BLACK], "☸", "red", scale=0.75)),
    "CP77_DRUID": ("Друидический ИИ-лес Каскадии", "друидический", flag([(20, 90, 40)], "♣", "cyan", scale=0.75)),
    "CP77_LUNAR": ("Лунная Республика Америки", "лунный", flag([(30, 30, 50), (140, 140, 160)], "☾", "white")),
    "CP77_FREE_JAPAN": ("Свободная Япония", "японский", flag([(240, 240, 240)], "☯", "red", scale=0.6)),
    "CP77_SHOGUNATE": ("Корпоративный сёгунат Арасаки", "сёгунский", flag([BLACK, (200, 20, 30)], "荒", "gold", stripes="diag")),
    "CP77_DIGITAL": ("Цифровая империя Микоси", "цифровой", flag([BLACK, (0, 120, 140)], "荒", "cyan")),
    "CP77_MYERS": ("Вечная Америка Майерс", "американский", flag([(30, 40, 110), (178, 34, 52)], "∞", "white", stripes="diag")),
}

for _tag, _d in NEW_TAGS.items():
    country_names(_tag, _d["name"], _d["adj"], _d.get("def_name"), _d["flag"])
for _tag, (_n, _a, _f) in COSMETIC.items():
    country_names(_tag, _n, _a, None, _f)


# ---------------------------------------------------------------------- идеи
IDEAS = {}


def idea(iid, name, desc, modifiers, icon, removal=-1):
    loc("cp77_ideas", iid, name)
    loc("cp77_ideas", iid + "_desc", desc)
    IDEAS[iid] = (modifiers, icon, removal)
    return iid


idea("cp77_city_of_dreams", "Город мечты",
     "Найт-Сити — город, где каждый мечтает стать легендой. Большинство становится удобрением.",
     {"consumer_goods_factor": 0.10, "research_speed_factor": 0.05, "stability_factor": -0.10}, "city")
idea("cp77_gang_wars", "Войны банд",
     "Мальстрём, Тигриные Когти, Валентинос, Шестая улица, Животные — каждая банда считает город своим.",
     {"stability_factor": -0.10, "war_support_factor": 0.05, "conscription": 0.01}, "swords")
idea("cp77_corpo_plaza", "Корпоративная площадь",
     "Башни Арасаки и Милитеха возвышаются над центром. Деньги текут рекой, но не в карманы граждан.",
     {"industrial_capacity_factory": 0.10, "political_power_factor": -0.10}, "yen")
idea("cp77_cyberpsychosis", "Эпидемия киберпсихоза",
     "Слишком много хрома, слишком мало человечности. MaxTac не успевает.",
     {"army_attack_factor": 0.05, "stability_factor": -0.10}, "brain")
idea("cp77_relic", "Биочип «Relic»",
     "В голове лидера города сидит цифровой призрак рокера-террориста. Он курит, хамит и даёт советы.",
     {"research_speed_factor": 0.05, "stability_factor": -0.05, "war_support_factor": 0.10}, "chip")
idea("cp77_tax_paradise", "Налоговый рай",
     "Корпорации платят налоги… теоретически.",
     {"political_power_gain": 0.20, "consumer_goods_factor": -0.05}, "money")
idea("cp77_arasaka_security", "Служба безопасности Арасаки",
     "Улицы патрулируют безупречно одетые люди с катанами и нулевой эмпатией.",
     {"army_defence_factor": 0.10, "stability_factor": 0.10, "communism_drift": -0.02}, "arasaka")
idea("cp77_arasaka_prefecture", "Префектура Арасаки",
     "Найт-Сити официально стал территорией корпорации. Флаг города заменён логотипом.",
     {"production_speed_buildings_factor": 0.10, "political_power_factor": -0.10, "industrial_capacity_factory": 0.10}, "arasaka")
idea("cp77_mikoshi_nation", "Народ в Микоси",
     "Миллионы энграмм хранятся в цифровом некрополе. Мёртвые голосуют активнее живых.",
     {"research_speed_factor": 0.25, "monthly_population": -0.50, "stability_factor": 0.10}, "ghost")
idea("cp77_militech_contracts", "Контракты Милитеха",
     "Оружейный гигант щедро платит за лояльность и испытательные полигоны.",
     {"industrial_capacity_factory": 0.10, "army_attack_factor": 0.05}, "militech")
idea("cp77_drone_swarm", "Рой дронов",
     "Небо над городом жужжит. Каждый дрон считает себя патриотом.",
     {"army_attack_factor": 0.10, "training_time_factor": -0.20}, "plane")
idea("cp77_free_city_charter", "Хартия свободного города",
     "Права граждан записаны на бумаге. Бумага бронирована.",
     {"stability_factor": 0.10, "democratic_drift": 0.05, "political_power_gain": 0.10}, "pen")
idea("cp77_shadow_puppeteers", "Кукловоды из тени",
     "Кто-то держит мэра на нитках. Город стал очень послушным. Подозрительно послушным.",
     {"political_power_gain": 0.50, "stability_factor": 0.15, "war_support_factor": -0.10}, "eye")
idea("cp77_samurai_on_tour", "«Самурай» в туре",
     "Воссоединившаяся легендарная группа играет на каждом углу. Корпораты в ярости.",
     {"war_support_factor": 0.15, "political_power_gain": 0.10}, "guitar")
idea("cp77_burn_corpo", "Сжечь корпо!",
     "Каждая башня — мишень. Каждый корпорат — враг народа.",
     {"army_attack_factor": 0.10, "production_speed_buildings_factor": -0.10, "communism_drift": 0.03}, "flame")
idea("cp77_afterlife_mercs", "Наёмники «Посмертия»",
     "Лучшие соло города пьют коктейли, названные в честь мёртвых легенд, и ждут контрактов.",
     {"experience_gain_army": 0.15, "special_forces_cap": 0.50}, "spade")
idea("cp77_nomad_clans", "Кланы кочевников",
     "Альдекальдо, Бакеры, Джоды — семьи на колёсах, готовые встать за своих.",
     {"army_speed_factor": 0.15, "monthly_population": 0.10}, "wheel")
idea("cp77_nation_on_wheels", "Нация на колёсах",
     "Столица — колонна из трёх тысяч машин. Заводы — на прицепах. Парламент — в автобусе.",
     {"army_speed_factor": 0.50, "production_speed_buildings_factor": -0.50, "army_org_factor": 0.10}, "wheel")
idea("cp77_chrome_cult", "Культ хрома",
     "Плоть слаба. Хром вечен. Глаза Мальстрёма светятся красным.",
     {"army_attack_factor": 0.20, "stability_factor": -0.15, "army_org_factor": -0.10}, "maelstrom")
idea("cp77_flesh_is_trash", "Тело — это мусор",
     "Последний живой орган, разрешённый законом, — мозг. Временно.",
     {"army_defence_factor": 0.20, "monthly_population": -0.30, "research_speed_factor": 0.05}, "skull")
idea("cp77_familia", "La Familia",
     "Валентинос держатся вместе. Семья — это всё.",
     {"stability_factor": 0.15, "conscription": 0.02}, "rose")
idea("cp77_saint_jackie", "Святой Джеки",
     "Джеки Уэллс вернулся из мёртвых (или его брейнданс-копия). Хейвуд молится на него.",
     {"war_support_factor": 0.20, "political_power_gain": 0.10}, "jackie")
idea("cp77_tyger_shogunate", "Сёгунат Когтей",
     "Неоновые катаны, кодекс чести и много, очень много мотоциклов.",
     {"political_power_gain": 0.20, "army_org_factor": 0.05}, "tiger")
idea("cp77_pacifica_net", "Сеть Пасифики",
     "Вуду-бои знают о Сети больше, чем NetWatch готов признать.",
     {"decryption_factor": 0.30, "encryption_factor": 0.30}, "wave")
idea("cp77_ai_overlords", "Власть ИИ",
     "Город управляется сущностями из-за Чёрного Заслона. Светофоры работают идеально. Люди — не очень.",
     {"research_speed_factor": 0.40, "stability_factor": 0.20, "consumer_goods_factor": -0.10, "monthly_population": -0.20}, "ai")
idea("cp77_rogue_ai", "Дикие ИИ в Сети",
     "Чёрный Заслон пал. Старая Сеть ползёт в каждый терминал, каждый тостер, каждый имплант.",
     {"research_speed_factor": -0.05, "decryption_factor": -0.20, "stability_factor": -0.05}, "wall")
idea("cp77_netwatch_protectorate", "Протекторат NetWatch",
     "Город — витрина безопасной Сети. Каждый пакет данных проверяется. Дважды.",
     {"encryption_factor": 0.50, "research_speed_factor": 0.05, "stability_factor": 0.05}, "eye")
idea("cp77_delamain_citizens", "Такси — граждане",
     "Автомобили Делямейна получили паспорта. Пробки стали политическим вопросом.",
     {"monthly_population": 0.20, "army_speed_factor": 0.10}, "taxi")
idea("cp77_delamain_split", "Расщепление Делямейна",
     "Двадцать одна личность ИИ-таксиста спорят, кто здесь президент. Одна из них хочет только покрасить машины в розовый.",
     {"stability_factor": -0.20, "political_power_gain": -0.10}, "glitch")
idea("cp77_vendocracy", "Вендократия",
     "Решения принимают торговые автоматы. Говорят, они мудрее Совета.",
     {"consumer_goods_factor": -0.10, "political_power_gain": 0.15}, "soda")
idea("cp77_free_soda", "Бесплатная газировка навеки",
     "Каждый гражданин получает Nicola-Колу бесплатно. Счастье измеряется в литрах.",
     {"stability_factor": 0.25, "consumer_goods_factor": 0.10, "war_support_factor": -0.10}, "soda")
idea("cp77_blue_eyes", "Взгляд Синих Глаз",
     "Никто не знает, кто он. Все знают, что он смотрит.",
     {"political_power_gain": 0.30, "stability_factor": 0.10, "research_speed_factor": 0.10}, "eye")
idea("cp77_blue_dreams", "Сны о синих глазах",
     "Жителям всего мира снится один и тот же человек в костюме. Он улыбается.",
     {"stability_factor": -0.05, "research_speed_factor": 0.03}, "eye")
idea("cp77_bd_nation", "Нация в брейндансе",
     "Половина граждан живёт в чужих воспоминаниях. Вторая половина их редактирует.",
     {"stability_factor": 0.20, "war_support_factor": -0.20, "research_speed_factor": 0.10}, "brain")
idea("cp77_simulation", "Симуляция внутри симуляции",
     "Учёные доказали, что мир — брейнданс. Затем доказали, что доказательство — тоже брейнданс.",
     {"research_speed_factor": 0.50, "stability_factor": -0.10}, "glitch")
idea("cp77_lizzy_cult", "Культ Лиззи Уиззи",
     "Хромированная поп-дива заменила себе всё, включая гражданство. Фанаты повторяют.",
     {"war_support_factor": 0.15, "stability_factor": 0.10, "consumer_goods_factor": 0.05}, "music")
idea("cp77_lizzy_fever", "Лихорадка Лиззи Уиззи",
     "Орбитальный концерт видел весь мир. Весь мир хочет хромированные губы.",
     {"stability_factor": 0.05, "war_support_factor": -0.05}, "music")
idea("cp77_trauma_team", "Платиновая подписка Trauma Team",
     "Бронированный AV прилетит за раненым солдатом за 3 минуты. Если оплачено.",
     {"monthly_population": 0.05, "army_org_factor": 0.05, "training_time_factor": -0.10}, "medic")
idea("cp77_sandevistan", "Доктрина Сандевистана",
     "Время замедляется. Пули зависают в воздухе. Солдаты успевают выпить кофе.",
     {"army_attack_factor": 0.10, "army_speed_factor": 0.10}, "sandevistan")
idea("cp77_fortress_city", "Город-крепость",
     "Мегабашни превращены в бастионы. Каждый этаж — огневая точка.",
     {"army_core_defence_factor": 0.15, "army_defence_factor": 0.05}, "tower")
idea("cp77_netrunner_corps", "Корпус нетраннеров",
     "Люди в ваннах со льдом, подключённые к Сети. Опасно, но эффективно.",
     {"decryption_factor": 0.25, "encryption_factor": 0.25}, "net")
idea("cp77_daemon_legion", "Легион демонов",
     "Самописные программы-демоны атакуют вражеские сети круглосуточно.",
     {"decryption_factor": 0.50, "research_speed_factor": 0.05}, "net")
idea("cp77_ncpd", "NCPD",
     "Полиция Найт-Сити. Коррумпирована, перегружена, но вооружена.",
     {"stability_factor": 0.05, "conscription": 0.01}, "police")
idea("cp77_cyberpsycho_squads", "Отряды киберпсихов",
     "Если не можешь вылечить киберпсихов — дай им форму и направь на врага.",
     {"army_attack_factor": 0.15, "army_org_factor": -0.15, "stability_factor": -0.05}, "brain")
idea("cp77_megacorp_economy", "Экономика мегакорпорации",
     "Город работает как один гигантский холдинг. Каждый гражданин — сотрудник.",
     {"industrial_capacity_factory": 0.15, "production_factory_max_efficiency_factor": 0.05}, "gear")
# --- НСША
idea("cp77_nusa_federal", "Федеральная власть НСША",
     "Президент Майерс железной рукой собирает страну, развалившуюся на свободные штаты.",
     {"political_power_gain": 0.10, "stability_factor": 0.05, "war_support_factor": 0.10}, "star")
idea("cp77_militech_state", "Государство Милитеха",
     "Где кончается правительство и начинается Милитех? Ответ засекречен.",
     {"industrial_capacity_factory": 0.10, "production_factory_max_efficiency_factor": 0.05}, "militech")
idea("cp77_unification_war", "Вторая война за объединение",
     "Свободные штаты вернутся. Добровольно или в мешках.",
     {"war_support_factor": 0.20, "army_attack_factor": 0.05}, "flag")
idea("cp77_fia", "FIA",
     "Федеральная разведка знает, что вы ели на завтрак. И что съедите завтра.",
     {"decryption_factor": 0.30, "encryption_factor": 0.30}, "eye")
idea("cp77_moon_colony", "Лунная колония",
     "Сойка улетела на Луну. За ней — тысячи переселенцев.",
     {"research_speed_factor": 0.10, "monthly_population": 0.05}, "moon")
idea("cp77_crystal_palace", "Хрустальный дворец",
     "Орбитальная станция-курорт и тайный командный центр.",
     {"production_speed_buildings_factor": 0.10, "research_speed_factor": 0.05}, "rocket")
idea("cp77_myers_eternal", "Вечная Майерс",
     "Президент Майерс не стареет. Президент Майерс не спит. Президент Майерс — энграмма?",
     {"political_power_gain": 0.50, "stability_factor": 0.10, "democratic_drift": -0.05}, "infinity")
# --- Арасака
idea("cp77_arasaka_empire", "Империя Арасаки",
     "Япония — это Арасака. Арасака — это Япония. Сабуро Арасаке 158 лет.",
     {"industrial_capacity_factory": 0.10, "stability_factor": 0.10, "political_power_gain": 0.10}, "arasaka")
idea("cp77_saburo_eternal", "Вечный Сабуро",
     "Энграмма основателя корпорации готова пережить любые тела.",
     {"political_power_gain": 0.25, "research_speed_factor": 0.05}, "ghost")
idea("cp77_yorinobu_reforms", "Реформы Ёринобу",
     "Наследник ненавидит империю отца и хочет её разобрать на части.",
     {"consumer_goods_factor": -0.10, "stability_factor": -0.05, "democratic_drift": 0.05}, "fist")
idea("cp77_soulkiller_nation", "Нация Soulkiller",
     "Каждый гражданин оцифрован. Тела хранятся на складах. На всякий случай.",
     {"research_speed_factor": 0.50, "monthly_population": -0.80, "stability_factor": 0.20}, "ghost")
idea("cp77_digital_emperor", "Цифровой император",
     "Сабуро стал ИИ. Ему больше не нужны ни сон, ни совесть.",
     {"army_attack_factor": 0.10, "army_defence_factor": 0.10, "political_power_gain": 1.0}, "ai")
idea("cp77_relic_world", "Relic 2.0",
     "Арасака раздала «бесплатные» биочипы всему миру. Ничего плохого же не случится?",
     {"stability_factor": -0.05, "war_support_factor": -0.05, "research_speed_factor": 0.02}, "chip")
# --- остальные
idea("cp77_kang_tao", "Государство Кан Тао",
     "Молодая и агрессивная корпорация умных пушек правит Китаем.",
     {"industrial_capacity_factory": 0.10, "research_speed_factor": 0.05}, "kangtao")
idea("cp77_sovoil", "СовОйл",
     "Советский Союз пережил XX век благодаря нефти, газу и полной беспринципности.",
     {"local_resources_factor": 0.15, "stability_factor": 0.05}, "flame")
idea("cp77_eec", "ЕЭС",
     "Европа объединилась вокруг евродоллара и бюрократии.",
     {"trade_opinion_factor": 0.20, "consumer_goods_factor": -0.05}, "money")
idea("cp77_free_state", "Дух Свободных штатов",
     "Здесь не любят Вашингтон, налоги и Милитех. Особенно Милитех.",
     {"war_support_factor": 0.10, "stability_factor": -0.05}, "flag")
idea("cp77_chooh2", "Поля CHOOH2",
     "Генномодифицированная кукуруза — топливо будущего. И настоящего. И, видимо, религия.",
     {"local_resources_factor": 0.20, "consumer_goods_factor": -0.05}, "corn")
idea("cp77_corn_empire", "Кукурузный трон",
     "Император правит с трона из початков. Подданные обязаны носить жёлтое.",
     {"stability_factor": 0.15, "political_power_gain": 0.20, "research_speed_factor": -0.05}, "corn")
idea("cp77_biotechnica_forests", "Леса Биотехники",
     "ГМО-секвойи растут по метру в неделю и, кажется, иногда переговариваются.",
     {"monthly_population": 0.10, "production_speed_buildings_factor": 0.05}, "tree")
idea("cp77_bigfoot", "Министерство снежного человека",
     "Он существует. У него есть пропуск в министерство. Он голосовал.",
     {"stability_factor": 0.10, "army_defence_factor": 0.05}, "bigfoot")
idea("cp77_druid_ai", "ИИ-друид",
     "Лес обрёл разум и требует уважения. Лесорубов стало меньше.",
     {"research_speed_factor": 0.15, "industrial_capacity_factory": -0.05}, "tree")
idea("cp77_nomad_horde", "Великая орда",
     "Пыль до горизонта. Моторы ревут. Это идут кочевники.",
     {"army_speed_factor": 0.25, "army_attack_factor": 0.10}, "wheel")
