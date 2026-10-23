"""Деревья фокусов НСША (ZNU), Арасаки (ZJP) и Свободных штатов (ZFT/ZFP/ZBL)."""
from cp77core import indent, loc
from content_common import leader

POL = "FOCUS_FILTER_POLITICAL"
IND = "FOCUS_FILTER_INDUSTRY"
RES = "FOCUS_FILTER_RESEARCH"
ARMY = "FOCUS_FILTER_ARMY_XP"
STAB = "FOCUS_FILTER_STABILITY"
WS = "FOCUS_FILTER_WAR_SUPPORT"
MAN = "FOCUS_FILTER_MANPOWER"
ANNEX = "FOCUS_FILTER_ANNEXATION"


def cap(body):
    return "capital_scope = {\n" + indent(body, 1) + "\n}"


def wargoal(tag, kind="annex_everything"):
    return f"if = {{ limit = {{ country_exists = {tag} NOT = {{ has_war_with = {tag} }} }} create_wargoal = {{ type = {kind} target = {tag} }} }}"


# ====================================================================== НСША
def build_usa(T):
    T.group = "cp77_focus_usa"
    a = T.add
    a("CP77_USA_new_united_states", 6, 0, "star", "Новые Соединённые Штаты",
      "Америка разорвана: Свободные штаты, Найт-Сити, Пустоши. Президент Розалинд Майерс собирает её заново.",
      "add_political_power = 100\nadd_stability = 0.05", filters=[POL])
    a("CP77_USA_militech_state", 3, 1, "militech", "Государство Милитеха",
      "Майерс — бывшая глава Милитеха. Совпадение? Нет.",
      "add_ideas = cp77_militech_state", prereq=["CP77_USA_new_united_states"], filters=[IND])
    a("CP77_USA_myers_doctrine", 6, 1, "flag", "Доктрина Майерс",
      "Единая страна. Единая армия. Единая корпорация… то есть правительство.",
      "add_political_power = 100\nadd_war_support = 0.05", prereq=["CP77_USA_new_united_states"], filters=[POL])
    a("CP77_USA_fia_network", 9, 1, "eye", "Сеть FIA",
      "Федеральная разведка — длинная рука Вашингтона.",
      "add_ideas = cp77_fia", prereq=["CP77_USA_new_united_states"], filters=[POL])
    a("CP77_USA_militech_army", 11, 1, "militech", "Армия Милитеха",
      "Частная армия, которая официально является государственной.",
      "army_experience = 50\nadd_tech_bonus = { name = CP77_USA_militech_army bonus = 1.0 uses = 2 category = infantry_weapons }",
      prereq=["CP77_USA_new_united_states"], filters=[ARMY])
    # экономика
    a("CP77_USA_war_economy", 3, 2, "gear", "Военная экономика",
      "Заводы Милитеха работают в три смены.",
      cap("add_extra_state_shared_building_slots = 3\nadd_building_construction = { type = arms_factory level = 3 instant_build = yes }"),
      prereq=["CP77_USA_militech_state"], filters=[IND])
    a("CP77_USA_orbital_industry", 2, 3, "rocket", "Орбитальная промышленность",
      "Невесомость — идеальное место для производства микросхем.",
      "add_research_slot = 1", prereq=["CP77_USA_war_economy"], cost=15, filters=[RES])
    a("CP77_USA_chimera_program", 4, 3, "mech", "Программа «Химера»",
      "Гигантский паукообразный мех Милитеха. Тот самый, что гонялся за Ви в Догтауне.",
      "add_tech_bonus = { name = CP77_USA_chimera_program bonus = 1.0 uses = 3 category = armor }",
      prereq=["CP77_USA_war_economy"], filters=[RES])
    a("CP77_USA_crystal_palace", 2, 4, "rocket", "Хрустальный дворец",
      "Орбитальная станция становится вторым правительственным центром.",
      "add_ideas = cp77_crystal_palace", prereq=["CP77_USA_orbital_industry"], filters=[IND])
    a("CP77_USA_mech_divisions", 4, 4, "mech", "Дивизии мехов",
      "Шагающая бронетехника на каждом фронте.",
      "army_experience = 50\nadd_tech_bonus = { name = CP77_USA_mech_divisions bonus = 1.0 uses = 2 category = land_doctrine }",
      prereq=["CP77_USA_chimera_program"], filters=[ARMY])
    a("CP77_USA_rods_from_god", 2, 5, "target", "Стержни Господни",
      "Вольфрамовые стержни с орбиты. Кинетическая бомбардировка без радиации — гуманно!",
      "add_nuclear_bombs = 5\nadd_war_support = 0.1\nevery_country = { news_event = { id = cp77.23 hours = 6 } }",
      prereq=["CP77_USA_crystal_palace"], ai=0.5, filters=[WS])
    # политика: война или федерализм
    a("CP77_USA_unification_war_ii", 5, 2, "swords", "Вторая война за объединение",
      "Свободные штаты вернутся в Союз. Под звуки маршей или канонады.",
      "add_ideas = cp77_unification_war", prereq=["CP77_USA_myers_doctrine"], ai=2, filters=[WS])
    a("CP77_USA_new_federalism", 7, 2, "handshake", "Новый федерализм",
      "Широкая автономия для штатов — в обмен на лояльность.",
      "add_stability = 0.1\nadd_political_power = 100", prereq=["CP77_USA_myers_doctrine"], ai=1, filters=[STAB])
    T.mutex_group(["CP77_USA_unification_war_ii", "CP77_USA_new_federalism"])
    a("CP77_USA_reclaim_night_city", 5, 3, "city", "Вернуть Найт-Сити",
      "Город на западном побережье слишком долго играл в независимость.",
      wargoal("ZNC", "puppet") + "\nadd_state_core = 378",
      prereq=["CP77_USA_unification_war_ii"], filters=[ANNEX], will_lead_to_war_with=["ZNC"])
    a("CP77_USA_crush_free_states", 5, 4, "hammer", "Сломить Свободные штаты",
      "Техас, Северо-Запад, Пустоши — всех вернуть под звёздно-полосатый флаг.",
      "\n".join(wargoal(t) for t in ("ZFT", "ZFP", "ZBL")) + "\nadd_war_support = 0.1",
      prereq=["CP77_USA_reclaim_night_city"], filters=[ANNEX], will_lead_to_war_with=["ZFT", "ZFP", "ZBL"])
    a("CP77_USA_one_nation", 5, 5, "star", "Единая нация",
      "От Атлантики до Тихого океана — одна страна.",
      "every_state = { limit = { OR = { state = 375 state = 376 state = 377 state = 378 state = 379 state = 385 state = 386 } is_owned_by = ROOT } ROOT = { add_state_core = PREV } }\nadd_stability = 0.1",
      prereq=["CP77_USA_crush_free_states"], filters=[STAB])
    a("CP77_USA_myers_forever", 5, 6, "infinity", "Майерс навсегда",
      "На 50-летие президентства Майерс выглядит на 45. Шёпотом говорят: оригинал умер в 2071, а страной правит её энграмма в Хрустальном дворце.",
      "add_ideas = cp77_myers_eternal\nset_cosmetic_tag = CP77_MYERS\nset_politics = { ruling_party = fascism elections_allowed = no }\n" +
      leader("Энграмма Розалинд Майерс", "USA_myers_engram_desc",
             "Цифровая копия президента, транслируемая в голографические трибуны по всей стране. Никогда не устаёт. Никогда не ошибается. Никогда не умрёт.",
             "myers_engram", "blue", "fascism_ideology", kind="ai", initials="RM"),
      prereq=["CP77_USA_one_nation"], ai=0.3, filters=[POL])
    a("CP77_USA_dogtown_operation", 7, 3, "target", "Операция в Догтауне",
      "Кошмар: самолёт президента падает в Догтаун, район Курта Хансена. Нужна помощь лучшего наёмника города.",
      "country_event = { id = cp77.11 days = 2 }", prereq=["CP77_USA_new_federalism"], filters=[POL])
    a("CP77_USA_save_songbird", 7, 4, "moon", "Спасти Сойку",
      "Сонг Со Ми — лучший нетраннер FIA — хочет свободы. Отпустим её на Луну.",
      "add_stability = 0.05\nadd_research_slot = 1", prereq=["CP77_USA_dogtown_operation"], ai=1, filters=[RES])
    a("CP77_USA_betray_songbird", 8, 4, "eye", "Предать Сойку",
      "Соломон Рид сдаёт её FIA. Государство превыше дружбы.",
      "add_political_power = 150\nadd_tech_bonus = { name = CP77_USA_betray_songbird bonus = 1.0 uses = 2 category = electronics }",
      prereq=["CP77_USA_dogtown_operation"], ai=1, filters=[POL])
    T.mutex_group(["CP77_USA_save_songbird", "CP77_USA_betray_songbird"])
    a("CP77_USA_cynosure_moon", 7, 5, "moon", "Синошур: путь к Луне",
      "Вслед за Сойкой — тысячи колонистов.",
      "add_ideas = cp77_moon_colony", prereq=["CP77_USA_save_songbird"], filters=[RES])
    a("CP77_USA_lunar_republic", 7, 6, "moon", "Лунная республика",
      "Правительство решает, что на Луне спокойнее. Столица переезжает. Вашингтон остаётся «филиалом».",
      "set_cosmetic_tag = CP77_LUNAR\nadd_stability = 0.1\nadd_research_slot = 1\nadd_war_support = -0.1",
      prereq=["CP77_USA_cynosure_moon"], ai=0.3, filters=[RES])
    a("CP77_USA_blackwall_weapon", 8, 5, "wall", "Заслон как оружие",
      "Сойка умела говорить с ИИ за Заслоном. FIA хочет поставить это на конвейер.",
      "add_ideas = cp77_netrunner_corps\nset_global_flag = cp77_blackwall_cracked\nadd_war_support = 0.05",
      prereq=["CP77_USA_betray_songbird"], filters=[RES])
    a("CP77_USA_fia_black_ops", 9, 2, "spade", "Чёрные операции FIA",
      "Спящие агенты в каждом Свободном штате.",
      "every_country = { limit = { OR = { tag = ZFT tag = ZFP tag = ZBL tag = ZNC } exists = yes } add_stability = -0.05 }\nadd_political_power = 50",
      prereq=["CP77_USA_fia_network"], filters=[POL])
    a("CP77_USA_reed_legacy", 9, 3, "spade", "Наследие Соломона Рида",
      "Лучший агент FIA учит новое поколение. Его уроки: не доверяй никому, особенно себе.",
      "army_experience = 25\nadd_tech_bonus = { name = CP77_USA_reed_legacy bonus = 1.0 uses = 1 category = land_doctrine }",
      prereq=["CP77_USA_fia_black_ops"], filters=[ARMY])
    a("CP77_USA_netwatch_takeover", 9, 4, "net", "Поглощение NetWatch",
      "Главная служба кибербезопасности теперь — отдел FIA.",
      "add_research_slot = 1", prereq=["CP77_USA_reed_legacy"], cost=15, filters=[RES])
    # армия
    a("CP77_USA_av_corps", 11, 2, "plane", "Корпус AV",
      "Тысяча боевых AV над Пустошами.",
      "air_experience = 50\nadd_tech_bonus = { name = CP77_USA_av_corps bonus = 1.0 uses = 2 category = air_equipment }",
      prereq=["CP77_USA_militech_army"], filters=[RES])
    a("CP77_USA_barghest_contracts", 11, 3, "skull", "Контракты с «Баргестом»",
      "Полковник Курт Хансен и его головорезы из Догтауна готовы работать на федералов. За правильную цену.",
      "add_manpower = 30000\narmy_experience = 30", prereq=["CP77_USA_av_corps"], filters=[MAN])
    a("CP77_USA_fifth_corporate_war", 11, 4, "swords", "Пятая корпоративная война",
      "Милитех против Арасаки. Снова. На этот раз — с армией целой страны.",
      wargoal("ZJP") + "\nadd_war_support = 0.15", prereq=["CP77_USA_barghest_contracts"], ai=0.5,
      filters=[WS], will_lead_to_war_with=["ZJP"])
    return T


# =================================================================== АРАСАКА
def build_jap(T):
    T.group = "cp77_focus_jap"
    a = T.add
    a("CP77_JAP_arasaka_empire", 5, 0, "arasaka", "Империя Арасаки",
      "Сабуро Арасаке 158 лет. Его корпорация владеет Японией. Его сыну это не нравится.",
      "add_political_power = 100", filters=[POL])
    a("CP77_JAP_zaibatsu_industry", 2, 1, "gear", "Дзайбацу XXI века",
      "Заводы Арасаки — самые автоматизированные в мире.",
      cap("add_extra_state_shared_building_slots = 3\nadd_building_construction = { type = industrial_complex level = 3 instant_build = yes }"),
      prereq=["CP77_JAP_arasaka_empire"], filters=[IND])
    a("CP77_JAP_saburo_will", 5, 1, "crown", "Воля Сабуро",
      "Старик ещё жив. Но надолго ли? И кто унаследует империю?",
      "add_stability = 0.05\nadd_political_power = 50", prereq=["CP77_JAP_arasaka_empire"], filters=[POL])
    a("CP77_JAP_arasaka_military", 8, 1, "swords", "Силы безопасности Арасаки",
      "Лучшие корпоративные солдаты планеты.",
      "army_experience = 50", prereq=["CP77_JAP_arasaka_empire"], filters=[ARMY])
    a("CP77_JAP_arasaka_tech", 2, 2, "chip", "Технологии Арасаки",
      "Relic, Soulkiller, Микоси. Наука без тормозов.",
      "add_research_slot = 1", prereq=["CP77_JAP_zaibatsu_industry"], cost=15, filters=[RES])
    a("CP77_JAP_cyberware_monopoly", 2, 3, "brain", "Монополия на импланты",
      "Каждый третий имплант в мире — от Арасаки.",
      "add_political_power = 150\nadd_tech_bonus = { name = CP77_JAP_cyberware_monopoly bonus = 1.0 uses = 2 category = electronics }",
      prereq=["CP77_JAP_arasaka_tech"], filters=[RES])
    a("CP77_JAP_tokyo_megacity", 2, 4, "city", "Мегаполис Токио",
      "Город-гигант на сорок миллионов жителей и миллиард камер.",
      cap("add_extra_state_shared_building_slots = 3\nadd_building_construction = { type = industrial_complex level = 3 instant_build = yes }\nadd_building_construction = { type = arms_factory level = 2 instant_build = yes }"),
      prereq=["CP77_JAP_cyberware_monopoly"], filters=[IND])
    # наследование
    a("CP77_JAP_yorinobu_coup", 4, 2, "fist", "Переворот Ёринобу",
      "Канон: в пентхаусе отеля «Конпеки Плаза» Ёринобу душит отца. Корпорация переходит к сыну-бунтарю.",
      "country_event = { id = cp77.4 }\n" +
      leader("Ёринобу Арасака", "JAP_yorinobu_desc",
             "Блудный сын, бывший лидер банды «Стальные драконы». Ненавидит корпорацию отца и мечтает её уничтожить.",
             "yorinobu", "red", "fascism_ideology", initials="YA"),
      prereq=["CP77_JAP_saburo_will"], ai=2, filters=[POL])
    a("CP77_JAP_saburo_eternal", 6, 2, "ghost", "Вечный Сабуро",
      "Сабуро не умрёт. Его энграмма ждёт в Микоси нового тела.",
      "add_ideas = cp77_saburo_eternal", prereq=["CP77_JAP_saburo_will"], ai=2, filters=[POL])
    T.mutex_group(["CP77_JAP_yorinobu_coup", "CP77_JAP_saburo_eternal"])
    a("CP77_JAP_dismantle_arasaka", 3, 3, "hammer", "Распустить Арасаку",
      "Ёринобу делает невозможное: корпорацию делят на сотню независимых компаний.",
      "add_ideas = cp77_yorinobu_reforms\nset_politics = { ruling_party = democratic elections_allowed = yes }\nadd_popularity = { ideology = democratic popularity = 0.3 }",
      prereq=["CP77_JAP_yorinobu_coup"], ai=1, filters=[POL])
    a("CP77_JAP_hanako_countercoup", 4, 3, "crown", "Контрпереворот Ханако",
      "Ханако и верные отцу генералы свергают Ёринобу. Его тело ещё пригодится.",
      leader("Ханако Арасака", "JAP_hanako_desc",
             "Наследница, верная воле отца. Её главный план — поместить энграмму Сабуро в тело брата.",
             "hanako_jap", "red", "fascism_ideology", initials="HA"),
      prereq=["CP77_JAP_yorinobu_coup"], ai=2, filters=[POL])
    T.mutex_group(["CP77_JAP_dismantle_arasaka", "CP77_JAP_hanako_countercoup"])
    a("CP77_JAP_tiger_claws_pact", 3, 4, "tiger", "Пакт с Тигриными Когтями",
      "Ёринобу всегда дружил с бандами. Теперь они — новая полиция.",
      "add_manpower = 50000\nadd_stability = -0.05", prereq=["CP77_JAP_dismantle_arasaka"], filters=[MAN])
    a("CP77_JAP_free_japan", 3, 5, "yinyang", "Свободная Япония",
      "Впервые за век Япония принадлежит японцам, а не корпорации.",
      "set_cosmetic_tag = CP77_FREE_JAPAN\nadd_stability = 0.15\nremove_ideas = cp77_arasaka_empire",
      prereq=["CP77_JAP_tiger_claws_pact"], filters=[STAB])
    a("CP77_JAP_cyber_shinto", 3, 6, "yinyang", "Кибер-синто",
      "Жрецы объявили: ками живут в Сети. Каждый роутер — святилище. Каждый ИИ — божество.",
      "add_research_slot = 1\nadd_stability = 0.1", prereq=["CP77_JAP_free_japan"], ai=0.5, filters=[RES])
    a("CP77_JAP_saburo_in_yorinobu", 4, 4, "ghost", "Сабуро в теле сына",
      "Энграмма отца загружена в мозг сына. Сабуро снова жив. Ёринобу — нет.",
      "add_ideas = cp77_saburo_eternal\nadd_political_power = 200\n" +
      leader("Сабуро Арасака (в теле Ёринобу)", "JAP_saburo_reborn_desc",
             "Основатель корпорации в молодом теле собственного сына. Жутко? Арасака предпочитает слово «преемственность».",
             "saburo_reborn", "gold", "fascism_ideology", initials="SA"),
      prereq=["CP77_JAP_hanako_countercoup"], filters=[POL])
    a("CP77_JAP_corporate_shogunate", 4, 5, "crown", "Корпоративный сёгунат",
      "Император — декорация. Сёгун — генеральный директор.",
      "set_cosmetic_tag = CP77_SHOGUNATE\nadd_war_support = 0.15\narmy_experience = 50",
      prereq=["CP77_JAP_saburo_in_yorinobu"], filters=[POL])
    a("CP77_JAP_mikoshi", 6, 3, "ghost", "Проект «Микоси»",
      "Цифровой некрополь Арасаки, где хранятся украденные души.",
      "add_research_slot = 1", prereq=["CP77_JAP_saburo_eternal"], cost=15, filters=[RES])
    a("CP77_JAP_soulkiller_nation", 6, 4, "skull", "Нация Soulkiller",
      "Зачем нужны тела, если можно хранить граждан в Микоси? Это так эффективно!",
      "add_ideas = cp77_soulkiller_nation", prereq=["CP77_JAP_mikoshi"], ai=0.5, filters=[RES])
    a("CP77_JAP_digital_emperor", 6, 5, "ai", "Цифровой император",
      "Сабуро отказывается от тела вообще. Теперь он везде.",
      "add_ideas = cp77_digital_emperor\nset_cosmetic_tag = CP77_DIGITAL\n" +
      leader("Цифровой Сабуро", "JAP_digital_saburo_desc",
             "Энграмма Сабуро Арасаки, слившаяся с корпоративной сетью. Он не человек. Он — бренд.",
             "saburo_ai", "cyan", "fascism_ideology", kind="ai", initials="SA"),
      prereq=["CP77_JAP_soulkiller_nation"], ai=0.5, filters=[POL])
    a("CP77_JAP_relic_for_all", 6, 6, "chip", "Relic 2.0 для всего мира",
      "Арасака раздаёт бесплатные биочипы всем желающим. В каждом — маленький Сабуро.",
      "every_other_country = { limit = { is_major = yes } add_timed_idea = { idea = cp77_relic_world days = 730 } }\nadd_political_power = 200",
      prereq=["CP77_JAP_digital_emperor"], ai=0.5, filters=[POL])
    # армия / экспансия
    a("CP77_JAP_adam_smasher", 8, 2, "skull", "Адам Смэшер",
      "Самый опасный киборг в мире. От человека в нём остались только мозг и злоба.",
      "create_field_marshal = {\n\tname = \"Адам Смэшер\"\n\tpicture = \"gfx/leaders/cp77/smasher.dds\"\n\ttraits = { }\n\tskill = 5\n\tattack_skill = 6\n\tdefense_skill = 3\n\tplanning_skill = 3\n\tlogistics_skill = 3\n}",
      prereq=["CP77_JAP_arasaka_military"], filters=[ARMY])
    a("CP77_JAP_tower_in_nc", 9, 2, "tower", "Башня в Найт-Сити",
      "Новая Арасака-тауэр возвышается над Найт-Сити. Город должен вернуться под контроль.",
      "add_state_claim = 378\nadd_political_power = 50", prereq=["CP77_JAP_arasaka_military"], filters=[POL])
    a("CP77_JAP_arasaka_navy", 8, 3, "anchor", "Флот Арасаки",
      "Авианосцы с логотипом корпорации.",
      "navy_experience = 50\n" + cap("add_building_construction = { type = dockyard level = 3 instant_build = yes }"),
      prereq=["CP77_JAP_adam_smasher"], filters=[RES])
    a("CP77_JAP_claim_night_city", 9, 3, "target", "Вернуть Найт-Сити",
      "Если город не хочет быть префектурой добровольно…",
      wargoal("ZNC", "puppet"), prereq=["CP77_JAP_tower_in_nc"], filters=[ANNEX], will_lead_to_war_with=["ZNC"])
    a("CP77_JAP_kang_tao_war", 8, 4, "kangtao", "Война с Кан Тао",
      "Молодой китайский конкурент слишком быстро растёт.",
      wargoal("ZCH") + "\nadd_war_support = 0.1", prereq=["CP77_JAP_arasaka_navy"], filters=[WS], will_lead_to_war_with=["ZCH"])
    a("CP77_JAP_fifth_corporate_war", 8, 5, "swords", "Пятая корпоративная война",
      "Арасака против Милитеха. Последняя битва за мир.",
      wargoal("ZNU") + "\nadd_war_support = 0.2", prereq=["CP77_JAP_kang_tao_war"], ai=0.5, filters=[WS], will_lead_to_war_with=["ZNU"])
    return T


# ============================================================ СВОБОДНЫЕ ШТАТЫ
def build_free_states(T, tag):
    """Дерево конкретного Свободного штата: общий ствол + собственная ветка."""
    T.group = f"cp77_focus_{tag.lower()}"
    pre = f"CP77_{tag}_"

    def r(x):
        return x.replace("CP77_FS_", pre) if isinstance(x, str) else tuple(r(i) for i in x)

    def a(fid, *args, **kw):
        kw.pop("allow_branch", None)
        kw["prereq"] = [r(p) for p in kw.get("prereq", [])]
        return T.add(r(fid), *args, **kw)

    def mutex(ids):
        T.mutex_group([r(i) for i in ids])
    a("CP77_FS_independence", 5, 0, "flag", "Свобода от Вашингтона",
      "Мы вышли из Союза во время Коллапса и не собираемся возвращаться.",
      "add_political_power = 75\nadd_war_support = 0.05", filters=[POL])
    a("CP77_FS_local_militia", 3, 1, "swords", "Народное ополчение",
      "Каждый гражданин с винтовкой — солдат Свободного штата.",
      "add_manpower = 20000\nadd_equipment_to_stockpile = { type = infantry_equipment_1 amount = 1500 }",
      prereq=["CP77_FS_independence"], filters=[MAN])
    a("CP77_FS_free_trade", 7, 1, "money", "Свободная торговля",
      "Никаких федеральных пошлин.",
      "add_political_power = 75\n" + cap("add_extra_state_shared_building_slots = 2\nadd_building_construction = { type = industrial_complex level = 1 instant_build = yes }"),
      prereq=["CP77_FS_independence"], filters=[IND])
    a("CP77_FS_border_forts", 3, 2, "tower", "Пограничные укрепления",
      "Бетон и колючая проволока на границе с НСША.",
      "add_ideas = cp77_fortress_city", prereq=["CP77_FS_local_militia"], filters=[ARMY])
    a("CP77_FS_corp_investors", 7, 2, "yen", "Корпоративные инвесторы",
      "Арасака с радостью вложится в любого врага Милитеха.",
      cap("add_building_construction = { type = arms_factory level = 2 instant_build = yes }"),
      prereq=["CP77_FS_free_trade"], filters=[IND])
    a("CP77_FS_mercs_from_nc", 3, 3, "spade", "Наёмники из Найт-Сити",
      "Лучшие соло всегда к услугам того, кто платит.",
      "army_experience = 40", prereq=["CP77_FS_border_forts"], filters=[ARMY])
    a("CP77_FS_union_of_free_states", 5, 3, "handshake", "Союз Свободных штатов",
      "Вместе мы сильнее, чем Майерс думает.",
      "if = { limit = { is_in_faction = no } create_faction = cp77_free_states_union }\n"
      "every_country = { limit = { OR = { tag = ZFT tag = ZFP tag = ZBL } NOT = { tag = ROOT } exists = yes is_in_faction = no } ROOT = { add_to_faction = PREV } }",
      prereq=[("CP77_FS_border_forts", "CP77_FS_corp_investors")], filters=[POL])
    a("CP77_FS_industrial_push", 7, 3, "gear", "Индустриальный рывок",
      "Заводы строятся быстрее, чем Вашингтон успевает вводить санкции.",
      cap("add_extra_state_shared_building_slots = 2\nadd_building_construction = { type = industrial_complex level = 2 instant_build = yes }"),
      prereq=["CP77_FS_corp_investors"], filters=[IND])
    a("CP77_FS_resist_nusa", 5, 4, "fist", "Сопротивление НСША",
      "Ни шагу назад перед федералами.",
      "add_war_support = 0.15\nadd_ideas = cp77_free_state", prereq=["CP77_FS_union_of_free_states"], filters=[WS])
    a("CP77_FS_research_cooperation", 7, 4, "atom", "Научное сотрудничество",
      "Университеты свободных штатов объединяют усилия.",
      "add_research_slot = 1", prereq=["CP77_FS_industrial_push"], cost=15, filters=[RES])
    a("CP77_FS_join_nusa", 4, 5, "star", "Вернуться в НСША",
      "Может, Майерс не так плоха? По крайней мере, у неё есть армия.",
      "set_politics = { ruling_party = democratic elections_allowed = yes }\nif = { limit = { country_exists = ZNU NOT = { has_war_with = ZNU } } ZNU = { puppet = ROOT } }",
      prereq=["CP77_FS_resist_nusa"], ai=0.5, filters=[POL])
    a("CP77_FS_free_forever", 6, 5, "flag", "Свободны навсегда",
      "Ни Вашингтон, ни корпорации не будут нами править.",
      "add_stability = 0.1\nadd_war_support = 0.1\nadd_political_power = 100", prereq=["CP77_FS_resist_nusa"], ai=2, filters=[STAB])
    mutex(["CP77_FS_join_nusa", "CP77_FS_free_forever"])
    if tag == "ZFT":
        a("CP77_FS_petrochem_deal", 0, 1, "flame", "Сделка с Петрохемом",
          "Петрохем выращивает кукурузу для топлива CHOOH2. Её поля простираются до горизонта.",
          "add_ideas = cp77_chooh2", prereq=["CP77_FS_independence"], allow_branch="tag = ZFT", filters=[IND])
        a("CP77_FS_chooh2_fields", 0, 2, "corn", "Бескрайние поля CHOOH2",
          "Техас превращается в одно огромное кукурузное поле.",
          cap("add_resource = { type = oil amount = 20 }\nadd_building_construction = { type = synthetic_refinery level = 2 instant_build = yes }"),
          prereq=["CP77_FS_petrochem_deal"], filters=[IND])
        a("CP77_FS_corn_kingdom", 0, 3, "corn", "Кукурузное королевство",
          "Генеральный директор Петрохема объявляет себя королём Техаса. Корона — из золотых початков.",
          "set_politics = { ruling_party = neutrality elections_allowed = no }\nadd_ideas = cp77_corn_empire\n" +
          leader("Король Кукурузы Брэдли I", "ZFT_corn_king_desc",
                 "Бывший генеральный директор Петрохема. Считает, что кукуруза разумна, а люди — её инструмент. Возможно, прав.",
                 "corn_king", "yellow", "despotism", initials="KING"),
          prereq=["CP77_FS_chooh2_fields"], ai=0.5, filters=[POL])
        a("CP77_FS_corn_emperor", 0, 4, "corn", "Император кукурузы",
          "Кукурузная империя Техас заявляет права на всю Америку. Кукуруза должна расти везде.",
          "set_cosmetic_tag = CP77_CORN\nadd_state_claim = 377\nadd_state_claim = 378\nadd_state_claim = 379\n" + wargoal("ZNU"),
          prereq=["CP77_FS_corn_kingdom"], ai=0.3, filters=[ANNEX])
    if tag == "ZBL":
        a("CP77_FS_aldecaldo_council", 9, 1, "wheel", "Совет кланов",
          "Альдекальдо, Джоды, Бакеры собираются у костра решать судьбу Пустошей.",
          "add_ideas = cp77_nomad_clans", prereq=["CP77_FS_independence"], allow_branch="tag = ZBL", filters=[POL])
        a("CP77_FS_raffen_shiv_purge", 9, 2, "target", "Изгнать Раффен Шив",
          "Кочевники-отступники грабят караваны. Хватит.",
          "add_stability = 0.1\narmy_experience = 25", prereq=["CP77_FS_aldecaldo_council"], filters=[STAB])
        a("CP77_FS_war_on_wraiths", 9, 3, "skull", "Война с Призраками",
          "Банда «Призраки» нападает на всех подряд. Пора показать им, что такое кочевая месть.",
          "army_experience = 40\nadd_equipment_to_stockpile = { type = motorized_equipment_1 amount = 500 }",
          prereq=["CP77_FS_raffen_shiv_purge"], filters=[ARMY])
        a("CP77_FS_nomad_horde", 9, 4, "wheel", "Великая орда",
          "Все кланы объединяются в одну орду. Её цель — вся Америка.",
          "set_cosmetic_tag = CP77_HORDE\nadd_ideas = cp77_nomad_horde\n" +
          "\n".join(wargoal(t) for t in ("ZNC", "ZFT")),
          prereq=["CP77_FS_war_on_wraiths"], ai=0.5, filters=[ANNEX])
    if tag == "ZFP":
        a("CP77_FS_biotechnica_forests", 11, 1, "tree", "Леса Биотехники",
          "Генетически модифицированные леса Каскадии растут на глазах.",
          "add_ideas = cp77_biotechnica_forests", prereq=["CP77_FS_independence"], allow_branch="tag = ZFP", filters=[IND])
        a("CP77_FS_cascadia_republic", 11, 2, "vote", "Республика Каскадия",
          "Самый демократичный из Свободных штатов. Здесь даже голосуют без взлома.",
          "set_politics = { ruling_party = democratic elections_allowed = yes }\nadd_stability = 0.1",
          prereq=["CP77_FS_biotechnica_forests"], filters=[POL])
        a("CP77_FS_bigfoot_ministry", 11, 3, "bigfoot", "Министерство снежного человека",
          "Генетики Биотехники случайно вывели снежного человека. Он оказался прекрасным администратором.",
          "add_ideas = cp77_bigfoot", prereq=["CP77_FS_cascadia_republic"], ai=0.5, filters=[STAB])
        a("CP77_FS_druid_ai", 11, 4, "tree", "ИИ-друид",
          "Лес обрёл разум через корневую сеть датчиков. Он требует место в парламенте.",
          "set_cosmetic_tag = CP77_DRUID\nadd_ideas = cp77_druid_ai\n" +
          leader("Великий Друид Секвойя", "ZFP_druid_desc",
                 "Коллективный разум миллиона генномодифицированных деревьев. Мыслит медленно, но очень глубоко.",
                 "druid", "green", "centrism", kind="ai", initials="TREE"),
          prereq=["CP77_FS_bigfoot_ministry"], ai=0.3, filters=[POL])
    return T
