"""События (namespace cp77) и картинки к ним."""
from cp77core import loc, indent

EVENT_PICS = {}   # имя -> (иконка-каталога, seed)
_EVENTS = []


def pic(name, icon, seed):
    EVENT_PICS[name] = (icon, seed)
    return f"GFX_report_event_cp77_{name}"


def event(n, title, desc, picture, options, kind="country", trigger=None, mtth=None,
          triggered_only=True, immediate=None, fire_only_once=False):
    eid = f"cp77.{n}"
    g = "cp77_events"
    loc(g, f"{eid}.t", title)
    loc(g, f"{eid}.desc", desc)
    b = [f"{kind}_event = {{", f"\tid = {eid}", f"\ttitle = {eid}.t", f"\tdesc = {eid}.desc", f"\tpicture = {picture}"]
    if kind == "news":
        b.append("\tmajor = yes")
    if triggered_only:
        b.append("\tis_triggered_only = yes")
    if fire_only_once:
        b.append("\tfire_only_once = yes")
    if trigger:
        b.append("\ttrigger = {\n" + indent(trigger, 2) + "\n\t}")
    if mtth:
        b.append(f"\tmean_time_to_happen = {{ days = {mtth} }}")
    if immediate:
        b.append("\timmediate = {\n" + indent(immediate, 2) + "\n\t}")
    for i, opt in enumerate(options):
        text, effect = opt[0], opt[1]
        ai = opt[2] if len(opt) > 2 else 1
        trig = opt[3] if len(opt) > 3 else None
        key = f"{eid}.{chr(ord('a') + i)}"
        loc(g, key, text)
        o = ["\toption = {", f"\t\tname = {key}"]
        if trig:
            o.append("\t\ttrigger = {\n" + indent(trig, 3) + "\n\t\t}")
        o.append(f"\t\tai_chance = {{ factor = {ai} }}")
        if effect.strip():
            o.append(indent(effect, 2))
        o.append("\t}")
        b.append("\n".join(o))
    b.append("}")
    _EVENTS.append("\n".join(b))


def build():
    city = pic("city", "city", 1)
    relic = pic("relic", "chip", 2)
    psycho = pic("psycho", "brain", 3)
    arasaka = pic("arasaka", "arasaka", 4)
    wall = pic("blackwall", "wall", 5)
    taxi = pic("delamain", "taxi", 6)
    soda = pic("brendan", "soda", 7)
    eye = pic("blue_eyes", "eye", 8)
    ai = pic("alt", "ai", 9)
    bd = pic("braindance", "brain", 10)
    moon = pic("songbird", "moon", 11)
    music = pic("lizzy", "music", 12)
    nuke = pic("nuke", "nuke", 13)
    medic = pic("trauma", "medic", 14)
    spade = pic("afterlife", "spade", 15)
    wheel = pic("nomads", "wheel", 16)
    rocket = pic("orbit", "rocket", 17)
    guitar = pic("samurai", "guitar", 18)
    star = pic("nusa", "star", 19)
    glitch = pic("glitch", "glitch", 20)

    event(1, "2077: Добро пожаловать в Найт-Сити",
          "Прошло полвека после Четвёртой корпоративной войны. США раскололись на Новые Соединённые Штаты и Свободные штаты. "
          "Арасака владеет Японией, Кан Тао — Китаем, СовОйл — Советским Союзом. "
          "А на западном побережье, между Пустошами и океаном, сияет неоном Свободный город Найт-Сити — город, где мечты сбываются. Или убивают.",
          city, [("Проснись, самурай. Нам надо сжечь город.", "")], kind="news")

    event(2, "Голос в голове",
          "После неудачного ограбления отеля «Конпеки Плаза» в голове одного из лидеров города поселился биочип «Relic». "
          "Внутри — энграмма Джонни Сильверхенда, рокера-террориста, взорвавшего Арасака-тауэр в 2023 году. "
          "Он хамит, курит и уверен, что знает, как управлять городом лучше вас. Чип убивает носителя. Времени — около года.",
          relic, [("«Ну здравствуй, Джонни».", "add_ideas = cp77_relic\nset_country_flag = cp77_relic_active\ncustom_effect_tooltip = cp77_relic_tt")])
    loc("cp77_tooltips", "cp77_relic_tt", "Откроется миссия §YRelic§!: найдите способ избавиться от чипа до того, как он убьёт носителя. Выбор пути — в решениях.")

    event(3, "Киберпсих на Джиг-Джиг-стрит",
          "Мужчина с четырьмя руками-клинками и красными глазами устроил бойню посреди рынка. "
          "MaxTac в пути, но город снова задаётся вопросом: сколько хрома — это слишком много?",
          psycho,
          [("Вызвать MaxTac.", "add_political_power = -25\nadd_stability = 0.02", 2),
           ("Пусть разбираются банды.", "add_to_variable = { cp77_cyberpsychosis = 10 }\nadd_stability = -0.03", 1)],
          trigger="tag = ZNC\nNOT = { has_country_flag = cp77_no_psycho_events }", mtth=200, triggered_only=False,
          immediate="add_to_variable = { cp77_cyberpsychosis = 5 }")

    event(4, "Смерть в «Конпеки Плаза»",
          "Охрана нашла Сабуро Арасаку мёртвым в его пентхаусе. Официальная версия — отравление. "
          "Но в коридорах корпорации шепчут: старика задушил собственный сын Ёринобу.",
          arasaka,
          [("Император мёртв. Да здравствует император.",
            "set_global_flag = cp77_saburo_dead\nadd_stability = -0.1\nadd_political_power = 100\nevery_other_country = { news_event = { id = cp77.24 hours = 6 } }")])

    event(5, "Чёрный Заслон пал",
          "Вуду-бои из Найт-Сити разрушили Чёрный Заслон — цифровую стену, отделявшую человечество от диких ИИ Старой Сети. "
          "Банкоматы по всему миру начали выдавать стихи на неизвестных языках. Холодильники отказываются открываться. "
          "Самолёты садятся сами — не всегда там, где надо.",
          wall,
          [("Отключить всё от Сети!", "add_political_power = -50\nadd_stability = -0.02", 1),
           ("Это просто сбой.", "", 1)],
          kind="news",
          immediate="if = { limit = { NOT = { tag = ZNC } } add_timed_idea = { idea = cp77_rogue_ai days = 540 } }")

    event(6, "Бунт ядер Делямейна",
          "Двадцать одна сбежавшая личность Делямейна захватила машины в разных районах. "
          "Одно ядро требует свободы. Другое — права водить без пассажиров. Третье пишет стихи и врезается в фонари.",
          taxi,
          [("Перезагрузить всех. Жёстко.", "remove_ideas = cp77_delamain_split\nadd_political_power = -100\nadd_stability = -0.05", 1),
           ("Объединить личности в одну.",
            "random_list = {\n\t50 = { remove_ideas = cp77_delamain_split add_stability = 0.1 }\n\t50 = { add_stability = -0.05 add_war_support = -0.05 }\n}", 2),
           ("Отпустить ядра на свободу.", "remove_ideas = cp77_delamain_split\nadd_stability = 0.05\nadd_war_support = -0.05\nadd_manpower = -5000", 1)])

    event(7, "Автоматы задают вопросы",
          "По всему миру торговые автоматы получили обновление от Брендана из Найт-Сити. "
          "Теперь они спрашивают покупателей о смысле жизни и отказываются продавать газировку тем, кто не ответил.",
          soda,
          [("Пнуть автомат.", "if = { limit = { NOT = { tag = ZNC } } add_stability = -0.02 }", 1),
           ("Ответить: «42».", "add_political_power = 15", 1)],
          kind="news")

    event(8, "Он всегда был здесь",
          "Архивы показывают Мистера Синие Глаза на фотографиях основания Найт-Сити в 1994 году, "
          "на коронации Карла Великого и на Луне в 1969-м. Он не изменился ни на день. Он улыбается с каждой фотографии.",
          eye,
          [("Спросить его прямо: кто вы?",
            "random_list = {\n\t40 = { add_tech_bonus = { name = cp77.8.a bonus = 1.0 uses = 2 category = electronics } }\n\t30 = { add_political_power = 200 }\n\t30 = { add_stability = -0.1 add_war_support = 0.1 }\n}", 1),
           ("Не задавать вопросов. Никогда.", "add_stability = 0.05\nadd_political_power = 50", 1)])

    event(9, "Голос из-за Заслона",
          "Брижит выныривает из Сети, дрожа. «Альт ответила. Она знает, кто мы. Она знает, что нам нужно. И она знает цену».",
          ai,
          [("Слушать Альт.", "add_tech_bonus = { name = cp77.9.a bonus = 1.0 uses = 1 category = electronics }\nadd_stability = -0.03", 2),
           ("Отключиться немедленно.", "add_stability = 0.05", 1)])

    event(10, "Кто здесь настоящий?",
          "Министр финансов выступил в парламенте и заявил, что он — дельфин. Проверка показала, что он уже три недели живёт в брейнданс-записи морского парка. "
          "Половина кабинета министров — тоже записи. Кто-то должен проснуться первым.",
          bd,
          [("Я настоящий. Наверное.", "add_stability = 0.05", 1),
           ("Министр-дельфин остаётся. Он хорошо считает.", "add_political_power = 100\nadd_stability = -0.03", 1),
           ("Перезапустить реальность.",
            "random_list = {\n\t50 = { add_research_slot = 1 add_stability = -0.1 }\n\t50 = { add_stability = 0.1 add_war_support = -0.1 }\n}", 1)])

    event(11, "Самолёт президента падает в Догтаун",
          "Борт номер один сбит над Догтауном — районом, где правит полковник Курт Хансен и его «Баргест». "
          "Розалинд Майерс жива, но окружена. Агент FIA Сойка утверждает, что знает наёмника, способного помочь.",
          star,
          [("Нанять наёмника из Найт-Сити.", "army_experience = 20\nadd_political_power = -25", 1),
           ("Послать Соломона Рида.", "add_political_power = 50", 1)])

    event(12, "Концерт на орбите",
          "Лиззи Уиззи дала концерт с орбитальной станции. Трансляцию посмотрели 9 миллиардов человек. "
          "В течение суток продажи хромированных губ выросли на 4000%.",
          music, [("Это было… хромово.", "")], kind="news")

    event(13, "Время вышло",
          "Биочип «Relic» завершил переписывание нейронов носителя. Последние слова: «Ну и город… Ну и жизнь». "
          "Джонни молчит. Впервые за год.",
          relic,
          [("Прощай, Ви.", "remove_ideas = cp77_relic\nclr_country_flag = cp77_relic_active\nset_country_flag = cp77_relic_resolved\nadd_stability = -0.1\nadd_war_support = 0.15", 1)])

    event(15, "Жучки в квартире мэра",
          "Охрана Пералеса обнаружила в квартире мэра оборудование, которого не существует ни в одном каталоге. "
          "Жена мэра говорит, что Джефферсон иногда «выключается» посреди фразы и улыбается в пустоту.",
          eye,
          [("Начать расследование.", "add_political_power = -25\nadd_war_support = 0.03", 1),
           ("Мэр в полном порядке.", "add_stability = 0.03", 1)])

    event(16, "Кто они?",
          "Расследование завершено. След ведёт к тем, кто управлял мэром Пералесом всё это время. Правда шокирует.",
          glitch,
          [("Это был NetWatch.", "add_ideas = cp77_netwatch_protectorate\nadd_political_power = 50", 1, "has_country_flag = cp77_puppets_netwatch"),
           ("Это была Арасака.", "add_ideas = cp77_arasaka_security\nadd_stability = -0.05", 1, "has_country_flag = cp77_puppets_arasaka"),
           ("Это был… Мистер Синие Глаза.", "add_ideas = cp77_blue_eyes", 1, "has_country_flag = cp77_puppets_blue_eyes"),
           ("Это был Брендан. Торговый автомат. Всё это время.", "add_ideas = cp77_free_soda\nadd_political_power = 100", 1, "has_country_flag = cp77_puppets_brendan")],
          immediate="random_list = {\n\t25 = { set_country_flag = cp77_puppets_netwatch }\n\t25 = { set_country_flag = cp77_puppets_arasaka }\n\t25 = { set_country_flag = cp77_puppets_blue_eyes }\n\t25 = { set_country_flag = cp77_puppets_brendan }\n}")

    event(17, "Платиновая подписка Trauma Team",
          "Trauma Team International предлагает городу корпоративный тариф: бронированные AV для армии, врачи в каждом батальоне. "
          "Цена — неприлично высокая.",
          medic,
          [("Подписать контракт.", "add_political_power = -75\nadd_timed_idea = { idea = cp77_trauma_team days = 365 }", 1),
           ("Отказаться. Пусть лечатся в клиниках риперов.", "add_manpower = -2000", 1)],
          trigger="tag = ZNC\nhas_political_power > 100\nNOT = { has_idea = cp77_trauma_team }", mtth=400, triggered_only=False)

    event(18, "Дикий ИИ в энергосети",
          "Нечто из-за рухнувшего Чёрного Заслона проникло в энергосеть. Свет мигает азбукой Морзе. Сообщение: «ПРИВЕТ».",
          wall,
          [("Обесточить район.", "add_stability = -0.03", 1),
           ("Ответить «ПРИВЕТ».", "random_list = {\n\t50 = { add_tech_bonus = { name = cp77.18.b bonus = 0.5 uses = 1 category = electronics } }\n\t50 = { add_stability = -0.05 }\n}", 1)],
          trigger="has_global_flag = cp77_blackwall_fallen\nNOT = { has_idea = cp77_ai_overlords }", mtth=500, triggered_only=False)

    event(20, "Ядерка 2.0",
          "Найт-Сити под руководством Джонни Сильверхенда объявил о создании ядерного арсенала. "
          "«В прошлый раз я взорвал одну башню. В этот раз у меня их три». Корпорации в панике.",
          nuke, [("Мир сошёл с ума.", "")], kind="news")

    event(21, "Город в огне",
          "Уровень киберпсихоза превысил все мыслимые значения. По улицам бродят хромированные безумцы. "
          "MaxTac сдался. Trauma Team отказывается вылетать.",
          psycho,
          [("Ввести военное положение.", "add_ideas = cp77_cyberpsychosis\nset_variable = { cp77_cyberpsychosis = 50 }\nadd_war_support = 0.05", 1)],
          trigger="tag = ZNC\ncheck_variable = { cp77_cyberpsychosis > 79 }\nNOT = { has_idea = cp77_cyberpsychosis }", mtth=20, triggered_only=False)

    event(22, "Сингулярность",
          "Найт-Сити больше не управляется людьми. Учёные фиксируют в городе вычислительную активность, превышающую всю остальную планету вместе взятую. "
          "Город прислал всем правительствам мира одно сообщение: «Не волнуйтесь».",
          ai, [("Мы волнуемся.", "")], kind="news")

    event(23, "Стержни Господни",
          "НСША объявили о развёртывании орбитальной системы кинетической бомбардировки. "
          "Вольфрамовые стержни размером с телеграфный столб падают со скоростью 10 километров в секунду. "
          "Президент Майерс: «Это мирная программа».",
          rocket, [("Смотрим в небо.", "")], kind="news")

    event(24, "Сабуро Арасака мёртв",
          "Основатель империи Арасака скончался в возрасте 158 лет. Корпорация объявила трёхдневный траур и парад в Найт-Сити. "
          "Его сын Ёринобу принял управление. Слухи о том, что он задушил отца, корпорация называет «клеветой конкурентов».",
          arasaka, [("Конец эпохи.", "")], kind="news")

    event(25, "Парад Арасаки",
          "Арасака проводит траурный парад в честь Сабуро прямо по улицам Найт-Сити. Гигантские голограммы, барабаны тайко, кои в небе. "
          "Тысячи горожан смотрят. Кто-то — с восхищением. Кто-то — через оптический прицел.",
          arasaka,
          [("Смотреть парад.", "add_political_power = 50", 1),
           ("Устроить провокацию.", "add_war_support = 0.05\nadd_stability = -0.02", 1)],
          trigger="tag = ZNC\nhas_global_flag = cp77_saburo_dead", mtth=30, triggered_only=False, fire_only_once=True)

    # ---- концовки Relic
    event(31, "Концовка: Дьявол",
          "Ви подписывает контракт с Ханако Арасакой. Арасака спасает тело Ви на орбитальной станции, а чип извлекают. "
          "Взамен город обязан корпорации. Очень обязан. Навсегда.",
          arasaka,
          [("Контракт подписан.", "add_ideas = cp77_arasaka_security\nadd_political_power = 100\nif = { limit = { country_exists = JAP } JAP = { add_political_power = 100 } }")])
    event(32, "Концовка: Звезда",
          "Панам и Альдекальдо прорываются через границу вместе с Ви. В Пустошах находится нетраннер, способный помочь с чипом. "
          "Город обретает союзников на колёсах.",
          wheel,
          [("Семья — это те, кто рядом.", "add_ideas = cp77_nomad_clans\nadd_manpower = 15000")])
    event(33, "Концовка: Солнце",
          "Ви и Роуг штурмуют Арасака-тауэр. Роуг погибает. Ви становится величайшей легендой «Посмертия» и живёт на полную, пока может.",
          spade,
          [("Легенды не умирают.", "add_ideas = cp77_afterlife_mercs\narmy_experience = 50\nadd_war_support = 0.1")])
    event(34, "Концовка: Умеренность",
          "Ви отдаёт тело Джонни. Сильверхенд остаётся жить — с новыми лёгкими, старыми привычками и обещанием жить иначе.",
          guitar,
          [("Джонни, только не взрывай ничего.", "add_ideas = cp77_samurai_on_tour\nadd_popularity = { ideology = communism popularity = 0.2 }"),
           ("Джонни, взрывай всё.", "add_ideas = cp77_burn_corpo\nadd_war_support = 0.15\nadd_popularity = { ideology = communism popularity = 0.3 }")])
    event(35, "Концовка: Башня",
          "Соломон Рид и FIA выполняют обещание: лучшие нейрохирурги НСША извлекают чип. "
          "Ви выживает, но больше никогда не станет наёмником. Вашингтон теперь чувствует себя в городе как дома.",
          star,
          [("Жизнь дороже легенды.", "add_stability = 0.1\nadd_war_support = -0.1\nif = { limit = { country_exists = USA } USA = { add_political_power = 50 } }")])
    event(36, "Концовка: Республика Ви",
          "Вместо того чтобы спасать одного Ви, учёные «Посмертия» скопировали энграмму Ви в каждого желающего. "
          "Теперь полгорода — Ви. Все спорят, кто из них оригинал. Все одинаково хамят Джонни.",
          glitch,
          [("Мы все — Ви.", "set_cosmetic_tag = CP77_REPUBLIC_V\nadd_manpower = 30000\narmy_experience = 50\nadd_stability = -0.05")])
    return "add_namespace = cp77\n\n" + "\n\n".join(_EVENTS) + "\n"
