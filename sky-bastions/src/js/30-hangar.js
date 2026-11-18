/* ================= toast & modal helpers ================= */
let toastT=0;
function toast(msg,dur){ const t=$('toast'); t.textContent=msg; t.hidden=false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); toastT=dur||2.6; }
let modalActs={};
function showModal(html,acts){ modalActs=acts||{}; $('mcard').innerHTML=html; $('modal').hidden=false; refreshIcons($('mcard')); }
function hideModal(){ $('modal').hidden=true; modalActs={}; }
function refreshIcons(root){ for(const img of (root||document).querySelectorAll('img[data-ic]')){ const u=icon(img.dataset.ic); if(img.getAttribute('src')!==u) img.src=u; } }
const IC=(k,cls)=>'<img class="'+(cls||'ii')+'" src="'+icon(k)+'" alt="">';
const COIN='<i class="coin"></i>';
function priceHTML(coins,gears){ return COIN+fmt(coins)+(gears?' '+IC('gear')+fmt(gears):''); }
function bumpPill(id){ const p=$(id); if(!p) return; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
function rewardRows(items){ return '<div class="rows">'+items.map((it,i)=>'<div class="pop" style="animation-delay:'+(0.12*i)+'s"><span>'+it.label+'</span><b>'+(it.ic==='coin'?COIN:IC(it.ic))+(it.amount!=null?'+'+fmt(it.amount):'')+'</b></div>').join('')+'</div>'; }
function showReward(title,items,img,extra){
  showModal('<h2 class="mtitle win outlined">'+title+'</h2>'+(img?'<img class="mimg" src="'+icon(img)+'" alt="">':'')+rewardRows(items)+(extra||'')+'<div class="macts"><button class="btn go" data-act="ok">Отлично</button></div>',{ok:()=>{ hideModal(); refreshAll(); }});
}

/* ================= spending ================= */
function gemsFor(coins,gears){ const rate=8*Math.pow(1.045,save.maxLevel-1); return Math.max(1,Math.ceil(Math.max(0,coins)/rate+Math.max(0,gears)/2)); }
function spendGems(amount,label,fn){
  if(save.gems<amount){ toast('Не хватает алмазов: нужно '+amount); openPanel('shop'); return; }
  showModal('<h2 class="mtitle outlined">'+label+'</h2><p class="mtip">Списать <b>'+amount+'</b> '+IC('gem')+' алмазов? У вас '+fmt(save.gems)+'.</p><div class="macts"><button class="btn ghost" data-act="no">Отмена</button><button class="btn gem" data-act="yes">'+IC('gem')+amount+'</button></div>',
    {no:hideModal, yes:()=>{ hideModal(); if(save.gems<amount) return; save.gems-=amount; persist(); fn(); refreshAll(); }});
}
async function watchAd(placement){
  const r=await Platform.showRewarded(placement);
  if(!r||!r.ok){ toast('Реклама не досмотрена — награда не начислена',2.2); return false; }
  return true;
}
async function buyProduct(id){
  const p=id===STARTER.id?STARTER:PRODUCTS.find(x=>x.id===id); if(!p) return;
  if(p===STARTER&&save.bought.starter) return;
  const r=await Platform.purchase(p);
  if(!r||!r.ok){ if(r&&r.error&&r.error!=='cancel') toast('Покупка не прошла: '+r.error); return; }
  save.gems+=p.gems; const items=[{ic:'gem',label:'Алмазы',amount:p.gems}];
  if(p===STARTER){ save.bought.starter=1; save.cont.gold++; const c=levelReward(save.maxLevel)*p.coinsX; save.coins+=c; items.push({ic:'coin',label:'Монеты',amount:c},{ic:'crate-gold',label:CONT.gold.name,amount:1}); }
  persist(); Snd.play('buy'); refreshAll(); showReward('Спасибо!',items,p===STARTER?'crate-gold':'gems6');
}

/* ================= hangar stage ================= */
function rebuildPreview(){
  const old=preview;
  preview=makeShip(playerSpec(),0); preview.y=0; preview.cruiseY=0;
  if(old){ preview.t=old.t; preview.propA=old.propA; }
}
function hangarLayout(){
  const tb=document.querySelector('.topbar').getBoundingClientRect(), sh=$('sheet').getBoundingClientRect();
  const area=LAND?{x:66,y:tb.bottom,w:sh.left-66-66,h:H-tb.bottom}:{x:44,y:tb.bottom,w:W-88,h:sh.top-tb.bottom};
  const R=preview.balloons.length?preview.balloons[0].R:32;
  const top=-(preview.topRows*B+22+2*R+(preview.balloons.length>=3?R*0.55:0))-6, bot=118, bw=preview.w+120, bh=bot-top;
  hs=clamp(Math.min(area.w/(bw*1.04),area.h/(bh*1.04)),0.38,2.3);
  hox=area.x+area.w/2+4*hs; hoy=area.y+area.h/2-((top+bot)/2)*hs;
}
function drawDock(){
  const w=preview.w, isl=islandSprites()[0], iw=w+150, ih=iw*230/240*0.62;
  ctx.drawImage(isl,-iw/2,58,iw,ih);
  ctx.lineWidth=2.4; ctx.strokeStyle=INK;
  for(const px of [-w/2-26,w/2+30]){ rr(ctx,px-4,46,8,30,3); ctx.fillStyle='#8a5a32'; ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle='#4a3a2a'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-w/2-26,48); ctx.quadraticCurveTo(-w/2-16,46,-w/2-6,30); ctx.moveTo(w/2+30,48); ctx.quadraticCurveTo(w/2+20,46,w/2+12,30); ctx.stroke();
}
let railT=0;
function updateHangar(dt){
  cam.x+=dt*22;
  preview.t+=dt; preview.propA+=dt*9;
  for(const c of preview.cells) if(c.pop>0) c.pop=Math.max(0,c.pop-dt*3.5);
  for(const p of hfx){ p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=60*dt; }
  hfx=hfx.filter(p=>p.life>0);
  if(yardFlash){ yardFlash.t-=dt; if(yardFlash.t<=0) yardFlash=null; }
  railT-=dt; if(railT<=0){ railT=1; updateRail(); }
}
function renderHangar(){
  setLoc(levelInfo(Math.min(save.maxLevel,MAX_LEVEL)).loc);
  cam.s=1; cam.gsy=H;
  drawSkyBack(); drawWeather();
  hangarLayout();
  ctx.setTransform(DPR*hs,0,0,DPR*hs,DPR*hox,DPR*hoy);
  ctx.lineJoin='round'; ctx.lineCap='round';
  drawDock();
  drawShip(ctx,preview,gt);
  if(tab==='yard') drawYardGrid();
  for(const p of hfx){ ctx.globalAlpha=clamp(p.life/p.max,0,1); ctx.fillStyle=p.c; star(ctx,p.x,p.y,p.r,p.r*0.45,4); ctx.fill(); }
  ctx.globalAlpha=1;
  if(wheel.dirty) drawWheel();
}
function drawYardGrid(){
  const rows=STAT.rows(save.up.frame), w=preview.w, g=save.grid, pulse=0.55+Math.sin(gt*4)*0.25;
  ctx.save(); ctx.translate(0,Math.sin(preview.t*1.6)*2.5);
  for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++){
    const x=-w/2+c*B, y=-(r+1)*B; if(g[r][c]) continue;
    const sup=r===0||!!g[r-1][c];
    ctx.setLineDash(sup?[5,4]:[2,5]); ctx.lineWidth=2; ctx.strokeStyle=sup?'rgba(255,255,255,'+pulse+')':'rgba(255,255,255,.35)';
    rr(ctx,x+3,y+3,B-6,B-6,6); ctx.stroke();
    if(sup){ ctx.setLineDash([]); ctx.lineWidth=3; line(ctx,x+B/2,y+B/2-6,x+B/2,y+B/2+6); line(ctx,x+B/2-6,y+B/2,x+B/2+6,y+B/2); }
  }
  ctx.setLineDash([]);
  if(yardFlash){ const x=-w/2+yardFlash.c*B, y=-(yardFlash.r+1)*B; ctx.strokeStyle=yardFlash.bad?'#f0503f':'#fff4a6'; ctx.lineWidth=3; ctx.globalAlpha=clamp(yardFlash.t*3,0,1); rr(ctx,x-2,y-2,B+4,B+4,7); ctx.stroke(); ctx.globalAlpha=1; }
  ctx.restore();
}
function sparkle(lx,ly,n,col){ for(let i=0;i<n;i++) hfx.push({x:lx+rand(-14,14),y:ly+rand(-14,14),vx:rand(-60,60),vy:rand(-110,-30),life:rand(0.5,0.9),max:0.9,r:rand(4,7),c:col||'#fff4a6'}); }
function upgradeFx(id){
  const s=preview;
  if(id==='wall'||id==='frame'||id==='autoRep') for(const c of s.cells) if(c.type==='W') c.pop=1;
  if(id==='wall'||id==='frame'||id==='hull'||id==='autoRep') sparkle(0,id==='hull'?20:-B,14);
  if(id==='powder'||id==='sights'||id==='loot') for(const c of s.cells) if(c.type==='crew'){ c.pop=1; sparkle(-s.w/2+c.c*B+B/2,-(c.r+0.5)*B,5); }
  if(id[0]==='b'&&id!=='boost') for(const b of s.balloons) sparkle(b.lx,b.ly,6);
  if(id==='thrust'||id==='boost'||id==='dodge') sparkle(-s.w/2-45,20,12);
  if(id==='rotor') sparkle(0,56,12);
}
function hangarTap(sx,sy){
  if(!preview) return;
  const lx=(sx-hox)/hs, ly=(sy-hoy)/hs-Math.sin(preview.t*1.6)*2.5;
  const c=Math.floor((lx+preview.w/2)/B), r=Math.floor(-ly/B), rows=STAT.rows(save.up.frame);
  if(c<0||c>=COLS||r<0||r>=rows) return;
  if(tab!=='yard'){ setTab('yard'); return; }
  applyTool(c,r);
}
function applyTool(c,r){
  const g=save.grid, cur=g[r][c];
  const flash=bad=>{ yardFlash={c,r,t:0.6,bad}; };
  if(tool==='erase'){
    if(!cur){ flash(true); return; }
    for(let r2=r;r2<4;r2++) g[r2][c]=null;
    Snd.play('crunch',0.6);
  } else {
    if(r>0&&!g[r-1][c]){ flash(true); toast('Блоку нужна опора снизу'); return; }
    if(tool==='W'){ if(cur==='W'){ flash(false); return; } if(cur){ flash(true); toast('Здесь стоит '+CREW[cur].name.toLowerCase()+'. Чтобы поставить стену, сначала уберите бойца'); return; } g[r][c]='W'; }
    else {
      if(cur===tool){ flash(false); return; }
      for(let r2=0;r2<4;r2++) for(let c2=0;c2<COLS;c2++) if(g[r2][c2]===tool){ const above=r2<3&&g[r2+1][c2]; g[r2][c2]=cur?cur:(above?'W':null); }
      g[r][c]=tool;
    }
    Snd.play('click');
  }
  persist(); rebuildPreview();
  const cell=preview.cells.find(x=>x.c===c&&x.r===r); if(cell) cell.pop=1;
  flash(false);
  if(designWeight()>designLift()) toast('Перегруз: подъём меньше веса. Улучшите баллоны или уберите блок');
  renderSheet();
}

/* ================= sheet ================= */
function setTab(t){ tab=t; for(const b of document.querySelectorAll('.tab')) b.setAttribute('aria-selected',b.dataset.tab===t?'true':'false'); renderSheet(); $('sheetBody').scrollTop=0; }
function upgIndex(id){ const u=UPG[id], l=save.up[id]; return u.min===0?l+1:l; }
function upgCost(id){ const u=UPG[id], l=save.up[id]; if(l>=u.max) return null; if(u.costs) return u.costs[l]; return COSTF(u.base,upgIndex(id)); }
function upgGears(id){ const u=UPG[id]; if(u.costs||save.up[id]>=u.max) return 0; return gearCostAt(upgIndex(id)); }
function buyButtons(attr,cost,gears){
  const can=save.coins>=cost&&save.gears>=gears;
  let h='<button class="buy" '+attr+(can?'':' data-poor="1"')+'>'+priceHTML(cost,gears)+'</button>';
  if(!can) h+='<button class="buy gem" '+attr.replace('data-','data-q')+' title="Быстрая прокачка за алмазы">'+IC('gem')+gemsFor(cost-save.coins,gears-save.gears)+'</button>';
  return '<div class="acts">'+h+'</div>';
}
function upgCard(id){
  const u=UPG[id], l=save.up[id], maxed=l>=u.max;
  const lv=u.costs?l+' из '+u.max:'ур. '+l;
  const note=u.note?'<br><span class="note">'+u.note(l,maxed)+'</span>':'';
  const btn=maxed?'<span class="maxed">Макс.</span>':buyButtons('data-buy="'+id+'"',upgCost(id),upgGears(id));
  return '<div class="card"><img class="ic" src="'+icon(u.icon)+'" alt=""><div class="info"><div class="nm">'+u.name+'<span class="lv">'+lv+'</span></div><div class="ds">'+u.label+': <b>'+u.val(l)+'</b>'+(maxed?'':' → <b class="up">'+u.val(l+1)+'</b>')+note+'</div></div>'+btn+'</div>';
}
function crewStatHTML(id,l,maxed){
  const nx=v=>maxed?'':' → <b class="up">'+fmt(v)+'</b>';
  if(id==='mechanic') return 'Ремонт: <b>'+fmt(crewHeal(l))+'</b>'+nx(crewHeal(l+1));
  if(id==='shield') return 'Щит: <b>'+fmt(crewShield(l))+'</b>'+nx(crewShield(l+1));
  return 'Урон: <b>'+fmt(crewDmg(id,l))+'</b>'+nx(crewDmg(id,l+1));
}
function crewCard(id){
  const d=CREW[id], cr=save.crew[id], leg=!!d.legend;
  if(!cr.own){
    if(leg) return '<div class="card legend"><img class="ic" src="'+icon('crew-'+id)+'" alt=""><div class="info"><div class="nm">'+d.name+'<span class="lv leg">Легенда</span></div><div class="ds">'+d.role+'</div></div><div class="acts"><button class="buy gem" data-legbuy="'+id+'">'+IC('gem')+fmt(d.gems)+'</button></div></div>';
    const locked=save.maxLevel<d.unlockAt;
    const btn=locked?'<span class="lock">С уровня '+d.unlockAt+'</span>':'<div class="acts"><button class="buy" data-hire="'+id+'"'+(save.coins<d.hire?' data-poor="1"':'')+'><span class="bl">Нанять</span>'+COIN+fmt(d.hire)+'</button></div>';
    return '<div class="card'+(locked?' locked':'')+'"><img class="ic" src="'+icon('crew-'+id)+'" alt=""><div class="info"><div class="nm">'+d.name+'</div><div class="ds">'+d.role+'</div></div>'+btn+'</div>';
  }
  const l=cr.lvl, maxed=l>=CREW_MAX;
  const placed=isPlaced(id)?'на борту':'<span style="color:var(--coin)">не на борту</span>';
  const btn=maxed?'<span class="maxed">Макс.</span>':buyButtons('data-crew="'+id+'"',crewCost(id,l),gearCostAt(l));
  return '<div class="card'+(leg?' legend':'')+'"><img class="ic" src="'+icon('crew-'+id)+'" alt=""><div class="info"><div class="nm">'+d.name+'<span class="lv'+(leg?' leg':'')+'">ур. '+l+'</span></div><div class="ds">'+crewStatHTML(id,l,maxed)+' · темп '+fmt1(crewRate(id,l))+' с<br><span class="note">'+d.role+' · '+placed+'</span></div></div>'+btn+'</div>';
}
function toolBtn(id,img,name,sub,on,leg){ return '<button class="tool'+(leg?' legend':'')+'" data-tool="'+id+'" aria-pressed="'+(tool===id)+'"><img src="'+img+'" alt=""><span>'+name+'</span><small'+(on?' class="on"':'')+'>'+sub+'</small></button>'; }
function renderTop(){
  $('hCoins').textContent=fmt(save.coins); $('hGears').textContent=fmt(save.gears); $('hGems').textContent=fmt(save.gems);
  const info=levelInfo(save.maxLevel);
  $('fightSub').textContent='Ур. '+save.maxLevel+' · '+LOCS[info.loc].name+(info.boss?' · босс':' '+info.stage+'/5');
  updateRail();
}
function updateRail(){
  if(!save) return;
  const d=daily();
  $('wheelBadge').hidden=d.wheelFree>=1;
  const nc=CONT_IDS.reduce((a,k)=>a+save.cont[k],0); $('storeBadge').hidden=nc<=0; $('storeBadge').textContent=nc>99?'99+':nc;
  const act=powerActive(); $('powerBadge').hidden=act||d.power>=AD_LIMIT.power;
  $('powerBtn').classList.toggle('hot',act);
  if(act){ const s=Math.ceil((save.powerUntil-Date.now())/1000); $('powerLbl').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); } else $('powerLbl').textContent='Бонус';
}
function renderSheet(){
  renderTop();
  refreshIcons(document);
  let h='';
  if(tab==='yard'){
    const rows=STAT.rows(save.up.frame); let n=0; for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++) if(save.grid[r][c]) n++;
    if(tool!=='W'&&tool!=='erase'&&!(save.crew[tool]&&save.crew[tool].own)) tool='W';
    h+='<p class="hint">Выберите деталь и нажмите на клетку корабля. Блоку нужна <b>опора снизу</b>, а каждый блок добавляет <b>вес</b>.</p><div class="tools">';
    h+=toolBtn('W',icon('wall'),'Стена','вес 10');
    h+=toolBtn('erase',icon('erase'),'Убрать','и всё выше');
    for(const id of CREW_IDS){ if(!save.crew[id].own) continue; const pl=isPlaced(id); h+=toolBtn(id,icon('crew-'+id),CREW[id].name,pl?'на борту':'в резерве',pl,CREW[id].legend); }
    h+='</div><div class="yard-stats"><span>Блоков: <b>'+n+'</b> из '+rows*COLS+'</span><span>Ярусов: <b>'+rows+'</b></span><span>Боец весит 8</span></div>';
  } else if(tab==='crew'){
    h+='<p class="hint">Бойцы стреляют сами. Новых бойцов поставьте на корабль во вкладке <b>Верфь</b>. С 10-го уровня для прокачки нужны <b>шестерни</b>.</p>';
    h+='<div class="sec">Легендарные</div>'; for(const id of LEG_IDS) h+=crewCard(id);
    h+='<div class="sec">Экипаж</div>'; for(const id of REG_IDS) h+=crewCard(id);
  } else {
    const hint={hull:'Стены и гондола держат удар. <b>Каркас</b> даёт новые ярусы, <b>Авторемонт</b> чинит корабль в бою.', arsenal:'Усиления для всего экипажа сразу.', bal:'Баллоны держат корабль в небе. Каждые 8 уровней обшивки — новая ткань.', prop:'Винты разгоняют корабль и бьют <b>тараном</b>. <b>Манёвр</b> помогает увернуться от снарядов.'}[tab];
    h+='<p class="hint">'+hint+'</p>';
    for(const id in UPG) if(UPG[id].tab===tab) h+=upgCard(id);
  }
  $('sheetBody').innerHTML=h;
  updateFooter();
}
function updateFooter(){
  const w=designWeight(), l=designLift(), max=Math.max(w,l)*1.2;
  $('fLift').textContent=l; $('fWeight').textContent=w;
  $('fLiftBar').style.width=(l/max*100)+'%'; $('fWeightMark').style.left=(w/max*100)+'%';
  const bad=w>l; $('fMeter').classList.toggle('bad',bad);
  const st=$('fState'); st.classList.toggle('bad',bad);
  st.textContent=bad?'Перегруз: корабль не взлетит':(powerActive()?'Усиление активно · ':'')+'Запас подъёма: '+(l-w);
}
function refreshAll(){ if(mode==='hangar'){ renderSheet(); } if(!$('panel').hidden) renderPanel(); renderTop(); }
function doUpgrade(id){ save.up[id]++; persist(); rebuildPreview(); upgradeFx(id); Snd.play('buy'); bumpPill('hCoinsPill'); renderSheet(); }
function buy(id){
  const cost=upgCost(id), gears=upgGears(id); if(cost==null) return;
  if(save.coins<cost||save.gears<gears){ toast(save.coins<cost?'Не хватает монет: нужно '+fmt(cost):'Не хватает шестерней: нужно '+fmt(gears)+'. Их дают контейнеры и боссы'); Snd.play('click',0.5); return; }
  save.coins-=cost; save.gears-=gears; doUpgrade(id);
}
function quickBuy(kind,id){
  let cost,gears,name,apply;
  if(kind==='buy'){ cost=upgCost(id); gears=upgGears(id); name=UPG[id].name; apply=()=>doUpgrade(id); }
  else { const l=save.crew[id].lvl; cost=crewCost(id,l); gears=gearCostAt(l); name=CREW[id].name; apply=()=>crewLevelUp(id); }
  if(cost==null) return;
  const g=gemsFor(cost-save.coins,gears-save.gears);
  spendGems(g,'Быстрая прокачка: '+name,()=>{ save.coins=Math.max(0,save.coins-cost); save.gears=Math.max(0,save.gears-gears); apply(); });
}
function crewLevelUp(id){
  save.crew[id].lvl++; persist(); rebuildPreview(); Snd.play('buy'); bumpPill('hCoinsPill');
  for(const c of preview.cells) if(c.crew===id){ c.pop=1; sparkle(-preview.w/2+c.c*B+B/2,-(c.r+0.5)*B,10); }
  renderSheet();
}
function grantHero(id){
  const cr=save.crew[id]; if(cr.own) return false;
  cr.own=1; const placed=autoPlace(id); persist(); rebuildPreview();
  return placed;
}
function crewAction(id,hire){
  const d=CREW[id], cr=save.crew[id];
  if(hire){
    if(cr.own||d.legend||save.maxLevel<d.unlockAt) return;
    if(save.coins<d.hire){ toast('Не хватает монет: нужно '+fmt(d.hire)); return; }
    save.coins-=d.hire; const placed=grantHero(id); Snd.play('buy'); renderSheet();
    toast(placed?d.name+' уже на борту!':d.name+' нанят. Поставьте его на корабль во вкладке «Верфь»');
    return;
  }
  if(cr.lvl>=CREW_MAX) return;
  const cost=crewCost(id,cr.lvl), gears=gearCostAt(cr.lvl);
  if(save.coins<cost||save.gears<gears){ toast(save.coins<cost?'Не хватает монет: нужно '+fmt(cost):'Не хватает шестерней: нужно '+fmt(gears)); return; }
  save.coins-=cost; save.gears-=gears; crewLevelUp(id);
}
function buyLegend(id){
  const d=CREW[id]; if(save.crew[id].own) return;
  spendGems(d.gems,'Легенда: '+d.name,()=>{ const placed=grantHero(id); Snd.play('legend'); showLegend(id,placed); });
}
function showLegend(id,placed){
  const d=CREW[id];
  showModal('<h2 class="mtitle leg outlined">Легенда!</h2><img class="mimg" src="'+icon('crew-'+id)+'" alt=""><p class="mtip"><b>'+d.name+'</b> в вашем экипаже. '+d.role+'.'+(placed?' Уже стоит на корабле.':' Поставьте героя на корабль во вкладке «Верфь».')+'</p><div class="macts"><button class="btn go" data-act="ok">В экипаж!</button></div>',{ok:()=>{ hideModal(); refreshAll(); }});
}
function autoPlace(id){
  const rows=STAT.rows(save.up.frame), g=save.grid;
  if(designWeight()+WEIGHT.crew>designLift()) return false;
  for(let r=0;r<rows;r++) for(let c=0;c<COLS-1;c++) if(!g[r][c]&&(r===0||g[r-1][c])){ g[r][c]=id; return true; }
  return false;
}

/* ================= panels ================= */
let panelName=null, mapCircle=1, oddsOpen=false;
function openPanel(name){
  panelName=name;
  if(name==='map') mapCircle=levelInfo(save.maxLevel).circle;
  $('panel').hidden=false; renderPanel(); $('pBody').scrollTop=0;
}
function closePanel(){ if(wheel.spinning) return; $('panel').hidden=true; panelName=null; }
function resHTML(){ return '<div class="pill"><i class="coin"></i><b>'+fmt(save.coins)+'</b></div><div class="pill">'+IC('gem','ri')+'<b>'+fmt(save.gems)+'</b></div>'; }
function renderPanel(){
  const title={map:'Карта полётов', wheel:'Колесо фортуны', shop:'Магазин', store:'Склад'}[panelName]||'';
  $('pTitle').textContent=title;
  $('pRes').innerHTML=LAND||W>480?resHTML():'';
  const body=$('pBody');
  if(panelName==='map') body.innerHTML=mapHTML();
  else if(panelName==='wheel'){ body.innerHTML=wheelHTML(); sizeWheel(); }
  else if(panelName==='shop') body.innerHTML=shopHTML();
  else if(panelName==='store') body.innerHTML=storeHTML();
  refreshIcons(body);
}
function mapHTML(){
  const cur=save.maxLevel, maxC=Math.max(CIRCLES,levelInfo(cur).circle);
  mapCircle=clamp(mapCircle,1,maxC);
  let h='<div class="circbar"><button class="iconbtn" data-circ="-1" aria-label="Предыдущий круг"'+(mapCircle<=1?' disabled':'')+'>‹</button><span>Круг '+mapCircle+(mapCircle<=CIRCLES?' из '+CIRCLES:'')+'</span><button class="iconbtn" data-circ="1" aria-label="Следующий круг"'+(mapCircle>=maxC?' disabled':'')+'>›</button></div>';
  h+='<p class="hint">Пройдено уровней: <b>'+fmt(cur-1)+'</b> из '+fmt(MAX_LEVEL)+'. Каждый круг — те же шесть земель, но враги сильнее. Пройденные уровни можно переигрывать.</p><div class="locs">';
  LOCS.forEach((L,li)=>{
    const n0=(mapCircle-1)*PER_CIRCLE+li*LEVELS_PER_LOC+1;
    h+='<div class="loc"><div class="loc-head" style="background:linear-gradient(90deg,'+L.sky.top+','+L.sky.mid+')"><span class="outlined">'+L.name+'</span><small class="outlined">ур. '+n0+'–'+(n0+4)+'</small></div><div class="nodes">';
    for(let k=0;k<LEVELS_PER_LOC;k++){
      const n=n0+k, boss=k===LEVELS_PER_LOC-1, st=save.stars[n]||0;
      const cls=n<cur?'done':n===cur?'cur':'lockd';
      h+='<div class="ncol"><button class="node '+cls+(boss?' boss':'')+'" data-level="'+n+'" aria-label="Уровень '+n+(boss?', босс '+L.boss:'')+'"'+(n>cur?' disabled':'')+'>'+(boss?IC(n>cur?'lock':'skullboss','ni'):n>cur?IC('lock','ni'):n)+'</button><div class="nst">'+(n<cur?[1,2,3].map(i=>'<i class="'+(i<=st?'on':'')+'"></i>').join(''):'')+'</div></div>';
    }
    h+='</div></div>';
  });
  return h+'</div>';
}
function shopHTML(){
  let h='';
  if(!Platform.billingReady()) h+='<div class="testnote">Тестовый режим: покупки и реклама имитируются, деньги не списываются. В сборке для RuStore здесь откроется оплата RuStore.</div>';
  if(!save.bought.starter) h+='<div class="starter"><img src="'+icon('crate-gold')+'" alt=""><div><div class="nm">'+STARTER.name+'<span class="lv">один раз</span></div><div class="ds"><b>'+STARTER.gems+'</b> алмазов, золотой сундук и <b>'+fmt(levelReward(save.maxLevel)*STARTER.coinsX)+'</b> монет</div><button class="buy rub" data-rub="'+STARTER.id+'">'+rub(STARTER.rub)+'</button></div></div>';
  h+='<div class="sec">Алмазы</div><div class="offers">';
  PRODUCTS.forEach((p,i)=>{ const b=productBonus(p); h+='<div class="offer'+(p.hot?' hot':'')+'">'+(b>0?'<span class="tag">+'+b+'%</span>':'')+'<img class="oi" src="'+icon('gems'+(i+1))+'" alt=""><div class="on">'+p.name+'</div><div class="oa"><b>'+fmt(p.gems)+'</b> алмазов</div><button class="buy rub" data-rub="'+p.id+'">'+rub(p.rub)+'</button></div>'; });
  h+='</div>';
  const d=daily(), left=AD_LIMIT.coins-d.adCoins, ac=Math.round(levelReward(save.maxLevel)*1.5), ag=Math.max(2,Math.round(3*gearMul(save.maxLevel)));
  h+='<div class="sec">Бесплатно</div><div class="offers"><div class="offer"><img class="oi" src="'+icon('coins')+'" alt=""><div class="on">Немного ресурсов</div><div class="oa"><b>'+fmt(ac)+'</b> монет и <b>'+ag+'</b> шестерней<br>осталось сегодня: '+left+' из '+AD_LIMIT.coins+'</div><button class="buy ad" data-adcoins="1"'+(left<=0?' disabled data-poor="1"':'')+'>'+IC('ad')+'Реклама</button></div>';
  const pd=d.power<AD_LIMIT.power&&!powerActive();
  h+='<div class="offer"><img class="oi" src="'+icon('power')+'" alt=""><div class="on">Усиление на '+POWER_MIN+' мин</div><div class="oa">+30% урона, +50% монет<br>раз в день</div><button class="buy ad" data-open="power"'+(pd?'':' data-poor="1"')+'>'+IC('ad')+(powerActive()?'Активно':pd?'Реклама':'Завтра')+'</button></div></div>';
  h+='<div class="sec">Контейнеры</div><div class="offers">';
  for(const k of ['steel','gold','ark']) h+='<div class="offer"><img class="oi" src="'+icon('crate-'+k)+'" alt=""><div class="on">'+CONT[k].name+'</div><div class="oa">монеты и шестерни</div><button class="buy gem" data-gemcont="'+k+'">'+IC('gem')+CONT[k].gems+'</button></div>';
  h+='</div><div class="sec">Ресурсы</div><div class="offers">';
  h+='<div class="offer"><img class="oi" src="'+icon('coins')+'" alt=""><div class="on">Мешок монет</div><div class="oa"><b>'+fmt(levelReward(save.maxLevel)*8)+'</b> монет</div><button class="buy gem" data-gempack="coins">'+IC('gem')+PRICE.coinsPack+'</button></div>';
  h+='<div class="offer"><img class="oi" src="'+icon('gearpile')+'" alt=""><div class="on">Ящик шестерней</div><div class="oa"><b>'+fmt(Math.round(30*gearMul(save.maxLevel)))+'</b> шестерней</div><button class="buy gem" data-gempack="gears">'+IC('gem')+PRICE.gearsPack+'</button></div></div>';
  h+='<div class="sec">Легендарные герои</div>';
  for(const id of LEG_IDS){ const d2=CREW[id], own=save.crew[id].own; h+='<div class="card legend"><img class="ic" src="'+icon('crew-'+id)+'" alt=""><div class="info"><div class="nm">'+d2.name+'<span class="lv leg">Легенда</span></div><div class="ds">'+d2.role+'</div></div>'+(own?'<span class="maxed">В экипаже</span>':'<div class="acts"><button class="buy gem" data-legbuy="'+id+'">'+IC('gem')+fmt(d2.gems)+'</button></div>')+'</div>'; }
  h+='<p class="hint">Алмазы покупаются только за рубли. Цены указаны с учётом НДС.</p>';
  return h;
}
function storeHTML(){
  let h='<p class="hint">Контейнеры выпадают за победы, из сундуков на шарах и на колесе фортуны. Внутри монеты и шестерни.</p>';
  let total=0;
  for(const k of CONT_IDS){ const n=save.cont[k]; total+=n; const c=CONT[k];
    h+='<div class="store-row"><img src="'+icon('crate-'+k)+'" alt=""><div class="info"><div class="nm">'+c.name+'<span class="lv">×'+n+'</span></div><div class="ds">Монеты ×'+fmt1(c.coins[0])+'–'+fmt1(c.coins[1])+' награды за уровень, шестерни '+fmt(Math.round(c.gears[0]*gearMul(save.maxLevel)))+'–'+fmt(Math.round(c.gears[1]*gearMul(save.maxLevel)))+'</div></div>'+
      (n>0?'<button class="buy" data-opencont="'+k+'">Открыть</button>':'<button class="buy gem" data-gemcont="'+k+'">'+IC('gem')+c.gems+'</button>')+'</div>'; }
  if(total>1) h+='<button class="btn go" data-openall="1">Открыть всё ('+total+')</button>';
  return h;
}
function rollContainer(k){ const c=CONT[k], R=levelReward(save.maxLevel), gm=gearMul(save.maxLevel); return {coins:Math.round(R*rand(c.coins[0],c.coins[1])), gears:Math.max(1,Math.round(gm*rand(c.gears[0],c.gears[1])))}; }
function openContainer(k){
  if(save.cont[k]<=0) return;
  save.cont[k]--; const r=rollContainer(k); save.coins+=r.coins; save.gears+=r.gears; persist(); Snd.play('open');
  showModal('<h2 class="mtitle win outlined">'+CONT[k].name+'</h2><img class="mimg shake" src="'+icon('crate-'+k)+'" alt="">'+rewardRows([{ic:'coin',label:'Монеты',amount:r.coins},{ic:'gear',label:'Шестерни',amount:r.gears}])+
    '<div class="macts">'+(save.cont[k]>0?'<button class="btn ghost" data-act="more">Ещё ('+save.cont[k]+')</button>':'')+'<button class="btn go" data-act="ok">Забрать</button></div>',{ok:()=>{ hideModal(); refreshAll(); }, more:()=>{ hideModal(); openContainer(k); }});
  refreshAll();
}
function openAll(){
  let coins=0,gears=0,n=0;
  for(const k of CONT_IDS) while(save.cont[k]>0){ save.cont[k]--; const r=rollContainer(k); coins+=r.coins; gears+=r.gears; n++; }
  save.coins+=coins; save.gears+=gears; persist(); Snd.play('open');
  showReward('Открыто: '+n,[{ic:'coin',label:'Монеты',amount:coins},{ic:'gear',label:'Шестерни',amount:gears}],'crate-gold');
}
function buyGemCont(k){ spendGems(CONT[k].gems,CONT[k].name,()=>{ save.cont[k]++; persist(); openContainer(k); }); }
function buyGemPack(kind){
  if(kind==='coins'){ const a=levelReward(save.maxLevel)*8; spendGems(PRICE.coinsPack,'Мешок монет',()=>{ save.coins+=a; persist(); showReward('Мешок монет',[{ic:'coin',label:'Монеты',amount:a}],'coins'); }); }
  else { const a=Math.round(30*gearMul(save.maxLevel)); spendGems(PRICE.gearsPack,'Ящик шестерней',()=>{ save.gears+=a; persist(); showReward('Ящик шестерней',[{ic:'gear',label:'Шестерни',amount:a}],'gearpile'); }); }
}
async function adCoins(){
  const d=daily(); if(d.adCoins>=AD_LIMIT.coins){ toast('На сегодня всё. Возвращайтесь завтра'); return; }
  if(!await watchAd('free_resources')) return;
  d.adCoins++; const c=Math.round(levelReward(save.maxLevel)*1.5), g=Math.max(2,Math.round(3*gearMul(save.maxLevel)));
  save.coins+=c; save.gears+=g; persist(); showReward('Награда',[{ic:'coin',label:'Монеты',amount:c},{ic:'gear',label:'Шестерни',amount:g}],'coins');
}
function openPower(){
  const d=daily();
  if(powerActive()){ const s=Math.ceil((save.powerUntil-Date.now())/1000); showModal('<h2 class="mtitle win outlined">Усиление</h2><img class="mimg" src="'+icon('power')+'" alt=""><p class="mtip">Активно ещё <b>'+Math.floor(s/60)+' мин '+(s%60)+' с</b>: +30% урона экипажа и +50% монет за бой.</p><div class="macts"><button class="btn go" data-act="ok">Ок</button></div>',{ok:hideModal}); return; }
  if(d.power>=AD_LIMIT.power){ showModal('<h2 class="mtitle outlined">Усиление</h2><img class="mimg" src="'+icon('power')+'" alt=""><p class="mtip">Сегодня усиление уже было. Завтра можно получить снова.</p><div class="macts"><button class="btn go" data-act="ok">Ок</button></div>',{ok:hideModal}); return; }
  showModal('<h2 class="mtitle win outlined">Усиление</h2><img class="mimg" src="'+icon('power')+'" alt=""><p class="mtip">Посмотрите рекламу и получите усиление на <b>'+POWER_MIN+' минут</b>: +30% урона всего экипажа и +50% монет. Доступно раз в день.</p><div class="macts"><button class="btn ghost" data-act="no">Не сейчас</button><button class="btn ad" data-act="yes">'+IC('ad')+'Смотреть</button></div>',
    {no:hideModal, yes:async()=>{ hideModal(); if(!await watchAd('daily_power')) return; const dd=daily(); dd.power++; save.powerUntil=Date.now()+POWER_MIN*60000; persist(); Snd.play('legend'); rebuildPreview(); refreshAll(); toast('Усиление активно на '+POWER_MIN+' минут!'); }});
}

/* ================= wheel of fortune ================= */
const wheel={angle:-Math.PI/2-0.5*TAU/WHEEL.length, spinning:false, from:0, to:0, t:0, dur:4.2, idx:0, dirty:false, lastSeg:0};
function wheelAmount(slot){ const n=save.maxLevel, R=levelReward(n), gm=gearMul(n);
  return {coinsS:R*2, coinsL:R*6, gearsS:Math.max(3,Math.round(6*gm)), gearsL:Math.max(10,Math.round(20*gm))}[slot.id]; }
function wheelLabel(slot){ const a=wheelAmount(slot); if(a!=null) return fmt(a); return {wood:'Ящик', steel:'Контейнер', gold:'Сундук', power:'+30%', hero:'Легенда'}[slot.id]||''; }
function wheelIcon(slot){ return {coinsS:'coins', coinsL:'loot', gearsS:'gear', gearsL:'gearpile', wood:'crate-wood', steel:'crate-steel', gold:'crate-gold', power:'power'}[slot.id]||('crew-'+slot.hero); }
function wheelPrizeName(slot){ return {coinsS:'Монеты', coinsL:'Много монет', gearsS:'Шестерни', gearsL:'Много шестерней', wood:CONT.wood.name, steel:CONT.steel.name, gold:CONT.gold.name, power:'Усиление на '+POWER_MIN+' минут'}[slot.id]||('Легендарный герой: '+CREW[slot.hero].name); }
function wheelHTML(){
  const d=daily();
  let btn;
  if(d.wheelFree<1) btn='<button class="btn go" data-spin="1">Крутить бесплатно</button>';
  else if(d.wheelAd<AD_LIMIT.wheel) btn='<button class="btn ad" data-spin="1">'+IC('ad')+'Крутить за рекламу · осталось '+(AD_LIMIT.wheel-d.wheelAd)+'</button>';
  else btn='<button class="btn gem" data-spin="1">Крутить за '+IC('gem')+PRICE.spin+'</button>';
  const odds=WHEEL.map(s=>'<span>'+wheelPrizeName(s)+(s.id==='hero'&&save.crew[s.hero].own?' (уже есть — выдаём ковчег)':'')+'</span><b>'+pct(s.w/100)+'</b>').join('');
  return '<div class="wheel-wrap"><canvas id="wheelCv" aria-label="Колесо фортуны"></canvas></div><div class="wheel-acts">'+btn+
    '<p class="hint" style="text-align:center">Раз в день бесплатно, ещё '+AD_LIMIT.wheel+' раза за рекламу, дальше за алмазы.</p><button class="linkbtn" data-odds="1">'+(oddsOpen?'Скрыть шансы':'Шансы выпадения')+'</button><div class="odds"'+(oddsOpen?'':' hidden')+'>'+odds+'</div></div>';
}
function sizeWheel(){ const c=$('wheelCv'); if(!c) return; const r=c.getBoundingClientRect(); const px=Math.round(Math.max(200,r.width)*DPR); if(c.width!==px){ c.width=px; c.height=px; } wheel.dirty=true; }
function drawWheel(){
  wheel.dirty=false;
  const c=$('wheelCv'); if(!c||panelName!=='wheel') return;
  const x=c.getContext('2d'), S=c.width, k=S/330;
  x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,S,S);
  x.setTransform(k,0,0,k,0,0); x.lineJoin='round'; x.lineCap='round';
  const cx=165, cy=170, R=140, N=WHEEL.length, seg=TAU/N;
  circ(x,cx,cy+4,R+12); x.fillStyle=INK; x.fill();
  circ(x,cx,cy,R+12); x.fillStyle='#c0850f'; x.fill(); x.lineWidth=4; x.strokeStyle=INK; x.stroke();
  for(let i=0;i<24;i++){ const a=i/24*TAU; circ(x,cx+Math.cos(a)*(R+6),cy+Math.sin(a)*(R+6),3); x.fillStyle=(i+Math.floor(gt*4))%2?'#fff4a6':'#ffd23f'; x.fill(); }
  WHEEL.forEach((slot,i)=>{
    const a0=wheel.angle+i*seg, a1=a0+seg, legend=slot.id==='hero';
    x.beginPath(); x.moveTo(cx,cy); x.arc(cx,cy,R,a0,a1); x.closePath();
    if(legend){ const g=x.createRadialGradient(cx,cy,20,cx,cy,R); g.addColorStop(0,'#ffe7a0'); g.addColorStop(1,'#9b62ec'); x.fillStyle=g; } else x.fillStyle=i%2?'#fff1d6':'#c4e7fc';
    x.fill(); x.lineWidth=2.5; x.strokeStyle=INK; x.stroke();
    const am=a0+seg/2;
    x.save(); x.translate(cx,cy); x.rotate(am+Math.PI/2);
    x.save(); x.translate(0,-R*0.56); x.scale(0.6,0.6); x.translate(-28,-28); drawIcon(x,wheelIcon(slot),0); x.restore();
    const lbl=wheelLabel(slot);
    x.font=(lbl.length>7?10:12)+'px "Russo One", "Arial Black", sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=3.5; x.strokeStyle=legend?INK:'#ffffff';
    x.strokeText(lbl,0,-R*0.84); x.fillStyle=legend?'#ffd23f':INK; x.fillText(lbl,0,-R*0.84);
    x.restore();
  });
  circ(x,cx,cy,24); x.fillStyle='#ffd23f'; x.fill(); x.lineWidth=3.5; x.strokeStyle=INK; x.stroke();
  x.fillStyle='#ffffff'; star(x,cx,cy,13,6,5); x.fill(); x.lineWidth=2; x.stroke();
  x.beginPath(); x.moveTo(cx-15,cy-R-22); x.lineTo(cx+15,cy-R-22); x.lineTo(cx,cy-R+8); x.closePath(); x.fillStyle='#f0503f'; x.fill(); x.lineWidth=3; x.strokeStyle=INK; x.stroke();
}
async function doSpin(){
  if(wheel.spinning) return;
  const d=daily();
  if(d.wheelFree<1){ d.wheelFree++; persist(); startSpin(); }
  else if(d.wheelAd<AD_LIMIT.wheel){ if(!await watchAd('wheel_spin')) return; d.wheelAd++; persist(); startSpin(); }
  else spendGems(PRICE.spin,'Вращение колеса',()=>startSpin());
  renderPanelSoon();
}
function renderPanelSoon(){ setTimeout(()=>{ if(panelName==='wheel'&&!wheel.spinning){ renderPanel(); } },0); }
function weightedPick(list){ let r=Math.random()*list.reduce((a,s)=>a+s.w,0); for(let i=0;i<list.length;i++){ r-=list[i].w; if(r<=0) return i; } return 0; }
function startSpin(){
  if(panelName!=='wheel') openPanel('wheel');
  const idx=weightedPick(WHEEL), N=WHEEL.length, seg=TAU/N;
  let target=-Math.PI/2-(idx+0.5)*seg+rand(-0.35,0.35)*seg;
  while(target<wheel.angle+TAU*5) target+=TAU;
  Object.assign(wheel,{spinning:true, from:wheel.angle, to:target, t:0, idx, lastSeg:Math.floor(wheel.angle/seg)});
  const b=$('pBody').querySelector('[data-spin]'); if(b) b.disabled=true;
}
function updateWheel(dt){
  if(!wheel.spinning) return;
  wheel.t+=dt; const u=clamp(wheel.t/wheel.dur,0,1), e=1-Math.pow(1-u,4);
  wheel.angle=lerp(wheel.from,wheel.to,e);
  const seg=TAU/WHEEL.length, sg=Math.floor(wheel.angle/seg); if(sg!==wheel.lastSeg){ wheel.lastSeg=sg; Snd.play('tick'); }
  wheel.dirty=true;
  if(u>=1){ wheel.spinning=false; wheel.angle%=TAU; grantWheel(WHEEL[wheel.idx]); }
}
function grantWheel(slot){
  const a=wheelAmount(slot), name=wheelPrizeName(slot);
  if(slot.id==='hero'){
    if(!save.crew[slot.hero].own){ const placed=grantHero(slot.hero); Snd.play('legend'); showLegend(slot.hero,placed); renderPanel(); return; }
    save.cont.ark++; persist(); Snd.play('open'); showReward('Выигрыш!',[{ic:'crate-ark',label:CONT.ark.name+' (герой уже есть)',amount:1}],'crate-ark'); renderPanel(); return;
  }
  if(slot.id==='coinsS'||slot.id==='coinsL') save.coins+=a;
  else if(slot.id==='gearsS'||slot.id==='gearsL') save.gears+=a;
  else if(CONT[slot.id]) save.cont[slot.id]++;
  else if(slot.id==='power') save.powerUntil=Math.max(Date.now(),save.powerUntil)+POWER_MIN*60000;
  persist(); Snd.play('open');
  const ic=slot.id.startsWith('coins')?'coin':slot.id.startsWith('gears')?'gear':wheelIcon(slot);
  showReward('Выигрыш!',[{ic,label:name,amount:a!=null?a:(CONT[slot.id]?1:null)}],wheelIcon(slot));
  renderPanel();
}

/* ================= test-mode ads & payments ================= */
function testAd(placement){
  return new Promise(res=>{
    const was=paused; paused=true; const DUR=4;
    $('sysCard').innerHTML='<h3>Реклама</h3><div class="sys-box" id="sysBox">'+DUR+'</div><div class="sys-bar"><span id="sysBar"></span></div><p>Тестовый режим: здесь будет ролик рекламной сети. Награда начислится после просмотра.</p><button class="btn ghost small" id="sysSkip">Закрыть без награды</button>';
    $('sys').hidden=false;
    const t0=performance.now();
    const done=ok=>{ clearInterval(tm); $('sys').hidden=true; paused=was; last=performance.now(); res({ok}); };
    const tm=setInterval(()=>{ const el=(performance.now()-t0)/1000; $('sysBox').textContent=el<DUR?Math.ceil(DUR-el):'✓'; $('sysBar').style.width=Math.min(100,el/DUR*100)+'%'; if(el>=DUR+0.3) done(true); },100);
    $('sysSkip').onclick=()=>done(false);
  });
}
function testPay(product){
  return new Promise(res=>{
    const was=paused; paused=true;
    $('sysCard').innerHTML='<h3>Оплата</h3><p>'+product.name+(product.gems?' · '+fmt(product.gems)+' алмазов':'')+'</p><div class="price">'+rub(product.rub)+'</div><p>Тестовый режим: деньги не списываются. В сборке для RuStore здесь откроется окно оплаты RuStore.</p><button class="btn gold" id="sysPay">Оплатить '+rub(product.rub)+' (тест)</button><button class="btn ghost small" id="sysCancel">Отмена</button>';
    $('sys').hidden=false;
    const done=ok=>{ $('sys').hidden=true; paused=was; last=performance.now(); res(ok?{ok:true}:{ok:false,error:'cancel'}); };
    $('sysPay').onclick=()=>done(true); $('sysCancel').onclick=()=>done(false);
  });
}
