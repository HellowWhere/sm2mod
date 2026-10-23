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
import nations as N  # noqa: E402
from content_common import country_names  # noqa: E402

VERSION = "1.0.0"


# --------------------------------------------------------------- решения
def decisions():
    G = "cp77_decisions"
    cats = {
        "cp77_gangs_category": ("Банды Найт-Сити", "Каждая банда города чего-то хочет. Обычно — денег. Иногда — крови.", "tag = ZNC", "swords"),
        "cp77_relic_category": ("Биочип «Relic»", "Чип в голове лидера убивает носителя. Найдите выход, пока не поздно.\n\nТекущий уровень киберпсихоза в городе: [?cp77_cyberpsychosis]", "tag = ZNC", "chip"),
        "cp77_netrunning_category": ("Нетраннинг", "Взлом чужих сетей — оружие XXI века.", "always = yes", "net"),
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
         "country_exists = ZJP\nNOT = { has_war_with = ZJP }", 31),
        ("cp77_relic_star", "Уехать с Панам", "Кочевники знают нетраннера в Пустошах, который может помочь.", "wheel", 75,
         "OR = { has_idea = cp77_nomad_clans has_idea = cp77_nation_on_wheels has_completed_focus = ZNC_nomad_pact }", 32),
        ("cp77_relic_sun", "Штурм с Роуг", "Ворваться в Арасака-тауэр, добраться до Микоси и выбить ответы силой.", "spade", 75,
         "OR = { has_idea = cp77_afterlife_mercs has_completed_focus = ZNC_mercenary_city }", 33),
        ("cp77_relic_temperance", "Отдать тело Джонни", "Пусть Джонни живёт. Ви уйдёт за Заслон с Альт.", "guitar", 50,
         "always = yes", 34),
        ("cp77_relic_tower", "Сделка с Соломоном Ридом", "FIA обещает операцию. Нужно только немного поработать на НСША.", "star", 100,
         "country_exists = ZNU\nNOT = { has_war_with = ZNU }", 35),
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

    # --- собственные решения каждой державы
    extra = [
        dict(tag="ZNU", name="Новые Соединённые Штаты", decisions=[
            ("militech_order", "Оборонный заказ Милитеху", "Ещё один завод — ещё один контракт.", "militech", 75,
             "capital_scope = { add_extra_state_shared_building_slots = 1 add_building_construction = { type = arms_factory level = 1 instant_build = yes } }", 365),
            ("fia_op", "Операция FIA", "Тихая операция против соперника.", "eye", 50,
             "random_other_country = { limit = { is_major = yes } add_stability = -0.03 add_political_power = -30 }", 180),
            ("myers_address", "Обращение Майерс к нации", "Президент говорит — нация слушает.", "star", 25, "add_war_support = 0.04\nadd_stability = 0.02", 150)]),
        dict(tag="ZJP", name="Арасака", decisions=[
            ("saburo_audience", "Аудиенция у Сабуро", "Старик принимает просителей. Раз в год.", "crown", 25, "add_stability = 0.04", 150),
            ("nc_expansion", "Расширение в Найт-Сити", "Арасака-тауэр будет выше всех.", "tower", 75, "add_state_claim = 378\nadd_political_power = 50", 0),
            ("soulkiller_test", "Испытание Soulkiller", "Ещё одна душа в Микоси. Во имя науки.", "skull", 50,
             "add_tech_bonus = { name = cp77_zjp_soulkiller_test bonus = 0.75 uses = 1 category = electronics }", 180)]),
        dict(tag="ZFT", name="Свободный штат Техас", decisions=[
            ("cattle_drive", "Перегон кибер-скота", "Коровы с GPS-ошейниками идут на рынок.", "wheel", 0, "add_political_power = 40", 120),
            ("oil_boom", "Нефтяной бум", "Новая скважина в пустыне.", "flame", 50, "random_owned_state = { add_resource = { type = oil amount = 6 } }", 0),
            ("mech_rodeo", "Родео на мехах", "Самое техасское зрелище в мире.", "mech", 30, "add_stability = 0.04\nadd_war_support = 0.02", 150)]),
        dict(tag="ZFP", name="Свободные Штаты Северо-Запада", decisions=[
            ("forest_tax", "Налог на ГМО-лес", "Деревья растут — налоги растут.", "tree", 0, "add_political_power = 40", 120),
            ("volunteers", "Каскадские добровольцы", "Лесорубы берутся за винтовки.", "fist", 30, "add_manpower = 8000", 180),
            ("bigfoot_sighting", "Наблюдение снежного человека", "Его снова видели. Туристы в восторге.", "bigfoot", 10,
             "random_list = { 70 = { add_stability = 0.03 } 30 = { add_political_power = 50 } }", 120)]),
        dict(tag="ZBL", name="Нация кочевников", decisions=[
            ("raid_convoy", "Ограбить конвой Милитеха", "Грузовики Милитеха идут через пустыню. Без охраны. Почти.", "target", 30,
             "add_equipment_to_stockpile = { type = infantry_equipment_1 amount = 1500 }", 120),
            ("clan_moot", "Собрание кланов", "Костёр, споры и общее решение.", "handshake", 25, "add_stability = 0.05", 150),
            ("fuel_run", "Бензиновый забег", "Доставить топливо через Пустоши.", "wheel", 0, "add_political_power = 40", 120)]),
    ]
    out_extra_cats = []
    for n in list(N.NATIONS.values()) + extra:
        cat, allowed, blocks = N.decisions_for(n)
        out_extra_cats.append(f"{cat} = {{\n\ticon = cp77_flag\n\tallowed = {{ {allowed} }}\n}}")
        CC.ICON_USES.add(("category", "flag"))
        for icon, b in blocks:
            CC.ICON_USES.add(("decision", icon))
            D.setdefault(cat, []).append(b)
    with open(os.path.join(MOD_DIR, "common/decisions/categories/cp77_decision_categories.txt"), "a", encoding="utf-8") as fh:
        fh.write("\n" + "\n\n".join(out_extra_cats) + "\n")

    text = "\n\n".join(f"{cat} = {{\n" + "\n\n".join(indent(d, 1) for d in ds) + "\n}" for cat, ds in D.items())
    write("common/decisions/cp77_decisions.txt", text + "\n")


# ------------------------------------------------------ настройка мира 2077
TECHS = ("infantry_weapons infantry_weapons1 infantry_weapons2 tech_support tech_engineers tech_recon "
         "motorised_infantry gw_artillery interwar_artillery electronic_mechanical_engineering radio basic_machine_tools early_fighter").split()


def set_tech():
    return "set_technology = {\n" + "\n".join(f"\t{t} = 1" for t in TECHS) + "\n}"


def template(name, n, reg="infantry", sup=("engineer", "recon")):
    regs = " ".join(f"{reg} = {{ x = {i // 3} y = {i % 3} }}" for i in range(n))
    sups = " ".join(f"{s} = {{ x = 0 y = {i} }}" for i, s in enumerate(sup))
    return f'division_template = {{\n\tname = "{name}"\n\tregiments = {{ {regs} }}\n\tsupport = {{ {sups} }}\n}}'


# Армии, появляющиеся при старте партии: тег -> [(шаблон, полков, тип, поддержка, имя дивизии, число)]
ARMIES = {
    "ZNC": [("Соло-наёмники", 6, "infantry", ("engineer", "recon"), "Соло-дивизия", 4),
            ("Хромированные банды", 4, "infantry", (), "Бригада банд", 4),
            ("Бронетакси", 4, "motorized", ("recon",), "Таксомоторный полк", 2)],
    "ZFT": [("Техасские рейнджеры", 6, "infantry", ("engineer",), "Рейнджеры", 6)],
    "ZFP": [("Каскадская гвардия", 6, "infantry", ("engineer",), "Гвардия", 6)],
    "ZBL": [("Кочевой караван", 4, "motorized", ("recon",), "Караван", 5)],
    "ZNU": [("Армия НСША", 9, "infantry", ("engineer", "recon"), "Пехотная дивизия НСША", 18),
            ("Мотопехота Милитеха", 6, "motorized", ("recon",), "Дивизия Милитеха", 6)],
    "ZJP": [("Силы безопасности Арасаки", 9, "infantry", ("engineer", "recon"), "Дивизия Арасаки", 16),
            ("Мобильный отряд Арасаки", 6, "motorized", ("recon",), "Мобильный отряд", 4)],
}
for _t, _n in N.NATIONS.items():
    _name, _cnt = _n["units"]
    ARMIES[_t] = [(_name, 9, "infantry", ("engineer", "recon"), _name, _cnt),
                  ("Мобильный корпус", 6, "motorized", ("recon",), "Мобильный корпус", max(2, _cnt // 4))]

ALL_TAGS = ["ZNC", "ZFT", "ZFP", "ZBL", "ZNU", "ZJP"] + list(N.NATIONS)

# ---- распределение мира: первые совпавшие правила побеждают
# (цель, условие в области штата). Ванильные теги используются только как «география».
RULES = [
    ("ZNC", "state = 378"),
    ("ZFT", "OR = { state = 375 state = 376 }"),
    ("ZBL", "OR = { state = 379 state = 377 }"),
    ("ZFP", "OR = { state = 385 state = 386 state = 380 state = 381 state = 382 state = 387 state = 388 }"),
    ("ZNU", "is_owned_by = USA"),
    ("ZCA", "is_owned_by = CAN"),
    ("ZMX", "is_owned_by = MEX"),
    ("ZCM", "OR = { is_owned_by = GUA is_owned_by = HON is_owned_by = ELS is_owned_by = NIC is_owned_by = COS is_owned_by = PAN is_owned_by = CUB is_owned_by = HAI is_owned_by = DOM }"),
    ("ZBR", "is_owned_by = BRA"),
    ("ZSC", "OR = { is_owned_by = ARG is_owned_by = CHL is_owned_by = URG is_owned_by = PAR }"),
    ("ZAD", "OR = { is_owned_by = COL is_owned_by = VEN is_owned_by = ECU is_owned_by = PRU is_owned_by = BOL }"),
    ("ZUK", "OR = { is_owned_by = IRE AND = { is_owned_by = ENG is_on_continent = europe } }"),
    ("ZSV", "OR = { is_owned_by = SOV is_owned_by = EST is_owned_by = LAT is_owned_by = LIT is_owned_by = MON is_owned_by = TAN }"),
    ("ZEE", "OR = { is_owned_by = POL is_owned_by = CZE is_owned_by = HUN is_owned_by = ROM is_owned_by = YUG is_owned_by = BUL is_owned_by = ALB is_owned_by = GRE AND = { is_owned_by = TUR is_on_continent = europe } }"),
    ("ZJP", "is_owned_by = JAP"),
    ("ZCH", "OR = { is_owned_by = CHI is_owned_by = PRC is_owned_by = GXC is_owned_by = YUN is_owned_by = SHX is_owned_by = XSM is_owned_by = SIK is_owned_by = MAN is_owned_by = MEN is_owned_by = TIB }"),
    ("ZIN", "OR = { is_owned_by = RAJ is_owned_by = NEP is_owned_by = BHU }"),
    ("ZAU", "OR = { is_owned_by = AST is_owned_by = NZL is_on_continent = australia }"),
    ("ZAF", "OR = { is_owned_by = SAF AND = { is_on_continent = africa OR = { is_owned_by = ENG is_owned_by = POR is_owned_by = BEL } } }"),
    ("ZME", "OR = { is_owned_by = TUR is_owned_by = PER is_owned_by = IRQ is_owned_by = SAU is_owned_by = YEM is_owned_by = OMN is_owned_by = AFG is_on_continent = middle_east }"),
    ("ZSH", "is_on_continent = africa"),
    ("ZEU", "is_on_continent = europe"),
    ("ZCM", "is_on_continent = north_america"),
    ("ZAD", "is_on_continent = south_america"),
    ("ZSE", "always = yes"),
]
# столица ванильного «донора» передаётся первой, чтобы стать столицей новой державы
CAPITAL_DONORS = {"ZNU": "USA", "ZCA": "CAN", "ZMX": "MEX", "ZCM": "PAN", "ZBR": "BRA", "ZSC": "ARG", "ZAD": "COL",
                  "ZUK": "ENG", "ZEU": "FRA", "ZEE": "POL", "ZSV": "SOV", "ZME": "TUR", "ZAF": "SAF", "ZSH": "EGY",
                  "ZCH": "CHI", "ZJP": "JAP", "ZIN": "RAJ", "ZSE": "SIA", "ZAU": "AST"}
KNOWN_CAPITALS = {"ZNC": 378, "ZFT": 375, "ZFP": 386, "ZBL": 379, "ZEU": 16, "ZUK": 126, "ZSV": 219, "ZJP": 282,
                  "ZSE": 336}
# ванильные теги, чьи ядра надо стереть, чтобы старые страны нельзя было освободить
VANILLA_TAGS = ("USA CAN MEX GUA HON ELS NIC COS PAN CUB HAI DOM BRA ARG CHL URG PAR COL VEN ECU PRU BOL "
                "ENG IRE SCO WLS SOV EST LAT LIT MON TAN POL CZE SLO HUN ROM YUG CRO SER MNT BUL ALB GRE "
                "FRA GER ITA BEL HOL LUX SWI AUS DEN NOR SWE FIN ICE SPR SPA POR TUR PER IRQ SAU YEM OMN AFG "
                "EGY ETH LIB SAF JAP KOR MAN CHI PRC GXC YUN SHX XSM SIK MEN TIB RAJ NEP BHU SIA PHI AST NZL "
                "UKR BLR GEO ARM AZR KAZ UZB TMS KYR TAJ PAK INS MAL VIN CAM LAO PAL ISR LEB SYR JOR MOR ALG TUN LBA SUD").split()


def scripted_triggers():
    write("common/scripted_triggers/cp77_triggers.txt",
          "cp77_is_cp_tag = {\n\tOR = {\n" + "\n".join(f"\t\ttag = {t}" for t in ALL_TAGS) + "\n\t}\n}\n")


def scripted_effects():
    # 1. столицы доноров
    caps = []
    for tag, donor in CAPITAL_DONORS.items():
        caps.append(f"{donor} = {{\n\tif = {{\n\t\tlimit = {{ exists = yes NOT = {{ cp77_is_cp_tag = yes }} }}\n"
                    f"\t\tcapital_scope = {{ {tag} = {{ transfer_state = PREV }} }}\n\t}}\n}}")
    # 2. все остальные штаты по правилам
    branches = []
    for i, (tag, cond) in enumerate(RULES):
        kw = "if" if i == 0 else "else_if"
        if cond == "always = yes":
            branches.append(f"else = {{ {tag} = {{ transfer_state = PREV }} }}")
        else:
            branches.append(f"{kw} = {{\n\tlimit = {{ {cond} }}\n\t{tag} = {{ transfer_state = PREV }}\n}}")
    rules = ("every_country = {\n\tlimit = { NOT = { cp77_is_cp_tag = yes } }\n\tevery_owned_state = {\n"
             + indent("\n".join(branches), 2) + "\n\t}\n}")
    # 3. ядра: старые стираем, новые ставим
    cores = "\n".join(f"{t} = {{ every_core_state = {{ remove_core_of = PREV }} }}" for t in VANILLA_TAGS)
    cores += "\nevery_country = {\n\tlimit = { cp77_is_cp_tag = yes }\n\tevery_owned_state = { add_core_of = PREV }\n}"
    capitals = "\n".join(f"{t} = {{ if = {{ limit = {{ owns_state = {s} }} set_capital = {{ state = {s} }} }} }}" for t, s in KNOWN_CAPITALS.items())
    setup = ("# Перекраивает мир 2077 года. Идемпотентно: трогает только штаты ванильных стран,\n"
             "# поэтому вызывается из истории стран, из закладки и из on_startup без вреда.\n"
             "cp77_setup_world = {\n" + indent("\n".join(caps), 1) + "\n" + indent(rules, 1) + "\n"
             + indent(cores, 1) + "\n" + indent(capitals, 1) + "\n}\n")

    spawn = []
    for tag, armies in ARMIES.items():
        body = []
        for tname, n, reg, sup, dname, cnt in armies:
            body.append(template(tname, n, reg, sup))
        units = []
        for tname, n, reg, sup, dname, cnt in armies:
            units.append(f'create_unit = {{\n\tdivision = "name = \\"{dname}\\" division_template = \\"{tname}\\" start_experience_factor = 0.4 start_equipment_factor = 1.0"\n'
                         f"\towner = {tag}\n\tcount = {cnt}\n}}")
        body.append("add_equipment_to_stockpile = { type = infantry_equipment_1 amount = 3000 }\n"
                    "add_equipment_to_stockpile = { type = support_equipment_1 amount = 300 }\n"
                    "add_equipment_to_stockpile = { type = motorized_equipment_1 amount = 500 }\n"
                    "add_manpower = 30000")
        body.append("capital_scope = {\n" + indent("\n".join(units), 1) + "\n}")
        spawn.append(f"{tag} = {{\n\tif = {{\n\t\tlimit = {{ exists = yes }}\n" + indent("\n".join(body), 2) + "\n\t}\n}")
    spawn_txt = ("cp77_spawn_armies = {\n\tif = {\n\t\tlimit = { NOT = { has_global_flag = cp77_armies_ready } }\n\t\tset_global_flag = cp77_armies_ready\n"
                 + indent("\n".join(spawn), 2) + "\n\t}\n}\n")
    diplomacy = ("cp77_start_diplomacy = {\n\tif = {\n\t\tlimit = { NOT = { has_global_flag = cp77_diplomacy_ready } }\n\t\tset_global_flag = cp77_diplomacy_ready\n"
                 "\t\tZNC = { set_variable = { cp77_cyberpsychosis = 20 } }\n"
                 "\t\tif = { limit = { ZNU = { exists = yes } ZCM = { exists = yes } } ZNU = { puppet = ZCM } }\n"
                 "\t\tevery_country = {\n\t\t\tlimit = { cp77_is_cp_tag = yes NOT = { tag = ZNU } }\n"
                 "\t\t\tevery_owned_state = { limit = { is_core_of = ZNU } ZNU = { add_state_claim = PREV } }\n\t\t}\n"
                 "\t}\n}\n")
    write("common/scripted_effects/cp77_scripted_effects.txt", setup + "\n" + spawn_txt + "\n" + diplomacy)

    write("common/on_actions/cp77_on_actions.txt",
          "on_actions = {\n\ton_startup = {\n\t\teffect = {\n"
          "\t\t\tcp77_setup_world = yes\n\t\t\tcp77_start_diplomacy = yes\n\t\t\tcp77_spawn_armies = yes\n"
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
    "ZNU": dict(capital=None, party="democratic", pops=dict(democratic=45, fascism=30, communism=5, neutrality=20),
                stab=0.6, ws=0.55, ideas="cp77_nusa_federal cp77_militech_state",
                leader=("Розалинд Майерс", "USA_myers_desc",
                        "Президент НСША, бывшая глава Милитеха. Железная воля, стальные нервы и, по слухам, титановый позвоночник.",
                        "myers", "blue", "conservatism"),
                parties={"democratic": ("Федералисты", "Федеральная партия Майерс")}),
    "ZJP": dict(capital=282, party="fascism", pops=dict(democratic=10, fascism=60, communism=5, neutrality=25),
                stab=0.7, ws=0.5, ideas="cp77_arasaka_empire",
                leader=("Сабуро Арасака", "JAP_saburo_desc",
                        "Основатель и глава корпорации Арасака. 158 лет, из них 100 — у власти. Тело — почти полностью кибернетическое.",
                        "saburo", "red", "fascism_ideology"),
                parties={"fascism": ("Арасака", "Совет директоров корпорации Арасака")},
                extra="create_corps_commander = {\n\tname = \"Горо Такэмура\"\n\tpicture = \"gfx/leaders/cp77/takemura.dds\"\n\ttraits = { }\n\tskill = 4\n\tattack_skill = 3\n\tdefense_skill = 4\n\tplanning_skill = 4\n\tlogistics_skill = 3\n}"),
}
# держава, в истории которой вызывается настройка мира: её тег и файл истории идут последними
SETUP_TAG = "ZUK"


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
        capital = f"capital = {h['capital']}\n\n" if h["capital"] else ""
        write(f"history/countries/{tag} - {d['file']}.txt",
              f"{capital}set_research_slots = 3\nset_stability = {h['stab']}\nset_war_support = {h['ws']}\nset_convoys = 50\n\n"
              f"{set_tech()}\n\nset_politics = {{\n\truling_party = {h['party']}\n\tlast_election = \"2076.11.3\"\n\telection_frequency = 48\n\telections_allowed = no\n}}\n"
              f"set_popularities = {{ {pops} }}\n\nadd_ideas = {{ {h['ideas']} }}\n\n"
              + leader(ln, ld, ldesc, lp, lc, lide) + "\n" + (h.get("extra", "") + "\n" if h.get("extra") else ""))
    for tag, n in sorted(N.NATIONS.items(), key=lambda kv: kv[0] == SETUP_TAG):
        tags.append(f'{tag} = "countries/{n["file"]}.txt"')
        r, g, b = n["color"]
        gfx = "asian" if tag in ("ZCH", "ZIN", "ZSE") else "african" if tag in ("ZAF", "ZSH") else \
            "middle_eastern" if tag == "ZME" else "south_american" if tag in ("ZBR", "ZAD", "ZSC", "ZMX", "ZCM") else \
            "eastern_european" if tag in ("ZSV", "ZEE") else "commonwealth" if tag in ("ZAU", "ZCA", "ZUK") else "western_european"
        write(f"common/countries/{n['file']}.txt",
              f"graphical_culture = {gfx}_gfx\ngraphical_culture_2d = {gfx}_2d\n\ncolor = {{ {r} {g} {b} }}\n")
        country_names(tag, n["name"], n["adj"], n["name"], n["flag"])
        hist = N.build_history(n, set_tech())
        if tag == SETUP_TAG:
            hist += ("\n# Последняя загружаемая история: к этому моменту у всех ванильных стран уже есть столицы,\n"
                     "# поэтому мир перекраивается здесь — до экрана выбора страны.\ncp77_setup_world = yes\n")
        write(f"history/countries/{tag} - {n['file']}.txt", hist)
    portrait("takemura", "red", initials="GT")
    portrait("blackhand", "cyan", initials="MB")
    portrait("smasher", "red", kind="machine", initials="AS")
    write("common/country_tags/cp77_countries.txt", "\n".join(tags) + "\n")


def generic_tree():
    """Дерево по умолчанию — для стран, появившихся в гражданских войнах."""
    T = Tree("cp77_generic_tree", "cp77_focus_generic", "country = {\n\tfactor = 1\n}", default="yes")
    a = T.add
    a("CP77_GEN_new_order", 2, 0, "flag", "Новый порядок", "Страна родилась в огне гражданской войны. Нужно выжить.", "add_political_power = 100\nadd_stability = 0.1")
    a("CP77_GEN_mercs", 1, 1, "spade", "Нанять наёмников", "Соло всегда готовы работать на новое правительство.", "army_experience = 30\nadd_manpower = 20000", prereq=["CP77_GEN_new_order"])
    a("CP77_GEN_corp_loans", 3, 1, "yen", "Корпоративные кредиты", "Корпорации дают деньги под чудовищный процент.", "capital_scope = {\n\tadd_extra_state_shared_building_slots = 2\n\tadd_building_construction = { type = industrial_complex level = 2 instant_build = yes }\n}", prereq=["CP77_GEN_new_order"])
    a("CP77_GEN_arms", 1, 2, "gear", "Свои арсеналы", "Оружие нужно производить самим.", "capital_scope = {\n\tadd_extra_state_shared_building_slots = 2\n\tadd_building_construction = { type = arms_factory level = 2 instant_build = yes }\n}", prereq=["CP77_GEN_mercs"])
    a("CP77_GEN_netrunners", 3, 2, "net", "Свои нетраннеры", "Без защиты в Сети государство не выживет.", "add_research_slot = 1", prereq=["CP77_GEN_corp_loans"])
    a("CP77_GEN_survive", 2, 3, "star", "Выжить в 2077", "Мы выстояли. Теперь мир должен считаться с нами.", "add_stability = 0.1\nadd_war_support = 0.1", prereq=["CP77_GEN_arms", "CP77_GEN_netrunners"])
    return T


def bookmark():
    G = "cp77_bookmark"
    loc(G, "CP77_BOOKMARK", "2077: Город мечты")
    loc(G, "CP77_BOOKMARK_DESC", "2077 год. Мир поделён между мегакорпорациями, обломками старых держав, кочевниками и ИИ за Чёрным Заслоном. Кем станете вы — легендой или удобрением?")
    entries = {
        "ZNC": ("neutrality", "cp77_city_of_dreams cp77_gang_wars cp77_corpo_plaza", "ZNC_corpo_council ZNC_burn_corpo ZNC_delamain",
                "Свободный город на западном побережье. Семь политических путей: от корпоративной префектуры Арасаки до президента-такси и вендократии торгового автомата Брендана."),
        "ZNU": ("democratic", "cp77_nusa_federal cp77_militech_state", "CP77_USA_unification_war_ii CP77_USA_save_songbird CP77_USA_myers_forever",
                "Президент Розалинд Майерс собирает расколотую Америку. Вторая война за объединение, Догтаун, Сойка и Луна — или вечная энграмма Майерс."),
        "ZJP": ("fascism", "cp77_arasaka_empire", "CP77_JAP_yorinobu_coup CP77_JAP_saburo_eternal CP77_JAP_digital_emperor",
                "Корпоративная Япония Арасаки. Ёринобу против отца, Ханако против брата, Микоси против всего человечества."),
    }
    majors = ["ZCH", "ZSV", "ZEU"]
    for t in majors:
        n = N.NATIONS[t]
        entries[t] = (n["party"], " ".join(i[0] for i in n["ideas"]), f"{t}_p0_0 {t}_p1_0 {t}_p2_0", n["root"][2])
    minors = {
        "ZFT": ("neutrality", "cp77_free_state", "CP77_ZFT_corn_kingdom", "Свободный штат Техас: нефть, кукуруза CHOOH2 и, возможно, Кукурузный император."),
        "ZBL": ("neutrality", "cp77_free_state", "CP77_ZBL_nomad_horde", "Кочевники Пустошей: семьи на колёсах, Василиски и Великая орда."),
        "ZFP": ("democratic", "cp77_free_state", "CP77_ZFP_druid_ai", "Свободные Штаты Северо-Запада: леса Биотехники, снежный человек-министр и ИИ-друид."),
    }
    for t, n in N.NATIONS.items():
        if t not in majors:
            minors[t] = (n["party"], " ".join(i[0] for i in n["ideas"]), f"{t}_p0_0 {t}_p2_0", n["root"][2])
    lines = ["bookmarks = {", "\tbookmark = {", '\t\tname = "CP77_BOOKMARK"', '\t\tdesc = "CP77_BOOKMARK_DESC"',
             "\t\tdate = 2077.1.1.12", '\t\tpicture = "GFX_select_date_1936"', '\t\tdefault_country = "ZNC"', "\t\tdefault = yes"]

    def entry(tag, v):
        ide, ideas, focuses, desc = v
        loc(G, f"CP77_{tag}_BM", desc)
        return (f'\t\t{tag} = {{\n\t\t\thistory = "CP77_{tag}_BM"\n\t\t\tideology = {ide}\n'
                f"\t\t\tideas = {{ {ideas} }}\n\t\t\tfocuses = {{ {focuses} }}\n\t\t}}")
    for t, v in entries.items():
        lines.append(entry(t, v))
    loc(G, "CP77_OTHERS_BM", "Свободные штаты, Британия, Индия, Бразилия, Пустоши Ближнего Востока и все остальные державы 2077 года.")
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

    def country_block(tag):
        return f"country = {{\n\tfactor = 0\n\tmodifier = {{ add = 100 tag = {tag} }}\n}}"
    trees = {
        "night_city": tree_night_city.build(Tree("cp77_night_city_tree", "", country_block("ZNC"))),
        "nusa": tree_others.build_usa(Tree("cp77_nusa_tree", "", country_block("ZNU"))),
        "arasaka": tree_others.build_jap(Tree("cp77_arasaka_tree", "", country_block("ZJP"))),
    }
    for tag in ("ZFT", "ZFP", "ZBL"):
        trees[tag.lower()] = tree_others.build_free_states(Tree(f"cp77_{tag.lower()}_tree", "", country_block(tag)), tag)
    for tag, n in N.NATIONS.items():
        trees[tag.lower()] = N.build_tree(n)
    trees["generic"] = generic_tree()
    for name, t in trees.items():
        write(f"common/national_focus/cp77_{name}.txt", t.render())
    trees = list(trees.values())

    loc("cp77_tooltips", "cp77_pacific_league", "Тихоокеанская лига")
    loc("cp77_tooltips", "cp77_free_states_union", "Союз Свободных штатов")

    write("events/cp77_events.txt", content_events.build())
    decisions()
    scripted_triggers()
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
                  'name="Cyberpunk 2077: Night City Wars"\nsupported_version="1.*"\n'
                  'replace_path="common/bookmarks"\nreplace_path="common/national_focus"\n')
    write("descriptor.mod", descriptor)
    with open(os.path.join(os.path.dirname(MOD_DIR), "cyberpunk2077.mod"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(descriptor + 'path="mod/cyberpunk2077"\n')

    graphics(trees, content_events.EVENT_PICS)
    write_localisation()
    validate()

    n_focus = sum(len(t.focuses) for t in trees)
    print(f"OK: {n_focus} фокусов, {len(IDEAS)} идей, {len(content_events._EVENTS)} событий, "
          f"{len(NEW_TAGS) + len(N.NATIONS)} держав, {len(CC.COSMETIC)} косметических тегов, {len(CC.PORTRAITS)} портретов")


if __name__ == "__main__":
    main()
