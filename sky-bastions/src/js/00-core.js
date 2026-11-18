/* ================= core: utils, data, save, platform, sound ================= */
const $=id=>document.getElementById(id);
const app=$('app'), cv=$('cv'), ctx=cv.getContext('2d');
let W=0,H=0,DPR=1,LAND=false;

const TAU=Math.PI*2, B=36, COLS=5, DECK=-200, HULL_H=44, ENGAGE=170, RANGE=720;
const INK='#1b2140';
const rand=(a,b)=>a+Math.random()*(b-a);
const irand=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const h1=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const reduceMotion=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

function roundCost(v){ v=Math.max(1,v); if(v<100) return Math.max(5,Math.round(v/5)*5); const p=Math.pow(10,Math.floor(Math.log10(v))-1); return Math.round(v/p)*p; }
const SUF=['','К','М','Б','Т'];
function fmt(n){
  n=Math.floor(n||0); if(n<10000) return String(Math.max(0,n));
  const e=Math.floor(Math.log10(n)/3), v=n/Math.pow(1000,e);
  const k=e-SUF.length, suf=e<SUF.length?SUF[e]:String.fromCharCode(97+Math.floor(k/26)%26)+String.fromCharCode(97+k%26);
  return String(v<100?Math.floor(v*10)/10:Math.floor(v)).replace('.',',')+suf;
}
const fmt1=v=>String(Math.round(v*10)/10).replace('.',',');
const rub=v=>v.toLocaleString('ru-RU')+' ₽';
const pct=v=>String(Math.round(v*1000)/10).replace('.',',')+'%';

/* growth & cost curves shared by every upgrade */
const GROW=(base,l)=>base*(1+0.15*(l-1))*Math.pow(1.07,l-1);
const COSTF=(base,l)=>roundCost(base*Math.pow(1.15,l-1)*(1+0.08*(l-1)));
const gearCostAt=l=>l<9?0:Math.round(2*Math.pow(1.06,l-9)*(1+0.2*(l-9)));
const levelReward=n=>Math.round(40*Math.pow(1.045,n-1));
const gearMul=n=>Math.pow(1.03,n-1);
function diffOf(n){
  const ramp=Math.min(n-1,30);
  return {hp:Math.pow(1.032,n-1)*(1+0.03*ramp), dmg:0.7*Math.pow(1.02,n-1)*(1+0.012*ramp), rew:Math.pow(1.045,n-1)};
}

/* ================= locations & levels ================= */
const LEVELS_PER_LOC=5, CIRCLES=40;
const LOCS=[
 {name:'Облачные луга', boss:'Чёрный шквал', ground:'hills', weather:null,
  sky:{top:'#3f95e6',mid:'#86c8f6',bot:'#dcf3ff',sun:'#fff4b8',far:'#93bcd8',near:'#79c25a',nearD:'#57a043',field:'#9ad36b',haze:'rgba(225,243,255,0.55)',cloud:'#ffffff',cloudS:'#d2e5f6',island:'#7cc25a',rockA:'#b38c72',rockB:'#6b4f45'},
  bal:{a:'#6a4a9e',b:'#2f2a40',patch:'#a58fd0'}, hull:{light:'#836276',base:'#5a3f52',dark:'#352332',band:'#c8302b'}, flag:'#26222f'},
 {name:'Песчаный каньон', boss:'Песчаный скорпион', ground:'mesa', weather:'dust',
  sky:{top:'#ec8a5e',mid:'#f8bb7e',bot:'#ffe8c2',sun:'#fff0c2',far:'#d08a5a',near:'#e9b86a',nearD:'#c98d47',field:'#f2cf86',haze:'rgba(255,232,205,0.45)',cloud:'#fff4e8',cloudS:'#f2c4ae',island:'#d9b65a',rockA:'#d38f5f',rockB:'#8a4f33'},
  bal:{a:'#d9772b',b:'#4a2e1e',patch:'#f2b27a'}, hull:{light:'#b88a5a',base:'#8a5e36',dark:'#55361d',band:'#2f6f7a'}, flag:'#5a3018'},
 {name:'Ледяные пики', boss:'Ледяной клык', ground:'peaks', weather:'snow',
  sky:{top:'#5a8fd6',mid:'#a9d0f2',bot:'#eef7ff',sun:'#ffffff',far:'#b6c8e4',near:'#eef4fb',nearD:'#b8cbe2',field:'#dbe8f6',haze:'rgba(235,245,255,0.55)',cloud:'#ffffff',cloudS:'#cfe0f2',island:'#eef4fb',rockA:'#9fb0c8',rockB:'#5d6e88'},
  bal:{a:'#3d6fb0',b:'#e8f2ff',patch:'#9cc3ec'}, hull:{light:'#8aa0bd',base:'#5f7594',dark:'#384a63',band:'#7fd6ff'}, flag:'#22344f'},
 {name:'Вулканические острова', boss:'Огненный кракен', ground:'volcano', weather:'ash',
  sky:{top:'#3a1f2e',mid:'#8a3a2e',bot:'#f08a4a',sun:'#ffd27a',far:'#4a2a30',near:'#2e2228',nearD:'#1c1418',field:'#ff6a2a',haze:'rgba(255,140,80,0.22)',cloud:'#c9a3a0',cloudS:'#7a5560',island:'#4a3a3a',rockA:'#5a4448',rockB:'#2a1e22'},
  bal:{a:'#2b2228',b:'#ff6a2a',patch:'#ff9a5a'}, hull:{light:'#5a3a36',base:'#3a2422',dark:'#1e1212',band:'#ff6a2a'}, flag:'#1e1212'},
 {name:'Грозовое море', boss:'Повелитель бурь', ground:'sea', weather:'rain',
  sky:{top:'#2a3348',mid:'#4f5d78',bot:'#8fa0b8',sun:'#d9e2ee',far:'#3c4a60',near:'#2f6f86',nearD:'#1f4f63',field:'#4a9ab3',haze:'rgba(180,200,220,0.22)',cloud:'#aab6c8',cloudS:'#6f7c92',island:'#5a7a6a',rockA:'#6f7480',rockB:'#3a3e48'},
  bal:{a:'#4a5568',b:'#ffd23f',patch:'#8a95a8'}, hull:{light:'#6a7488',base:'#465064',dark:'#262c3a',band:'#ffd23f'}, flag:'#1c2230'},
 {name:'Звёздная высь', boss:'Полуночный левиафан', ground:'night', weather:'stars',
  sky:{top:'#0f1638',mid:'#27306a',bot:'#5a4a8a',sun:'#f4f1ff',far:'#2a2f5a',near:'#1c2247',nearD:'#121633',field:'#ffd86b',haze:'rgba(120,110,200,0.22)',cloud:'#8a8fc0',cloudS:'#4a4f80',island:'#3f4f7a',rockA:'#4a4a7a',rockB:'#24244a'},
  bal:{a:'#2b2f6b',b:'#c9b3ff',patch:'#7a7fc0'}, hull:{light:'#4a4f7a',base:'#2f3360',dark:'#181a38',band:'#c9b3ff'}, flag:'#121633'},
];
const PER_CIRCLE=LOCS.length*LEVELS_PER_LOC, MAX_LEVEL=PER_CIRCLE*CIRCLES;
function levelInfo(n){ const i=n-1; return {n, circle:Math.floor(i/PER_CIRCLE)+1, loc:Math.floor(i/LEVELS_PER_LOC)%LOCS.length, stage:i%LEVELS_PER_LOC+1, boss:i%LEVELS_PER_LOC===LEVELS_PER_LOC-1}; }

/* ================= palettes ================= */
const MATS=[
 {name:'Дерево', base:'#c98545', dark:'#8f5426', light:'#eab37c', inner:'#5a3418', pat:'planks'},
 {name:'Камень', base:'#a9b0bb', dark:'#6b7381', light:'#d7dce3', inner:'#3d4350', pat:'bricks'},
 {name:'Железо', base:'#7d92a8', dark:'#4a5b70', light:'#b9c8d8', inner:'#2a3442', pat:'plates'},
 {name:'Латунь', base:'#e2ab3c', dark:'#9d6c16', light:'#ffd987', inner:'#4e3510', pat:'plates'},
 {name:'Чёрная сталь', base:'#5a6474', dark:'#2b313c', light:'#9aa6b8', inner:'#181c24', pat:'plates'},
 {name:'Мрамор', base:'#efe9df', dark:'#b9ad99', light:'#ffffff', inner:'#5a5040', pat:'bricks'},
 {name:'Небесная сталь', base:'#5ccde0', dark:'#2789a2', light:'#c8f7ff', inner:'#173c4c', pat:'crystal'},
 {name:'Звёздный кристалл', base:'#a77ef0', dark:'#6a43b8', light:'#e6d6ff', inner:'#2a1a4a', pat:'crystal'},
];
const tierOf=l=>Math.min(MATS.length-1,Math.floor((l-1)/8));
const HULLS=[
 {light:'#dc9d5f', base:'#b36f36', dark:'#7c4520', band:'#e7b54a', keel:null},
 {light:'#cf8f55', base:'#a5612d', dark:'#6e3b1a', band:'#e7b54a', keel:'#8193a8'},
 {light:'#8f5e48', base:'#663f2e', dark:'#3f2419', band:'#f2c14e', keel:'#e2ab3c'},
 {light:'#7f8ea5', base:'#56647a', dark:'#2e3748', band:'#f2c14e', keel:'#e2ab3c'},
];
const hullTierOf=l=>Math.min(HULLS.length-1,Math.floor((l-1)/10));
const PROPC=[
 {a:'#d08d4f', b:'#9a5d2c', hub:'#e2ab3c'},
 {a:'#f4c454', b:'#c38d1d', hub:'#e2ab3c'},
 {a:'#d6dee8', b:'#94a3b6', hub:'#f2c14e'},
 {a:'#86e6f2', b:'#3fb2c8', hub:'#f2c14e'},
 {a:'#c9a6ff', b:'#7b4fd0', hub:'#ffd23f'},
];
const propTier=l=>l>=40?4:l>=20?3:l>=10?2:l>=4?1:0;
const BTIERS=[
 {name:'Парусина', a:'#e8483b', b:'#fff1d6', patch:'#f6d9a8'},
 {name:'Прорезиненная', a:'#2f7fd8', b:'#e9f3ff', patch:'#a9cdf5'},
 {name:'Шёлковая', a:'#8b57d8', b:'#ffe7a8', patch:'#d2b8f5'},
 {name:'Армированная', a:'#2f9e5a', b:'#f2f2e0', patch:'#a6dcb6'},
 {name:'Латунная сетка', a:'#d79a1c', b:'#fff3c4', patch:'#f5d78a'},
 {name:'Небесный шёлк', a:'#16a6c9', b:'#ffffff', patch:'#9be3f2'},
 {name:'Звёздная ткань', a:'#2b2f6b', b:'#ffd23f', patch:'#8a8fd0'},
];
const btierOf=l=>Math.min(BTIERS.length-1,Math.floor((l-1)/8));
const BLOOK={ gold:{a:'#ffcf3f', b:'#fff4c8', neck:'#8a5a32', patch:'#ffe48a'}, bomb:{a:'#3a3548', b:'#57506b', neck:'#2a2633', patch:'#77738a', skull:true} };
BTIERS.forEach((t,i)=>{ BLOOK['p'+i]={a:t.a, b:t.b, neck:'#8a5a32', patch:t.patch}; });
LOCS.forEach((L,i)=>{ BLOOK['e'+i]={a:L.bal.a, b:L.bal.b, neck:'#4b3a2a', patch:L.bal.patch, skull:true}; });

const LOOK={
 gunner:{coat:'#43a453', trim:'#2b6e35', hat:'aviator', hatC:'#7a5230', skin:'#f2c49b'},
 cannon:{coat:'#d8473b', trim:'#8f2a22', hat:'helmet', hatC:'#5d6372', skin:'#e3a982'},
 harpoon:{coat:'#3d82d4', trim:'#24528c', hat:'beanie', hatC:'#f0e7d2', skin:'#c98d62'},
 mechanic:{coat:'#ef9f27', trim:'#9c5f12', hat:'hardhat', hatC:'#ffd43b', skin:'#f5d0ae'},
 tesla:{coat:'#8b57d8', trim:'#56308f', hat:'tesla', hatC:'#f4f1ff', skin:'#eab48c'},
 sniper:{coat:'#5f6e3a', trim:'#3c4723', hat:'beret', hatC:'#2f3a1e', skin:'#e8b48c'},
 rocket:{coat:'#c8562b', trim:'#7a2f14', hat:'pilot', hatC:'#ece6d6', skin:'#f0c39a'},
 flamer:{coat:'#7a5a3a', trim:'#3e2b18', hat:'mask', hatC:'#4a4f5c', skin:'#d7a07a'},
 frost:{coat:'#7fc6e6', trim:'#3b88b0', hat:'ushanka', hatC:'#8a6a4a', skin:'#f4d2b5'},
 gatling:{coat:'#6b7b8c', trim:'#3a4552', hat:'headband', hatC:'#d8483b', skin:'#c98d62'},
 shield:{coat:'#4a6fb0', trim:'#27457a', hat:'knight', hatC:'#b9c3d3', skin:'#f2c49b'},
 thunder:{coat:'#1f3f8a', trim:'#f2c14e', hat:'bicorne', hatC:'#1b2140', skin:'#e3a982', legend:true},
 atlas:{coat:'#8b97a8', trim:'#4b5566', hat:'robot', hatC:'#9aa6b8', skin:'#9aa6b8', legend:true},
 valkyrie:{coat:'#d64b6a', trim:'#8a1f3a', hat:'winged', hatC:'#e2ab3c', skin:'#f5d0ae', legend:true},
 blizzard:{coat:'#e9f6ff', trim:'#7fc6e6', hat:'hood', hatC:'#bfe6fb', skin:'#f4d2b5', legend:true},
};
const PCOATS={gunner:'#4d4b5c',cannon:'#7d2f2f',harpoon:'#2f5470',mechanic:'#6e5a2a',tesla:'#4b2b6e',sniper:'#3e4a2a',rocket:'#6a3a2a',flamer:'#4a3a2a',frost:'#2f5a70',gatling:'#4a4a52',shield:'#2f3a5a'};
const PLOOK={};
Object.keys(PCOATS).forEach((k,i)=>{ PLOOK[k]={coat:PCOATS[k], trim:'#1e1a26', hat:'bandana', hatC:i%2?'#2d2a3a':'#c8302b', skin:['#d9a37a','#b98058','#e0b08a','#c99068'][i%4], patch:i%3===0}; });

/* ================= upgrades ================= */
const WEIGHT={wall:10, crew:8, hull:20};
const STAT={
 wallHp:l=>Math.round(GROW(50,l)),
 hullHp:l=>Math.round(GROW(170,l)),
 rows:l=>1+l,
 autoRep:l=>0.0015*l,
 powder:l=>Math.pow(1.05,l),
 sights:l=>Math.pow(0.985,l),
 loot:l=>1+0.05*l,
 bCount:l=>1+l,
 bLift:l=>40+9*(l-1),
 bHp:l=>Math.round(GROW(55,l)),
 bPatch:l=>0.002*l,
 speed:l=>Math.min(200,70+6*l),
 ram:l=>Math.round(GROW(84,l)),
 rotor:l=>14*l,
 ramCd:l=>Math.max(5,15-1.25*(l-1)),
 dodge:l=>Math.min(0.3,0.012*l),
};
const UPG={
 wall:{tab:'hull', name:'Стены', max:300, base:40, icon:'wall', label:'Прочность блока', val:l=>fmt(STAT.wallHp(l)),
   note:(l,m)=>{const a=MATS[tierOf(l)].name; if(m) return 'Материал: '+a; const b=MATS[tierOf(l+1)].name; return a!==b?'Материал: '+a+' → '+b:'Материал: '+a+' · новый каждые 8 ур.';}},
 hull:{tab:'hull', name:'Гондола', max:300, base:45, icon:'hull', label:'Прочность корпуса', val:l=>fmt(STAT.hullHp(l))},
 frame:{tab:'hull', name:'Каркас', max:3, costs:[0,180,700], icon:'frame', label:'Ярусов для блоков', val:l=>STAT.rows(l)},
 autoRep:{tab:'hull', name:'Авторемонт', max:20, min:0, base:300, icon:'autorep', label:'Починка в бою, % в секунду', val:l=>fmt1(STAT.autoRep(l)*100)},
 powder:{tab:'arsenal', name:'Порох', max:300, min:0, base:60, icon:'powder', label:'Урон всего экипажа', val:l=>'+'+fmt(Math.round((STAT.powder(l)-1)*100))+'%'},
 sights:{tab:'arsenal', name:'Прицелы', max:30, min:0, base:80, icon:'sights', label:'Скорость стрельбы', val:l=>'+'+Math.round((1/STAT.sights(l)-1)*100)+'%'},
 loot:{tab:'arsenal', name:'Добыча', max:100, min:0, base:100, icon:'loot', label:'Монеты за бой', val:l=>'+'+l*5+'%'},
 bCount:{tab:'bal', name:'Число баллонов', max:5, costs:[0,260,1100,4000,12000], icon:'bcount', label:'Баллонов над палубой', val:l=>STAT.bCount(l)},
 bLift:{tab:'bal', name:'Объём', max:300, base:35, icon:'blift', label:'Подъём одного баллона', val:l=>STAT.bLift(l)},
 bHp:{tab:'bal', name:'Обшивка', max:300, base:35, icon:'bhp', label:'Прочность баллона', val:l=>fmt(STAT.bHp(l)),
   note:(l,m)=>{const a=BTIERS[btierOf(l)].name; if(m) return 'Ткань: '+a; const b=BTIERS[btierOf(l+1)].name; return a!==b?'Ткань: '+a+' → '+b:'Ткань: '+a+' · новая каждые 8 ур.';}},
 bPatch:{tab:'bal', name:'Самозаплатка', max:15, min:0, base:250, icon:'bpatch', label:'Баллоны чинятся, % в секунду', val:l=>fmt1(STAT.bPatch(l)*100)},
 thrust:{tab:'prop', name:'Тяга', max:300, base:40, icon:'thrust', label:'Скорость / удар тарана', val:l=>STAT.speed(l)+' / '+fmt(STAT.ram(l))},
 rotor:{tab:'prop', name:'Подъёмный винт', max:30, min:0, base:90, icon:'rotor', label:'Подъём, который не пробить', val:l=>STAT.rotor(l)},
 boost:{tab:'prop', name:'Форсаж', max:9, base:60, icon:'boost', label:'Перезарядка тарана, с', val:l=>fmt1(STAT.ramCd(l))},
 dodge:{tab:'prop', name:'Манёвр', max:25, min:0, base:150, icon:'dodge', label:'Шанс увернуться от снаряда', val:l=>Math.round(STAT.dodge(l)*100)+'%'},
};

/* ================= crew ================= */
const CREW={
 gunner:{name:'Стрелок', role:'Быстро стреляет по ближайшей цели', unlockAt:1, hire:0, base:25, dmg:9, rate:0.75},
 cannon:{name:'Канонир', role:'Ядра навесом через стены, урон по площади', unlockAt:2, hire:150, base:35, dmg:30, rate:2.4},
 harpoon:{name:'Гарпунёр', role:'Охотник за баллонами: по ним урон ×3', unlockAt:3, hire:240, base:40, dmg:15, rate:1.8},
 mechanic:{name:'Механик', role:'Чинит блоки, корпус и баллоны прямо в бою', unlockAt:4, hire:340, base:45, heal:12, rate:2.4, support:true},
 tesla:{name:'Тесла-инженер', role:'Цепная молния бьёт до четырёх целей', unlockAt:6, hire:700, base:60, dmg:15, rate:2.2},
 sniper:{name:'Снайпер', role:'Мощный дальний выстрел, выбивает вражеский экипаж', unlockAt:8, hire:900, base:70, dmg:60, rate:3.4},
 rocket:{name:'Ракетчик', role:'Самонаводящиеся ракеты со взрывом', unlockAt:12, hire:1500, base:80, dmg:32, rate:2.6},
 flamer:{name:'Огнемётчик', role:'Поджигает цели вблизи: урон огнём 3 секунды', unlockAt:16, hire:2400, base:90, dmg:14, rate:1.1, range:420},
 frost:{name:'Морозильщик', role:'Ледяные снаряды замедляют стрельбу врага', unlockAt:20, hire:3500, base:100, dmg:16, rate:1.6},
 gatling:{name:'Пулемётчик', role:'Очередь из пяти пуль', unlockAt:25, hire:5500, base:110, dmg:6, rate:1.7},
 shield:{name:'Щитоносец', role:'Ставит энергощит, который принимает урон на себя', unlockAt:30, hire:8000, base:120, shield:45, rate:8, support:true},
 thunder:{name:'Капитан Гром', legend:true, gems:990, role:'Бьёт молниями с неба по шести целям. Весь экипаж наносит +10% урона', base:150, dmg:55, rate:6},
 atlas:{name:'Атлас', legend:true, gems:790, role:'Боевой автоматон: мощный лазер, корпус чинится сам', base:130, dmg:20, rate:0.9},
 valkyrie:{name:'Валькирия', legend:true, gems:690, role:'Залп из трёх ракет по баллонам. +15% монет за бой', base:130, dmg:26, rate:3.2},
 blizzard:{name:'Вьюга', legend:true, gems:1190, role:'Буран замораживает весь вражеский экипаж на 2 секунды', base:160, dmg:35, rate:8},
};
const CREW_IDS=Object.keys(CREW), CREW_MAX=300;
const REG_IDS=CREW_IDS.filter(id=>!CREW[id].legend), LEG_IDS=CREW_IDS.filter(id=>CREW[id].legend);
const crewDmg=(id,l)=>GROW(CREW[id].dmg||0,l);
const crewHeal=l=>GROW(CREW.mechanic.heal,l);
const crewShield=l=>GROW(CREW.shield.shield,l);
const crewRate=(id,l)=>CREW[id].rate*Math.pow(0.99,Math.min(l-1,50));
const crewCost=(id,l)=>COSTF(CREW[id].base,l);

/* ================= economy: containers, shop, wheel ================= */
const CONT={
 wood:{name:'Деревянный ящик', coins:[0.8,1.4], gears:[3,6], gems:30},
 steel:{name:'Стальной контейнер', coins:[1.8,3], gears:[8,14], gems:60},
 gold:{name:'Золотой сундук', coins:[4,7], gears:[20,35], gems:150},
 ark:{name:'Небесный ковчег', coins:[10,16], gears:[50,80], gems:400},
};
const CONT_IDS=Object.keys(CONT);
const PRODUCTS=[
 {id:'gems_80', gems:80, rub:79, name:'Горсть алмазов'},
 {id:'gems_420', gems:420, rub:379, name:'Мешочек алмазов'},
 {id:'gems_900', gems:900, rub:749, name:'Шкатулка алмазов'},
 {id:'gems_1900', gems:1900, rub:1490, name:'Сундук алмазов', hot:true},
 {id:'gems_5200', gems:5200, rub:3790, name:'Ларь алмазов'},
 {id:'gems_11500', gems:11500, rub:7490, name:'Сокровищница'},
];
const STARTER={id:'starter_pack', rub:149, name:'Набор новичка', gems:300, cont:'gold', coinsX:5};
const productBonus=p=>Math.round((p.gems/p.rub)/(80/79)*100-100);
const PRICE={spin:30, revive:20, coinsPack:50, gearsPack:50};
const AD_LIMIT={wheel:2, coins:5, power:1};
const POWER_MIN=20, POWER_DMG=1.3, POWER_COINS=1.5;
const WHEEL=[
 {id:'coinsS', w:25.4}, {id:'gearsS', w:15}, {id:'wood', w:16}, {id:'coinsL', w:12}, {id:'hero', hero:'thunder', w:0.3},
 {id:'steel', w:10}, {id:'power', w:8}, {id:'gearsL', w:8}, {id:'gold', w:5}, {id:'hero', hero:'valkyrie', w:0.3},
];
const TIPS=[
 'Нажмите на <b>баллон врага</b> — весь экипаж будет бить по нему. Без баллонов корабль рухнет.',
 '<b>Гарпунёр</b> прокалывает баллоны втрое быстрее остальных.',
 'Чем <b>больше баллонов</b>, тем меньше риск рухнуть, если один лопнет.',
 '<b>Подъёмный винт</b> держит корабль, даже когда баллоны пробиты.',
 '<b>Канонир</b> стреляет навесом и достаёт вражеский экипаж за стенами.',
 'Ставьте <b>стены у носа</b> — они закрывают стрелков от огня.',
 'Внизу воздух плотнее: подбитый корабль может удержаться над землёй. <b>Балласт</b> помогает.',
 '<b>Порох</b> в Арсенале усиливает сразу весь экипаж.',
 'Улучшения выше 9-го уровня требуют <b>шестерни</b>. Их дают контейнеры и боссы.',
 'Раз в день колесо фортуны крутится <b>бесплатно</b>.',
];

/* ================= save ================= */
const SAVE_KEY='skyBastions.v1';
function blankCrew(){ const o={}; for(const id of CREW_IDS) o[id]={own:id==='gunner'?1:0, lvl:1}; return o; }
function defaultSave(){
  return {v:2, coins:50, gears:0, gems:0, maxLevel:1, stars:{}, sound:true, tutorial:true,
    up:{wall:1,hull:1,frame:1,autoRep:0,powder:0,sights:0,loot:0,bCount:1,bLift:1,bHp:1,bPatch:0,thrust:1,rotor:0,boost:1,dodge:0},
    crew:blankCrew(), grid:[['W','W','gunner','W','W'],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]],
    cont:{wood:0,steel:0,gold:0,ark:0}, daily:{day:'',wheelFree:0,wheelAd:0,adCoins:0,power:0}, powerUntil:0, bought:{}};
}
function migrate(s){
  const d=defaultSave();
  if(!s||typeof s!=='object'||(s.v!==1&&s.v!==2)) return d;
  if(s.v===1){ s.maxLevel=Math.max(1,s.maxLevel||s.level||1); s.v=2; }
  const num=(k)=>{ if(typeof s[k]!=='number'||!isFinite(s[k])||s[k]<0) s[k]=d[k]; };
  ['coins','gears','gems','maxLevel','powerUntil'].forEach(num);
  s.maxLevel=Math.max(1,Math.floor(s.maxLevel));
  s.up=Object.assign({},d.up,s.up||{});
  for(const k in UPG) s.up[k]=clamp(Math.floor(s.up[k]||0),UPG[k].min===0?0:1,UPG[k].max);
  s.crew=s.crew||{};
  for(const k of CREW_IDS) s.crew[k]=Object.assign({},d.crew[k],s.crew[k]||{});
  if(!Array.isArray(s.grid)||s.grid.length!==4||s.grid.some(r=>!Array.isArray(r)||r.length!==COLS)) s.grid=d.grid;
  for(const row of s.grid) for(let c=0;c<COLS;c++){ const v=row[c]; if(v&&v!=='W'&&!CREW[v]) row[c]=null; }
  s.cont=Object.assign({},d.cont,s.cont||{});
  s.daily=Object.assign({},d.daily,s.daily||{});
  s.stars=s.stars&&typeof s.stars==='object'?s.stars:{};
  s.bought=s.bought&&typeof s.bought==='object'?s.bought:{};
  if(typeof s.sound!=='boolean') s.sound=true;
  if(typeof s.tutorial!=='boolean') s.tutorial=s.maxLevel<=1;
  delete s.level;
  return s;
}
function loadSave(){ try{ const raw=localStorage.getItem(SAVE_KEY); if(raw) return migrate(JSON.parse(raw)); }catch(e){} return defaultSave(); }
function persist(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(save)); }catch(e){} }
let save=null;
function todayKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function daily(){ const k=todayKey(); if(save.daily.day!==k) save.daily={day:k,wheelFree:0,wheelAd:0,adCoins:0,power:0}; return save.daily; }
const powerActive=()=>Date.now()<save.powerUntil;

/* ================= platform: rewarded ads and payments =================
   Release build: the Android wrapper injects window.SkyNative with
     showRewarded(jsonArgs, callbackId)  and  purchase(jsonArgs, callbackId)
   and answers with SkyPlatform.resolve(callbackId, '{"ok":true}').
   Without the wrapper the game runs in an honest test mode: nothing is charged. */
const Platform={
  _cb:{}, _id:0,
  native(){ return window.SkyNative||null; },
  billingReady(){ const n=this.native(); return !!(n&&n.purchase); },
  adsReady(){ const n=this.native(); return !!(n&&n.showRewarded); },
  call(method,arg){ const n=this.native(); return new Promise(res=>{ const id='cb'+(++this._id); this._cb[id]=res; try{ n[method](JSON.stringify(arg||{}),id); }catch(e){ delete this._cb[id]; res({ok:false,error:String(e)}); } }); },
  resolve(id,json){ const f=this._cb[id]; if(!f) return; delete this._cb[id]; let r; try{ r=typeof json==='string'?JSON.parse(json):json; }catch(e){ r={ok:false}; } f(r||{ok:false}); },
  showRewarded(placement){ return this.adsReady()?this.call('showRewarded',{placement}):testAd(placement); },
  purchase(product){ return this.billingReady()?this.call('purchase',{productId:product.id, priceRub:product.rub}):testPay(product); },
};
window.SkyPlatform={resolve:(id,json)=>Platform.resolve(id,json)};

/* ================= sound ================= */
const Snd={
  ac:null, master:null, noise:null, last:{},
  init(){ if(this.ac){ if(this.ac.state==='suspended') this.ac.resume(); return; }
    try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; this.ac=new AC(); this.master=this.ac.createGain(); this.master.gain.value=0.45; this.master.connect(this.ac.destination);
      const len=this.ac.sampleRate; const buf=this.ac.createBuffer(1,len,this.ac.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; this.noise=buf; }catch(e){ this.ac=null; } },
  play(n,v){ if(!save||!save.sound||!this.ac||this.ac.state!=='running') return; const t=this.ac.currentTime; if(this.last[n]&&t-this.last[n]<0.045) return; this.last[n]=t; const f=this['s_'+n]; if(f) try{ f.call(this,t,v==null?1:v); }catch(e){} },
  env(g,t,a,d,p){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002,p),t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); },
  nz(t,dur,type,freq,q,p,a){ a=a||0.004; const s=this.ac.createBufferSource(); s.buffer=this.noise; const f=this.ac.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q||1; const g=this.ac.createGain(); this.env(g,t,a,dur,p); s.connect(f); f.connect(g); g.connect(this.master); s.start(t,Math.random()*0.4); s.stop(t+a+dur+0.05); return f; },
  tn(t,type,f0,f1,dur,p,a){ a=a||0.004; const o=this.ac.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur); const g=this.ac.createGain(); this.env(g,t,a,dur,p); o.connect(g); g.connect(this.master); o.start(t); o.stop(t+a+dur+0.05); },
  s_shot(t,v){ this.nz(t,0.07,'highpass',1700,0.7,0.16*v); this.tn(t,'square',380,140,0.05,0.04*v); },
  s_snipe(t,v){ this.nz(t,0.12,'highpass',900,0.6,0.3*v); this.tn(t,'square',900,120,0.12,0.08*v); },
  s_cannon(t,v){ this.tn(t,'sine',150,42,0.28,0.45*v); this.nz(t,0.22,'lowpass',800,0.8,0.25*v); },
  s_rocket(t,v){ const f=this.nz(t,0.35,'bandpass',400,1.5,0.25*v); f.frequency.exponentialRampToValueAtTime(1800,t+0.35); },
  s_flame(t,v){ this.nz(t,0.3,'lowpass',1400,0.6,0.2*v,0.04); },
  s_ice(t,v){ this.tn(t,'triangle',1800,2600,0.12,0.08*v); this.nz(t,0.08,'highpass',4000,0.5,0.1*v); },
  s_laser(t,v){ this.tn(t,'sawtooth',1400,300,0.18,0.1*v); },
  s_pop(t,v){ this.nz(t,0.16,'bandpass',1300,0.9,0.5*v); this.tn(t,'triangle',760,110,0.16,0.22*v); },
  s_boom(t,v){ this.nz(t,0.7,'lowpass',520,0.7,0.55*v,0.01); this.tn(t,'sine',95,30,0.6,0.45*v); },
  s_hit(t,v){ this.nz(t,0.05,'bandpass',700,1.4,0.18*v); },
  s_crunch(t,v){ this.nz(t,0.22,'lowpass',900,1,0.35*v); this.tn(t,'square',190,60,0.15,0.08*v); },
  s_coin(t,v){ this.tn(t,'sine',988,0,0.06,0.11*v); this.tn(t+0.06,'sine',1319,0,0.12,0.11*v); },
  s_zap(t,v){ this.tn(t,'sawtooth',420,1600,0.12,0.12*v); this.nz(t,0.14,'highpass',3000,0.5,0.16*v); },
  s_thunder(t,v){ this.nz(t,0.9,'lowpass',300,0.7,0.6*v,0.01); this.nz(t,0.15,'highpass',2500,0.5,0.3*v); },
  s_harpoon(t,v){ const f=this.nz(t,0.24,'bandpass',500,2,0.3*v); f.frequency.exponentialRampToValueAtTime(2600,t+0.24); },
  s_heal(t,v){ this.tn(t,'sine',660,990,0.14,0.08*v); },
  s_shield(t,v){ this.tn(t,'sine',300,900,0.3,0.12*v); },
  s_ram(t,v){ this.tn(t,'sawtooth',95,38,0.42,0.3*v); this.nz(t,0.45,'lowpass',420,1,0.55*v); },
  s_click(t,v){ this.tn(t,'sine',720,480,0.05,0.12*v); },
  s_tick(t,v){ this.tn(t,'square',1200,900,0.025,0.05*v); },
  s_buy(t,v){ [523,659,784,1047].forEach((f,i)=>this.tn(t+i*0.06,'triangle',f,0,0.12,0.14*v)); },
  s_open(t,v){ this.nz(t,0.25,'bandpass',600,1,0.3*v); [784,988,1175,1568].forEach((f,i)=>this.tn(t+0.15+i*0.07,'triangle',f,0,0.15,0.14*v)); },
  s_legend(t,v){ [523,659,784,1047,1319,1568].forEach((f,i)=>this.tn(t+i*0.09,'triangle',f,0,0.3,0.16*v)); },
  s_win(t,v){ [523,659,784,659,784,1047].forEach((f,i)=>this.tn(t+i*0.11,'triangle',f,0,0.2,0.16*v)); },
  s_lose(t,v){ [392,330,262,196].forEach((f,i)=>this.tn(t+i*0.16,'triangle',f,0,0.25,0.15*v)); },
  s_bag(t,v){ this.nz(t,0.3,'bandpass',300,1,0.25*v); },
};
