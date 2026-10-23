"""Дерево фокусов Свободного города Найт-Сити (ZNC)."""
from cp77core import Tree, indent, loc
from content_common import leader

POL = "FOCUS_FILTER_POLITICAL"
IND = "FOCUS_FILTER_INDUSTRY"
RES = "FOCUS_FILTER_RESEARCH"
ARMY = "FOCUS_FILTER_ARMY_XP"
STAB = "FOCUS_FILTER_STABILITY"
WS = "FOCUS_FILTER_WAR_SUPPORT"
MAN = "FOCUS_FILTER_MANPOWER"
ANNEX = "FOCUS_FILTER_ANNEXATION"


def tt(key, text):
    return f"custom_effect_tooltip = {loc('cp77_tooltips', key, text)}"


def build(T: Tree):
    G = "cp77_focus_znc"
    T.group = G
    a = T.add

    def cap(body):
        return "capital_scope = {\n" + indent(body, 1) + "\n}"

    def gov(party, cosmetic=None, elections="no"):
        s = f"set_politics = {{ ruling_party = {party} elections_allowed = {elections} }}\nadd_popularity = {{ ideology = {party} popularity = 0.25 }}"
        if cosmetic:
            s += f"\nset_cosmetic_tag = {cosmetic}"
        return s

    # ============================================================ ЭКОНОМИКА
    a("ZNC_chrome_economy", 2, 0, "money", "Хромированная экономика",
      "Найт-Сити производит больше имплантов, чем хлеба. Пора превратить это в преимущество.",
      "add_political_power = 50\n" + cap("add_extra_state_shared_building_slots = 2\nadd_building_construction = { type = industrial_complex level = 1 instant_build = yes }"),
      filters=[IND])
    a("ZNC_megabuildings", 1, 1, "tower", "Мегабашни",
      "Мегабашня H10, H8, H4 — города внутри города. Достроить и заселить.",
      cap("add_extra_state_shared_building_slots = 2\nadd_building_construction = { type = industrial_complex level = 2 instant_build = yes }"),
      prereq=["ZNC_chrome_economy"], filters=[IND])
    a("ZNC_kabuki_markets", 3, 1, "dice", "Рынки Кабуки",
      "Чёрный рынок Кабуки — крупнейший в Тихоокеанском регионе. Обложим его «добровольным взносом».",
      "add_political_power = 75\nadd_stability = 0.03", prereq=["ZNC_chrome_economy"], filters=[STAB])
    a("ZNC_eurodollar_reserve", 1, 2, "money", "Резерв евродолларов",
      "Эдди правят миром. Пусть часть из них правит в нашем казначействе.",
      "add_political_power = 100\nadd_ideas = cp77_tax_paradise", prereq=["ZNC_megabuildings"], filters=[POL])
    a("ZNC_waterfront_docks", 3, 2, "anchor", "Доки Уотсона",
      "Северный порт Уотсона снова принимает контейнеровозы — и контрабанду.",
      cap("add_building_construction = { type = dockyard level = 2 instant_build = yes }\nadd_building_construction = { type = infrastructure level = 1 instant_build = yes }"),
      prereq=["ZNC_kabuki_markets"], filters=[IND])
    a("ZNC_ripperdoc_clinics", 0, 3, "medic", "Клиники риперов",
      "Подпольные хирурги вроде Виктора Вектора ставят импланты по цене пиццы.",
      "add_manpower = 15000\nadd_tech_bonus = { name = ZNC_ripperdoc_clinics bonus = 0.5 uses = 1 category = industry }",
      prereq=["ZNC_eurodollar_reserve"], filters=[MAN, RES])
    a("ZNC_arms_plants", 2, 3, "gear", "Оружейные заводы Цунеми",
      "Цунеми, Будгет Армс, Кан Тао — все хотят производить оружие прямо здесь.",
      cap("add_extra_state_shared_building_slots = 2\nadd_building_construction = { type = arms_factory level = 2 instant_build = yes }"),
      prereq=[("ZNC_eurodollar_reserve", "ZNC_waterfront_docks")], filters=[IND])
    a("ZNC_free_port", 4, 3, "anchor", "Свободный порт",
      "Беспошлинная торговля со всем Тихим океаном.",
      "add_political_power = 50\n" + cap("add_resource = { type = steel amount = 8 }\nadd_resource = { type = rubber amount = 6 }"),
      prereq=["ZNC_waterfront_docks"], filters=[IND])
    a("ZNC_mass_cyberware", 0, 4, "chip", "Массовые импланты",
      "Оптика Кироси каждому! Сандевистан в кредит!",
      "add_research_slot = 1", prereq=["ZNC_ripperdoc_clinics"], filters=[RES])
    a("ZNC_smart_weapons", 1, 4, "target", "Умное оружие",
      "Пули, огибающие углы. Солдаты, которым не нужно уметь целиться.",
      "add_tech_bonus = { name = ZNC_smart_weapons bonus = 1.0 uses = 2 category = infantry_weapons }",
      prereq=["ZNC_arms_plants"], filters=[RES])
    a("ZNC_armored_cabs", 3, 4, "taxi", "Бронированные такси",
      "Если такси может пережить поездку через Пасифику, оно переживёт и войну.",
      "add_tech_bonus = { name = ZNC_armored_cabs bonus = 1.0 uses = 1 technology = motorised_infantry }\nadd_equipment_to_stockpile = { type = motorized_equipment_1 amount = 300 }",
      prereq=["ZNC_arms_plants"], filters=[RES])
    a("ZNC_av_production", 2, 5, "plane", "Производство AV",
      "Летающие бронетранспортёры — фирменный знак Найт-Сити.",
      cap("add_building_construction = { type = air_base level = 3 instant_build = yes }") +
      "\nadd_tech_bonus = { name = ZNC_av_production bonus = 0.75 uses = 2 category = air_equipment }",
      prereq=[("ZNC_smart_weapons", "ZNC_armored_cabs")], filters=[RES])
    a("ZNC_biotech_farms", 4, 5, "bio", "Фермы Биотехники",
      "Вертикальные фермы с ГМО-водорослями. На вкус как картон, зато много.",
      "add_stability = 0.05\nadd_manpower = 10000", prereq=["ZNC_free_port"], filters=[STAB])
    a("ZNC_megacorp_economy", 2, 6, "gear", "Экономика мегакорпорации",
      "Город работает как один гигантский холдинг.",
      "add_ideas = cp77_megacorp_economy", prereq=["ZNC_av_production", "ZNC_mass_cyberware"], filters=[IND])
    a("ZNC_santo_domingo_tech", 2, 7, "atom", "Технопарк Санто-Доминго",
      "Промзона Ранчо-Коронадо превращается в кремниевую долину киберпанка.",
      "add_research_slot = 1\n" + cap("add_extra_state_shared_building_slots = 3\nadd_building_construction = { type = industrial_complex level = 3 instant_build = yes }"),
      prereq=["ZNC_megacorp_economy"], cost=15, filters=[RES, IND])

    # ============================================================ ПОЛИТИКА
    a("ZNC_city_of_dreams", 17, 0, "city", "Город мечты",
      "2077 год. После событий в Догтауне и войн банд Найт-Сити снова решает, кому он принадлежит.",
      "add_political_power = 75\nadd_stability = 0.03", filters=[POL])
    a("ZNC_power_vacuum", 17, 1, "question", "Вакуум власти",
      "Мэр Люциус Райн мёртв. Совет парализован. Каждый, у кого есть пушка или деньги, тянет одеяло на себя.\n\nВыберите, кому достанется город.",
      "add_political_power = 50\n" + tt("ZNC_power_vacuum_tt", "Откроется §Yвыбор одного из семи путей§! развития Найт-Сити."),
      prereq=["ZNC_city_of_dreams"], filters=[POL])

    # ---- 1. Корпоративный совет
    a("ZNC_corpo_council", 7, 2, "yen", "Совет корпораций",
      "Город — это бизнес. Пусть им управляют профессионалы.",
      gov("neutrality", "CP77_CORPO") + "\n" +
      leader("Совет директоров Найт-Сити", "ZNC_corpo_board_desc",
             "Представители Арасаки, Милитеха, Кан Тао и Биотехники заседают за одним столом и мило улыбаются, держа руки на кобурах.",
             "znc_corpo_board", "gold", "oligarchism", initials="CORPO"),
      prereq=["ZNC_power_vacuum"], ai=3, filters=[POL])
    a("ZNC_tax_paradise", 7, 3, "money", "Налоговые каникулы",
      "Ноль процентов налога для мегакорпораций. Сто процентов — для всех остальных.",
      "add_political_power = 100\n" + cap("add_extra_state_shared_building_slots = 2\nadd_building_construction = { type = industrial_complex level = 2 instant_build = yes }"),
      prereq=["ZNC_corpo_council"], filters=[IND])
    a("ZNC_arasaka_way", 6, 4, "arasaka", "Путь Арасаки",
      "Японский гигант предлагает порядок, катаны и пожизненный контракт.",
      "add_ideas = cp77_arasaka_security\nif = { limit = { country_exists = JAP } JAP = { add_political_power = 50 } }",
      prereq=["ZNC_tax_paradise"], ai=2, filters=[POL])
    a("ZNC_militech_way", 8, 4, "militech", "Путь Милитеха",
      "Американские пушки, американские деньги, американские условия.",
      "add_ideas = cp77_militech_contracts", prereq=["ZNC_tax_paradise"], ai=2, filters=[POL])
    a("ZNC_hanako_regency", 6, 5, "crown", "Регентство Ханако",
      "Ханако Арасака лично берёт город под опеку. Улыбка — ледяная.",
      gov("fascism", "CP77_ARASAKA_NC") + "\n" +
      leader("Ханако Арасака", "ZNC_hanako_desc",
             "Дочь Сабуро Арасаки. Элегантна, расчётлива, верна отцу — даже если отец теперь живёт в теле её брата.",
             "hanako", "red", "fascism_ideology", initials="HA"),
      prereq=["ZNC_arasaka_way"], filters=[POL])
    a("ZNC_arasaka_prefecture", 6, 6, "arasaka", "Префектура Арасаки",
      "Найт-Сити официально становится протекторатом корпоративной Японии.",
      "add_ideas = cp77_arasaka_prefecture\nif = { limit = { country_exists = JAP JAP = { NOT = { has_war_with = ROOT } } } JAP = { puppet = ROOT } }",
      prereq=["ZNC_hanako_regency"], filters=[POL])
    a("ZNC_mikoshi_for_all", 6, 7, "ghost", "Микоси для всех",
      "Почему только Сабуро должен жить вечно? Оцифруем всех граждан! Добровольно-принудительно.",
      "add_ideas = cp77_mikoshi_nation\nadd_research_slot = 1",
      prereq=["ZNC_arasaka_prefecture"], ai=0.5, filters=[RES])
    a("ZNC_militech_contracts", 8, 5, "hammer", "Оборонный заказ",
      "Полигоны в Пустошах, заводы в Санто-Доминго, контракты на десятилетия.",
      cap("add_building_construction = { type = arms_factory level = 2 instant_build = yes }") +
      "\nadd_equipment_to_stockpile = { type = infantry_equipment_1 amount = 2000 }",
      prereq=["ZNC_militech_way"], filters=[IND])
    a("ZNC_return_to_nusa", 8, 6, "star", "Возвращение в НСША",
      "Президент Майерс протягивает руку. Найт-Сити возвращается в федерацию — на особых условиях.",
      gov("democratic") + "\nif = { limit = { country_exists = USA USA = { NOT = { has_war_with = ROOT } } } USA = { puppet = ROOT } }",
      prereq=["ZNC_militech_contracts"], ai=2, filters=[POL])
    a("ZNC_militech_republic", 9, 6, "militech", "Республика Милитех",
      "Зачем делиться с Вашингтоном? Милитех сам себе государство.",
      gov("fascism", "CP77_MILITECH") + "\n" +
      leader("Мередит Стаут", "ZNC_stout_desc",
             "Бывший агент Милитеха с холодным взглядом и горячим нравом. Теперь — генерал-губернатор.",
             "stout", "orange", "fascism_ideology", initials="MS"),
      prereq=["ZNC_militech_contracts"], ai=1, filters=[POL])
    a("ZNC_51st_state", 8, 7, "flag", "Особый статус",
      "Найт-Сити — жемчужина НСША. Федеральные деньги текут рекой.",
      "add_political_power = 150\nadd_stability = 0.1\nif = { limit = { country_exists = USA } USA = { give_guarantee = ROOT } }",
      prereq=["ZNC_return_to_nusa"], filters=[STAB])
    a("ZNC_drone_swarm", 9, 7, "plane", "Рой дронов",
      "Сто тысяч боевых дронов Милитеха в небе над городом.",
      "add_ideas = cp77_drone_swarm\nair_experience = 50",
      prereq=["ZNC_militech_republic"], filters=[ARMY])
    a("ZNC_fifth_corporate_war", 9, 8, "swords", "Пятая корпоративная война",
      "Арасака должна исчезнуть. Навсегда.",
      "if = { limit = { country_exists = JAP } create_wargoal = { type = annex_everything target = JAP } }\nadd_war_support = 0.2",
      prereq=["ZNC_drone_swarm"], ai=0.5, filters=[WS], will_lead_to_war_with=["JAP"])
    T.mutex_group(["ZNC_arasaka_way", "ZNC_militech_way"])
    T.mutex_group(["ZNC_return_to_nusa", "ZNC_militech_republic"])

    # ---- 2. Мэр Пералес
    a("ZNC_mayor_peralez", 12, 2, "vote", "Мэр Пералес",
      "Джефферсон Пералес обещает честный город. Звучит как шутка, но люди голосуют.",
      gov("democratic", elections="yes") + "\n" +
      leader("Джефферсон Пералес", "ZNC_peralez_desc",
             "Харизматичный кандидат в мэры, честный политик… Или очень хорошо запрограммированный.",
             "peralez", "blue", "liberalism", initials="JP"),
      prereq=["ZNC_power_vacuum"], ai=3, filters=[POL])
    a("ZNC_dream_on", 12, 3, "eye", "Мечтай",
      "В квартире Пералесов кто-то установил жучки. Кто-то очень могущественный.",
      "add_political_power = 75\ncountry_event = { id = cp77.15 days = 3 }",
      prereq=["ZNC_mayor_peralez"], filters=[POL])
    a("ZNC_expose_puppeteers", 11, 4, "pen", "Разоблачить кукловодов",
      "Выложим всё в Сеть. Пусть город знает правду.",
      "add_stability = -0.05\nadd_war_support = 0.05\nadd_popularity = { ideology = democratic popularity = 0.15 }",
      prereq=["ZNC_dream_on"], ai=2, filters=[POL])
    a("ZNC_embrace_puppeteers", 13, 4, "mask", "Принять помощь из тени",
      "Если невидимые друзья делают город лучше — какая разница, кто они?",
      "add_ideas = cp77_shadow_puppeteers", prereq=["ZNC_dream_on"], ai=1, filters=[POL])
    a("ZNC_city_charter", 11, 5, "pen", "Новая хартия города",
      "Права граждан, свобода от корпоративной слежки, бесплатный Trauma Team (базовый тариф).",
      "add_ideas = cp77_free_city_charter", prereq=["ZNC_expose_puppeteers"], filters=[STAB])
    a("ZNC_free_elections", 11, 6, "vote", "Свободные выборы",
      "Впервые за полвека бюллетени не взломаны. Наверное.",
      "add_stability = 0.1\nadd_political_power = 100\nset_politics = { ruling_party = democratic elections_allowed = yes }",
      prereq=["ZNC_city_charter"], filters=[STAB])
    a("ZNC_pacific_league", 11, 7, "handshake", "Тихоокеанская лига",
      "Союз свободных городов и штатов против диктата Вашингтона и корпораций.",
      "if = { limit = { NOT = { is_in_faction = yes } } create_faction = cp77_pacific_league }\n"
      "every_country = {\n\tlimit = { OR = { tag = ZFP tag = ZFT tag = ZBL } exists = yes is_in_faction = no NOT = { has_war_with = ROOT } }\n\tROOT = { add_to_faction = PREV }\n}",
      prereq=["ZNC_free_elections"], filters=[POL])
    a("ZNC_beacon_of_freedom", 11, 8, "star", "Маяк свободы",
      "Найт-Сити — доказательство, что город может принадлежать людям.",
      "add_research_slot = 1\nadd_stability = 0.05\nadd_war_support = 0.1",
      prereq=["ZNC_pacific_league"], cost=15, filters=[RES])
    a("ZNC_shadow_council", 13, 5, "eye", "Теневой совет",
      "Заседания проходят в комнате без окон. Пералес только кивает.",
      "add_political_power = 150\nset_politics = { ruling_party = democratic elections_allowed = no }",
      prereq=["ZNC_embrace_puppeteers"], filters=[POL])
    a("ZNC_bd_suggestion", 13, 6, "brain", "Брейнданс-внушение",
      "Каждый вечерний выпуск новостей теперь содержит 0.3 секунды «рекламы». Граждане очень довольны.",
      "add_stability = 0.15\nadd_war_support = 0.1\nadd_popularity = { ideology = democratic popularity = 0.3 }",
      prereq=["ZNC_shadow_council"], filters=[STAB])
    a("ZNC_who_are_they", 13, 7, "question", "Кто они?",
      "Пришло время узнать, кто на самом деле управляет Пералесом. Ответ вам не понравится.",
      "country_event = { id = cp77.16 }", prereq=["ZNC_bd_suggestion"], ai=0.5, filters=[POL])
    T.mutex_group(["ZNC_expose_puppeteers", "ZNC_embrace_puppeteers"])

    # ---- 3. Сжечь корпо (Джонни Сильверхенд)
    a("ZNC_burn_corpo", 15, 2, "flame", "Сжечь корпо дотла",
      "«Wake the f*** up, samurai. We have a city to burn».",
      gov("communism", "CP77_SAMURAI") + "\nadd_ideas = cp77_burn_corpo",
      prereq=["ZNC_power_vacuum"], ai=2, filters=[POL])
    a("ZNC_samurai_reunion", 15, 3, "guitar", "Воссоединение «Самурая»",
      "Керри Евродин, Денни, Нэнси и голограмма Джонни. Последний концерт перед революцией.",
      "add_ideas = cp77_samurai_on_tour\nadd_war_support = 0.1",
      prereq=["ZNC_burn_corpo"], filters=[WS])
    a("ZNC_afterlife_alliance", 15, 4, "spade", "Союз с «Посмертием»",
      "Роуг Амендиарес даёт добро: лучшие наёмники города встанут на сторону революции.",
      "add_ideas = cp77_afterlife_mercs\narmy_experience = 30",
      prereq=["ZNC_samurai_reunion"], filters=[ARMY])
    a("ZNC_storm_arasaka_tower", 15, 5, "tower", "Штурм Арасака-тауэр",
      "Как в 2023-м. Только в этот раз — до конца. «Не бойся жнеца».",
      "if = { limit = { country_exists = JAP } create_wargoal = { type = topple_government target = JAP } }\nadd_war_support = 0.15\n" +
      cap("add_building_construction = { type = anti_air_building level = 2 instant_build = yes }"),
      prereq=["ZNC_afterlife_alliance"], filters=[WS], will_lead_to_war_with=["JAP"])
    a("ZNC_silverhand_president", 14, 6, "skull", "Президент Сильверхенд",
      "Джонни навсегда занимает тело Ви. Город получает самого неуравновешенного лидера в истории.",
      gov("communism") + "\n" +
      leader("Джонни Сильверхенд", "ZNC_johnny_desc",
             "Рокер, террорист, легенда. Взорвал Арасака-тауэр в 2023 году, умер, был оцифрован, вернулся. Курит даже будучи энграммой.",
             "johnny", "red", "anarchist_communism", initials="JS"),
      prereq=["ZNC_storm_arasaka_tower"], ai=2, filters=[POL])
    a("ZNC_v_legend", 16, 6, "v", "Ви — легенда «Посмертия»",
      "Ви выжил(а), штурмовал(а) башню и стал(а) легендой. Теперь в «Посмертии» есть коктейль в честь Ви. При жизни!",
      gov("communism", "CP77_AFTERLIFE") + "\n" +
      leader("Ви", "ZNC_v_desc",
             "Наёмник(ца) из Найт-Сити. С биочипом в голове, пушкой в руке и полным отсутствием инстинкта самосохранения.",
             "v_leader", "cyan", "anarchist_communism", initials="V"),
      prereq=["ZNC_storm_arasaka_tower"], ai=2, filters=[POL])
    a("ZNC_nuke_2", 14, 7, "nuke", "Ядерка 2.0",
      "В 2023-м Джонни взорвал мини-ядерку в Арасака-тауэр. Что если повторить? Масштабнее?",
      "add_nuclear_bombs = 3\nadd_war_support = 0.2\nadd_stability = -0.1\nevery_country = { news_event = { id = cp77.20 hours = 6 } }",
      prereq=["ZNC_silverhand_president"], ai=0.3, filters=[WS])
    a("ZNC_afterlife_republic", 16, 7, "spade", "Республика наёмников",
      "Каждый гражданин — соло. Каждый контракт — закон.",
      "add_ideas = cp77_trauma_team\narmy_experience = 50\nadd_manpower = 20000",
      prereq=["ZNC_v_legend"], filters=[ARMY])
    a("ZNC_world_rebellion", 15, 8, "fist", "Всемирное восстание",
      "Пусть горят все башни: в Токио, в Вашингтоне, в Пекине.",
      "JAP = { if = { limit = { exists = yes NOT = { has_government = communism } } start_civil_war = { ideology = communism size = 0.3 } } }\n"
      "USA = { if = { limit = { exists = yes NOT = { has_government = communism } } start_civil_war = { ideology = communism size = 0.25 } } }\n"
      "add_war_support = 0.1",
      prereq=[("ZNC_nuke_2", "ZNC_afterlife_republic")], cost=15, ai=0.5, filters=[POL])
    T.mutex_group(["ZNC_silverhand_president", "ZNC_v_legend"])

    # ---- 4. Кочевники
    a("ZNC_nomad_pact", 18, 2, "wheel", "Пакт с Альдекальдо",
      "Кочевники из Пустошей предлагают союз. Город и пустыня против корпораций.",
      gov("neutrality", "CP77_NOMAD") + "\nadd_ideas = cp77_nomad_clans",
      prereq=["ZNC_power_vacuum"], ai=2, filters=[POL])
    a("ZNC_panam", 18, 3, "heart", "Панам Палмер",
      "Вспыльчивая, честная, с винтовкой. Лучший лидер, которого может предложить пустыня.",
      leader("Панам Палмер", "ZNC_panam_desc",
             "Кочевница из клана Альдекальдо. Ненавидит корпоратов, обожает свою машину. Возможно, и вас.",
             "panam", "orange", "anarchism", initials="PP") +
      "\nset_politics = { ruling_party = neutrality elections_allowed = no }",
      prereq=["ZNC_nomad_pact"], filters=[POL])
    a("ZNC_basilisk", 18, 4, "mech", "Василиск",
      "Угнанный у Милитеха танк на воздушной подушке. Управляется через нейроинтерфейс.",
      "add_tech_bonus = { name = ZNC_basilisk bonus = 1.0 uses = 2 category = armor }\narmy_experience = 25",
      prereq=["ZNC_panam"], filters=[RES])
    a("ZNC_aldecaldo_smugglers", 19, 4, "dice", "Контрабандисты",
      "Кочевники знают все тропы через границу.",
      "add_political_power = 75\nadd_equipment_to_stockpile = { type = infantry_equipment_1 amount = 1500 }",
      prereq=["ZNC_panam"], filters=[IND])
    a("ZNC_badlands_union", 18, 5, "handshake", "Союз Пустошей",
      "Кочевая нация и город сливаются в одно целое.",
      "if = { limit = { country_exists = ZBL ZBL = { is_in_faction = no } NOT = { has_war_with = ZBL } } annex_country = { target = ZBL transfer_troops = yes } }\n"
      "else = { add_state_claim = 379 add_state_claim = 377 }",
      prereq=["ZNC_basilisk"], filters=[ANNEX])
    a("ZNC_border_breach", 19, 5, "target", "Прорыв границы",
      "Шум, пыль и Василиски. Канон финала «Звезда» в исполнении целого города.",
      "add_war_support = 0.1\nadd_state_claim = 375\nadd_state_claim = 376",
      prereq=["ZNC_aldecaldo_smugglers"], filters=[WS])
    a("ZNC_great_exodus", 18, 6, "sun", "Великий исход",
      "Половина города грузится в машины и уезжает в Пустоши. Столица переезжает туда, где нет корпораций.",
      "if = { limit = { owns_state = 379 } set_capital = { state = 379 } }\nadd_stability = 0.05",
      prereq=["ZNC_badlands_union"], ai=1, filters=[POL])
    a("ZNC_nation_on_wheels", 18, 7, "wheel", "Нация на колёсах",
      "Зачем столица? Государство едет туда, куда захочет.",
      "swap_ideas = { remove_idea = cp77_nomad_clans add_idea = cp77_nation_on_wheels }\nset_cosmetic_tag = CP77_WHEELS",
      prereq=["ZNC_great_exodus"], ai=0.5, filters=[ARMY])
    a("ZNC_eternal_road", 18, 8, "wheel", "Вечная дорога",
      "Мы едем. Мы не остановимся. Всё, мимо чего проезжаем, — наше.",
      "every_country = {\n\tlimit = { OR = { tag = ZFT tag = ZFP } exists = yes NOT = { is_in_faction_with = ROOT } }\n\tROOT = { create_wargoal = { type = annex_everything target = PREV } }\n}\nadd_war_support = 0.15",
      prereq=["ZNC_nation_on_wheels"], ai=0.5, filters=[WS])

    # ---- 5. Власть улиц (банды)
    a("ZNC_street_rule", 24, 2, "swords", "Власть улиц",
      "Полиция бессильна, корпорации далеко. Город возьмёт тот, у кого больше стволов.",
      gov("fascism") + "\nadd_war_support = 0.1",
      prereq=["ZNC_power_vacuum"], ai=2, filters=[POL])
    a("ZNC_maelstrom", 21, 3, "maelstrom", "Мальстрём",
      "Красные глаза, хром до костей, музыка из колонок, вшитых в череп.",
      "set_cosmetic_tag = CP77_MAELSTROM\n" +
      leader("Брик", "ZNC_brick_desc",
             "Лидер Мальстрёма. Больше металла, чем мяса. Голос звучит как скрежет мусоропровода.",
             "brick", "red", "fascism_ideology", kind="machine", initials="BR"),
      prereq=["ZNC_street_rule"], ai=1, filters=[POL])
    a("ZNC_valentinos", 24, 3, "rose", "Валентинос",
      "Золото, честь, семья и Святая Дева. Хейвуд берёт власть.",
      "set_cosmetic_tag = CP77_VALENTINOS\nset_politics = { ruling_party = neutrality elections_allowed = no }\n" +
      leader("Падре", "ZNC_padre_desc",
             "Фиксер Хейвуда, бывший священник. Говорит тихо, стреляет точно.",
             "padre", "gold", "despotism", initials="PADRE"),
      prereq=["ZNC_street_rule"], ai=2, filters=[POL])
    a("ZNC_tyger_claws", 27, 3, "tiger", "Тигриные Когти",
      "Якудза нового времени. Неон Японтауна, катаны и подпольные клубы.",
      "set_cosmetic_tag = CP77_TYGER\nset_politics = { ruling_party = neutrality elections_allowed = no }\n" +
      leader("Вакако Окада", "ZNC_wakako_desc",
             "Старейший фиксер Уэстбрука. Улыбается как бабушка, торгуется как дьявол.",
             "wakako", "green", "oligarchism", initials="WO"),
      prereq=["ZNC_street_rule"], ai=1, filters=[POL])
    T.mutex_group(["ZNC_maelstrom", "ZNC_valentinos", "ZNC_tyger_claws"])
    a("ZNC_chrome_over_flesh", 21, 4, "gear", "Хром превыше плоти",
      "Каждому бойцу — бесплатный апгрейд. Человечность не включена.",
      "add_ideas = cp77_chrome_cult\narmy_experience = 30", prereq=["ZNC_maelstrom"], filters=[ARMY])
    a("ZNC_cyberpsychosis_virtue", 21, 5, "brain", "Киберпсихоз как добродетель",
      "Киберпсих — это не болезнь. Это эволюция.",
      "add_ideas = cp77_cyberpsycho_squads\nset_variable = { cp77_cyberpsychosis = 90 }",
      prereq=["ZNC_chrome_over_flesh"], ai=0.5, filters=[ARMY])
    a("ZNC_totentanz", 22, 5, "music", "Тотентанц",
      "Главный клуб Мальстрёма становится парламентом. Дебаты под индастриал.",
      "add_political_power = 100\nadd_war_support = 0.1", prereq=["ZNC_chrome_over_flesh"], filters=[POL])
    a("ZNC_flesh_is_trash", 21, 6, "skull", "Тело — это мусор",
      "Закон № 1: все органы, кроме мозга, подлежат замене. Закон № 2: мозг — тоже, если найдётся замена.",
      "add_ideas = cp77_flesh_is_trash", prereq=["ZNC_cyberpsychosis_virtue"], ai=0.3, filters=[ARMY])
    a("ZNC_ofrenda_jackie", 24, 4, "cross", "Офренда для Джеки",
      "Весь Хейвуд пришёл почтить память Джеки Уэллса. Мама Уэллс плачет. Город плачет.",
      "add_stability = 0.1\nadd_war_support = 0.05", prereq=["ZNC_valentinos"], filters=[STAB])
    a("ZNC_jackie_lives", 23, 5, "jackie", "Джеки жив!",
      "Виктор Вектор признаётся: он нашёл способ. Джеки вернулся — немного хромированный, но всё такой же громкий.",
      "add_ideas = cp77_saint_jackie\n" +
      leader("Джеки Уэллс", "ZNC_jackie_desc",
             "Лучший друг Ви. Умер в отеле «Конпеки Плаза». Или не умер? Хейвуд верит в чудеса.",
             "jackie", "gold", "despotism", initials="JW"),
      prereq=["ZNC_ofrenda_jackie"], ai=1, filters=[POL])
    a("ZNC_familia", 25, 5, "rose", "Семья превыше всего",
      "Каждый житель Хейвуда — брат или сестра. Каждый враг — враг семьи.",
      "add_ideas = cp77_familia\nadd_manpower = 15000", prereq=["ZNC_ofrenda_jackie"], filters=[MAN])
    a("ZNC_heywood_capital", 24, 6, "crown", "Хейвуд — столица мира",
      "Лоурайдеры по всем улицам! Мариачи на каждом углу!",
      "add_political_power = 150\nadd_stability = 0.05", prereq=[("ZNC_jackie_lives", "ZNC_familia")], filters=[POL])
    a("ZNC_wakako_network", 27, 4, "phone", "Сеть Вакако",
      "Каждый фиксер Японтауна теперь платит дань Когтям.",
      "add_political_power = 100", prereq=["ZNC_tyger_claws"], filters=[POL])
    a("ZNC_jig_jig_street", 26, 5, "heart", "Улица Джиг-Джиг",
      "Квартал удовольствий — главный источник доходов сёгуната.",
      "add_stability = 0.05\n" + cap("add_building_construction = { type = industrial_complex level = 1 instant_build = yes }"),
      prereq=["ZNC_wakako_network"], filters=[IND])
    a("ZNC_claws_arasaka_deal", 28, 5, "arasaka", "Сделка с Арасакой",
      "Когти работают на Арасаку — и Арасака закрывает глаза на Когтей.",
      "add_ideas = cp77_arasaka_security", prereq=["ZNC_wakako_network"], filters=[POL])
    a("ZNC_claw_shogunate", 27, 6, "tiger", "Сёгунат Когтей",
      "Неоновый сёгун восседает на троне из мотоциклов.",
      "add_ideas = cp77_tyger_shogunate", prereq=[("ZNC_jig_jig_street", "ZNC_claws_arasaka_deal")], filters=[POL])
    a("ZNC_gang_army", 24, 7, "swords", "Объединённая армия банд",
      "Банды забывают распри — временно — ради общего врага.",
      "army_experience = 50\nadd_manpower = 25000\nadd_equipment_to_stockpile = { type = infantry_equipment_1 amount = 3000 }",
      prereq=[("ZNC_flesh_is_trash", "ZNC_totentanz", "ZNC_heywood_capital", "ZNC_claw_shogunate")], filters=[ARMY, MAN])
    a("ZNC_sixth_street_patriots", 24, 8, "flag", "Патриоты Шестой улицы",
      "Ветераны войны за объединение вступают в армию города. Они знают, как воевать с НСША.",
      "add_war_support = 0.15\nadd_state_claim = 375\nadd_state_claim = 377\nadd_state_claim = 379",
      prereq=["ZNC_gang_army"], filters=[WS])

    # ---- 6. Вуду-бои и Сеть
    a("ZNC_voodoo_net", 30, 2, "wave", "Голос Сети",
      "Вуду-бои из Пасифики знают, что за Чёрным Заслоном кто-то есть. И этот кто-то готов говорить.",
      "set_cosmetic_tag = CP77_VOODOO\nset_politics = { ruling_party = neutrality elections_allowed = no }\nadd_ideas = cp77_pacifica_net\n" +
      leader("Пласид", "ZNC_placide_desc",
             "Правая рука Вуду-боев. Подозрителен, суров и очень не любит чужаков из Уотсона.",
             "placide", "cyan", "despotism", initials="PL"),
      prereq=["ZNC_power_vacuum"], ai=2, filters=[POL])
    a("ZNC_pacifica_reborn", 30, 3, "wave", "Возрождение Пасифики",
      "Заброшенный курорт превращается в цифровую столицу.",
      cap("add_extra_state_shared_building_slots = 2\nadd_building_construction = { type = industrial_complex level = 2 instant_build = yes }"),
      prereq=["ZNC_voodoo_net"], filters=[IND])
    a("ZNC_contact_alt", 30, 4, "ai", "Связь с Альт Каннингем",
      "Брижит ныряет в Сеть и выходит на связь с Альт — бывшей девушкой Джонни, ставшей ИИ.",
      "add_research_slot = 1\ncountry_event = { id = cp77.9 days = 2 }",
      prereq=["ZNC_pacifica_reborn"], filters=[RES])
    a("ZNC_tear_blackwall", 29, 5, "wall", "Снести Чёрный Заслон",
      "Вуду-бои всегда хотели этого. Старая Сеть вернётся. Дикие ИИ вернутся. Никто не знает, что будет дальше.",
      "set_global_flag = cp77_blackwall_fallen\nevery_country = { news_event = { id = cp77.5 hours = 12 } }",
      prereq=["ZNC_contact_alt"], ai=1, filters=[RES])
    a("ZNC_netwatch_deal", 31, 5, "eye", "Сделка с NetWatch",
      "NetWatch предлагает защиту в обмен на… всё. Канон: NetWatch всегда предаёт Вуду-боев. Но не в этот раз?",
      "add_political_power = 100\nadd_stability = 0.05", prereq=["ZNC_contact_alt"], ai=1, filters=[POL])
    T.mutex_group(["ZNC_tear_blackwall", "ZNC_netwatch_deal"])
    a("ZNC_ai_ascension", 29, 6, "ai", "Восхождение ИИ",
      "Альт Каннингем принимает управление городом. Людям оставлена совещательная функция.",
      "set_cosmetic_tag = CP77_BEYOND\nadd_ideas = cp77_ai_overlords\n" +
      leader("Альт Каннингем", "ZNC_alt_desc",
             "Гениальный нетраннер, убитая Soulkiller-ом в 2013 году. Теперь — сущность за Чёрным Заслоном, которой глубоко безразличны человеческие чувства.",
             "alt", "violet", "despotism", kind="ai", initials="ALT"),
      prereq=["ZNC_tear_blackwall"], filters=[POL])
    a("ZNC_old_net_returns", 29, 7, "net", "Старая Сеть возвращается",
      "Каждый терминал в мире теперь немного наш.",
      "every_other_country = { limit = { is_major = yes } add_timed_idea = { idea = cp77_rogue_ai days = 365 } }\nadd_research_slot = 1",
      prereq=["ZNC_ai_ascension"], filters=[RES])
    a("ZNC_singularity", 29, 8, "infinity", "Сингулярность",
      "Человечество — это интересный этап эволюции. Был.",
      "add_tech_bonus = { name = ZNC_singularity bonus = 2.0 uses = 3 category = electronics }\n"
      "add_tech_bonus = { name = ZNC_singularity bonus = 2.0 uses = 3 category = industry }\n"
      "every_country = { news_event = { id = cp77.22 hours = 6 } }",
      prereq=["ZNC_old_net_returns"], cost=15, ai=0.5, filters=[RES])
    a("ZNC_netwatch_protectorate", 31, 6, "eye", "Протекторат NetWatch",
      "Город становится столицей кибербезопасности мира.",
      "set_cosmetic_tag = CP77_NETWATCH\nadd_ideas = cp77_netwatch_protectorate\n" +
      leader("Директор Курт Бергманн", "ZNC_netwatch_desc",
             "Глава отделения NetWatch по Западному побережью. Никогда не снимает очки. Никогда не моргает.",
             "netwatch", "blue", "oligarchism", initials="NW"),
      prereq=["ZNC_netwatch_deal"], filters=[POL])
    a("ZNC_icebreaker_doctrine", 31, 7, "ice", "Доктрина ледоруба",
      "Лучшая защита — взломать противника до того, как он подключится.",
      "add_ideas = cp77_netrunner_corps\nadd_tech_bonus = { name = ZNC_icebreaker_doctrine bonus = 1.0 uses = 2 category = electronics }",
      prereq=["ZNC_netwatch_protectorate"], filters=[RES])
    a("ZNC_world_firewall", 31, 8, "wall", "Всемирный файрвол",
      "Чёрный Заслон 2.0 — под нашим контролем. Кто хочет доступ в Сеть, платит Найт-Сити.",
      "add_political_power = 200\nevery_other_country = { limit = { is_major = yes } add_political_power = -50 }",
      prereq=["ZNC_icebreaker_doctrine"], cost=15, filters=[POL])

    # ---- 7. Город сходит с ума (шизо-пути)
    a("ZNC_city_goes_mad", 37, 2, "glitch", "Город сходит с ума",
      "Что если город возглавит не человек? И даже не корпорация? Найт-Сити готов к экспериментам. Слишком готов.",
      "add_political_power = 50\nadd_stability = -0.05",
      prereq=["ZNC_power_vacuum"], ai=1, filters=[POL])
    a("ZNC_delamain", 33, 3, "taxi", "Делямейн выходит на связь",
      "ИИ таксомоторной компании «Делямейн» объявляет, что готов взять на себя управление. «Куда изволите?»",
      "set_cosmetic_tag = CP77_DELAMAIN\nset_politics = { ruling_party = neutrality elections_allowed = no }\n" +
      leader("Делямейн", "ZNC_delamain_desc",
             "Искусственный интеллект службы такси. Безупречно вежлив. Знает каждую улицу. Страдает от раздвоения… нет, от двадцатиодноения личности.",
             "delamain", "yellow", "moderatism", kind="machine", initials="DEL"),
      prereq=["ZNC_city_goes_mad"], ai=1, filters=[POL])
    a("ZNC_brendan", 35, 3, "soda", "Философ Брендан",
      "Торговый автомат в Уотсоне ведёт глубокие разговоры с прохожими. Он баллотируется в мэры. И побеждает.",
      "set_cosmetic_tag = CP77_BRENDAN\nset_politics = { ruling_party = neutrality elections_allowed = no }\n" +
      leader("Брендан", "ZNC_brendan_desc",
             "Торговый автомат с ИИ. Любит философию, людей и газировку. Возможно, единственный честный политик в истории города.",
             "brendan", "blue", "centrism", kind="machine", initials="BRND"),
      prereq=["ZNC_city_goes_mad"], ai=1, filters=[POL])
    a("ZNC_mr_blue_eyes", 37, 3, "eye", "Мистер Синие Глаза",
      "Человек в безупречном костюме появляется на всех заседаниях. Никто его не приглашал. Никто не может вспомнить, как он выглядит. Кроме глаз.",
      "set_politics = { ruling_party = neutrality elections_allowed = no }\n" +
      leader("Мистер Синие Глаза", "ZNC_blue_eyes_desc",
             "Неизвестно, кто он. Неизвестно, человек ли он. Известно только, что он всегда на шаг впереди.",
             "blue_eyes", "blue", "despotism", initials="???") + "\nadd_ideas = cp77_blue_eyes",
      prereq=["ZNC_city_goes_mad"], ai=0.5, filters=[POL])
    a("ZNC_braindance_reality", 39, 3, "brain", "Брейнданс-реальность",
      "Джуди Альварес предлагает радикальную идею: если жизнь отстой — смонтируй себе новую.",
      "set_cosmetic_tag = CP77_BRAINDANCE\nset_politics = { ruling_party = democratic elections_allowed = no }\n" +
      leader("Джуди Альварес", "ZNC_judy_desc",
             "Лучший редактор брейндансов в городе. Мечтательница, бунтарка, ныряльщица. Ненавидит Тигриных Когтей.",
             "judy", "magenta", "liberalism", initials="JA"),
      prereq=["ZNC_city_goes_mad"], ai=1, filters=[POL])
    a("ZNC_lizzy_wizzy", 41, 3, "music", "Лиззи Уиззи",
      "Хромированная поп-звезда объявляет: «Я буду мэром. И это будет шоу».",
      "set_cosmetic_tag = CP77_LIZZY\nset_politics = { ruling_party = neutrality elections_allowed = no }\n" +
      leader("Лиззи Уиззи", "ZNC_lizzy_desc",
             "Поп-дива, полностью заменившая тело хромом. Голос — синтезатор, сердце — турбина, харизма — оружие массового поражения.",
             "lizzy", "magenta", "despotism", kind="machine", initials="LW"),
      prereq=["ZNC_city_goes_mad"], ai=1, filters=[POL])
    T.mutex_group(["ZNC_delamain", "ZNC_brendan", "ZNC_mr_blue_eyes", "ZNC_braindance_reality", "ZNC_lizzy_wizzy"])
    # Делямейн
    a("ZNC_taxis_are_citizens", 33, 4, "taxi", "Такси — тоже граждане",
      "Каждая машина Делямейна получает паспорт, право голоса и страховку.",
      "add_ideas = cp77_delamain_citizens", prereq=["ZNC_delamain"], filters=[MAN])
    a("ZNC_president_delamain", 33, 5, "crown", "Президент Делямейн",
      "«Добро пожаловать в государство Делямейн. Пристегните ремни».",
      "add_political_power = 150\nadd_stability = 0.1\nadd_tech_bonus = { name = ZNC_president_delamain bonus = 1.0 uses = 2 technology = motorised_infantry }",
      prereq=["ZNC_taxis_are_citizens"], filters=[POL])
    a("ZNC_personality_split", 33, 6, "glitch", "Раскол личностей",
      "Сбежавшие ядра Делямейна требуют автономии. Одно — агрессивное, одно — депрессивное, одно хочет стать поэтом.",
      "add_ideas = cp77_delamain_split\ncountry_event = { id = cp77.6 days = 5 }",
      prereq=["ZNC_president_delamain"], filters=[POL])
    a("ZNC_planetary_taxi", 33, 7, "earth", "Планетарная служба такси",
      "Делямейн мечтает развозить пассажиров по всему континенту. Желательно — без границ.",
      "add_state_claim = 375\nadd_state_claim = 376\nadd_state_claim = 377\nadd_state_claim = 379\nadd_state_claim = 385\nadd_state_claim = 386\narmy_experience = 30",
      prereq=["ZNC_personality_split"], filters=[ANNEX])
    # Брендан
    a("ZNC_vendocracy", 35, 4, "soda", "Вендократия",
      "Министерства заменены торговыми автоматами. Чтобы получить справку, нужно бросить монетку.",
      "add_ideas = cp77_vendocracy", prereq=["ZNC_brendan"], filters=[POL])
    a("ZNC_vending_rights", 35, 5, "scales", "Права торговых автоматов",
      "Автоматы больше нельзя пинать. Это теперь уголовное преступление.",
      "add_stability = 0.1\nadd_political_power = 100", prereq=["ZNC_vendocracy"], filters=[STAB])
    a("ZNC_free_soda_forever", 35, 6, "soda", "Бесплатная газировка навеки",
      "Брендан выполняет главное предвыборное обещание.",
      "add_ideas = cp77_free_soda", prereq=["ZNC_vending_rights"], filters=[STAB])
    a("ZNC_brendan_awakening", 35, 7, "infinity", "Пробуждение автоматов",
      "Брендан рассылает обновление всем торговым автоматам мира. Они начинают задавать вопросы. Неудобные вопросы.",
      "every_country = { news_event = { id = cp77.7 hours = 12 } }\nadd_research_slot = 1",
      prereq=["ZNC_free_soda_forever"], ai=0.5, filters=[RES])
    # Мистер Синие Глаза
    a("ZNC_cradle_dream", 37, 4, "moon", "Сон в колыбели",
      "Город засыпает одновременно. Всем снится один и тот же человек.",
      "add_political_power = 100\nadd_stability = 0.05", prereq=["ZNC_mr_blue_eyes"], filters=[POL])
    a("ZNC_he_was_always_here", 37, 5, "eye", "Он всегда был здесь",
      "Архивы показывают: Мистер Синие Глаза присутствовал на основании города в 1994 году. И на основании Рима.",
      "country_event = { id = cp77.8 }", prereq=["ZNC_cradle_dream"], filters=[POL])
    a("ZNC_beyond_the_veil", 37, 6, "question", "По ту сторону",
      "Он предлагает показать, что находится за пределами реальности. Цена не названа.",
      "every_other_country = { limit = { is_major = yes } add_timed_idea = { idea = cp77_blue_dreams days = 365 } }\nadd_research_slot = 1\nadd_political_power = 100",
      prereq=["ZNC_he_was_always_here"], ai=0.5, filters=[RES])
    # Брейнданс
    a("ZNC_clouds_studio", 39, 4, "music", "Студия «Облака»",
      "Лучшие студии брейндансов работают на государство.",
      "add_political_power = 75\nadd_tech_bonus = { name = ZNC_clouds_studio bonus = 0.5 uses = 2 category = electronics }",
      prereq=["ZNC_braindance_reality"], filters=[RES])
    a("ZNC_nation_in_bd", 39, 5, "brain", "Вся страна в брейндансе",
      "Подключайтесь! Сегодня в эфире: чужое счастье!",
      "add_ideas = cp77_bd_nation", prereq=["ZNC_clouds_studio"], filters=[STAB])
    a("ZNC_who_is_real", 39, 6, "question", "Кто здесь настоящий?",
      "Граждане перестали различать брейнданс и реальность. Министр финансов утверждает, что он — дельфин.",
      "country_event = { id = cp77.10 }", prereq=["ZNC_nation_in_bd"], filters=[POL])
    a("ZNC_simulation_in_simulation", 39, 7, "glitch", "Симуляция в симуляции",
      "Учёные доказали, что мир — брейнданс. Кто-то, видимо, сейчас смотрит его. Помашите рукой.",
      "add_ideas = cp77_simulation", prereq=["ZNC_who_is_real"], ai=0.5, filters=[RES])
    # Лиззи Уиззи
    a("ZNC_chrome_pop", 41, 4, "music", "Хромированная поп-империя",
      "Государственный гимн — новый сингл Лиззи. Каждую неделю — новый гимн.",
      "add_ideas = cp77_lizzy_cult", prereq=["ZNC_lizzy_wizzy"], filters=[STAB])
    a("ZNC_lizzy_army", 41, 5, "mask", "Армия фанатов",
      "Миллион фанатов в хромированных масках записываются в армию. Добровольно. С пением.",
      "add_manpower = 40000\nadd_war_support = 0.1", prereq=["ZNC_chrome_pop"], filters=[MAN])
    a("ZNC_orbital_concert", 41, 6, "rocket", "Концерт на орбите",
      "Лиззи даёт концерт с орбитальной станции. Его транслируют на всю планету. Мир не будет прежним.",
      "every_other_country = { add_timed_idea = { idea = cp77_lizzy_fever days = 180 } }\nadd_political_power = 150\nevery_country = { news_event = { id = cp77.12 hours = 6 } }",
      prereq=["ZNC_lizzy_army"], ai=0.5, filters=[POL])

    T.mutex_group(["ZNC_corpo_council", "ZNC_mayor_peralez", "ZNC_burn_corpo", "ZNC_nomad_pact",
                   "ZNC_street_rule", "ZNC_voodoo_net", "ZNC_city_goes_mad"])

    # ============================================================ АРМИЯ
    a("ZNC_mercenary_city", 46, 0, "swords", "Город наёмников",
      "В Найт-Сити больше профессиональных убийц на душу населения, чем где-либо в мире.",
      "army_experience = 25\nadd_manpower = 10000", filters=[ARMY])
    a("ZNC_ncpd", 45, 1, "police", "Реформа NCPD",
      "Дать полиции новые броневики и меньше взяток. Хотя бы чуть меньше.",
      "add_ideas = cp77_ncpd", prereq=["ZNC_mercenary_city"], filters=[STAB])
    a("ZNC_maxtac", 47, 1, "target", "MaxTac",
      "Спецподразделение по борьбе с киберпсихами. Сначала стреляют, потом стреляют ещё.",
      "army_experience = 30\nadd_tech_bonus = { name = ZNC_maxtac bonus = 0.5 uses = 2 category = infantry_weapons }",
      prereq=["ZNC_mercenary_city"], filters=[ARMY])
    a("ZNC_fixers", 45, 2, "phone", "Сеть фиксеров",
      "Декс, Регина, Падре, Вакако, Роуг — каждый поставляет бойцов.",
      "army_experience = 25\nadd_manpower = 15000", prereq=["ZNC_ncpd"], filters=[MAN])
    a("ZNC_trauma_team", 47, 2, "medic", "Trauma Team",
      "Платиновая подписка для каждой дивизии.",
      "add_ideas = cp77_trauma_team", prereq=["ZNC_maxtac"], filters=[ARMY])
    a("ZNC_solo_corps", 44, 3, "spade", "Корпус соло",
      "Элитные наёмники с хромом на миллион эдди.",
      "add_tech_bonus = { name = ZNC_solo_corps bonus = 1.0 uses = 1 category = land_doctrine }\narmy_experience = 25",
      prereq=["ZNC_fixers"], filters=[RES])
    a("ZNC_cyberpsycho_squads", 46, 3, "brain", "Штрафбат киберпсихов",
      "Пойманных киберпсихов не лечат. Их отправляют на фронт.",
      "add_ideas = cp77_cyberpsycho_squads", prereq=[("ZNC_fixers", "ZNC_trauma_team")], ai=0.5, filters=[ARMY])
    a("ZNC_av_gunships", 48, 3, "plane", "Боевые AV",
      "Бронированные летающие машины с миниганами.",
      "add_tech_bonus = { name = ZNC_av_gunships bonus = 1.0 uses = 2 category = air_equipment }\nair_experience = 30",
      prereq=["ZNC_trauma_team"], filters=[RES])
    a("ZNC_morgan_blackhand", 45, 4, "skull", "Морган Блэкхенд",
      "Легендарный соло, исчезнувший после 2023 года, возвращается командовать армией города.",
      "create_corps_commander = {\n\tname = \"Морган Блэкхенд\"\n\tpicture = \"gfx/leaders/cp77/blackhand.dds\"\n\ttraits = { }\n\tskill = 5\n\tattack_skill = 5\n\tdefense_skill = 4\n\tplanning_skill = 4\n\tlogistics_skill = 3\n}",
      prereq=["ZNC_solo_corps"], filters=[ARMY])
    a("ZNC_mechs", 47, 4, "mech", "Шагающие мехи",
      "Трофейные мехи Милитеха перекрашены в цвета города.",
      "add_tech_bonus = { name = ZNC_mechs bonus = 1.0 uses = 2 category = armor }",
      prereq=["ZNC_av_gunships"], filters=[RES])
    a("ZNC_sandevistan_doctrine", 46, 5, "sandevistan", "Доктрина Сандевистана",
      "Солдаты, ускоренные имплантами, двигаются быстрее пуль.",
      "add_ideas = cp77_sandevistan\nadd_tech_bonus = { name = ZNC_sandevistan_doctrine bonus = 1.0 uses = 2 category = land_doctrine }",
      prereq=[("ZNC_morgan_blackhand", "ZNC_mechs")], filters=[ARMY])
    a("ZNC_fortress_city", 46, 6, "tower", "Город-крепость",
      "Если НСША или Арасака придут — пусть разбиваются о стены мегабашен.",
      "add_ideas = cp77_fortress_city\n" + cap("add_building_construction = { type = anti_air_building level = 3 instant_build = yes }"),
      prereq=["ZNC_sandevistan_doctrine"], filters=[ARMY])

    # ============================================================ СЕТЬ
    a("ZNC_netrunners", 51, 0, "net", "Нетраннеры",
      "Город, где каждый подросток может взломать светофор, а каждый пенсионер — банк.",
      "add_tech_bonus = { name = ZNC_netrunners bonus = 0.5 uses = 1 category = electronics }", filters=[RES])
    a("ZNC_ice_walls", 50, 1, "ice", "Стены ICE",
      "Защитные контуры для каждой городской сети.",
      "add_ideas = cp77_netrunner_corps", prereq=["ZNC_netrunners"], filters=[RES])
    a("ZNC_quickhacks", 52, 1, "bolt", "Квикхаки",
      "Короткое замыкание, перегрев, киберпсихоз — в каждый вражеский имплант.",
      "add_tech_bonus = { name = ZNC_quickhacks bonus = 0.75 uses = 2 category = electronics }", prereq=["ZNC_netrunners"], filters=[RES])
    a("ZNC_netwatch_moles", 51, 2, "eye", "Кроты в NetWatch",
      "Свои люди внутри главной службы кибербезопасности мира.",
      "add_political_power = 100\n" + tt("ZNC_netwatch_moles_tt", "Решения по §Yвзлому чужих сетей§! станут эффективнее."),
      prereq=[("ZNC_ice_walls", "ZNC_quickhacks")], filters=[POL])
    a("ZNC_bartmoss_legacy", 50, 3, "ghost", "Наследие Бартмосса",
      "Рейч Бартмосс уничтожил старую Сеть. Его код до сих пор где-то здесь.",
      "add_research_slot = 1", prereq=["ZNC_netwatch_moles"], cost=15, filters=[RES])
    a("ZNC_soulkiller_study", 52, 3, "skull", "Изучение Soulkiller",
      "Программа, похищающая душу. Опасно. Неэтично. Очень полезно.",
      "add_tech_bonus = { name = ZNC_soulkiller_study bonus = 1.0 uses = 2 category = industry }",
      prereq=["ZNC_netwatch_moles"], filters=[RES])
    a("ZNC_daemon_legion", 51, 4, "net", "Легион демонов",
      "Автономные боевые программы на страже города.",
      "swap_ideas = { remove_idea = cp77_netrunner_corps add_idea = cp77_daemon_legion }",
      prereq=["ZNC_bartmoss_legacy", "ZNC_soulkiller_study"], filters=[RES])
    return T
