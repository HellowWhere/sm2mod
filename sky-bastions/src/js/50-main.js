/* ================= loop, input, boot ================= */
function resize(){
  const r=app.getBoundingClientRect(); W=Math.max(1,r.width); H=Math.max(1,r.height);
  DPR=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
  LAND=W>H*1.05; app.classList.toggle('land',LAND); app.classList.toggle('port',!LAND);
  _safeTop=null; wType='-';
  if(mode==='battle'){ battleLayout(); updateCoinTarget(); }
  if(panelName==='wheel') sizeWheel();
}
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const rdt=Math.min(0.05,Math.max(0,(now-last)/1000)); last=now;
  if(toastT>0){ toastT-=rdt; if(toastT<=0) $('toast').hidden=true; }
  try{
    updateWheel(rdt);
    if(mode==='hangar'){ gt+=rdt; updWeather(rdt); updateHangar(rdt); renderHangar(); }
    else {
      if(!paused){ for(let i=0;i<speedMul;i++){ gt+=rdt; updateBattle(rdt); } updWeather(rdt); }
      renderBattle();
    }
    if(wheel.dirty) drawWheel();
  }catch(e){ console.error(e); }
}
function bindUI(){
  cv.addEventListener('pointerdown',e=>{ Snd.init(); const r=cv.getBoundingClientRect(), sx=e.clientX-r.left, sy=e.clientY-r.top; if(mode==='hangar') hangarTap(sx,sy); else if(!paused) battleTap(sx,sy); });
  document.addEventListener('pointerdown',()=>Snd.init(),{capture:true});
  $('tabs').addEventListener('click',e=>{ const b=e.target.closest('.tab'); if(!b) return; Snd.play('click'); setTab(b.dataset.tab); });
  $('sheetBody').addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return; const d=b.dataset;
    if(d.buy) buy(d.buy);
    else if(d.qbuy) quickBuy('buy',d.qbuy);
    else if(d.crew) crewAction(d.crew,false);
    else if(d.qcrew) quickBuy('crew',d.qcrew);
    else if(d.hire) crewAction(d.hire,true);
    else if(d.legbuy) buyLegend(d.legbuy);
    else if(d.tool){ tool=d.tool; Snd.play('click'); renderSheet(); }
  });
  for(const b of document.querySelectorAll('.rbtn')) b.addEventListener('click',()=>{ Snd.play('click'); const k=b.dataset.open; if(k==='power') openPower(); else openPanel(k); });
  $('hGemsPill').addEventListener('click',()=>{ Snd.play('click'); openPanel('shop'); });
  $('pClose').addEventListener('click',()=>{ Snd.play('click'); closePanel(); });
  $('panel').addEventListener('click',e=>{
    if(e.target===$('panel')){ closePanel(); return; }
    const b=e.target.closest('button'); if(!b) return; const d=b.dataset;
    if(d.level){ Snd.play('click'); startBattle(+d.level); }
    else if(d.circ){ mapCircle+=+d.circ; renderPanel(); }
    else if(d.spin) doSpin();
    else if(d.odds){ oddsOpen=!oddsOpen; renderPanel(); }
    else if(d.rub) buyProduct(d.rub);
    else if(d.adcoins) adCoins();
    else if(d.open==='power') openPower();
    else if(d.gemcont) buyGemCont(d.gemcont);
    else if(d.gempack) buyGemPack(d.gempack);
    else if(d.legbuy) buyLegend(d.legbuy);
    else if(d.opencont) openContainer(d.opencont);
    else if(d.openall) openAll();
  });
  $('fightBtn').addEventListener('click',()=>{
    Snd.init();
    if(designWeight()>designLift()){ toast('Перегруз! Улучшите баллоны или уберите блоки'); const lb=$('liftBox'); lb.classList.remove('shake'); void lb.offsetWidth; lb.classList.add('shake'); return; }
    if(!CREW_IDS.some(id=>!CREW[id].support&&isPlaced(id))){ toast('Посадите на борт хотя бы одного бойца'); setTab('yard'); return; }
    Snd.play('click'); startBattle(save.maxLevel);
  });
  $('soundBtn').addEventListener('click',()=>{ save.sound=!save.sound; persist(); syncSound(); if(save.sound){ Snd.init(); Snd.play('click'); } });
  $('pauseBtn').addEventListener('click',()=>{ if(mode==='battle'&&run&&!run.over&&!paused) showPause(); });
  $('speedBtn').addEventListener('click',()=>{ speedMul=speedMul===1?2:1; $('speedBtn').textContent='×'+speedMul; Snd.play('click'); });
  $('ramBtn').addEventListener('click',useRam);
  $('ballastBtn').addEventListener('click',useBallast);
  $('modal').addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(!b) return; Snd.play('click'); const f=modalActs[b.dataset.act]; if(f) f(); });
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'){ if(!$('panel').hidden){ closePanel(); return; } }
    if(mode!=='battle'||!run) return;
    if(e.code==='Space'){ e.preventDefault(); useRam(); }
    else if(e.key==='b'||e.key==='и'||e.key==='B'||e.key==='И') useBallast();
    else if(e.key==='Escape'&&!run.over){ if(paused&&!$('modal').hidden&&modalActs.resume) modalActs.resume(); else if(!paused) showPause(); }
  });
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&mode==='battle'&&run&&!run.over&&!paused) showPause(); });
}
function syncSound(){ $('soundIc').src=icon(save.sound?'sound-on':'sound-off'); $('soundBtn').setAttribute('aria-pressed',String(save.sound)); $('soundBtn').setAttribute('aria-label',save.sound?'Звук включён':'Звук выключен'); }
function boot(data){
  save=(data&&data.save)?migrate(data.save):loadSave();
  daily(); persist();
  resize();
  rebuildPreview();
  $('pauseIc').src=icon('pause'); $('ramIc').src=icon('ram'); $('ballastIc').src=icon('ballast');
  syncSound(); bindUI(); setTab('yard');
  requestAnimationFrame(t=>{ last=t; frame(t); });
  if(document.fonts&&document.fonts.load) document.fonts.load('20px "Russo One"').then(()=>{ wheel.dirty=true; }).catch(()=>{});
  try{ window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({save})); }catch(e){}
  window.SkyBastions={
    setSpeed:n=>{ speedMul=Math.max(1,Math.min(8,n|0)); },
    get state(){ return {mode, save, run:run&&{n:run.n,coins:run.coins,gears:run.gears,over:run.over,prog:P?P.x-run.startX:0,len:run.len,revived:run.revived}, ships:ships.length, fliers:fliers.length, paused}; },
    cellScreen(c,r){ return {x:hox+(-preview.w/2+c*B+B/2)*hs, y:hoy-(r+0.5)*B*hs}; },
    enemyBalloonScreen(){ for(const sh of ships){ if(sh.side!==-1||sh.dead) continue; const b=sh.balloons.find(x=>x.alive); if(b){ const q=balPos(sh,b); return {x:(q.x-cam.x)*cam.s, y:(q.y-cam.y)*cam.s}; } } return null; },
  };
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.ready) hot.ready(boot); else boot((hot&&hot.data)||{});
