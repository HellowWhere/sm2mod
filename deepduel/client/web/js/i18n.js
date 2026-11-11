/* English translation. The game (client and server) is written in Russian; when the language is English,
   every piece of text that appears on the page is translated on the fly from the dictionary below.
   The server stays the same for both languages - weapon names, errors etc. are translated here too. */
window.DD = window.DD || {};
(function () {
  function detect() {
    let l = null;
    try { const q = new URLSearchParams(location.search).get('lang'); if (q) localStorage.setItem('dd_lang', q); } catch (e) {}
    try { l = localStorage.getItem('dd_lang'); } catch (e) {}
    if (!l) { try { const a = window.DeepDuelAndroid; if (a && a.lang) l = a.lang(); } catch (e) {} }
    if (!l || l === 'auto') l = /^(ru|be|uk|kk)/i.test(navigator.language || 'ru') ? 'ru' : 'en';
    return l === 'en' ? 'en' : 'ru';
  }
  const lang = detect();
  const I = {
    lang,
    missing: new Set(),
    set(l) { try { localStorage.setItem('dd_lang', l); } catch (e) {} location.reload(); },
    t: (s) => s,
  };
  DD.i18n = I;
  DD.t = (s) => I.t(s);
  if (lang !== 'en') return;

  // ------------------------------------------------------------------ whole phrases and words
  const D = {
    // start screen, connection
    'Глубинная дуэль': 'Deep Duel', 'Глубинной дуэли': 'Deep Duel', 'ГЛУБИННАЯ': 'DEEP', 'ДУЭЛЬ': 'DUEL',
    'Подводные дуэли 1 на 1': '1v1 submarine duels', 'Подводная дуэль 1 на 1': '1v1 submarine duel',
    'Играть онлайн': 'Play online', 'или свой сервер': 'or your own server',
    'Сервер на этом телефоне': 'Host a server on this phone', 'или подключиться к другу': 'or join a friend',
    'Адрес сервера': 'Server address', 'Войти': 'Join',
    'Адрес показывает владелец сервера на экране «Сервер на этом телефоне».': 'The host sees the address on the “Host a server on this phone” screen.',
    'Сервер выключен': 'Server is off', 'Порт': 'Port', 'Запустить': 'Start', 'Адреса для друзей': 'Addresses for friends',
    'Ключ администратора': 'Admin key', 'Как играть с друзьями': 'How to play with friends',
    'Запустите сервер. Телефон с сервером должен оставаться включённым — сервер работает даже со свёрнутым приложением.':
      'Start the server. The host phone must stay on — the server keeps running even when the app is in the background.',
    'Друзья подключаются к той же Wi-Fi сети или к точке доступа этого телефона.': 'Friends join the same Wi-Fi network or this phone’s hotspot.',
    'Они вводят один из адресов слева в поле «Адрес сервера». Можно играть и из браузера: открыть адрес как http://…':
      'They type one of the addresses on the left into “Server address”. A browser works too: open the address as http://…',
    'Все аккаунты и прогресс хранятся на этом телефоне.': 'All accounts and progress are stored on this phone.',
    'Играть на этом сервере': 'Play on this server', 'Новый капитан': 'New captain', 'Сервер:': 'Server:',
    'Имя капитана': 'Captain name', 'Начать': 'Start', 'У меня есть код аккаунта': 'I have an account code', 'Другой сервер': 'Other server',
    'Подключение…': 'Connecting…', 'Подключение к': 'Connecting to', 'Отмена': 'Cancel',
    'Поверните телефон горизонтально': 'Rotate your phone to landscape',
    'Связь с сервером потеряна. Переподключение…': 'Connection lost. Reconnecting…', 'Вход…': 'Signing in…',
    'Сервер': 'Server', 'Введите адрес сервера': 'Enter the server address', 'Не удалось подключиться': 'Could not connect',
    'Добро пожаловать на борт, капитан! В «Ящиках» вас ждут 2 подарка.': 'Welcome aboard, captain! Two gifts are waiting for you in “Crates”.',
    'Вход по коду аккаунта': 'Sign in with an account code', 'Код можно посмотреть в настройках на старом устройстве.': 'You can find the code in Settings on your old device.',
    'Код аккаунта': 'Account code', 'Нет каталога игры': 'Game catalog is missing', 'Нет связи с сервером': 'No connection to the server',
    'Сервер работает': 'Server is running', 'Остановить': 'Stop', 'Нет сети. Включите Wi-Fi или точку доступа.': 'No network. Turn on Wi-Fi or a hotspot.',
    'Игроков на сервере:': 'Players on server:', 'онлайн:': 'online:', 'боёв идёт:': 'battles running:',
    'Данные игроков хранятся в памяти приложения на этом телефоне.': 'Player data is stored in the app’s memory on this phone.',
    'Остановить сервер? Все игроки будут отключены.': 'Stop the server? All players will be disconnected.',
    'Не удалось запустить сервер:': 'Could not start the server:', 'Сервер запущен!': 'Server started!',
    'Неверный адрес сервера': 'Invalid server address', 'Сервер не отвечает': 'Server is not responding', 'Ошибка': 'Error',
    'Сервер не ответил': 'The server did not respond', 'Подтверждение': 'Confirm', 'Да': 'Yes',
    'точка доступа': 'hotspot', 'мобильная сеть': 'mobile network', 'кабель/USB': 'cable/USB', 'нет сети': 'no network', 'уже занят': 'is already in use', 'порт': 'port',
    // menu
    'Бой': 'Battle', 'Ангар': 'Hangar', 'Арсенал': 'Arsenal', 'Ящики': 'Crates', 'Пропуск': 'Pass', 'Магазин': 'Shop', 'Рейтинг': 'Ranking',
    'Сдаться': 'Surrender', 'ОГОНЬ': 'FIRE', 'СОНАР': 'SONAR', 'ФОРСАЖ': 'BOOST',
    'монет': 'coins', 'жемчуга': 'pearls', 'жемчужин': 'pearls', 'Ящик': 'Crate', 'ящик': 'crate', 'Окраска': 'Skin',
    'Коралловая лагуна': 'Coral Lagoon', 'Глубоководный каньон': 'Deep Canyon', 'Вулканический разлом': 'Volcanic Rift',
    'БОТ': 'BOT', 'Сдаться? Это засчитается как поражение.': 'Surrender? It will count as a defeat.',
    'Вас засекли сонаром!': 'You were pinged by sonar!', 'Системы отключены!': 'Systems are down!', 'Корпус разъедает кислота!': 'Acid is eating the hull!',
    'Аккумулятор разряжен!': 'Battery drained!', 'Винт заморожен!': 'Propeller frozen!', 'В БОЙ!': 'FIGHT!', 'Вы обнаружены!': 'You are detected!',
    'кубков': 'trophies', 'до «': 'to «', 'корпус ур.': 'hull lv.', 'ур.': 'lv.',
    'Награды за бои:': 'Battle rewards:', 'Лимит на сегодня исчерпан — бои дают только кубки и опыт пропуска': 'Daily limit reached — battles give only trophies and pass XP',
    'Каждый бой приносит ящик и монеты': 'Every battle gives a crate and coins', 'Боевой пропуск': 'Battle Pass', 'Премиум': 'Premium',
    'Все уровни пройдены!': 'All levels complete!', 'опыта до следующего уровня': 'XP to the next level',
    'Ящиков ждут открытия:': 'Crates waiting to be opened:', 'Нет неоткрытых ящиков': 'No unopened crates',
    'Побед:': 'Wins:', 'Поражений:': 'Losses:', 'Ничьих:': 'Draws:',
    // hangar
    'МАКС.': 'MAX', 'Сразу': 'Instant', 'Прочность': 'Hull points', 'Броня': 'Armor', 'Скорость': 'Speed', 'Обзор': 'Vision', 'Слоты': 'Slots',
    'Не хватает монет. Монеты дают бои и ящики.': 'Not enough coins. You get coins from battles and crates.', 'уровень': 'level', 'опыта': 'XP',
    'Откроется на корпусе ур.': 'Unlocks at hull lv.', 'в ящиках': 'in crates',
    // arsenal
    'Пушки': 'Guns', 'Торпеды': 'Torpedoes', 'ПУШКИ': 'GUNS', 'ТОРПЕДЫ': 'TORPEDOES', 'Оружие и чертежи': 'Weapons and blueprints',
    'Новое оружие выпадает из ящиков. Повторные находки — чертежи для улучшения. Больше слотов даёт улучшение корпуса.':
      'New weapons drop from crates. Duplicates become blueprints for upgrades. Upgrade the hull to get more slots.',
    'Установить:': 'Equip:', 'Слот': 'Slot', 'пусто': 'empty', 'Снять': 'Remove', 'Улучшить': 'Upgrade', 'Тип': 'Type',
    'Пушка (зажать «Огонь»)': 'Gun (hold “Fire”)', 'Торпеда (кнопка торпеды)': 'Torpedo (torpedo button)', 'Урон': 'Damage', 'Перезарядка': 'Reload',
    'Дальность': 'Range', 'Радиус взрыва': 'Blast radius', 'Особое': 'Special', 'Уровень': 'Level', 'не получено': 'not owned', 'Чертежи': 'Blueprints',
    'К ящикам': 'To crates', 'Их дают ящики.': 'Crates drop them.', 'Нужно чертежей:': 'Blueprints needed:', 'Не хватает монет': 'Not enough coins',
    'Нет подходящего оружия — ищите его в ящиках': 'No suitable weapon — look for one in crates', 'Пушка': 'Gun', 'Торпеда': 'Torpedo', 'в слот': 'to slot',
    // crates
    'Монеты, жемчуг и чертежи оружия. Сегодня за бои:': 'Coins, pearls and weapon blueprints. From battles today:',
    'вида чертежей': 'blueprint types', 'Открыть': 'Open', 'Нет': 'None', 'Нажмите, чтобы открыть': 'Tap to open', 'НОВОЕ!': 'NEW!',
    'оружие получено': 'weapon unlocked', 'чертежи': 'blueprints', 'Открыть ещё': 'Open another', 'Отлично!': 'Great!', 'Отлично': 'Great',
    'Уровень растёт, когда вы улучшаете подлодку и оружие.': 'Your level grows as you upgrade your submarine and weapons.', 'Забрать': 'Claim',
    // battle pass
    'Сезон': 'Season', 'Максимальный уровень': 'Max level', 'победа': 'win', 'поражение': 'loss', 'до конца сезона': 'season ends in',
    'Забрать всё': 'Claim all', 'Премиум активен': 'Premium active', 'Бесплатно': 'Free', 'Получено:': 'Received:', 'Получено наград:': 'Rewards claimed:',
    // shop
    'Тестовый режим сервера: покупки выдаются сразу и бесплатно, реальные деньги не списываются.': 'Server test mode: purchases are granted instantly and for free, no real money is charged.',
    'Покупки за $ подтверждает администратор сервера после оплаты. Номер заказа появится после нажатия «Купить».':
      'Purchases are confirmed by the server admin after payment. You get an order number after tapping “Buy”.',
    'Покупки за реальные деньги на этом сервере отключены.': 'Real-money purchases are disabled on this server.',
    'Активно ещё': 'Active for', 'Куплено': 'Purchased', 'Есть': 'Owned', 'ТОЛЬКО СЕЙЧАС': 'LIMITED OFFER', 'Осталось:': 'Time left:', 'Осталось': 'Time left',
    'Предложения': 'Offers', 'Жемчуг и монеты': 'Pearls and coins', 'Окраски': 'Skins',
    'Покупки зачисляются на аккаунт на этом сервере.': 'Purchases go to your account on this server.', 'Мои заказы': 'My orders',
    'Покупки на этом сервере отключены': 'Purchases are disabled on this server',
    'Тестовый режим: деньги не списываются, товар выдаётся сразу.': 'Test mode: no money is charged, the item is granted instantly.',
    'После нажатия создастся заказ. Администратор сервера выдаст товар после оплаты.': 'An order will be created. The server admin grants the item after payment.',
    'Покупка': 'Purchase', 'Покупка получена!': 'Purchase received!',
    'Свяжитесь с владельцем сервера для оплаты и назовите номер заказа. Товар появится сразу после подтверждения.':
      'Contact the server owner to pay and tell them the order number. The item appears right after confirmation.',
    'Понятно': 'Got it', 'Не хватает жемчуга': 'Not enough pearls', 'Купить': 'Buy', 'Готово!': 'Done!',
    'ожидает оплаты': 'awaiting payment', 'выдан': 'granted', 'отклонён': 'rejected', 'Заказов пока нет': 'No orders yet',
    // ranking, profile, settings
    'Рейтинг капитанов': 'Captain ranking', 'Загрузка…': 'Loading…', 'Капитан': 'Captain', 'Кубки': 'Trophies', 'Рекорд': 'Best', 'Боёв': 'Battles',
    'Побед': 'Wins', 'Поражений': 'Losses', 'Оружия': 'Weapons',
    'Победа даёт кубки, поражение их отнимает. Кубки определяют лигу и соперников.': 'A win gives trophies, a defeat takes them away. Trophies decide your league and opponents.',
    'Настройки': 'Settings', 'Звук и управление': 'Sound and controls', 'Звуки': 'Sound', 'Вибрация': 'Vibration',
    'Экономия батареи (проще графика)': 'Battery saver (simpler graphics)', 'Сменить сервер': 'Change server', 'Админ-панель': 'Admin panel',
    'Мой сервер': 'My server', 'Показать': 'Show', 'Копировать': 'Copy',
    'По этому коду можно войти в аккаунт с другого устройства. Никому не сообщайте его.': 'This code lets you sign in from another device. Do not share it with anyone.',
    'клиент': 'client', 'сервер': 'server', 'пинг': 'ping', 'Имя изменено': 'Name changed', 'Код скопирован': 'Code copied',
    // admin panel
    'Введите ключ администратора. Он показан на экране сервера (или в консоли ПК-сервера).': 'Enter the admin key. It is shown on the server screen (or in the PC server console).',
    'Ключ': 'Key', 'Админ-панель сервера': 'Server admin panel', 'Заказы': 'Orders', 'Игроки': 'Players', 'Подарок': 'Gift',
    'Игроков:': 'Players:', 'всего боёв:': 'battles total:', 'ждут подтверждения:': 'awaiting confirmation:', 'выручка:': 'revenue:',
    'ожидает': 'pending', 'тест': 'test', 'Выдать': 'Grant', 'Отклонить': 'Reject', 'Заказов нет': 'No orders', 'Товар выдан': 'Item granted',
    'онлайн': 'online', 'кубки': 'trophies', 'монеты': 'coins', 'жемчуг': 'pearls', 'потрачено': 'spent', 'Сохранить': 'Save',
    'Режим оплаты': 'Payment mode', 'Тест (бесплатно)': 'Test (free)', 'Ручное подтверждение': 'Manual confirmation', 'Выключены': 'Off',
    '«Тест» — товары выдаются бесплатно (для проверки). «Ручное» — игрок создаёт заказ, вы получаете оплату и нажимаете «Выдать».':
      '“Test” — items are granted for free (for testing). “Manual” — the player creates an order, you receive the payment and tap “Grant”.',
    'Название сервера': 'Server name', 'Ящиков за бои в день': 'Battle crates per day', 'Лимит с продлением на 7 дней': 'Limit with the 7-day extension',
    'Бот, если нет соперника, через (сек, 0 — никогда)': 'Bot if no opponent after (sec, 0 — never)', 'Боты': 'Bots',
    'Как обычные игроки': 'Look like regular players', 'Помечать «БОТ»': 'Label as “BOT”', 'Длительность боя (сек)': 'Battle length (sec)',
    'Утешительный набор доступен (мин)': 'Consolation pack available for (min)', 'Сохранено': 'Saved', 'Имя игрока': 'Player name',
    'Монеты': 'Coins', 'Жемчуг': 'Pearls', 'нет': 'none', 'Сколько ящиков': 'How many crates', 'Отправить подарок': 'Send gift', 'Подарок отправлен': 'Gift sent',
    // matchmaking and result
    'Поиск соперника…': 'Searching for an opponent…', 'Ищем капитана с похожим числом кубков': 'Looking for a captain with a similar trophy count',
    'бот через': 'bot in', 'подбираем бота': 'picking a bot', 'Онлайн:': 'Online:', 'ищут бой:': 'in queue:',
    'ПОБЕДА!': 'VICTORY!', 'ПОРАЖЕНИЕ': 'DEFEAT', 'НИЧЬЯ': 'DRAW',
    'Подлодка противника уничтожена': 'Enemy submarine destroyed', 'Ваша подлодка уничтожена': 'Your submarine was destroyed',
    'Обе подлодки уничтожены': 'Both submarines destroyed', 'Время вышло — победа по прочности': 'Time is up — decided by remaining hull',
    'Противник сдался': 'The opponent surrendered', 'Вы сдались': 'You surrendered',
    'Лимит наград исчерпан': 'Reward limit reached', 'Ящики и монеты за бои вернутся завтра': 'Battle crates and coins come back tomorrow',
    'за бой': 'for the battle', 'ящиков за сегодня:': 'crates today:', 'опыта пропуска': 'pass XP', 'Новый уровень пропуска:': 'New pass level:',
    'уровень пропуска': 'pass level', 'соперник:': 'opponent:', 'всего': 'total', 'Бой с ботом: кубки ×0.5': 'Bot battle: trophies ×0.5',
    'урон': 'damage', 'попаданий': 'hits', 'получено': 'taken', 'В порт': 'To port', 'Ещё бой': 'Fight again',

    // ---------------------------------------------------------------- texts that come from the server
    'Обычный': 'Common', 'Редкий': 'Rare', 'Эпический': 'Epic', 'Легендарный': 'Legendary',
    'Обычное': 'Common', 'Редкое': 'Rare', 'Эпическое': 'Epic', 'Легендарное': 'Legendary',
    'обычное': 'common', 'редкое': 'rare', 'эпическое': 'epic', 'легендарное': 'legendary',
    'Гарпунная пушка': 'Harpoon Gun', 'Надёжное орудие среднего калибра.': 'A reliable medium-calibre gun.',
    'Скорострел': 'Rapid Gun', 'Низкий урон, огромная скорострельность.': 'Low damage, huge rate of fire.',
    'Спаренная пушка': 'Twin Gun', 'Два ствола стреляют одновременно.': 'Two barrels fire at once.',
    'Картечница': 'Scattergun', 'Веер из 5 зарядов. Страшна вблизи.': 'A fan of 5 pellets. Deadly up close.',
    'Звуковая пушка': 'Sonic Cannon', 'Широкая волна проходит сквозь скалы.': 'A wide wave that passes through rocks.',
    'Бомбомёт': 'Mortar', 'Тонущие бомбы рвутся и бьют по площади. Стреляйте сверху.': 'Sinking bombs with area damage. Fire from above.',
    'Кислотник': 'Acid Sprayer', 'Кислота разъедает корпус: 14 урона в секунду ещё 4 с.': 'Acid eats the hull: 14 damage per second for 4 more seconds.',
    'Крио-пушка': 'Cryo Cannon', 'Замораживает винт: цель замедляется на 1,5 с.': 'Freezes the propeller: the target is slowed for 1.5 s.',
    'Ионная пушка': 'Ion Cannon', 'Разряжает аккумулятор цели — враг не сможет уйти на форсаже.': 'Drains the target’s battery — the enemy cannot boost away.',
    'Вихревая пушка': 'Vortex Cannon', 'Водоворот отбрасывает подлодку врага.': 'A whirlpool knocks the enemy submarine back.',
    'Рельсотрон': 'Railgun', 'Сверхбыстрый снаряд с огромным уроном.': 'A hyper-fast projectile with huge damage.',
    'Плазмомёт': 'Plasma Launcher', 'Сгусток плазмы взрывается и бьёт по площади.': 'A plasma blob that explodes with area damage.',
    'Тесла-разрядник': 'Tesla Coil', 'Молния сама находит цель вблизи и бьёт без промаха.': 'Lightning finds a nearby target on its own and never misses.',
    'Торпеда МК-1': 'MK-1 Torpedo', 'Классическая торпеда. Мощный взрыв.': 'The classic torpedo. A powerful blast.',
    'Торпеда «Стриж»': '“Swift” Torpedo', 'Быстрая и лёгкая, перезаряжается быстрее.': 'Fast and light, reloads quicker.',
    'Глубинная бомба': 'Depth Charge', 'Сбрасывается за кормой, тонет и взрывается рядом с врагом.': 'Dropped astern, sinks and explodes near the enemy.',
    'Самонаводящаяся': 'Homing Torpedo', 'Сама находит цель в секторе впереди.': 'Finds a target in the sector ahead by itself.',
    'Мина-ловушка': 'Trap Mine', 'Сбрасывается за кормой и взрывается рядом с врагом.': 'Dropped astern and explodes near the enemy.',
    'Сетевая торпеда': 'Net Torpedo', 'Опутывает винт сетью: враг замедлен на 3 с.': 'Tangles the propeller in a net: the enemy is slowed for 3 s.',
    'Кассетная торпеда': 'Cluster Torpedo', 'Через мгновение распадается на 4 боеголовки.': 'Splits into 4 warheads after a moment.',
    'Тяжёлая торпеда «Кит»': '“Whale” Heavy Torpedo', 'Медленная, но разносит всё вокруг.': 'Slow, but wrecks everything around.',
    'Торпеда-призрак': 'Ghost Torpedo', 'Не видна врагу, пока не подойдёт вплотную.': 'Invisible to the enemy until it gets very close.',
    'ЭМИ-торпеда': 'EMP Torpedo', 'Наводится и выключает системы врага на 2 с.': 'Homes in and shuts down the enemy’s systems for 2 s.',
    'Рой': 'Swarm', 'Залп из трёх мини-торпед с самонаведением.': 'A salvo of three homing mini-torpedoes.',
    'Суперторпеда «Шквал»': '“Squall” Supertorpedo', 'Суперкавитация: почти мгновенно долетает до цели.': 'Supercavitation: reaches the target almost instantly.',
    'Обычный ящик': 'Common Crate', 'Редкий ящик': 'Rare Crate', 'Эпический ящик': 'Epic Crate', 'Легендарный ящик': 'Legendary Crate',
    'Классика': 'Classic', 'Доступна сразу': 'Available from the start', 'Флотский': 'Navy', 'Коралловый': 'Coral', 'Камуфляж': 'Camo',
    'Глубоководный': 'Abyss', 'Неон': 'Neon', 'Золотой Кракен': 'Golden Kraken', 'Акула': 'Shark', 'Премиум пропуск': 'Premium Pass',
    'Бронза': 'Bronze', 'Серебро': 'Silver', 'Золото': 'Gold', 'Платина': 'Platinum', 'Алмаз': 'Diamond', 'Легенда глубин': 'Legend of the Deep',
    'Горсть жемчуга': 'Handful of Pearls', 'Мешочек жемчуга': 'Pouch of Pearls', 'Шкатулка жемчуга': 'Box of Pearls', 'Сундук жемчуга': 'Chest of Pearls',
    'Сокровищница': 'Treasury', 'Королевская сокровищница': 'Royal Treasury', 'в подарок': 'bonus', 'Мешок монет': 'Sack of Coins',
    'монет на улучшения': 'coins for upgrades', 'Премиум боевой пропуск': 'Premium Battle Pass',
    'Вторая линия наград сезона: эксклюзивные окраски, ящики и жемчуг.': 'The second reward track of the season: exclusive skins, crates and pearls.',
    'Премиум пропуск + 10 уровней': 'Premium Pass + 10 levels', 'Премиум-линия и сразу +10 уровней пропуска.': 'The premium track plus 10 pass levels right away.',
    'Продление наград на сегодня': 'Reward extension for today', '+10 ящиков к дневному лимиту за бои.': '+10 crates to today’s battle limit.',
    'Продление наград на 7 дней': 'Reward extension for 7 days', 'Дневной лимит ящиков за бои 20 вместо 10 целую неделю.': 'A daily battle-crate limit of 20 instead of 10 for a whole week.',
    '3 редких ящика': '3 Rare Crates', 'Оружие, монеты и шанс на жемчуг.': 'Weapons, coins and a chance of pearls.',
    'Набор «Эпический»': '“Epic” Bundle', '3 эпических и 5 редких ящиков.': '3 epic and 5 rare crates.',
    'Набор «Легенда»': '“Legend” Bundle', '2 легендарных и 5 эпических ящиков.': '2 legendary and 5 epic crates.',
    'Мгновенное улучшение': 'Instant Upgrade', '+1 уровень выбранной детали без затрат монет.': '+1 level for the chosen part without spending coins.',
    'Утешительный набор': 'Consolation Pack', 'Только сейчас: 4 000 монет, 2 редких ящика и 60 жемчуга.': 'Right now only: 4,000 coins, 2 rare crates and 60 pearls.',
    'Корпус': 'Hull', 'Размер и прочность лодки. Больше корпус — больше слотов под оружие, но лодка тяжелее и заметнее.':
      'Size and durability. A bigger hull has more weapon slots, but the sub is heavier and easier to spot.',
    'Размер': 'Size', 'Слоты пушек': 'Gun slots', 'Слоты торпед': 'Torpedo slots', 'Снижает весь получаемый урон.': 'Reduces all incoming damage.',
    'Снижение урона': 'Damage reduction', 'Винт': 'Propeller', 'Максимальная скорость и разгон лодки.': 'Top speed and acceleration.', 'Разгон': 'Acceleration',
    'Рули глубины': 'Dive planes', 'Как быстро лодка поворачивает.': 'How fast the submarine turns.', 'Поворот': 'Turning',
    'Сонар': 'Sonar', 'Дальность обзора в тёмной воде и перезарядка сонарного импульса.': 'Vision range in dark water and sonar pulse cooldown.',
    'Перезарядка импульса': 'Pulse cooldown', 'Аккумулятор': 'Battery', 'Энергия для форсажа и его мощность.': 'Energy for the boost and its power.',
    'Восстановление': 'Recharge', 'Сила форсажа': 'Boost power',
    'автонаведение': 'auto-aim', 'самонаведение': 'homing', 'отключает системы на': 'disables systems for', 'замедляет на': 'slows for', 'кислота': 'acid',
    'энергии': 'energy', 'отбрасывает': 'knockback', 'невидима для врага': 'invisible to the enemy', 'сквозь скалы': 'passes through rocks', 'тонет': 'sinks',
    'сброс за корму': 'dropped astern', '4 боеголовки': '4 warheads',
    // server errors and notices
    'Неизвестная деталь': 'Unknown part', 'Деталь уже максимального уровня': 'The part is already at max level', 'Это оружие ещё не получено': 'You do not own this weapon yet',
    'Оружие уже максимального уровня': 'The weapon is already at max level', 'Неверный слот': 'Invalid slot', 'Этот слот закрыт — улучшите корпус': 'This slot is locked — upgrade the hull',
    'Оружие не подходит для этого слота': 'This weapon does not fit the slot', 'Окраска ещё не открыта': 'This skin is not unlocked yet', 'Нет такого ящика': 'No such crate',
    'Неверный уровень': 'Invalid level', 'Этот уровень пропуска ещё не открыт': 'This pass level is not unlocked yet', 'Нужен премиум боевой пропуск': 'Premium Battle Pass required',
    'Награда уже получена': 'Reward already claimed', 'Товар не найден': 'Item not found', 'Эта окраска у вас уже есть': 'You already own this skin',
    'Премиум-пропуск этого сезона уже активен': 'This season’s Premium Pass is already active', 'Предложение уже закончилось': 'The offer has expired',
    'Сначала войдите в игру': 'Sign in first', 'Это имя уже занято': 'This name is already taken', 'Вы уже в бою': 'You are already in a battle',
    'Неизвестная команда:': 'Unknown command:', 'Ошибка сервера': 'Server error', 'Имя должно быть от 3 до 16 символов': 'The name must be 3 to 16 characters long',
    'Имя может содержать только буквы, цифры, пробел, _ и -': 'The name may contain only letters, digits, spaces, _ and -', 'Это имя зарезервировано': 'This name is reserved',
    'В этот аккаунт вошли с другого устройства': 'This account was signed in from another device', 'Слишком много неверных попыток': 'Too many wrong attempts',
    'Неверный ключ администратора': 'Wrong admin key', 'Заказ не найден или уже обработан': 'Order not found or already processed',
    'Режим: test, manual или off': 'Mode: test, manual or off', 'Неверное имя': 'Invalid name', 'Неизвестная настройка': 'Unknown setting', 'Игрок не найден': 'Player not found',
    'Администратор отправил вам подарок!': 'The admin sent you a gift!', 'Неизвестная операция': 'Unknown operation', 'Нужно число': 'A number is required',
  };

  // ------------------------------------------------------------------ sentences where the word order changes
  const P = [
    ['Вы открыли игру с сервера {0}. Нажмите «Войти».', 'You opened the game from server {0}. Tap “Join”.'],
    ['{0} кубков · до «{1}» {2}', '{0} trophies · {2} to “{1}”'],
    ['{0}: уровень {1}! +{2} опыта', '{0}: level {1}! +{2} XP'],
    ['Купить «{0}» за {1} жемчуга?', 'Buy “{0}” for {1} pearls?'],
    ['Купить за {0}', 'Buy for {0}'],
    ['«{0}» за {1}.', '“{0}” for {1}.'],
    ['Заказ №{0} создан', 'Order #{0} created'],
    ['{0} получен. Открыть сейчас?', '{0} received. Open it now?'],
    ['Это оружие можно найти в ящиках ({0} редкость).', 'This weapon is found in crates ({0} rarity).'],
    ['Откроется на {0} уровне пропуска', 'Unlocks at pass level {0}'],
    ['Ваше место: {0} из {1}', 'Your rank: {0} of {1}'],
    ['Не повезло? {0}!', 'Bad luck? {0}!'],
    ['Не хватает монет: нужно {0}', 'Not enough coins: {0} needed'],
    ['Не хватает чертежей: нужно {0}', 'Not enough blueprints: {0} needed'],
    ['Покупка подтверждена: {0}', 'Purchase confirmed: {0}'],
    ['Заказ #{0} отклонён администратором', 'Order #{0} was rejected by the admin'],
    ['Новый уровень капитана: {0}!', 'New captain level: {0}!'],
    ['Окраска «{0}»', '“{0}” skin'],
    ['Боевой пропуск, ур. {0}', 'Battle Pass, level {0}'],
    ['Премиум пропуск, ур. {0}', 'Premium Pass, level {0}'],
    ['Магазин, {0} жемчуга', 'Shop, {0} pearls'],
    ['порт {0} уже занят', 'port {0} is already in use'],
    ['Сервер «Глубинной дуэли» работает', 'Deep Duel server is running'],
  ].map(([ru, en]) => [new RegExp('^' + ru.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d\}/g, '(.+?)') + '$'), en]);

  const CYR = /[А-Яа-яЁё]/;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const ANY = new RegExp('(?<![А-Яа-яЁё])(?:' + keys.map(esc).join('|') + ')(?![А-Яа-яЁё])', 'g');
  const UNIT = { 'мс': 'ms', 'сек': 'sec', 'мин': 'min', 'с': 's', 'ч': 'h', 'д': 'd' };
  const cache = new Map();

  function tr(text) {
    if (!text || !CYR.test(text)) return text;
    const hit = cache.get(text);
    if (hit !== undefined) return hit;
    const lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
    let s = text.trim().replace(/\s+/g, ' ');
    let out = null;
    if (Object.prototype.hasOwnProperty.call(D, s)) out = D[s];
    if (out === null) {
      for (const [re, en] of P) {
        const m = re.exec(s);
        if (m) { out = en.replace(/\{(\d)\}/g, (x, i) => tr(m[+i + 1])); break; }
      }
    }
    if (out === null) {
      out = s.replace(/(\d)\s?(мс|сек|мин|с|ч|д)(?![А-Яа-яЁё.])/g, (x, d, u) => d + ' ' + UNIT[u])
        .replace(/\/с(?![А-Яа-яЁё])/g, '/s')
        .replace(/(?<![А-Яа-яЁё])К(\d+)(?![А-Яа-яЁё])/g, 'H$1')
        .replace(ANY, (k) => D[k]);
      if (out === 'с') out = 's';
      if (CYR.test(out) && cache.size < 4000) I.missing.add(s);
    }
    out = lead + out + trail;
    if (cache.size < 4000) cache.set(text, out);
    return out;
  }
  I.t = tr;

  const ATTRS = ['placeholder', 'title', 'aria-label'];
  function walk(node) {
    if (node.nodeType === 3) {
      const v = node.nodeValue;
      if (v && CYR.test(v)) { const n = tr(v); if (n !== v) node.nodeValue = n; }
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
    for (const a of ATTRS) {
      const v = node.getAttribute && node.getAttribute(a);
      if (v && CYR.test(v)) { const n = tr(v); if (n !== v) node.setAttribute(a, n); }
    }
    for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
  }
  function start() {
    document.documentElement.lang = 'en';
    document.title = tr(document.title);
    walk(document.body);
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'characterData') walk(m.target);
        else if (m.type === 'attributes') walk(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
