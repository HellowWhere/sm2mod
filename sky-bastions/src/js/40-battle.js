/* ================= battle setup ================= */
function makeLevel(n){
  const info=levelInfo(n), c=info.circle, st=info.stage, len=2000+st*180, ev=[];
  const g=Math.min(6,1+Math.floor(st/2)+Math.floor((c-1)/2)), bm=Math.min(5,Math.floor(st/2)+Math.floor((c-1)/2));
  ev.push({at:160, type:'wave', g:Math.min(g,3), b:n>=2?Math.min(bm,2):0});
  ev.push({at:520, type:'chest'});
  ev.push({at:800, type:'ship', kind:n<=2?'scout':(st>=3||c>1)?'frigate':'scout'});
  ev.push({at:1150, type:'wave', g, b:bm});
  if(!info.boss&&(st>=2||c>=2)) ev.push({at:1450, type:'ship', kind:'scout'});
  if(!info.boss&&(st>=4||c>=3)) ev.push({at:1700, type:'ship', kind:c>=3?'frigate':'scout'});
  ev.push({at:Math.round(len*0.64), type:'chest'});
  if(n>=2) ev.push({at:len-700, type:'wave', g:Math.min(7,g+1), b:Math.min(6,bm+1)});
  ev.push({at:len-380, type:'ship', kind:info.boss?'boss':(st>=3||c>1)?'frigate':'scout'});
  if(info.boss&&c>=2) ev.push({at:len-360, type:'ship', kind:'scout'});
  ev.sort((a,b)=>a.at-b.at);
  return {len, ev, boss:info.boss, info};
}
let hudTopPx=60;
function battleLayout(){ hudTopPx=(LAND?54:62)+safeTop(); cam.gsy=H-(LAND?32:150); cam.s=targetScale(); cam.y=-cam.gsy/cam.s; }
function targetScale(){
  let need=380;
  for(const s of ships){
    if(s.dead) continue;
    if(s!==P&&s.x-cam.x>W/cam.s+200) continue;
    let top=-s.topRows*B-34; for(const b of s.balloons) if(b.alive) top=Math.min(top,b.ly-b.R);
    need=Math.max(need,-(s.cruiseY+top)+26);
  }
  return clamp(Math.min(W/700,(cam.gsy-hudTopPx)/need),0.3,1.7);
}
let _safeTop=null;
function safeTop(){ if(_safeTop==null){ const d=document.createElement('div'); d.style.cssText='position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden'; document.body.appendChild(d); _safeTop=d.getBoundingClientRect().height||0; d.remove(); } return _safeTop; }
function camLeftMargin(){ const vis=W/cam.s; let m=125+Math.max(0,vis-700)*0.28; if(LAND){ const want=190/cam.s+140; m=Math.max(m,Math.min(want,vis-600)); } return m; }
function startBattle(n){
  hideModal(); $('panel').hidden=true; panelName=null;
  n=Math.max(1,Math.min(n,save.maxLevel));
  const lv=makeLevel(n);
  run={n, info:lv.info, len:lv.len, ev:lv.ev, boss:lv.boss, evIdx:0, replay:n<save.maxLevel, coins:0, gears:0, conts:[], shown:0, time:0, over:null, overT:0, ballast:1, focus:null, startX:0,
    tut:save.tutorial&&n===1, tutStep:0, lostBalloon:false, finished:false, revived:false};
  setLoc(lv.info.loc);
  ships=[]; fliers=[]; projs=[]; parts=[]; coinsFx=[]; burns=[]; shake=0;
  P=makeShip(playerSpec(),0); P.ramT=2; ships.push(P);
  cam.x=0; battleLayout(); cam.x=P.x-camLeftMargin();
  mode='battle'; paused=false;
  $('hangar').hidden=true; $('hud').hidden=false;
  const L=LOCS[lv.info.loc];
  $('bLevel').textContent='Ур. '+n;
  $('bName').textContent=lv.boss?'Босс «'+L.boss+'»':L.name+' · '+lv.info.stage+'/5';
  const marks=$('routeMarks'); marks.innerHTML='';
  for(const e of run.ev) if(e.type==='ship'){ const m=document.createElement('div'); m.className='mark'+(e.kind==='boss'?' boss':''); m.style.left=(e.at/run.len*100)+'%'; m.style.backgroundImage='url('+icon(e.kind==='boss'?'skullboss':'skull')+')'; marks.appendChild(m); e.mark=m; }
  $('routeShip').style.backgroundImage='url('+icon('shipmini')+')';
  $('powerChip').hidden=!powerActive(); $('powerChipTxt').textContent='Усиление: +30% урона, +50% монет';
  updateCoinTarget(); hudT=0; lastShownCoins=-1;
  if(run.tut) toast('Корабль летит сам, экипаж стреляет без команды',3.2);
  else if(lv.boss) toast('Впереди босс «'+L.boss+'»!',2.6);
}
function updateCoinTarget(){ const r=$('bCoinsPill').getBoundingClientRect(); coinTarget={x:r.left+16,y:r.top+r.height/2}; }
function backToHangar(){
  hideModal(); $('sys').hidden=true; mode='hangar'; paused=false; run=null;
  $('hud').hidden=true; $('hangar').hidden=false;
  rebuildPreview(); renderSheet();
}

/* ================= spawning ================= */
function camRight(){ return cam.x+W/cam.s; }
function fireEvent(e){
  const n=run.n, D=diffOf(n);
  if(e.type==='wave'){
    for(let i=0;i<e.g;i++){ const hp=Math.round(26*D.hp), by=DECK-rand(30,230); fliers.push({kind:'flier', sub:'glider', x:camRight()+60+i*70+rand(0,40), y:by, baseY:by, hp, max:hp, r:18, t:rand(0,10), cd:rand(1.2,2.2), hold:rand(170,380), dead:false, hit:0, reward:Math.round((4+Math.min(n,30)*0.3)*D.rew), dmg:5*D.dmg}); }
    for(let i=0;i<e.b;i++){ const hp=Math.round(18*D.hp); fliers.push({kind:'flier', sub:'bomb', x:camRight()+120+i*90+rand(0,60), y:DECK-rand(40,260), hp, max:hp, r:15, t:rand(0,10), speed:rand(55,75), dead:false, hit:0, reward:Math.round(3*D.rew), dmg:34*D.dmg}); }
  } else if(e.type==='chest'){
    const hp=Math.round(22*D.hp); fliers.push({kind:'flier', sub:'chest', x:camRight()+40, y:DECK-rand(170,300), vx:-28, vy:-5, hp, max:hp, r:17, t:0, dead:false, hit:0, neutral:true, reward:Math.round(levelReward(n)*0.6)});
    if(run.tut&&run.tutStep<2) toast('Сундук на шаре! Нажмите на него, чтобы сбить',2.8);
  } else if(e.type==='ship'){
    const sp=enemySpec(n,e.kind), s=makeShip(sp,camRight()+sp.cols*B/2+120);
    s.cruiseY=DECK+rand(-45,25); s.y=s.cruiseY; s.ramT=8; ships.push(s); e.ship=s;
    if(run.tut&&run.tutStep<1){ run.tutStep=1; toast('Пират! Нажмите на его баллон — экипаж ударит туда. Без баллонов корабль рухнет',4.2); }
  }
}

/* ================= particles & fx ================= */
function addP(o){ if(parts.length<700) parts.push(o); }
function shakeAdd(v){ shake=Math.min(16,shake+v*(reduceMotion?0.25:1)); }
function addText(x,y,txt,col,size,big){ addP({t:big?'banner':'text', x:x+rand(-6,6), y, vx:0, vy:big?-30:-70, life:big?1.3:0.75, max:big?1.3:0.75, txt, c:col, size:size||16}); }
function puff(x,y,n,col,sz){ for(let i=0;i<n;i++) addP({t:'smoke', x:x+rand(-8,8), y:y+rand(-8,8), vx:rand(-30,30), vy:rand(-40,-8), r:rand(5,10)*(sz||1), gr:rand(10,22), life:rand(0.5,1), max:1, c:col||'#eef0f6'}); }
function explosion(x,y,size){
  addP({t:'flash', x, y, r:size*1.3, life:0.12, max:0.12});
  addP({t:'ring', x, y, r:size*0.3, gr:size*5, life:0.35, max:0.35, c:'#fff3c4'});
  for(let i=0;i<9;i++){ const a=rand(0,TAU), sp=rand(0.5,1.5)*size*2.4; addP({t:'fire', x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-20, r:rand(0.3,0.55)*size, life:rand(0.25,0.5), max:0.5}); }
  for(let i=0;i<6;i++) addP({t:'smoke', x:x+rand(-10,10), y:y+rand(-10,10), vx:rand(-40,40), vy:rand(-50,-10), r:size*rand(0.25,0.4), gr:rand(15,30), life:rand(0.7,1.2), max:1.2, c:'#5e5866'});
  for(let i=0;i<8;i++){ const a=rand(0,TAU), sp=rand(150,380); addP({t:'spark', x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:rand(0.2,0.4), max:0.4}); }
  shakeAdd(size*0.1);
}
function addDebris(x,y,mat,n){ for(let i=0;i<n;i++) addP({t:'debris', x:x+rand(-10,10), y:y+rand(-10,10), vx:rand(-160,160), vy:rand(-260,-60), w:rand(6,13), h:rand(5,10), rot:rand(0,TAU), vr:rand(-10,10), life:rand(1,1.8), max:1.8, c:pick([mat.base,mat.dark,mat.light])}); }
function popFx(x,y,R,look){
  addP({t:'ring', x, y, r:R*0.6, gr:R*6, life:0.3, max:0.3, c:'#ffffff'});
  for(let i=0;i<14;i++){ const a=rand(0,TAU), sp=rand(80,260); addP({t:'shred', x:x+Math.cos(a)*R*0.6, y:y+Math.sin(a)*R*0.6, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-60, rot:rand(0,TAU), vr:rand(-12,12), s:rand(5,10), life:rand(0.8,1.4), max:1.4, c:i%2?look.a:look.b}); }
}
function addChute(x,y,crew,pirate){ addP({t:'chute', x, y, vx:rand(-20,20), vy:-40, life:5, max:5, crew, pirate, age:0}); }
function addLoose(x,y,b){ addP({t:'loose', x, y, vx:rand(-20,20), vy:-30, life:4, max:4, R:b.R, look:b.look, armor:b.armor}); }
function bolt(a,b,col){ const pts=[a]; const n=6; for(let i=1;i<n;i++){ const u=i/n; pts.push({x:lerp(a.x,b.x,u)+rand(-12,12), y:lerp(a.y,b.y,u)+rand(-12,12)}); } pts.push(b); addP({t:'bolt', pts, x:0, y:0, vx:0, vy:0, life:0.22, max:0.22, c:col}); }
function snowBurst(x,y,n){ for(let i=0;i<n;i++){ const a=rand(0,TAU), sp=rand(40,180); addP({t:'snow', x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:rand(0.6,1.1), max:1.1, r:rand(1.5,3.5)}); } }
function spawnCoins(wx,wy,amount){
  if(!run||amount<=0) return;
  amount=Math.round(amount*((P&&P.spec.coinMul)||1));
  run.coins+=amount;
  const n=Math.min(12,Math.max(1,Math.round(amount/5)));
  const sx=(wx-cam.x)*cam.s, sy=(wy-cam.y)*cam.s;
  for(let i=0;i<n;i++) coinsFx.push({x:sx, y:sy, vx:rand(-140,140), vy:rand(-300,-140), t:0, delay:i*0.035, val:amount/n, spin:rand(0,6)});
}
function addGears(wx,wy,n){ if(!run||n<=0) return; run.gears+=n; addP({t:'gtext', x:wx, y:wy, vx:0, vy:-45, life:1.4, max:1.4, n}); }

/* ================= damage & statuses ================= */
function damage(p,amt,hx,hy){
  if(!partAlive(p)) return;
  const s=p.ship;
  if(s&&s.invuln>0) return;
  amt=Math.max(1,amt);
  if(s&&s.shield>0){ const a=Math.min(s.shield,amt); s.shield-=a; amt-=a; s.shieldHit=1; if(amt<0.5){ if(Math.random()<0.25) addText(hx,hy-8,'щит','#9fe8ff',13); return; } }
  amt=Math.max(1,Math.round(amt));
  p.hp-=amt; p.hit=0.12;
  const own=p.kind==='flier'?-1:s.side;
  addText(hx,hy-8,fmt(amt),own===1?'#ff9b8a':(p.kind==='balloon'?'#ffe066':'#ffffff'),own===1?14:16);
  if(p.hp<=0){ p.hp=0; destroyPart(p); }
}
function heal(p,amt,quiet){
  if(!partAlive(p)) return;
  const v=Math.min(p.max-p.hp,Math.round(amt)); if(v<=0) return;
  p.hp+=v; if(quiet) return;
  const q=partPos(p); addText(q.x,q.y-10,'+'+fmt(v),'#7dff8a',15);
  for(let i=0;i<4;i++) addP({t:'heal', x:q.x+rand(-12,12), y:q.y+rand(-10,10), vx:0, vy:-40, life:0.6, max:0.6});
}
function addBurn(p,dps){
  if(!partAlive(p)) return;
  if(p.kind==='flier'){ damage(p,dps,p.x,p.y); return; }
  const b=burns.find(x=>x.p===p); if(b){ b.t=3; b.dps=Math.max(b.dps,dps); } else burns.push({p,t:3,dps,acc:0});
}
function updateBurns(dt){
  for(const b of burns){
    b.t-=dt; b.acc+=dt;
    if(!partAlive(b.p)){ b.t=0; continue; }
    const q=partPos(b.p);
    if(Math.random()<dt*14) addP({t:'fire', x:q.x+rand(-12,12), y:q.y+rand(-8,10), vx:rand(-10,10), vy:-50, r:rand(4,7), life:0.4, max:0.4});
    if(b.acc>=0.5){ b.acc-=0.5; damage(b.p,b.dps*0.5,q.x,q.y); }
  }
  burns=burns.filter(b=>b.t>0);
}
function destroyPart(p){
  if(run&&run.focus===p) run.focus=null;
  if(p.kind==='cell'){
    p.alive=false; const s=p.ship, q=cellPos(s,p);
    addDebris(q.x,q.y,MATS[s.matTier],8); puff(q.x,q.y,4);
    if(p.type==='crew') addChute(q.x,q.y-6,p.crew,s.spec.pirate);
    Snd.play('crunch'); shakeAdd(2);
  } else if(p.kind==='balloon'){
    p.alive=false; const q=balPos(p.ship,p);
    popFx(q.x,q.y,p.R,BLOOK[p.look]||BLOOK.p0); Snd.play('pop'); shakeAdd(3);
    if(p.ship.side===-1) addText(q.x,q.y-p.R,'ПУФ!','#ffffff',24,true);
    else if(run){ run.lostBalloon=true; if(!run.balWarned){ run.balWarned=true; toast('Баллон лопнул! Подъём упал',2.2); } }
  } else if(p.kind==='hull'){
    killShip(p.ship,'destroyed');
  } else if(p.kind==='flier'){
    p.dead=true;
    if(p.sub==='chest'){
      popFx(p.x,p.y,p.r,BLOOK.gold); addP({t:'crate', x:p.x, y:p.y+26, vx:0, vy:-40, rot:0, vr:rand(-2,2), life:2.2, max:2.2}); Snd.play('pop');
      if(run&&Math.random()<0.35){ run.conts.push('wood'); addText(p.x,p.y-48,'+ ящик','#ffe066',20,true); } else addText(p.x,p.y-24,'Клад!','#ffe066',22,true);
      if(run&&Math.random()<0.5) addGears(p.x+20,p.y-10,Math.max(1,Math.round(2*gearMul(run.n))));
    } else { explosion(p.x,p.y,p.sub==='bomb'?30:20); Snd.play('boom',0.6); if(p.sub==='glider') addChute(p.x,p.y,'gunner',true); }
    spawnCoins(p.x,p.y,p.reward);
  }
}
function killShip(s,how){
  if(s.dead) return;
  s.dead=true; s.hull.alive=false; s.shield=0;
  s.vy=how==='crash'?0:-30; s.rotV=(s.side===1?1:-1)*rand(0.25,0.45);
  if(run&&run.focus&&run.focus.ship===s) run.focus=null;
  for(const c of s.cells) if(c.alive&&c.type==='crew'){ const q=cellPos(s,c); addChute(q.x,q.y-6,c.crew,s.spec.pirate); }
  for(const b of s.balloons) if(b.alive){ const q=balPos(s,b); addLoose(q.x,q.y,b); b.alive=false; }
  explosion(s.x,s.y+14,46); Snd.play('boom');
  if(how==='crash') crashFx(s);
  if(s.side===-1&&run){
    const crash=how==='crash';
    spawnCoins(s.x,crash?-30:s.y,Math.round(s.spec.reward*(crash?1.5:1)));
    if(s.spec.gears) addGears(s.x+30,(crash?-60:s.y-30),s.spec.gears);
    addText(s.x,crash?-60:s.y-60,crash?'СБИТ! ×1,5':'РАЗГРОМЛЕН!','#ffe066',30,true);
    if(s.spec.boss) addText(s.x,(crash?-110:s.y-110),'Босс повержен!','#ffb43a',26,true);
    if(run.tut&&run.tutStep<2){ run.tutStep=2; setTimeout(()=>{ if(mode==='battle'&&run&&!run.over) toast('Когда враг рядом, жмите «Таран» — удар носом корабля',3.4); },1400); }
  }
}
function crashFx(s){
  s.gone=true;
  explosion(s.x,-8,70);
  for(const c of s.cells) if(c.alive){ const q=cellPos(s,c); addDebris(q.x,Math.min(q.y,-10),MATS[s.matTier],3); }
  addDebris(s.x,-10,{base:'#b36f36',dark:'#7c4520',light:'#dc9d5f'},10);
  puff(s.x,-10,10,'#7a7484',2.2);
  Snd.play('boom'); shakeAdd(10);
}

/* ================= combat ================= */
function shipParts(s,withBal){ const a=[]; for(const c of s.cells) if(c.alive) a.push(c); a.push(s.hull); if(withBal) for(const b of s.balloons) if(b.alive) a.push(b); return a; }
function nearest(from,list,maxD){ const md=maxD||RANGE; let best=null, bd=md*md; for(const p of list){ const q=partPos(p), d=(q.x-from.x)*(q.x-from.x)+(q.y-from.y)*(q.y-from.y); if(d<bd){ bd=d; best=p; } } return best; }
function hostileShips(side){ return ships.filter(o=>o.side!==side&&!o.dead); }
function hostilePool(side,withBal){ const a=[]; for(const o of hostileShips(side)) for(const p of shipParts(o,withBal)) a.push(p); if(side===1) for(const f of fliers) if(!f.dead&&!f.neutral) a.push(f); return a; }
const crewRange=id=>CREW[id].range||RANGE;
function pickTarget(s,cell){
  const type=cell.crew, from=muzzleBase(s,cell), rg=crewRange(type);
  if(type==='mechanic'){ let best=null, br=0.97; for(const p of shipParts(s,true)){ const r=p.hp/p.max*(p.kind==='balloon'?0.85:1); if(r<br){ br=r; best=p; } } return best; }
  if(type==='shield'){ const mx=crewShield(cell.lvl)*3; return s.shield<mx*0.8?s.hull:null; }
  const foes=hostileShips(s.side), fl=s.side===1?fliers.filter(f=>!f.dead&&!f.neutral):[];
  const parts=[]; for(const o of foes) for(const c of o.cells) if(c.alive) parts.push(c); for(const o of foes) parts.push(o.hull);
  const bals=[]; for(const o of foes) for(const b of o.balloons) if(b.alive) bals.push(b);
  const crewCells=parts.filter(p=>p.kind==='cell'&&p.type==='crew');
  let t=null;
  switch(type){
    case 'harpoon': case 'valkyrie': t=nearest(from,bals,rg)||nearest(from,fl.filter(f=>f.sub==='bomb'),rg)||nearest(from,fl,rg)||nearest(from,parts,rg); break;
    case 'cannon': { const inR=crewCells.filter(p=>{ const q=partPos(p); return Math.hypot(q.x-from.x,q.y-from.y)<rg; }); t=inR.length?pick(inR):(nearest(from,parts,rg)||nearest(from,fl,rg)); break; }
    case 'sniper': case 'frost': t=nearest(from,crewCells,rg)||nearest(from,parts,rg)||nearest(from,fl,rg); break;
    case 'tesla': case 'gatling': case 'gunner': t=nearest(from,fl,520)||nearest(from,parts,rg)||nearest(from,fl,rg); break;
    default: t=nearest(from,parts,rg)||nearest(from,fl,rg)||nearest(from,bals,rg);
  }
  if(!t&&s.side===1) t=nearest(from,fliers.filter(f=>!f.dead&&f.neutral),560);
  return t;
}
function bullet(side,x,y,a,sp,dmg,rad){ projs.push({type:'bullet', side, x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, g:0, dmg, rad:rad||3, life:2}); }
function rocket(side,x,y,ang,target,dmg){ projs.push({type:'rocket', side, x, y, ang, sp:240, target, dmg, rad:5, splash:42, life:4, trail:0, vx:0, vy:0, g:0}); }
function fire(s,cell,tg,from,tp){
  const type=cell.crew, side=s.side, dmg=crewDmg(type,cell.lvl)*(s.spec.dmgMul||1), vol=side===1?0.75:0.4;
  let tx=tp.x, ty=tp.y; if(side===-1){ tx+=rand(-14,14); ty+=rand(-14,14); }
  const dx=tx-from.x, dy=ty-from.y, dd=Math.hypot(dx,dy)||1, ux=dx/dd, uy=dy/dd, mx=from.x+ux*22, my=from.y+uy*22, ang=Math.atan2(dy,dx);
  cell.recoil=1;
  switch(type){
    case 'gunner': bullet(side,mx,my,ang+rand(-0.025,0.025),side===1?780:560,dmg); Snd.play('shot',vol); puff(mx,my,1,'#ffffff',0.6); break;
    case 'gatling': cell.burst=5; cell.burstT=0; cell.burstDmg=dmg; break;
    case 'sniper': projs.push({type:'snipe', side, x:mx, y:my, vx:ux*1500, vy:uy*1500, g:0, dmg, rad:3, life:1.4}); Snd.play('snipe',vol); puff(mx,my,2,'#ffffff',0.7); break;
    case 'cannon': { const T=0.75+dd/700, g=520; projs.push({type:'ball', side, x:mx, y:my, vx:(tx-mx)/T, vy:(ty-my-0.5*g*T*T)/T, g, dmg, rad:6, splash:50, life:T+2, trail:0}); Snd.play('cannon',vol); puff(mx,my,3,'#ffffff',0.9); shakeAdd(side===1?1:0.5); break; }
    case 'harpoon': { const T=dd/680, g=160; projs.push({type:'harpoon', side, x:mx, y:my, vx:(tx-mx)/T, vy:(ty-my-0.5*g*T*T)/T, g, dmg, rad:4, life:T+2}); Snd.play('harpoon',vol); break; }
    case 'rocket': rocket(side,mx,my,ang-0.5,tg,dmg); Snd.play('rocket',vol); puff(mx,my,2,'#ffffff',0.8); break;
    case 'valkyrie': { const bals=[]; for(const o of hostileShips(side)) for(const b of o.balloons) if(b.alive) bals.push(b); for(let i=0;i<3;i++){ const t2=bals.length?bals[i%bals.length]:tg; rocket(side,mx,my,ang-0.9+i*0.45,t2,dmg); } Snd.play('rocket',vol); cell.act=0.6; break; }
    case 'flamer': for(let i=0;i<5;i++) projs.push({type:'flame', side, x:mx, y:my, vx:ux*430+rand(-40,40), vy:uy*430+rand(-60,30), g:-40, dmg:dmg/5, rad:7, life:0.9, max:0.9, burn:dmg*0.5}); Snd.play('flame',vol); break;
    case 'frost': projs.push({type:'ice', side, x:mx, y:my, vx:ux*720, vy:uy*720, g:0, dmg, rad:4, life:2, chill:3}); Snd.play('ice',vol); break;
    case 'tesla': zap(s,from,tg,dmg,3); break;
    case 'thunder': skyStrike(s,dmg); cell.act=0.8; break;
    case 'atlas': { const q=partPos(tg); addP({t:'beam', x:mx, y:my, x2:q.x, y2:q.y, vx:0, vy:0, life:0.22, max:0.22}); damage(tg,dmg,q.x,q.y); for(let i=0;i<4;i++) addP({t:'spark', x:q.x, y:q.y, vx:rand(-150,150), vy:rand(-150,50), life:0.25, max:0.25}); Snd.play('laser',vol); break; }
    case 'blizzard': blizzard(s,dmg); cell.act=1; break;
    case 'mechanic': projs.push({type:'repair', side, x:from.x, y:from.y-6, vx:0, vy:-80, target:tg, heal:crewHeal(cell.lvl)*(side===1?1:s.spec.dmgMul), life:3}); cell.act=0.7; Snd.play('heal',0.7); break;
    case 'shield': { const amt=crewShield(cell.lvl); s.shield=Math.min(amt*3,s.shield+amt); cell.act=1; Snd.play('shield',vol); addP({t:'ring', x:s.x, y:s.y-40, r:40, gr:240, life:0.4, max:0.4, c:'#9fe8ff'}); break; }
  }
}
function zap(s,from,first,dmg,chains){
  const hit=[first]; let last=first; const pool=hostilePool(s.side,true);
  for(let i=0;i<chains;i++){ const lp=partPos(last); let best=null, bd=170*170; for(const p of pool){ if(hit.indexOf(p)>=0) continue; const q=partPos(p), d2=(q.x-lp.x)*(q.x-lp.x)+(q.y-lp.y)*(q.y-lp.y); if(d2<bd){ bd=d2; best=p; } } if(!best) break; hit.push(best); last=best; }
  const pos=hit.map(partPos); let prev=from;
  hit.forEach((p,i)=>{ bolt(prev,pos[i]); damage(p,dmg*Math.pow(0.85,i),pos[i].x,pos[i].y); prev=pos[i]; });
  Snd.play('zap',s.side===1?0.8:0.5);
}
function skyStrike(s,dmg){
  const pool=hostilePool(s.side,true).filter(p=>{ const q=partPos(p); return q.x<camRight()+40; });
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  const tg=pool.slice(0,6), pos=tg.map(partPos);
  tg.forEach((p,i)=>{ const q=pos[i]; bolt({x:q.x+rand(-40,40),y:q.y-700},q,'#fff6a0'); addP({t:'flash', x:q.x, y:q.y, r:40, life:0.15, max:0.15}); damage(p,dmg,q.x,q.y); });
  if(tg.length){ Snd.play('thunder',0.7); shakeAdd(4); flashT=Math.max(flashT,0.12); }
}
function blizzard(s,dmg){
  for(const o of hostileShips(s.side)){
    o.freeze=Math.max(o.freeze,2);
    for(const c of o.cells) if(c.alive&&c.type==='crew'){ const q=cellPos(o,c); damage(c,dmg*0.5,q.x,q.y); snowBurst(q.x,q.y,6); }
    snowBurst(o.x,o.y-60,24);
  }
  if(s.side===1) for(const f of fliers) if(!f.dead&&!f.neutral&&f.x<camRight()){ damage(f,dmg,f.x,f.y); snowBurst(f.x,f.y,6); }
  Snd.play('ice',0.9);
}
function updateCrew(s,dt){
  const slow=s.freeze>0?0:s.chill>0?0.55:1, rateMul=s.spec.rateMul||1;
  for(const cell of s.cells){
    if(cell.hit>0) cell.hit-=dt;
    if(!cell.alive||cell.type!=='crew') continue;
    cell.recoil=Math.max(0,cell.recoil-dt*4); cell.act=Math.max(0,cell.act-dt);
    cell.cd-=dt*slow; cell.retarget-=dt;
    let tg=cell.target;
    const sup=CREW[cell.crew]&&CREW[cell.crew].support;
    if(s.side===1&&run.focus&&partAlive(run.focus)&&!sup) tg=run.focus;
    else if(!partAlive(tg)||cell.retarget<=0||(cell.crew==='mechanic'&&tg&&tg.hp>=tg.max)){ tg=pickTarget(s,cell); cell.retarget=0.7; }
    if(tg&&!partAlive(tg)) tg=null;
    cell.target=tg;
    const from=muzzleBase(s,cell);
    if(cell.burst>0&&tg&&slow>0){ cell.burstT-=dt; if(cell.burstT<=0){ cell.burstT=0.07; cell.burst--; const q=partPos(tg); const a=Math.atan2(q.y+(s.side===-1?rand(-14,14):0)-from.y,q.x-from.x)+rand(-0.05,0.05); bullet(s.side,from.x+Math.cos(a)*24,from.y+Math.sin(a)*24,a,s.side===1?820:580,cell.burstDmg,2.5); cell.recoil=1; cell.act=0.3; Snd.play('shot',s.side===1?0.45:0.3); } }
    if(tg){
      const tp=partPos(tg), dx=tp.x-from.x, dy=tp.y-from.y, d=Math.hypot(dx,dy);
      if(!sup){ let la=Math.atan2(dy,dx*s.side); if(cell.crew==='cannon') la-=0.45; la=clamp(la,-1.3,0.95); cell.aim=lerp(cell.aim,la,1-Math.exp(-10*dt)); }
      if(cell.cd<=0&&d<crewRange(cell.crew)&&slow>0){ fire(s,cell,tg,from,tp); cell.cd=crewRate(cell.crew,cell.lvl)*rateMul*(s.side===1?1:1.15)*rand(0.94,1.06); }
    } else cell.aim=lerp(cell.aim,-0.15,dt*2);
  }
  for(const b of s.balloons) if(b.hit>0) b.hit-=dt;
  if(s.hull.hit>0) s.hull.hit-=dt;
}
function contactShip(s,x,y,r){
  for(const b of s.balloons){ if(!b.alive) continue; const q=balPos(s,b), dx=(x-q.x)/(b.R*0.9+r), dy=(y-q.y)/(b.R+r); if(dx*dx+dy*dy<1) return b; }
  for(const c of s.cells){ if(!c.alive) continue; const q=cellPos(s,c); if(Math.abs(x-q.x)<B/2+r&&Math.abs(y-q.y)<B/2+r) return c; }
  const h=hullRect(s); if(x>h.x0-r&&x<h.x1+r&&y>h.y0-r&&y<h.y1+r) return s.hull;
  return null;
}
function hitTest(p){
  if(p.side===1){ for(const f of fliers){ if(f.dead) continue; const dx=p.x-f.x, dy=p.y-f.y; if(dx*dx+dy*dy<(f.r+p.rad)*(f.r+p.rad)){ onHit(p,f); return true; } } }
  for(const s of ships){
    if(s.side===p.side||s.dead) continue;
    const part=contactShip(s,p.x,p.y,p.rad); if(!part) continue;
    if(s===P){ if(p.ghost) continue; if(!p.rolled){ p.rolled=true; if(P.spec.dodge>0&&Math.random()<P.spec.dodge){ p.ghost=true; addText(p.x,p.y-10,'Мимо!','#ffffff',14); continue; } } }
    onHit(p,part); return true;
  }
  return false;
}
function splashAt(s,x,y,rad,dmg,except){
  if(!s||s.dead) return;
  for(const c of s.cells){ if(!c.alive||c===except) continue; const q=cellPos(s,c), d=Math.hypot(q.x-x,q.y-y); if(d<rad) damage(c,dmg*(1-d/rad*0.5),q.x,q.y); }
  if(except!==s.hull&&!s.dead){ const hr=hullRect(s); if(y>hr.y0-rad&&x>hr.x0&&x<hr.x1) damage(s.hull,dmg*0.7,x,hr.y0+6); }
}
function onHit(p,part){
  let dmg=p.dmg;
  if(p.type==='harpoon'&&part.kind==='balloon') dmg*=3;
  if(p.type==='bullet'||p.type==='snipe'){ addP({t:'spark', x:p.x, y:p.y, vx:-p.vx*0.2+rand(-80,80), vy:rand(-120,0), life:0.2, max:0.2}); Snd.play('hit',0.5); }
  if(p.type==='harpoon'){ for(let i=0;i<4;i++) addP({t:'spark', x:p.x, y:p.y, vx:rand(-120,120), vy:rand(-150,20), life:0.25, max:0.25}); Snd.play('hit',0.7); }
  damage(part,dmg,p.x,p.y);
  if(p.type==='flame') addBurn(part,p.burn);
  if(p.type==='ice'){ if(part.ship) part.ship.chill=Math.max(part.ship.chill,p.chill); snowBurst(p.x,p.y,6); }
  if(p.type==='ball'||p.type==='rocket'){ explosion(p.x,p.y,p.type==='ball'?20:16); Snd.play('boom',0.45); splashAt(part.ship,p.x,p.y,p.splash,dmg*0.5,part); }
}
function wrapA(a){ while(a>Math.PI) a-=TAU; while(a<-Math.PI) a+=TAU; return a; }
function updateProjs(dt){
  for(const p of projs){
    if(p.dead) continue;
    if(p.type==='repair'){
      if(!partAlive(p.target)){ p.dead=true; continue; }
      const q=partPos(p.target), dx=q.x-p.x, dy=q.y-p.y, d=Math.hypot(dx,dy)||1;
      if(d<12){ heal(p.target,p.heal); p.dead=true; continue; }
      const k=1-Math.exp(-6*dt); p.vx=lerp(p.vx,dx/d*380,k); p.vy=lerp(p.vy,dy/d*380,k);
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; if(p.life<=0) p.dead=true; continue;
    }
    if(p.type==='rocket'){
      if(partAlive(p.target)){ const q=partPos(p.target); p.ang+=clamp(wrapA(Math.atan2(q.y-p.y,q.x-p.x)-p.ang),-4.5*dt,4.5*dt); }
      p.sp=Math.min(600,p.sp+700*dt); p.vx=Math.cos(p.ang)*p.sp; p.vy=Math.sin(p.ang)*p.sp;
      p.trail-=dt; if(p.trail<=0){ p.trail=0.03; addP({t:'smoke', x:p.x, y:p.y, vx:0, vy:-6, r:3, gr:10, life:0.45, max:0.45, c:'#f4f4f8'}); }
    }
    const sp=Math.hypot(p.vx,p.vy), steps=Math.max(1,Math.ceil(sp*dt/10)), sdt=dt/steps;
    for(let i=0;i<steps;i++){ p.vy+=p.g*sdt; p.x+=p.vx*sdt; p.y+=p.vy*sdt; if(hitTest(p)){ p.dead=true; break; } }
    if(p.type==='ball'&&!p.dead){ p.trail-=dt; if(p.trail<=0){ p.trail=0.04; addP({t:'smoke', x:p.x, y:p.y, vx:0, vy:-10, r:3, gr:8, life:0.4, max:0.4, c:'#e9ebf2'}); } }
    p.life-=dt;
    if(!p.dead&&(p.life<=0||p.y>0)){ p.dead=true; if(p.y>0&&(p.type==='ball'||p.type==='rocket')) puff(p.x,-4,3,'#cdbb9a'); }
  }
  projs=projs.filter(p=>!p.dead);
}
function randomPlayerPart(){ if(!P||P.dead) return null; const bl=P.balloons.filter(b=>b.alive); if(bl.length&&Math.random()<0.5) return pick(bl); const cs=P.cells.filter(c=>c.alive); if(cs.length) return pick(cs); return P.hull; }
function updateFliers(dt){
  const pb=bowX(P);
  for(const f of fliers){
    if(f.dead) continue;
    f.t+=dt; if(f.hit>0) f.hit-=dt;
    if(f.sub==='glider'){
      const tx=pb+f.hold, ty=f.baseY+Math.sin(f.t*1.4)*22;
      f.x+=clamp((tx-f.x)*1.5,-170,170)*dt; f.y=lerp(f.y,ty,1-Math.exp(-2*dt));
      f.cd-=dt;
      if(f.cd<=0&&f.x-pb<560&&!P.dead){ f.cd=rand(1.6,2.6); const tg=randomPlayerPart(); if(tg){ const q=partPos(tg), dx=q.x+rand(-10,10)-f.x, dy=q.y+rand(-10,10)-f.y, d=Math.hypot(dx,dy)||1; projs.push({type:'bullet', side:-1, x:f.x-14, y:f.y+6, vx:dx/d*520, vy:dy/d*520, g:0, dmg:f.dmg, rad:3, life:2}); Snd.play('shot',0.3); } }
    } else if(f.sub==='bomb'){
      if(!partAlive(f.tgt)) f.tgt=randomPlayerPart();
      if(f.tgt){ const q=partPos(f.tgt), dx=q.x-f.x, dy=q.y-f.y, d=Math.hypot(dx,dy)||1; f.x+=dx/d*f.speed*dt; f.y+=dy/d*f.speed*dt+Math.sin(f.t*2)*8*dt; }
      if(!P.dead){ const hp=contactShip(P,f.x,f.y+10,f.r*0.7); if(hp){ f.dead=true; const q=partPos(hp); damage(hp,f.dmg,q.x,q.y); splashAt(P,f.x,f.y,55,f.dmg*0.4,hp); explosion(f.x,f.y+10,32); Snd.play('boom',0.8); } }
    } else if(f.sub==='chest'){
      f.x+=f.vx*dt; f.y+=f.vy*dt+Math.sin(f.t*1.5)*6*dt;
      if(f.x<cam.x-150||f.y<cam.y-150) f.dead=true;
    }
  }
  fliers=fliers.filter(f=>!f.dead);
}
function nearestEnemy(){ let best=null, bg=Infinity; for(const s of ships){ if(s.side!==-1||s.dead) continue; const g=bowX(s)-bowX(P); if(g<bg){ bg=g; best=s; } } return {s:best, gap:bg}; }
function startRam(s,t){ if(s.ram||s.dead||!t||t.dead) return false; s.ram={target:t}; if(s===P) Snd.play('harpoon',0.9); return true; }
function updateRam(s,dt){
  if(!s.ram) return false;
  const t=s.ram.target;
  if(!t||t.dead){ s.ram=null; return false; }
  s.x+=s.side*560*dt; s.moving=true;
  if(Math.random()<0.6) addP({t:'smoke', x:sternX(s), y:s.y+20, vx:-s.side*60, vy:rand(-10,10), r:5, gr:14, life:0.5, max:0.5, c:'#ffffff'});
  if((bowX(t)-bowX(s))*s.side<=4) ramImpact(s,t);
  return true;
}
function frontCells(s){ const best={}; for(const c of s.cells){ if(!c.alive) continue; if(!best[c.r]||c.c>best[c.r].c) best[c.r]=c; } return Object.values(best); }
function ramImpact(s,t){
  const dmg=(s.spec.ram||60)*(s.side===1&&powerActive()?POWER_DMG:1);
  const cx=(bowX(s)+bowX(t))/2, cy=(s.y+t.y)/2+10;
  for(const c of frontCells(t)){ const q=cellPos(t,c); damage(c,dmg,q.x,q.y); }
  damage(t.hull,dmg*0.6,bowX(t),t.y+20);
  if(!s.dead) for(const c of frontCells(s)){ const q=cellPos(s,c); damage(c,dmg*0.12,q.x,q.y); }
  t.kx=s.side*320; s.kx=-s.side*230;
  s.ram=null; s.ramT=s.spec.ramCd||16;
  for(let i=0;i<14;i++){ const a=rand(0,TAU), sp=rand(150,420); addP({t:'spark', x:cx, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:rand(0.2,0.45), max:0.45}); }
  addDebris(cx,cy,MATS[t.matTier],6); puff(cx,cy,6,'#ffffff',1.4);
  addText(cx,cy-60,'ТАРАН!','#ffb43a',30,true);
  shakeAdd(14); Snd.play('ram');
}
function updateShipPhysics(s,dt){
  s.t+=dt; s.propA+=dt*(s.moving?22:13);
  s.x+=s.kx*dt; s.kx*=Math.exp(-4*dt);
  s.chill=Math.max(0,s.chill-dt); s.freeze=Math.max(0,s.freeze-dt); s.invuln=Math.max(0,s.invuln-dt); s.shieldHit=Math.max(0,s.shieldHit-dt*3);
  if(s.dead){
    if(s.gone) return;
    s.vy+=380*dt; s.y+=s.vy*dt; s.rot+=s.rotV*dt;
    s.smokeT-=dt; if(s.smokeT<=0){ s.smokeT=0.05; addP({t:'smoke', x:s.x+rand(-20,20), y:s.y+rand(-10,20), vx:rand(-20,20), vy:-30, r:8, gr:20, life:1, max:1, c:'#57515f'}); addP({t:'fire', x:s.x+rand(-25,25), y:s.y+rand(0,20), vx:0, vy:-40, r:9, life:0.35, max:0.35}); }
    if(s.y+30>0) crashFx(s);
    return;
  }
  if(s.side===1&&(s.spec.regen||s.spec.patch)){ s.regenT+=dt; if(s.regenT>=0.5){ s.regenT-=0.5; const r=s.spec.regen*0.5, pt=s.spec.patch*0.5; if(r>0){ for(const c of s.cells) if(c.alive) heal(c,c.max*r,true); heal(s.hull,s.hull.max*r,true); } if(pt>0) for(const b of s.balloons) if(b.alive) heal(b,b.max*pt,true); } }
  const wgt=shipWeight(s), lift=effLift(s);
  let target=clamp((wgt-lift)/wgt*90,-28,70);
  if(lift>=wgt&&s.y<=s.cruiseY+0.5) target=0;
  s.vy=lerp(s.vy,target,1-Math.exp(-1.5*dt)); s.y+=s.vy*dt;
  if(s.y<s.cruiseY){ s.y=s.cruiseY; if(s.vy<0) s.vy=0; }
  s.sinking=lift<wgt&&s.vy>1;
  const hr=s.hull.hp/s.hull.max;
  if(hr<0.5){ s.smokeT-=dt; if(s.smokeT<=0){ s.smokeT=hr<0.25?0.08:0.18; addP({t:'smoke', x:s.x+s.side*rand(-s.w/2,s.w/2), y:s.y+rand(0,20), vx:rand(-10,10)-s.side*20, vy:-35, r:6, gr:16, life:1.2, max:1.2, c:hr<0.25?'#4f4a58':'#8a8594'}); if(hr<0.25) addP({t:'fire', x:s.x+s.side*rand(-s.w/3,s.w/3), y:s.y+rand(4,24), vx:0, vy:-30, r:7, life:0.3, max:0.3}); } }
  if(s.y+HULL_H>=0) killShip(s,'crash');
}
function updateMovement(dt){
  if(!P.dead){
    P.ramT-=dt;
    if(!updateRam(P,dt)){ const ne=nearestEnemy(); P.moving=ne.gap>ENGAGE+2; if(P.moving) P.x+=Math.min(P.spec.speed*dt,ne.gap-ENGAGE); }
  }
  for(const s of ships){
    if(s===P||s.dead) continue;
    s.ramT-=dt;
    if(updateRam(s,dt)) continue;
    const g=bowX(s)-bowX(P);
    let can=g>ENGAGE+2;
    for(const o of ships){ if(o===s||o===P||o.dead||o.side!==-1||o.x>=s.x) continue; if(bowX(s)-sternX(o)<30) can=false; }
    s.moving=can;
    if(can) s.x-=Math.min(s.spec.speed*dt,Math.max(0,g-ENGAGE));
    if(s.spec.boss&&s.ramT<=0&&g<ENGAGE+40&&!P.dead) startRam(s,P);
  }
}

/* ================= battle update ================= */
let hudT=0;
function updateBattle(dt){
  run.time+=dt;
  const prog=P.x-run.startX;
  while(run.evIdx<run.ev.length&&prog>=run.ev[run.evIdx].at) fireEvent(run.ev[run.evIdx++]);
  updateMovement(dt);
  for(const s of ships) updateShipPhysics(s,dt);
  for(const s of ships) if(!s.dead) updateCrew(s,dt);
  updateFliers(dt);
  updateProjs(dt);
  updateBurns(dt);
  ships=ships.filter(s=>!s.gone||s===P);
  if(run.focus&&!partAlive(run.focus)) run.focus=null;
  updateParts(dt);
  updateCoins(dt);
  cam.s=lerp(cam.s,targetScale(),1-Math.exp(-1.2*dt));
  cam.x=lerp(cam.x,P.x-camLeftMargin(),1-Math.exp(-4*dt)); cam.y=-cam.gsy/cam.s;
  shake=Math.max(0,shake-dt*28);
  if(!run.over){
    if(P.dead){ run.over='lose'; run.overT=2.4; P.ram=null; }
    else if(prog>=run.len&&!ships.some(s=>s.side===-1)&&!fliers.some(f=>!f.neutral)){ run.over='win'; run.overT=1.5; addText(P.x+150,P.y-140,'ПОБЕДА!','#ffe066',40,true); Snd.play('win'); }
  } else if(!run.finished){
    run.overT-=dt;
    if(run.overT<=0){ run.finished=true; if(run.over==='lose'&&!run.revived) offerRevive(); else showResult(run.over==='win'); }
  }
}
function updateParts(dt){
  for(const p of parts){
    p.life-=dt;
    switch(p.t){
      case 'smoke': p.x+=p.vx*dt; p.y+=p.vy*dt; p.r+=p.gr*dt; p.vx*=0.98; break;
      case 'fire': p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.9; p.vy*=0.9; break;
      case 'spark': case 'snow': p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=(p.t==='snow'?60:500)*dt; if(p.t==='snow'){ p.vx*=0.95; } break;
      case 'ring': p.r+=p.gr*dt; break;
      case 'debris': case 'shred': p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=(p.t==='shred'?260:620)*dt; p.vx*=p.t==='shred'?0.97:0.995; p.rot+=p.vr*dt; if(p.y>0) p.life=Math.min(p.life,0.1); break;
      case 'text': case 'gtext': p.y+=p.vy*dt; p.vy*=0.92; break;
      case 'banner': p.y+=p.vy*dt; p.vy*=0.94; break;
      case 'chute': p.age+=dt; p.vy=lerp(p.vy,32,1-Math.exp(-2*dt)); p.y+=p.vy*dt; p.x+=(p.vx+Math.sin(p.age*1.5)*20)*dt; if(p.y>0) p.life=0; break;
      case 'loose': p.y+=p.vy*dt; p.x+=(p.vx+Math.sin(p.life*2)*15)*dt; p.vy-=8*dt; break;
      case 'bag': case 'crate': p.vy+=500*dt; p.y+=p.vy*dt; p.rot+=(p.vr||0)*dt; if(p.y>-4){ p.life=0; puff(p.x,-4,3,'#cdbb9a'); } break;
      case 'heal': p.y+=p.vy*dt; break;
    }
  }
  parts=parts.filter(p=>p.life>0);
}
function updateCoins(dt){
  for(const c of coinsFx){
    c.t+=dt; if(c.t<c.delay) continue;
    const tt=c.t-c.delay;
    if(tt<0.45){ c.vy+=900*dt; c.x+=c.vx*dt; c.y+=c.vy*dt; c.vx*=0.98; }
    else { const k=Math.min(1,dt*(5+tt*12)); c.x+=(coinTarget.x-c.x)*k; c.y+=(coinTarget.y-c.y)*k; if(Math.hypot(coinTarget.x-c.x,coinTarget.y-c.y)<14){ c.done=true; run.shown+=c.val; Snd.play('coin',0.7); bumpPill('bCoinsPill'); } }
  }
  coinsFx=coinsFx.filter(c=>!c.done);
}

/* ================= battle render ================= */
function renderBattle(){
  drawSkyBack(); drawGround(); drawMidClouds();
  const sx=shake>0?rand(-shake,shake):0, sy=shake>0?rand(-shake,shake):0;
  ctx.setTransform(DPR*cam.s,0,0,DPR*cam.s,DPR*(-cam.x*cam.s+sx),DPR*(-cam.y*cam.s+sy));
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(const s of ships) if(s.side===-1&&!s.gone) drawShip(ctx,s,gt);
  if(!P.gone) drawShip(ctx,P,gt);
  for(const f of fliers) drawFlier(f);
  drawProjs(); drawParts();
  for(const s of ships) drawShipBars(s);
  if(run.focus&&partAlive(run.focus)) drawFocus(run.focus);
  drawFrontClouds(); drawWeather();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(P&&!P.dead&&P.hull.hp/P.hull.max<0.3){ const a=0.25+Math.sin(gt*6)*0.12; const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75); g.addColorStop(0,'rgba(240,60,50,0)'); g.addColorStop(1,'rgba(240,60,50,'+a+')'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  for(const c of coinsFx){ if(c.t<c.delay) continue; const sw=Math.max(0.25,Math.abs(Math.cos(gt*10+c.spin))); ell(ctx,c.x,c.y,8*sw,8); ctx.fillStyle='#ffd23f'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=INK; ctx.stroke(); ell(ctx,c.x,c.y,4*sw,4.4); ctx.strokeStyle='#de9512'; ctx.lineWidth=1.5; ctx.stroke(); }
  updateHUD();
}
function drawShipBars(s){
  if(s.dead) return;
  let top=-s.topRows*B-30; for(const b of s.balloons) top=Math.min(top,b.ly-b.R);
  const x=s.x, y=s.y+top-16, w=s.spec.boss?96:70, r=s.hull.hp/s.hull.max;
  rr(ctx,x-w/2,y,w,9,4.5); ctx.fillStyle=INK; ctx.fill();
  if(r>0){ rr(ctx,x-w/2+2,y+2,(w-4)*r,5,2.5); ctx.fillStyle=r>0.5?'#66d33e':r>0.25?'#ffd23f':'#f0503f'; ctx.fill(); }
  if(s.shield>0){ const sm=Math.max(s.shield,1); rr(ctx,x-w/2,y-7,w*Math.min(1,s.shield/Math.max(sm,crewShieldMaxOf(s))),4,2); ctx.fillStyle='#7fe3ff'; ctx.fill(); }
  if(s.spec.boss){ ctx.font='13px "Russo One", "Arial Black", sans-serif'; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle=INK; ctx.strokeText(s.spec.name,x,y-10); ctx.fillStyle='#ffffff'; ctx.fillText(s.spec.name,x,y-10); }
  for(const b of s.balloons){ if(!b.alive||b.hp>=b.max) continue; const q=balPos(s,b), bw=b.R*1.1, br=b.hp/b.max; rr(ctx,q.x-bw/2,q.y+b.R+16,bw,6,3); ctx.fillStyle=INK; ctx.fill(); rr(ctx,q.x-bw/2+1.5,q.y+b.R+17.5,(bw-3)*br,3,1.5); ctx.fillStyle=br>0.4?'#ffd23f':'#f0503f'; ctx.fill(); }
  if(s.side===1&&s.sinking){ ctx.font='13px "Russo One", sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#ff8a7a'; ctx.strokeStyle=INK; ctx.lineWidth=3; const t='▼ '+Math.round(s.vy*5)+' м/с'; ctx.strokeText(t,x,s.y+70); ctx.fillText(t,x,s.y+70); }
}
function crewShieldMaxOf(s){ let m=0; for(const c of s.cells) if(c.alive&&c.crew==='shield') m=Math.max(m,crewShield(c.lvl)*3); return m||s.shield; }
function drawFocus(p){
  const q=partPos(p), r=p.kind==='balloon'?p.R+8:p.kind==='hull'?40:p.kind==='flier'?p.r+10:28;
  ctx.save(); ctx.translate(q.x,q.y); ctx.rotate(gt*1.5);
  ctx.lineWidth=5; ctx.strokeStyle=INK; ctx.setLineDash([10,8]); circ(ctx,0,0,r); ctx.stroke();
  ctx.lineWidth=2.6; ctx.strokeStyle='#ff4b3e'; ctx.stroke(); ctx.setLineDash([]);
  for(let i=0;i<4;i++){ ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(r-6,0); ctx.lineTo(r+8,0); ctx.lineWidth=5; ctx.strokeStyle=INK; ctx.stroke(); ctx.lineWidth=2.6; ctx.strokeStyle='#ff4b3e'; ctx.stroke(); }
  ctx.restore();
}
function drawFlier(f){
  const c=ctx, look=BLOOK['e'+curLocIdx];
  c.save(); c.translate(f.x,f.y); c.lineWidth=2; c.strokeStyle=INK;
  if(f.sub==='glider'){
    c.rotate(Math.sin(f.t*2)*0.07);
    c.beginPath(); c.moveTo(-36,-2); c.quadraticCurveTo(-14,-30,0,-27); c.quadraticCurveTo(14,-30,36,-2); c.quadraticCurveTo(0,-12,-36,-2); c.closePath();
    c.fillStyle=look.a; c.fill();
    c.save(); c.clip(); c.fillStyle=look.b; for(let k=-30;k<36;k+=16) c.fillRect(k,-32,7,34); c.restore();
    c.lineWidth=2.2; c.stroke();
    c.lineWidth=1.4; line(c,-14,-9,-2,6); line(c,14,-9,4,6);
    c.save(); c.translate(-1,14); c.rotate(-0.25); drawCrewBody(c,'gunner',0,8,f.t,true); c.restore();
    c.save(); c.translate(-6,10); c.rotate(Math.PI-0.2); rr(c,0,-1.6,12,3.2,1.2); c.fillStyle='#3c4253'; c.fill(); c.stroke(); c.restore();
  } else if(f.sub==='bomb'){
    c.strokeStyle='#4a3a2a'; c.lineWidth=1.4; line(c,0,f.r,0,f.r+14);
    drawBalloon(c,{lx:0,ly:0,R:f.r,hp:1,max:1,wob:0,hit:f.hit,armor:1,look:'bomb',patches:[]},0);
    circ(c,0,f.r+22,9); c.fillStyle='#262333'; c.fill(); c.lineWidth=2; c.strokeStyle=INK; c.stroke();
    c.fillStyle='rgba(255,255,255,.35)'; circ(c,-3,f.r+19,2.5); c.fill();
    c.strokeStyle='#8a5a32'; c.lineWidth=2; line(c,4,f.r+14,8,f.r+9);
    if(Math.sin(f.t*30)>-0.2){ c.fillStyle='#ffd23f'; star(c,9,f.r+8,5,2,6); c.fill(); }
  } else if(f.sub==='chest'){
    c.strokeStyle='#4a3a2a'; c.lineWidth=1.5; line(c,-6,f.r,-9,f.r+12); line(c,6,f.r,9,f.r+12);
    drawBalloon(c,{lx:0,ly:0,R:f.r,hp:f.hp,max:f.max,wob:0,hit:f.hit,armor:1,look:'gold',patches:[]},0);
    drawCrate(c,0,f.r+20,26,'wood',gt);
  }
  if(f.hit>0&&f.sub==='glider'){ c.globalAlpha=Math.min(0.7,f.hit*6); circ(c,0,0,f.r+4); c.fillStyle='#ffffff'; c.fill(); c.globalAlpha=1; }
  if(f.hp<f.max&&f.sub!=='chest'){ rr(c,-16,-f.r-16,32,5,2.5); c.fillStyle=INK; c.fill(); rr(c,-15,-f.r-15,30*(f.hp/f.max),3,1.5); c.fillStyle='#f0503f'; c.fill(); }
  c.restore();
}
function drawProjs(){
  const c=ctx;
  for(const p of projs){
    switch(p.type){
      case 'bullet': c.save(); c.translate(p.x,p.y); c.rotate(Math.atan2(p.vy,p.vx)); rr(c,-7,-2,12,4,2); c.fillStyle=p.side===1?'#ffe27a':'#ff8f6b'; c.fill(); c.lineWidth=1.3; c.strokeStyle=INK; c.stroke(); c.restore(); break;
      case 'snipe': c.strokeStyle=p.side===1?'rgba(255,240,160,.8)':'rgba(255,150,120,.8)'; c.lineWidth=3; line(c,p.x-p.vx*0.03,p.y-p.vy*0.03,p.x,p.y); c.fillStyle='#ffffff'; circ(c,p.x,p.y,2.6); c.fill(); break;
      case 'ball': circ(c,p.x,p.y,6.5); c.fillStyle='#2b2f3a'; c.fill(); c.lineWidth=2; c.strokeStyle=INK; c.stroke(); circ(c,p.x-2,p.y-2.2,1.9); c.fillStyle='#9aa3b8'; c.fill(); break;
      case 'harpoon': c.save(); c.translate(p.x,p.y); c.rotate(Math.atan2(p.vy,p.vx)); rr(c,-18,-1.3,20,2.6,1.3); c.fillStyle='#8a5a32'; c.fill(); c.lineWidth=1.2; c.strokeStyle=INK; c.stroke(); c.beginPath(); c.moveTo(1,-4); c.lineTo(10,0); c.lineTo(1,4); c.closePath(); c.fillStyle='#dfe6ee'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-18,0); c.lineTo(-23,-4); c.lineTo(-20,0); c.lineTo(-23,4); c.closePath(); c.fillStyle='#f0503f'; c.fill(); c.stroke(); c.restore(); break;
      case 'rocket': c.save(); c.translate(p.x,p.y); c.rotate(p.ang); rr(c,-9,-3,14,6,3); c.fillStyle=p.side===1?'#f0503f':'#5f6e3a'; c.fill(); c.lineWidth=1.4; c.strokeStyle=INK; c.stroke(); c.beginPath(); c.moveTo(5,-3); c.lineTo(10,0); c.lineTo(5,3); c.closePath(); c.fillStyle='#e9eef5'; c.fill(); c.stroke(); c.fillStyle='#ffb43a'; star(c,-11,0,4+Math.random()*2,2,5); c.fill(); c.restore(); break;
      case 'flame': { const k=clamp(p.life/p.max,0,1); c.globalAlpha=Math.min(1,k*1.5); circ(c,p.x,p.y,4+(1-k)*9); c.fillStyle=k>0.6?'#fff2a8':k>0.3?'#ffb43a':'#ff6a2a'; c.fill(); c.globalAlpha=1; break; }
      case 'ice': c.save(); c.translate(p.x,p.y); c.rotate(Math.atan2(p.vy,p.vx)); c.beginPath(); c.moveTo(-8,0); c.lineTo(0,-3.5); c.lineTo(8,0); c.lineTo(0,3.5); c.closePath(); c.fillStyle='#bff4ff'; c.fill(); c.lineWidth=1.3; c.strokeStyle='#2789a2'; c.stroke(); c.restore(); break;
      case 'repair': { const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,11); g.addColorStop(0,'rgba(170,255,170,.9)'); g.addColorStop(1,'rgba(120,255,140,0)'); c.fillStyle=g; circ(c,p.x,p.y,11); c.fill(); c.fillStyle='#ffffff'; c.fillRect(p.x-1.5,p.y-5,3,10); c.fillRect(p.x-5,p.y-1.5,10,3); break; }
    }
  }
}
function drawParts(){
  const c=ctx;
  for(const p of parts){
    const k=clamp(p.life/p.max,0,1);
    switch(p.t){
      case 'smoke': c.globalAlpha=k*0.75; circ(c,p.x,p.y,p.r); c.fillStyle=p.c; c.fill(); break;
      case 'fire': c.globalAlpha=Math.min(1,k*1.6); circ(c,p.x,p.y,Math.max(0.5,p.r*(0.4+k*0.6))); c.fillStyle=k>0.65?'#fff2a8':k>0.35?'#ffb43a':'#ff6a2a'; c.fill(); break;
      case 'spark': c.globalAlpha=k; c.strokeStyle='#ffe27a'; c.lineWidth=2.2; line(c,p.x,p.y,p.x-p.vx*0.03,p.y-p.vy*0.03); break;
      case 'snow': c.globalAlpha=k; c.fillStyle='#ffffff'; circ(c,p.x,p.y,p.r); c.fill(); break;
      case 'ring': c.globalAlpha=k; c.lineWidth=5*k+0.5; c.strokeStyle=p.c; circ(c,p.x,p.y,p.r); c.stroke(); break;
      case 'flash': { c.globalAlpha=k; const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r); g.addColorStop(0,'rgba(255,255,230,1)'); g.addColorStop(1,'rgba(255,220,120,0)'); c.fillStyle=g; circ(c,p.x,p.y,p.r); c.fill(); break; }
      case 'beam': c.globalAlpha=k; for(const [lw,col] of [[9,'rgba(90,230,255,.45)'],[4,'#bff8ff'],[1.6,'#ffffff']]){ c.lineWidth=lw; c.strokeStyle=col; line(c,p.x,p.y,p.x2,p.y2); } break;
      case 'debris': c.globalAlpha=Math.min(1,k*3); c.save(); c.translate(p.x,p.y); c.rotate(p.rot); c.fillStyle=p.c; c.fillRect(-p.w/2,-p.h/2,p.w,p.h); c.lineWidth=1.5; c.strokeStyle=INK; c.strokeRect(-p.w/2,-p.h/2,p.w,p.h); c.restore(); break;
      case 'shred': c.globalAlpha=Math.min(1,k*2); c.save(); c.translate(p.x,p.y); c.rotate(p.rot); c.beginPath(); c.moveTo(-p.s,-p.s*0.4); c.lineTo(p.s,-p.s*0.6); c.lineTo(p.s*0.2,p.s*0.7); c.closePath(); c.fillStyle=p.c; c.fill(); c.lineWidth=1.2; c.strokeStyle=INK; c.stroke(); c.restore(); break;
      case 'text': { c.globalAlpha=Math.min(1,k*2.5); c.font=p.size+'px "Russo One", "Arial Black", sans-serif'; c.textAlign='center'; c.lineWidth=4; c.strokeStyle=INK; c.strokeText(p.txt,p.x,p.y); c.fillStyle=p.c; c.fillText(p.txt,p.x,p.y); break; }
      case 'gtext': { c.globalAlpha=Math.min(1,k*2.5); drawGear(c,p.x-16,p.y-6,9); c.font='18px "Russo One", "Arial Black", sans-serif'; c.textAlign='left'; c.lineWidth=4; c.strokeStyle=INK; c.strokeText('+'+fmt(p.n),p.x-4,p.y); c.fillStyle='#e6edf7'; c.fillText('+'+fmt(p.n),p.x-4,p.y); break; }
      case 'banner': { const age=p.max-p.life, sc=age<0.15?0.4+age/0.15*0.8:age<0.25?1.2-(age-0.15)*2:1; c.globalAlpha=Math.min(1,k*3); c.save(); c.translate(p.x,p.y); c.scale(sc,sc); c.font=p.size+'px "Russo One", "Arial Black", sans-serif'; c.textAlign='center'; c.lineWidth=7; c.strokeStyle=INK; c.strokeText(p.txt,0,0); c.fillStyle=p.c; c.fillText(p.txt,0,0); c.restore(); break; }
      case 'bolt': { c.globalAlpha=k; const cols=p.c?[[8,'rgba(255,240,120,.5)'],[3,'#fff6c0'],[1.4,'#ffffff']]:[[7,'rgba(180,120,255,.6)'],[3,'#e9d8ff'],[1.4,'#ffffff']]; for(const [lw,col] of cols){ c.lineWidth=lw; c.strokeStyle=col; c.beginPath(); p.pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)); c.stroke(); } break; }
      case 'chute': { c.globalAlpha=Math.min(1,k*3); c.save(); c.translate(p.x,p.y); c.rotate(Math.sin(p.age*2)*0.15); const open=Math.min(1,p.age*2.5);
        c.strokeStyle='#4a3a2a'; c.lineWidth=1.2; line(c,-16*open,-40,0,-14); line(c,16*open,-40,0,-14); line(c,0,-40,0,-14);
        c.beginPath(); c.ellipse(0,-40,17*open+1,13*open+1,0,Math.PI,TAU); c.closePath(); c.fillStyle=p.pirate?'#2f2a40':'#fff1d6'; c.fill(); c.lineWidth=2; c.strokeStyle=INK; c.stroke();
        c.beginPath(); c.ellipse(0,-40,6*open+0.5,13*open+1,0,Math.PI,TAU); c.closePath(); c.fillStyle=p.pirate?'#c8302b':'#e8483b'; c.fill(); c.stroke();
        c.scale(0.85,0.85); drawCrewBody(c,p.crew,0,10,p.age,p.pirate); c.restore(); break; }
      case 'loose': { c.globalAlpha=Math.min(1,k*2); c.save(); c.translate(p.x,p.y); c.strokeStyle='#4a3a2a'; c.lineWidth=1.4; line(c,-5,p.R*0.9,-8+Math.sin(p.life*4)*3,p.R+22); line(c,5,p.R*0.9,8+Math.sin(p.life*4)*3,p.R+22); drawBalloon(c,{lx:0,ly:0,R:p.R,hp:1,max:1,wob:0,hit:0,armor:p.armor,look:p.look,patches:[]},0); c.restore(); break; }
      case 'bag': drawBag(c,p.x,p.y,1.3); break;
      case 'crate': c.save(); c.translate(p.x,p.y); c.rotate(p.rot); drawCrate(c,0,0,26,'wood',0); c.restore(); break;
      case 'heal': c.globalAlpha=k; c.fillStyle='#7dff8a'; c.fillRect(p.x-1.5,p.y-5,3,10); c.fillRect(p.x-5,p.y-1.5,10,3); break;
    }
  }
  c.globalAlpha=1;
}

/* ================= HUD & abilities ================= */
let lastShownCoins=-1;
function updateHUD(){
  if(!run) return;
  hudT-=1/60; if(hudT>0) return; hudT=0.1;
  const prog=clamp((P.x-run.startX)/run.len,0,1);
  $('routeFill').style.width=(prog*100)+'%'; $('routeShip').style.left=(prog*100)+'%';
  for(const e of run.ev) if(e.mark&&e.ship&&e.ship.dead) e.mark.classList.add('done');
  const sc=Math.floor(run.shown+0.001); if(sc!==lastShownCoins){ lastShownCoins=sc; $('bCoins').textContent=fmt(sc); }
  $('altVal').textContent=Math.max(0,Math.round(-(P.y+HULL_H)*5))+' м';
  const wgt=Math.round(shipWeight(P)), lift=Math.round(P.dead?0:effLift(P)), max=Math.max(wgt,lift,1)*1.2;
  $('bLift').textContent=lift; $('bWeight').textContent=wgt;
  $('bLiftBar').style.width=(lift/max*100)+'%'; $('bWeightMark').style.left=(wgt/max*100)+'%';
  $('bMeter').classList.toggle('bad',lift<wgt);
  const hr=P.dead?0:P.hull.hp/P.hull.max;
  $('bHullBar').style.width=(hr*100)+'%'; $('bHull').textContent=fmt(Math.ceil(P.dead?0:P.hull.hp));
  $('warn').hidden=!(P.sinking&&!P.dead&&!run.over);
  const ne=nearestEnemy(), canRam=!P.dead&&!P.ram&&ne.s&&ne.gap<430;
  const cdp=P.ramT>0?clamp(P.ramT/P.spec.ramCd,0,1)*100:0;
  const rb=$('ramBtn'); rb.style.setProperty('--p',cdp.toFixed(1)); rb.classList.toggle('off',!canRam||P.ramT>0);
  $('ballastN').textContent=run.ballast; $('ballastBtn').classList.toggle('off',run.ballast<=0||P.dead);
  $('powerChip').hidden=!powerActive();
}
function useRam(){
  if(!run||P.dead||run.over) return;
  const ne=nearestEnemy();
  if(P.ramT>0){ toast('Таран перезаряжается: '+fmt1(P.ramT)+' с',1.4); return; }
  if(!ne.s||ne.gap>=430){ toast('Таран: враг слишком далеко',1.4); return; }
  startRam(P,ne.s);
}
function useBallast(){
  if(!run||P.dead||run.over) return;
  if(run.ballast<=0){ toast('Балласт уже сброшен',1.4); return; }
  run.ballast--; P.weightMul=0.7;
  for(let i=0;i<5;i++) addP({t:'bag', x:P.x+rand(-P.w/2,P.w/2), y:P.y+HULL_H, vx:0, vy:rand(0,60), rot:0, vr:rand(-3,3), life:4, max:4});
  addText(P.x+P.w/2+30,P.y+80,'−30% веса','#7dff8a',20,true); Snd.play('bag');
}
function battleTap(sx,sy){
  if(!run||run.over) return;
  const wx=sx/cam.s+cam.x, wy=sy/cam.s+cam.y, tol=16/cam.s;
  let hit=null;
  for(const f of fliers){ if(f.dead) continue; const oy=f.sub==='chest'?12:f.sub==='bomb'?10:0; if(Math.hypot(wx-f.x,wy-f.y-oy)<f.r+tol+(f.sub!=='glider'?10:6)){ hit=f; break; } }
  if(!hit) for(const s of ships){ if(s.side!==-1||s.dead) continue; const p=contactShip(s,wx,wy,tol*0.6); if(p){ hit=p; break; } }
  if(hit){ run.focus=hit; Snd.play('click'); }
  else if(run.focus) run.focus=null;
}

/* ================= second life & results ================= */
function offerRevive(){
  paused=true;
  showModal('<h2 class="mtitle lose outlined">Корабль сбит!</h2><p class="mtip"><b>Вторая жизнь:</b> корабль полностью чинится и продолжает бой с того же места. Один раз за бой.</p><div class="macts"><button class="btn ad" data-act="ad">'+IC('ad')+'Реклама</button><button class="btn gem" data-act="gem">'+IC('gem')+PRICE.revive+'</button></div><div class="macts"><button class="btn ghost" data-act="no">Сдаться</button></div>',
    {ad:async()=>{ hideModal(); if(await watchAd('second_life')) revive(); else offerRevive(); },
     gem:()=>{ if(save.gems<PRICE.revive){ toast('Не хватает алмазов: нужно '+PRICE.revive); return; } hideModal(); save.gems-=PRICE.revive; persist(); revive(); },
     no:()=>{ hideModal(); paused=false; showResult(false); }});
}
function revive(){
  run.revived=true; run.over=null; run.finished=false; paused=false; last=performance.now();
  Object.assign(P,{dead:false, gone:false, rot:0, rotV:0, vy:0, kx:0, y:P.cruiseY, ram:null, invuln:3, chill:0, freeze:0});
  P.hull.alive=true; P.hull.hp=P.hull.max;
  for(const c of P.cells){ c.alive=true; c.hp=c.max; c.target=null; }
  for(const b of P.balloons){ b.alive=true; b.hp=b.max; }
  projs=projs.filter(p=>p.side===1); burns=burns.filter(b=>b.p.ship!==P);
  for(const s of ships) if(s.side===-1&&!s.dead) s.kx=260;
  addText(P.x,P.y-140,'ВТОРАЯ ЖИЗНЬ!','#7dff8a',30,true); Snd.play('legend');
  for(let i=0;i<20;i++) addP({t:'heal', x:P.x+rand(-P.w/2,P.w/2), y:P.y+rand(-120,20), vx:0, vy:-50, life:0.9, max:0.9});
}
function settle(win){
  const n=run.n, info=run.info;
  let bonus=0, cont=null, stars=0;
  if(win){
    bonus=Math.round(levelReward(n)*(info.boss?3:1.5)*(run.replay?0.5:1));
    const hr=P.hull.hp/P.hull.max; stars=hr>=0.7&&!run.lostBalloon&&!run.revived?3:hr>=0.35?2:1;
    if(!run.replay) cont=info.boss?(info.loc===LOCS.length-1?'ark':'gold'):(stars>=3&&Math.random()<0.5?'steel':'wood');
    save.stars[n]=Math.max(save.stars[n]||0,stars);
    if(n>=save.maxLevel) save.maxLevel=n+1;
    save.tutorial=false;
  }
  const coins=run.coins+bonus, gears=run.gears;
  save.coins+=coins; save.gears+=gears;
  const conts=run.conts.slice(); if(cont) conts.unshift(cont);
  for(const k of conts) save.cont[k]++;
  persist();
  return {coins, gears, bonus, stars, conts};
}
function showResult(win){
  const r=settle(win), n=run.n;
  const rows=()=>{ const it=[{ic:'coin',label:'Добыча в бою',amount:run.coins*(r.doubled?2:1)}]; if(r.bonus) it.push({ic:'coin',label:'Награда за уровень',amount:r.bonus*(r.doubled?2:1)}); if(r.gears) it.push({ic:'gear',label:'Шестерни',amount:r.gears*(r.doubled?2:1)}); for(const k of r.conts) it.push({ic:'crate-'+k,label:CONT[k].name,amount:1}); return rewardRows(it); };
  const nextN=run.replay?Math.min(n+1,save.maxLevel):save.maxLevel;
  const unlock=win?REG_IDS.find(id=>CREW[id].unlockAt===save.maxLevel&&!save.crew[id].own):null;
  const tip=unlock?'<p class="mtip">Новый боец в таверне: <b>'+CREW[unlock].name+'</b>. Наймите его во вкладке «Экипаж».</p>':'<p class="mtip">'+pick(TIPS)+'</p>';
  const x2=()=>'<button class="btn ad" data-act="x2">'+IC('ad')+'×2 награда за рекламу</button>';
  if(r.coins<=0&&r.gears<=0) r.doubled=true;
  const render=()=>{
    const head=win?'<h2 class="mtitle win outlined">Победа!</h2><div class="stars">'+[1,2,3].map(i=>'<div class="star'+(i<=r.stars?' on':'')+'"></div>').join('')+'</div>':'<h2 class="mtitle lose outlined">Корабль сбит</h2>';
    const acts=win?'<button class="btn ghost" data-act="hangar">В ангар</button><button class="btn go" data-act="next">Уровень '+nextN+'</button>':'<button class="btn ghost" data-act="retry">Ещё раз</button><button class="btn go" data-act="hangar">Улучшить</button>';
    showModal(head+rows()+(r.doubled?'':'<div class="macts">'+x2()+'</div>')+tip+'<div class="macts">'+acts+'</div>',acts_);
  };
  const acts_={
    hangar:backToHangar,
    next:()=>startBattle(nextN),
    retry:()=>startBattle(n),
    x2:async()=>{ if(r.doubled) return; if(!await watchAd('double_reward')) return; r.doubled=true; save.coins+=r.coins; save.gears+=r.gears; persist(); Snd.play('buy'); render(); },
  };
  render();
  if(!win) Snd.play('lose');
}
function showPause(){
  paused=true;
  showModal('<h2 class="mtitle outlined">Пауза</h2><p class="mtip">Уровень '+run.n+'. Добыча сейчас: <b>'+fmt(run.coins)+'</b>. Если вернуться в ангар, монеты останутся у вас.</p><div class="macts"><button class="btn ghost" data-act="quit">В ангар</button><button class="btn go" data-act="resume">Дальше</button></div>',
    {resume:()=>{ hideModal(); paused=false; last=performance.now(); }, quit:()=>{ save.coins+=run.coins; save.gears+=run.gears; for(const k of run.conts) save.cont[k]++; persist(); backToHangar(); }});
}
