#!/usr/bin/env python3
"""Сборка мода «Cyberpunk 2077: Night City Wars» для Hearts of Iron IV.

Запуск:  python3 tools/build.py
Результат: папка cyberpunk2077/ рядом с tools/ полностью перегенерируется.
"""
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cp77gfx  # noqa: E402
from cp77core import MOD_DIR, LOC, Tree, indent, loc, write, write_localisation  # noqa: E402
import content_common as CC  # noqa: E402
from content_common import C, ICON_CATALOG, IDEAS, NEW_TAGS, leader, portrait  # noqa: E402
import content_events  # noqa: E402
import tree_night_city  # noqa: E402
import tree_others  # noqa: E402

VERSION = "1.0.0"


# --------------------------------------------------------------- решения
def decisions():
    G = "cp77_decisions"
    cats = {
        "cp77_gangs_category": ("Банды Найт-Сити", "Каждая банда города чего-то хочет. Обычно — денег. Иногда — крови.", "tag = ZNC", "swords"),
        "cp77_relic_category": ("Биочип «Relic»", "Чип в голове лидера убивает носителя. Найдите выход, пока не поздно.\n\nТекущий уровень киберпсихоза в городе: [?cp77_cyberpsychosis]", "tag = ZNC", "chip"),
        "cp77_netrunning_category": ("Нетраннинг", "Взлом чужих сетей — оружие XXI века.", "OR = { tag = ZNC tag = USA tag = JAP tag = CHI }", "net"),
        "cp77_blackwall_category": ("Последствия падения Заслона", "Дикие ИИ рыщут по Сети. Надо защищаться.", "always = yes", "wall"),
    }
    out_cat = []
    for k, (name, desc, allowed, icon) in cats.items():
        loc(G, k, name)
        loc(G, k + "_desc", desc)
        vis = "\n\tvisible = { has_global_flag = cp77_blackwall_fallen }" if k == "cp77_blackwall_category" else ""
        out_cat.append(f"{k} = {{\n\ticon = cp77_{icon}\n\tallowed = {{ {allowed} }}{vis}\n}}")
        CC.ICON_USES.add(("category", icon))
    write("common/decisions/categories/cp77_decision_categories.txt", "\n\n".join(out_cat) + "\n")

    D = {}

    def dec(cat, did, name, desc, icon, body):
        loc(G, did, name)
        loc(G, did + "_desc", desc)
        CC.ICON_USES.add(("decision", icon))
        D.setdefault(cat, []).append(f"{did} = {{\n\ticon = cp77_{icon}\n" + indent(body, 1) + "\n}")

    # --- банды
    gang = "cp77_gangs_category"
    for did, name, desc, icon, cost, eff in [
        ("cp77_pay_maelstrom", "Заплатить Мальстрёму", "Ящик хрома — и Мальстрём делится оружием.", "maelstrom", 30,
         "add_equipment_to_stockpile = { type = infantry_equipment_1 amount = 750 }\nadd_stability = -0.02\nadd_to_variable = { cp77_cyberpsychosis = 5 }"),
        ("cp77_pay_tyger_claws", "Договориться с Тигриными Когтями", "Когти обучают наших бойцов кендзюцу на мотоциклах.", "tiger", 40,
         "army_experience = 15"),
        ("cp77_pay_valentinos", "Почтить Валентинос", "Офренда, золото и обещание защиты — и Хейвуд даст людей.", "rose", 25,
         "add_manpower = 6000\nadd_stability = 0.02"),
        ("cp77_pay_sixth_street", "Наградить Шестую улицу", "Ветераны любят медали и патриотические речи.", "flag", 25,
         "add_war_support = 0.05"),
        ("cp77_pay_animals", "Нанять Животных", "Качки на биотестостероне. Не очень умные, но очень сильные.", "fist", 20,
         "add_manpower = 3000\narmy_experience = 5"),
        ("cp77_pay_mox", "Поддержать Мокс", "Мокс защищают работниц «Облаков». Народ это ценит.", "heart", 20,
         "add_stability = 0.03"),
        ("cp77_pay_voodoo", "Сделка с Вуду-боями", "Нетраннеры Пасифики поделятся парой секретов.", "wave", 35,
         "add_tech_bonus = { name = cp77_pay_voodoo bonus = 0.5 uses = 1 category = electronics }"),
    ]:
        dec(gang, did, name, desc, icon, f"cost = {cost}\ndays_re_enable = 120\nfire_only_once = no\n"
            f"complete_effect = {{\n{indent(eff, 1)}\n}}\nai_will_do = {{ factor = 1 }}")
    dec(gang, "cp77_maxtac_sweep", "Зачистка MaxTac", "Спецназ прочёсывает худшие кварталы города.", "target",
        "cost = 50\ndays_re_enable = 90\ncomplete_effect = {\n\tadd_stability = 0.08\n\tadd_war_support = -0.03\n\tsubtract_from_variable = { cp77_cyberpsychosis = 10 }\n}\nai_will_do = { factor = 1 }")
    dec(gang, "cp77_cyberpsycho_hunt", "Охота на киберпсихов", "Регина Джонс платит за каждого обезвреженного киберпсиха.\n\nТекущий уровень киберпсихоза: [?cp77_cyberpsychosis]", "brain",
        "cost = 40\ndays_re_enable = 60\nvisible = { check_variable = { cp77_cyberpsychosis > 29 } }\n"
        "complete_effect = {\n\tsubtract_from_variable = { cp77_cyberpsychosis = 20 }\n\tadd_stability = 0.02\n\tarmy_experience = 5\n}\nai_will_do = { factor = 2 }")
    dec(gang, "cp77_cure_cyberpsychosis", "Лечение киберпсихоза", "Клиники риперов работают бесплатно. Город выдыхает.", "medic",
        "cost = 100\nvisible = { has_idea = cp77_cyberpsychosis }\navailable = { check_variable = { cp77_cyberpsychosis < 40 } }\n"
        "complete_effect = { remove_ideas = cp77_cyberpsychosis }\nai_will_do = { factor = 5 }")

    # --- Relic
    rel = "cp77_relic_category"
    loc(G, "cp77_relic_mission", "Время уходит")
    loc(G, "cp77_relic_mission_desc", "Биочип «Relic» переписывает нейроны носителя. Если ничего не предпринять, лидер города умрёт, а Джонни останется ни с чем.")
    D.setdefault(rel, []).append(
        "cp77_relic_mission = {\n\ticon = cp77_hourglass\n\tallowed = { tag = ZNC }\n"
        "\tactivation = { has_country_flag = cp77_relic_active }\n\tavailable = { has_country_flag = cp77_relic_resolved }\n"
        "\tcancel_trigger = { has_country_flag = cp77_relic_resolved }\n"
        "\tdays_mission_timeout = 365\n\tis_good = no\n\tfire_only_once = yes\n\tselectable_mission = no\n"
        "\tcomplete_effect = { }\n\ttimeout_effect = { country_event = cp77.13 }\n\tai_will_do = { factor = 1 }\n}")
    CC.ICON_USES.add(("decision", "hourglass"))
    vis = "visible = {\n\thas_country_flag = cp77_relic_active\n\tNOT = { has_country_flag = cp77_relic_resolved }\n}"
    resolve = "set_country_flag = cp77_relic_resolved\nclr_country_flag = cp77_relic_active\nremove_ideas = cp77_relic"
    dec(rel, "cp77_relic_misty", "Расклад Мисти", "Мисти раскладывает таро. Карты говорят странное. Карты всегда говорят странное.", "star",
        f"cost = 10\ndays_re_enable = 60\n{vis}\ncomplete_effect = {{\n\trandom_list = {{\n\t\t50 = {{ add_political_power = 40 }}\n\t\t30 = {{ add_stability = 0.03 }}\n\t\t20 = {{ add_stability = -0.02 add_war_support = 0.05 }}\n\t}}\n}}\nai_will_do = {{ factor = 1 }}")
    dec(rel, "cp77_relic_viktor", "Таблетки Виктора", "Виктор Вектор выписывает подавители. Помогает. Ненадолго.", "medic",
        f"cost = 25\ndays_re_enable = 90\n{vis}\ncomplete_effect = {{ add_stability = 0.03 }}\nai_will_do = {{ factor = 1 }}")
    endings = [
        ("cp77_relic_devil", "Довериться Ханако Арасаке", "Арасака умеет извлекать чипы. Цена — вечный контракт.", "arasaka", 100,
         "country_exists = JAP\nNOT = { has_war_with = JAP }", 31),
        ("cp77_relic_star", "Уехать с Панам", "Кочевники знают нетраннера в Пустошах, который может помочь.", "wheel", 75,
         "OR = { has_idea = cp77_nomad_clans has_idea = cp77_nation_on_wheels has_completed_focus = ZNC_nomad_pact }", 32),
        ("cp77_relic_sun", "Штурм с Роуг", "Ворваться в Арасака-тауэр, добраться до Микоси и выбить ответы силой.", "spade", 75,
         "OR = { has_idea = cp77_afterlife_mercs has_completed_focus = ZNC_mercenary_city }", 33),
        ("cp77_relic_temperance", "Отдать тело Джонни", "Пусть Джонни живёт. Ви уйдёт за Заслон с Альт.", "guitar", 50,
         "always = yes", 34),
        ("cp77_relic_tower", "Сделка с Соломоном Ридом", "FIA обещает операцию. Нужно только немного поработать на НСША.", "star", 100,
         "country_exists = USA\nNOT = { has_war_with = USA }", 35),
        ("cp77_relic_republic_v", "Скопировать Ви в каждого", "Безумная идея учёных «Посмертия»: если нельзя спасти одного Ви, пусть их будет миллион.", "v", 150,
         "has_completed_focus = ZNC_mass_cyberware", 36),
    ]
    for did, name, desc, icon, cost, avail, ev in endings:
        dec(rel, did, name, desc, icon,
            f"cost = {cost}\n{vis}\navailable = {{\n{indent(avail, 1)}\n}}\n"
            f"complete_effect = {{\n{indent(resolve, 1)}\n\tcountry_event = cp77.{ev}\n}}\nai_will_do = {{ factor = 1 }}")

    # --- нетраннинг
    net = "cp77_netrunning_category"
    loc(G, "cp77_hack_country", "Взломать сети: [From.GetNameDef]")
    loc(G, "cp77_hack_country_desc", "Нетраннеры атакуют государственные сети противника, крадут технологии и сеют хаос.")
    CC.ICON_USES.add(("decision", "net"))
    D.setdefault(net, []).append(
        "cp77_hack_country = {\n\ticon = cp77_net\n\tcost = 50\n\tdays_re_enable = 180\n"
        "\ttarget_trigger = {\n\t\tFROM = {\n\t\t\tis_major = yes\n\t\t\texists = yes\n\t\t\tNOT = { tag = ROOT }\n\t\t}\n\t}\n"
        "\tcomplete_effect = {\n\t\tFROM = { add_political_power = -50 add_stability = -0.03 }\n"
        "\t\tadd_tech_bonus = { name = cp77_hack_country bonus = 0.5 uses = 1 category = industry }\n"
        "\t\tif = {\n\t\t\tlimit = { has_completed_focus = ZNC_netwatch_moles }\n\t\t\tFROM = { add_stability = -0.03 }\n\t\t\tadd_political_power = 25\n\t\t}\n\t}\n"
        "\tai_will_do = { factor = 0.3 }\n}")
    dec(net, "cp77_hire_netrunners", "Нанять нетраннеров", "Лучшие нетраннеры города готовы работать на государство.", "ice",
        "cost = 75\nfire_only_once = yes\ncomplete_effect = { add_timed_idea = { idea = cp77_netrunner_corps days = 365 } }\nai_will_do = { factor = 1 }")

    # --- Чёрный Заслон
    dec("cp77_blackwall_category", "cp77_firewall", "Поставить файрвол", "Изолировать государственные сети от диких ИИ.", "wall",
        "cost = 75\navailable = { has_idea = cp77_rogue_ai }\ncomplete_effect = { remove_ideas = cp77_rogue_ai }\nai_will_do = { factor = 3 }")

    text = "\n\n".join(f"{cat} = {{\n" + "\n\n".join(indent(d, 1) for d in ds) + "\n}" for cat, ds in D.items())
    write("common/decisions/cp77_decisions.txt", text + "\n")


# ------------------------------------------------------ настройка мира 2077
def templates(tag):
    t = {
        "ZNC": [("Соло-наёмники", 6, "infantry", ["engineer", "recon"]),
                ("Хромированные банды", 4, "infantry", []),
                ("Бронетакси", 4, "motorized", ["recon"])],
        "ZFT": [("Техасские рейнджеры", 6, "infantry", ["engineer"])],
        "ZFP": [("Каскадская гвардия", 6, "infantry", ["engineer"])],
        "ZBL": [("Кочевой караван", 4, "motorized", ["recon"])],
    }[tag]
    out = []
    for name, n, reg, sup in t:
        regs = " ".join(f"{reg} = {{ x = {i // 3} y = {i % 3} }}" for i in range(n))
        sups = " ".join(f"{s} = {{ x = 0 y = {i} }}" for i, s in enumerate(sup))
        out.append(f'division_template = {{\n\tname = "{name}"\n\tregiments = {{ {regs} }}\n\tsupport = {{ {sups} }}\n}}')
    return out


TECHS = ("infantry_weapons infantry_weapons1 infantry_weapons2 tech_support tech_engineers tech_recon "
         "motorised_infantry gw_artillery interwar_artillery electronic_mechanical_engineering radio basic_machine_tools early_fighter").split()


def set_tech():
    return "set_technology = {\n" + "\n".join(f"\t{t} = 1" for t in TECHS) + "\n}"


UNITS = {
    "ZNC": (378, [("Соло-наёмники", "Соло-дивизия", 4), ("Хромированные банды", "Бригада банд", 4), ("Бронетакси", "Таксомоторный полк", 2)]),
    "ZFT": (375, [("Техасские рейнджеры", "Рейнджеры", 5)]),
    "ZFP": (386, [("Каскадская гвардия", "Гвардия Каскадии", 4)]),
    "ZBL": (379, [("Кочевой караван", "Караван", 4)]),
}
STATES = {"ZNC": [378], "ZFT": [375, 376], "ZFP": [386, 385], "ZBL": [379, 377]}


def scripted_effects():
    parts = []
    for tag, states in STATES.items():
        body = [f"transfer_state = {s}\nadd_state_core = {s}" for s in states]
        body.append(f"set_capital = {{ state = {states[0]} }}")
        body.append(set_tech())
        body += templates(tag)
        body.append("add_equipment_to_stockpile = { type = infantry_equipment_1 amount = 3000 }\n"
                    "add_equipment_to_stockpile = { type = support_equipment_1 amount = 300 }\n"
                    "add_equipment_to_stockpile = { type = motorized_equipment_1 amount = 400 }\n"
                    "add_manpower = 30000")
        parts.append(f"{tag} = {{\n" + indent("\n".join(body), 1) + "\n}")
    lost = sorted(s for v in STATES.values() for s in v)
    usa = ["set_cosmetic_tag = CP77_NUSA",
           leader("Розалинд Майерс", "USA_myers_desc",
                  "Президент НСША, бывшая глава Милитеха. Железная воля, стальные нервы и, по слухам, титановый позвоночник.",
                  "myers", "blue", "conservatism", initials="RM"),
           "set_politics = { ruling_party = democratic elections_allowed = no }",
           "add_ideas = { cp77_nusa_federal cp77_militech_state }"]
    usa += [f"remove_state_core = {s}\nadd_state_claim = {s}" for s in lost]
    parts.append("USA = {\n" + indent("\n".join(usa), 1) + "\n}")
    jap = ["set_cosmetic_tag = CP77_ARJ",
           leader("Сабуро Арасака", "JAP_saburo_desc",
                  "Основатель и глава корпорации Арасака. 158 лет, из них 100 — у власти. Тело — почти полностью кибернетическое.",
                  "saburo", "red", "fascism_ideology", initials="SA"),
           "set_politics = { ruling_party = fascism elections_allowed = no }",
           "add_ideas = cp77_arasaka_empire",
           "if = { limit = { has_war_with = CHI } white_peace = CHI }",
           "if = { limit = { has_war_with = PRC } white_peace = PRC }",
           "create_corps_commander = {\n\tname = \"Горо Такэмура\"\n\tpicture = \"gfx/leaders/cp77/takemura.dds\"\n\ttraits = { }\n\tskill = 4\n\tattack_skill = 3\n\tdefense_skill = 4\n\tplanning_skill = 4\n\tlogistics_skill = 3\n}"]
    portrait("takemura", "red", initials="GT")
    portrait("blackhand", "cyan", initials="MB")
    portrait("smasher", "red", kind="machine", initials="AS")
    parts.append("JAP = {\n" + indent("\n".join(jap), 1) + "\n}")
    for tag, cos, idea_id, lname, did, desc, pid, col, ide, party in [
        ("CHI", "CP77_KTC", "cp77_kang_tao", "Совет директоров Кан Тао", "CHI_kangtao_desc",
         "Самая быстрорастущая оружейная корпорация мира и фактическое правительство Китая.", "kangtao", "cyan", "oligarchism", "neutrality"),
        ("SOV", "CP77_SOV", "cp77_sovoil", "Президиум СовОйл", "SOV_sovoil_desc",
         "Нефтяной гигант, который пережил распад, войны и Коллапс. И стал государством.", "sovoil", "orange", "marxism", "communism"),
        ("FRA", "CP77_EEC", "cp77_eec", "Еврокомиссар ЕЭС", "FRA_eec_desc",
         "Лицо Европейского экономического сообщества. Улыбается в камеры и подписывает торговые соглашения.", "eec", "blue", "liberalism", "democratic"),
    ]:
        b = [f"set_cosmetic_tag = {cos}", leader(lname, did, desc, pid, col, ide, initials=tag),
             f"set_politics = {{ ruling_party = {party} elections_allowed = no }}", f"add_ideas = {idea_id}"]
        parts.append(f"if = {{\n\tlimit = {{ country_exists = {tag} }}\n\t{tag} = {{\n" + indent("\n".join(b), 2) + "\n\t}\n}")
    parts.append("ZNC = { set_variable = { cp77_cyberpsychosis = 20 } }")
    setup = ("cp77_setup_world = {\n\tif = {\n\t\tlimit = { NOT = { has_global_flag = cp77_world_ready } }\n\t\tset_global_flag = cp77_world_ready\n"
             + indent("\n".join(parts), 2) + "\n\t}\n}\n")

    spawn = []
    for tag, (state, units) in UNITS.items():
        for tmpl, uname, cnt in units:
            spawn.append(f'{state} = {{\n\tif = {{\n\t\tlimit = {{ is_owned_by = {tag} }}\n\t\tcreate_unit = {{\n'
                         f'\t\t\tdivision = "name = \\"{uname}\\" division_template = \\"{tmpl}\\" start_experience_factor = 0.4 start_equipment_factor = 1.0"\n'
                         f'\t\t\towner = {tag}\n\t\t\tcount = {cnt}\n\t\t}}\n\t}}\n}}')
    spawn_txt = ("cp77_spawn_armies = {\n\tif = {\n\t\tlimit = { NOT = { has_global_flag = cp77_armies_ready } }\n\t\tset_global_flag = cp77_armies_ready\n"
                 + indent("\n".join(spawn), 2) + "\n\t}\n}\n")
    write("common/scripted_effects/cp77_scripted_effects.txt", setup + "\n" + spawn_txt)

    write("common/on_actions/cp77_on_actions.txt",
          "on_actions = {\n\ton_startup = {\n\t\teffect = {\n"
          "\t\t\tcp77_setup_world = yes\n\t\t\tcp77_spawn_armies = yes\n"
          "\t\t\tevery_country = { news_event = { id = cp77.1 days = 1 } }\n"
          "\t\t\tZNC = { country_event = { id = cp77.2 days = 14 } }\n"
          "\t\t}\n\t}\n}\n")


# ------------------------------------------------------- страны и история
HISTORY = {
    "ZNC": dict(capital=378, party="neutrality", pops=dict(democratic=20, fascism=20, communism=15, neutrality=45),
                stab=0.45, ws=0.35, ideas="cp77_city_of_dreams cp77_gang_wars cp77_corpo_plaza",
                leader=("Городской совет Найт-Сити", "ZNC_council_desc",
                        "После гибели мэра Люциуса Райна городом управляет совет. Половина его членов подкуплена Арасакой, половина — Милитехом, ещё половина — бандами. Да, это три половины. Это Найт-Сити.",
                        "znc_council", "yellow", "oligarchism"),
                parties={"neutrality": ("Городской совет", "Совет Свободного города Найт-Сити"),
                         "democratic": ("Прогрессисты", "Прогрессивная коалиция Пералеса"),
                         "fascism": ("Корпоблок", "Корпоративный блок безопасности"),
                         "communism": ("Сожги корпо", "Движение «Сожги корпо» имени Сильверхенда")}),
    "ZFT": dict(capital=375, party="neutrality", pops=dict(democratic=30, fascism=20, communism=5, neutrality=45),
                stab=0.55, ws=0.5, ideas="cp77_free_state",
                leader=("Губернатор Клэй Мэддокс", "ZFT_maddox_desc",
                        "Нефтяник, ковбой и убеждённый сепаратист. Носит шляпу даже в душе.", "maddox", "orange", "oligarchism"),
                parties={"neutrality": ("Партия одинокой звезды", "Партия Одинокой звезды")}),
    "ZFP": dict(capital=386, party="democratic", pops=dict(democratic=55, fascism=5, communism=15, neutrality=25),
                stab=0.6, ws=0.3, ideas="cp77_free_state",
                leader=("Канцлер Ирен Валиант", "ZFP_valiant_desc",
                        "Бывший биоинженер Биотехники, ставшая главой Свободных штатов Северо-Запада.", "valiant", "green", "liberalism"),
                parties={"democratic": ("Каскадская лига", "Каскадская лига свободы")}),
    "ZBL": dict(capital=379, party="neutrality", pops=dict(democratic=10, fascism=10, communism=20, neutrality=60),
                stab=0.5, ws=0.6, ideas="cp77_free_state",
                leader=("Сол Брайт", "ZBL_saul_desc",
                        "Глава клана Альдекальдо. Осторожный, мудрый, упрямый как мул. Панам с ним вечно спорит.", "saul", "orange", "anarchism"),
                parties={"neutrality": ("Совет кланов", "Совет кочевых кланов Пустошей")}),
}


def countries():
    tags = []
    for tag, d in NEW_TAGS.items():
        tags.append(f'{tag} = "countries/{d["file"]}.txt"')
        r, g, b = d["color"]
        write(f"common/countries/{d['file']}.txt",
              f"graphical_culture = {d['gfx']}_gfx\ngraphical_culture_2d = {d['gfx']}_2d\n\ncolor = {{ {r} {g} {b} }}\n")
        h = HISTORY[tag]
        ln, ld, ldesc, lp, lc, lide = h["leader"]
        pops = " ".join(f"{k} = {v}" for k, v in h["pops"].items())
        for ide, (short, long_) in h["parties"].items():
            loc("cp77_countries", f"{tag}_{ide}_party", short)
            loc("cp77_countries", f"{tag}_{ide}_party_long", long_)
        write(f"history/countries/{tag} - {d['file']}.txt",
              f"capital = {h['capital']}\n\nset_research_slots = 3\nset_stability = {h['stab']}\nset_war_support = {h['ws']}\nset_convoys = 20\n\n"
              f"{set_tech()}\n\nset_politics = {{\n\truling_party = {h['party']}\n\tlast_election = \"2076.11.3\"\n\telection_frequency = 48\n\telections_allowed = no\n}}\n"
              f"set_popularities = {{ {pops} }}\n\nadd_ideas = {{ {h['ideas']} }}\n\n"
              + leader(ln, ld, ldesc, lp, lc, lide) + "\n")
    write("common/country_tags/cp77_countries.txt", "\n".join(tags) + "\n")


def bookmark():
    G = "cp77_bookmark"
    loc(G, "CP77_BOOKMARK", "2077: Город мечты")
    loc(G, "CP77_BOOKMARK_DESC", "Найт-Сити, 2077 год. Корпорации, банды, кочевники и ИИ за Чёрным Заслоном делят мир. Кем станете вы — легендой или удобрением?")
    entries = {
        "ZNC": ("neutrality", "cp77_city_of_dreams cp77_gang_wars cp77_corpo_plaza", "ZNC_corpo_council ZNC_burn_corpo ZNC_delamain",
                "Свободный город на западном побережье. Семь политических путей: от корпоративной префектуры Арасаки до президента-такси и вендократии торгового автомата Брендана."),
        "USA": ("democratic", "cp77_nusa_federal cp77_militech_state", "CP77_USA_unification_war_ii CP77_USA_save_songbird CP77_USA_myers_forever",
                "Президент Розалинд Майерс собирает расколотую Америку. Вторая война за объединение, Догтаун, Сойка и Луна — или вечная энграмма Майерс."),
        "JAP": ("fascism", "cp77_arasaka_empire", "CP77_JAP_yorinobu_coup CP77_JAP_saburo_eternal CP77_JAP_digital_emperor",
                "Корпоративная Япония Арасаки. Ёринобу против отца, Ханако против брата, Микоси против всего человечества."),
    }
    minors = {
        "ZFT": ("neutrality", "cp77_free_state", "CP77_FS_corn_kingdom", "Свободный штат Техас: нефть, кукуруза CHOOH2 и, возможно, Кукурузный император."),
        "ZBL": ("neutrality", "cp77_free_state", "CP77_FS_nomad_horde", "Кочевники Пустошей: семьи на колёсах, Василиски и Великая орда."),
        "ZFP": ("democratic", "cp77_free_state", "CP77_FS_druid_ai", "Свободные Штаты Северо-Запада: леса Биотехники, снежный человек-министр и ИИ-друид."),
    }
    lines = ["bookmarks = {", "\tbookmark = {", '\t\tname = "CP77_BOOKMARK"', '\t\tdesc = "CP77_BOOKMARK_DESC"',
             "\t\tdate = 2077.1.1.12", '\t\tpicture = "GFX_select_date_1936"', '\t\tdefault_country = "ZNC"', "\t\tdefault = yes"]

    def entry(tag, v):
        ide, ideas, focuses, desc = v
        loc(G, f"CP77_{tag}_BM", desc)
        return (f'\t\t{tag} = {{\n\t\t\thistory = "CP77_{tag}_BM"\n\t\t\tideology = {ide}\n'
                f"\t\t\tideas = {{ {ideas} }}\n\t\t\tfocuses = {{ {focuses} }}\n\t\t}}")
    for t, v in entries.items():
        lines.append(entry(t, v))
    loc(G, "CP77_OTHERS_BM", "Свободные штаты, Кан Тао, СовОйл, ЕЭС и все остальные — мир 2077 года открыт.")
    lines.append('\t\t"---" = {\n\t\t\thistory = "CP77_OTHERS_BM"\n\t\t}')
    for t, v in minors.items():
        lines.append(entry(t, v))
    lines.append("\t\teffect = {\n\t\t\trandomize_weather = 22345\n\t\t\tcp77_setup_world = yes\n\t\t}")
    lines += ["\t}", "}"]
    write("common/bookmarks/cp77_2077.txt", "\n".join(lines) + "\n")


# ------------------------------------------------------------------- идеи
def ideas():
    out = ["ideas = {", "\tcountry = {"]
    for iid, (mods, icon, removal) in IDEAS.items():
        CC.ICON_USES.add(("idea", icon))
        m = "\n".join(f"\t\t\t\t{k} = {v}" for k, v in mods.items())
        out.append(f"\t\t{iid} = {{\n\t\t\tpicture = cp77_{icon}\n\t\t\tallowed = {{ always = no }}\n\t\t\tallowed_civil_war = {{ always = yes }}\n"
                   f"\t\t\tremoval_cost = {removal}\n\t\t\tmodifier = {{\n{m}\n\t\t\t}}\n\t\t}}")
    out += ["\t}", "}"]
    write("common/ideas/cp77_ideas.txt", "\n".join(out) + "\n")


# ---------------------------------------------------------------- графика
def graphics(trees, event_pics):
    gfx = os.path.join(MOD_DIR, "gfx")
    sprites = []

    def glyph(icon):
        g, c = ICON_CATALOG[icon]
        return g, C[c]

    goal_icons = sorted({f.icon for t in trees for f in t.focuses.values()})
    for icon in goal_icons:
        g, c = glyph(icon)
        cp77gfx.focus_icon(g, c, os.path.join(gfx, "interface/goals/cp77", f"{icon}.dds"))
        sprites.append((f"GFX_goal_cp77_{icon}", f"gfx/interface/goals/cp77/{icon}.dds"))
    for kind, icon in sorted(CC.ICON_USES):
        g, c = glyph(icon)
        if kind == "idea":
            cp77gfx.idea_icon(g, c, os.path.join(gfx, "interface/ideas/cp77", f"{icon}.dds"))
            sprites.append((f"GFX_idea_cp77_{icon}", f"gfx/interface/ideas/cp77/{icon}.dds"))
        elif kind == "decision":
            cp77gfx.small_icon(g, c, os.path.join(gfx, "interface/decisions/cp77", f"{icon}.dds"), 44)
            sprites.append((f"GFX_decision_cp77_{icon}", f"gfx/interface/decisions/cp77/{icon}.dds"))
        elif kind == "category":
            cp77gfx.small_icon(g, c, os.path.join(gfx, "interface/decisions/cp77", f"cat_{icon}.dds"), 40)
            sprites.append((f"GFX_decision_category_cp77_{icon}", f"gfx/interface/decisions/cp77/cat_{icon}.dds"))
    for name, (icon, seed) in event_pics.items():
        g, c = glyph(icon)
        cp77gfx.event_picture(g, c, os.path.join(gfx, "event_pictures/cp77", f"{name}.dds"), seed, "NIGHT CITY // 2077")
        sprites.append((f"GFX_report_event_cp77_{name}", f"gfx/event_pictures/cp77/{name}.dds"))
    for i, (pid, (col, kind, initials)) in enumerate(sorted(CC.PORTRAITS.items())):
        cp77gfx.portrait(os.path.join(gfx, "leaders/cp77", f"{pid}.dds"), col, seed=i, initials=initials,
                         kind=kind if kind != "human" else "human")
    for tag, design in CC.FLAGS.items():
        cp77gfx.flag(os.path.join(gfx, "flags"), tag, design)

    body = "\n".join(f'\tspriteType = {{\n\t\tname = "{n}"\n\t\ttexturefile = "{p}"\n\t}}' for n, p in sprites)
    write("interface/cp77.gfx", "spriteTypes = {\n" + body + "\n}\n")


# -------------------------------------------------------------- проверки
def validate():
    errors = []
    for root, _, files in os.walk(MOD_DIR):
        for fn in files:
            if not fn.endswith((".txt", ".gfx", ".mod")):
                continue
            p = os.path.join(root, fn)
            s = open(p, encoding="utf-8").read()
            s2 = re.sub(r'"[^"\n]*"', '""', s)
            s2 = re.sub(r"#.*", "", s2)
            if s2.count("{") != s2.count("}"):
                errors.append(f"unbalanced braces: {os.path.relpath(p, MOD_DIR)} ({s2.count('{')} vs {s2.count('}')})")
    # все упомянутые ивенты существуют
    ev_text = open(os.path.join(MOD_DIR, "events/cp77_events.txt"), encoding="utf-8").read()
    defined = set(re.findall(r"id = (cp77\.\d+)", ev_text))
    used = set()
    for root, _, files in os.walk(os.path.join(MOD_DIR, "common")):
        for fn in files:
            used |= set(re.findall(r"(cp77\.\d+)\b", open(os.path.join(root, fn), encoding="utf-8").read()))
    used |= set(re.findall(r"id = (cp77\.\d+) (?:days|hours)", ev_text))
    for e in sorted(used - defined):
        if not re.match(r"cp77\.\d+\.[a-z]$", e):
            errors.append(f"missing event {e}")
    # идеи
    all_text = ""
    for root, _, files in os.walk(os.path.join(MOD_DIR, "common")):
        for fn in files:
            all_text += open(os.path.join(root, fn), encoding="utf-8").read()
    all_text += ev_text
    for iid in set(re.findall(r"\b(cp77_[a-z0-9_]+)", all_text)):
        pass
    for iid in set(re.findall(r"(?:add_ideas|remove_ideas|has_idea|idea|add_idea|remove_idea) = (cp77_[a-z0-9_]+)", all_text)):
        if iid not in IDEAS:
            errors.append(f"unknown idea {iid}")
    for cos in set(re.findall(r"set_cosmetic_tag = (\w+)", all_text)):
        if cos not in CC.COSMETIC:
            errors.append(f"unknown cosmetic tag {cos}")
    flat = {k for g in LOC.values() for k in g}
    for key in set(re.findall(r"custom_effect_tooltip = (\w+)", all_text)) | set(re.findall(r"create_faction = (\w+)", all_text)):
        if key not in flat:
            errors.append(f"missing loc {key}")
    for icon in ICON_CATALOG:
        g = ICON_CATALOG[icon][0]
        if cp77gfx._font_for(g[0], 40) is None:
            errors.append(f"glyph missing for {icon}")
    if errors:
        print("\n".join(errors))
        sys.exit(1)


def main():
    if os.path.isdir(MOD_DIR):
        shutil.rmtree(MOD_DIR)
    CC.ICON_USES = set()

    znc = tree_night_city.build(Tree("cp77_night_city_tree", "", "country = {\n\tfactor = 0\n\tmodifier = { add = 100 tag = ZNC }\n}"))
    usa = tree_others.build_usa(Tree("cp77_nusa_tree", "", "country = {\n\tfactor = 0\n\tmodifier = { add = 100 tag = USA }\n}"))
    jap = tree_others.build_jap(Tree("cp77_arasaka_tree", "", "country = {\n\tfactor = 0\n\tmodifier = { add = 100 tag = JAP }\n}"))
    fs = tree_others.build_free_states(Tree("cp77_free_states_tree", "",
                                            "country = {\n\tfactor = 0\n\tmodifier = { add = 100 OR = { tag = ZFT tag = ZFP tag = ZBL } }\n}"))
    trees = [znc, usa, jap, fs]
    for name, t in zip(["night_city", "nusa", "arasaka", "free_states"], trees):
        write(f"common/national_focus/cp77_{name}.txt", t.render())

    loc("cp77_tooltips", "cp77_pacific_league", "Тихоокеанская лига")
    loc("cp77_tooltips", "cp77_free_states_union", "Союз Свободных штатов")

    write("events/cp77_events.txt", content_events.build())
    decisions()
    scripted_effects()
    countries()
    bookmark()
    ideas()

    write("common/defines/cp77_defines.lua",
          'NDefines.NGame.START_DATE = "2077.1.1.12"\nNDefines.NGame.END_DATE = "2120.1.1.1"\n')

    loc("cp77_states_replace", "STATE_378", "Найт-Сити")
    loc("cp77_states_replace", "STATE_379", "Пустоши Невады")
    loc("cp77_states_replace", "STATE_377", "Аризонские Пустоши")
    loc("cp77_states_replace", "STATE_375", "Свободный Техас")

    descriptor = (f'version="{VERSION}"\ntags={{\n\t"Alternative History"\n\t"National Focuses"\n\t"Events"\n\t"Gameplay"\n}}\n'
                  'name="Cyberpunk 2077: Night City Wars"\nsupported_version="1.*"\nreplace_path="common/bookmarks"\n')
    write("descriptor.mod", descriptor)
    with open(os.path.join(os.path.dirname(MOD_DIR), "cyberpunk2077.mod"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(descriptor + 'path="mod/cyberpunk2077"\n')

    graphics(trees, content_events.EVENT_PICS)
    write_localisation()
    validate()

    n_focus = sum(len(t.focuses) for t in trees)
    print(f"OK: {n_focus} фокусов, {len(IDEAS)} идей, {len(content_events._EVENTS)} событий, "
          f"{len(NEW_TAGS)} новых стран, {len(CC.COSMETIC)} косметических тегов, {len(CC.PORTRAITS)} портретов")


if __name__ == "__main__":
    main()
