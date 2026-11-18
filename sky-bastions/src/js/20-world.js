/* ================= ships ================= */
function onBoard(){ const set=new Set(), rows=STAT.rows(save.up.frame); for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++){ const v=save.grid[r][c]; if(v&&v!=='W'&&save.crew[v]&&save.crew[v].own) set.add(v); } return set; }
function playerMods(){
  const up=save.up, on=onBoard(), pw=powerActive();
  return {dmg:STAT.powder(up.powder)*(on.has('thunder')?1.1:1)*(pw?POWER_DMG:1), rate:STAT.sights(up.sights),
    coins:STAT.loot(up.loot)*(on.has('valkyrie')?1.15:1)*(pw?POWER_COINS:1), regen:STAT.autoRep(up.autoRep)+(on.has('atlas')?0.004:0),
    patch:STAT.bPatch(up.bPatch), dodge:STAT.dodge(up.dodge)};
}
function playerSpec(){
  const up=save.up, rows=STAT.rows(up.frame), cells=[], m=playerMods();
  for(let r=0;r<rows;r++) for(let col=0;col<COLS;col++){ const v=save.grid[r][col]; if(!v) continue;
    if(v==='W') cells.push({c:col,r,type:'W'}); else if(save.crew[v]&&save.crew[v].own) cells.push({c:col,r,type:'crew',crew:v,lvl:save.crew[v].lvl}); }
  const n=STAT.bCount(up.bCount);
  return {side:1, cols:COLS, frameRows:rows, cells, wallHp:STAT.wallHp(up.wall), hullHp:STAT.hullHp(up.hull), hullLvl:up.hull, hullPal:HULLS[hullTierOf(up.hull)], matTier:tierOf(up.wall),
    bal:{n, hp:STAT.bHp(up.bHp), lift:STAT.bLift(up.bLift), R:(30+Math.min(10,(up.bLift-1)*0.5))*(n>=5?0.86:1), armor:(up.bHp-1)%8+1+(up.bHp>=9?4:0), look:'p'+btierOf(up.bHp)},
    rotorLift:STAT.rotor(up.rotor), rotorLvl:up.rotor, thrustLvl:up.thrust, speed:STAT.speed(up.thrust), ram:STAT.ram(up.thrust), ramCd:STAT.ramCd(up.boost),
    dmgMul:m.dmg, rateMul:m.rate, coinMul:m.coins, regen:m.regen, patch:m.patch, dodge:m.dodge, pirate:false, flag:'#2f6fd0'};
}
function enemyPool(n){ const p=['gunner']; for(const [id,at] of [['cannon',2],['harpoon',3],['mechanic',5],['tesla',6],['sniper',9],['rocket',13],['flamer',17],['frost',21],['gatling',26]]) if(n>=at) p.push(id); return p; }
function enemySpec(n,kind){
  const info=levelInfo(n), D=diffOf(n), circ_=info.circle, Lc=LOCS[info.loc];
  let cols,rows,nCrew,nBal,name,hullK;
  if(kind==='scout'){ cols=3; rows=n<2?1:irand(1,2); nCrew=n<2?1:irand(1,2); nBal=rows>1?2:irand(1,2); name='Пиратский шлюп'; hullK=1; }
  else if(kind==='frigate'){ cols=4; rows=irand(2,3); nCrew=irand(2,3)+(circ_>=3?1:0); nBal=rows>2?3:irand(2,3); name='Пиратский фрегат'; hullK=1.5; }
  else { cols=5; rows=4; nCrew=Math.min(6,3+Math.floor(circ_/2)); nBal=Math.min(6,4+Math.floor((circ_-1)/2)); name='«'+Lc.boss+'»'; hullK=2.6; }
  const pool=enemyPool(n), cells=[];
  for(let col=0;col<cols;col++){ const h=col===cols-1?rows:Math.max(1,rows-(Math.random()<0.4?1:0)); for(let r=0;r<h;r++) cells.push({c:col,r,type:'W'}); }
  const cand=cells.filter(x=>x.c<cols-1).sort((a,b)=>(b.r-a.r)+(Math.random()-0.5)*1.5);
  for(let i=0;i<Math.min(nCrew,cand.length);i++){ cand[i].type='crew'; cand[i].crew=i===0?'gunner':pick(pool); cand[i].lvl=1; }
  let wgt=WEIGHT.hull; for(const x of cells) wgt+=x.type==='W'?WEIGHT.wall:WEIGHT.crew;
  const boss=kind==='boss';
  return {side:-1, cols, cells, wallHp:Math.round(36*D.hp), hullHp:Math.round(100*D.hp*hullK), hullLvl:1, hullPal:Lc.hull, matTier:Math.min(MATS.length-1,Math.floor((n-1)/12)),
    bal:{n:nBal, hp:Math.round(38*D.hp*(boss?1.5:1)), lift:wgt*rand(1.12,1.24)/nBal, R:(boss?36:27+nBal*1.5)*(nBal>=5?0.88:1), armor:Math.min(12,1+Math.floor(n/10)), look:'e'+info.loc},
    rotorLift:0, rotorLvl:0, thrustLvl:Math.min(40,1+Math.floor(n/4)), speed:110, ram:Math.round(60*D.hp), ramCd:16, dmgMul:D.dmg, rateMul:1, pirate:true, boss, name, kind, flag:Lc.flag,
    reward:Math.round((16+6*cells.length+8*nBal)*D.rew*(boss?1.6:1)), gears:boss?Math.round(12*gearMul(n)):kind==='frigate'&&Math.random()<0.5?Math.max(1,Math.round(2*gearMul(n))):0};
}
const BAL_X={1:[0],2:[-0.26,0.26],3:[-0.38,0,0.38],4:[-0.42,-0.14,0.14,0.42],5:[-0.46,-0.23,0,0.23,0.46],6:[-0.48,-0.29,-0.1,0.1,0.29,0.48]};
const BAL_HIGH={3:[1],4:[1,2],5:[1,3],6:[1,3,5]};
function makeShip(spec,x){
  const s={side:spec.side, cols:spec.cols, w:spec.cols*B, x, y:DECK, cruiseY:DECK, vy:0, rot:0, rotV:0, kx:0, dead:false, gone:false, spec, cells:[], balloons:[], t:Math.random()*10, propA:Math.random()*6,
    ram:null, ramT:(spec.ramCd||10)*0.4, weightMul:1, matTier:spec.matTier||0, moving:false, smokeT:0, shield:0, shieldMax:0, shieldHit:0, chill:0, freeze:0, invuln:0, regenT:0};
  s.hull={kind:'hull', ship:s, hp:spec.hullHp, max:spec.hullHp, alive:true, hit:0};
  for(const sc of spec.cells){ const crew=sc.type==='crew', max=crew?Math.round(spec.wallHp*0.8):spec.wallHp;
    s.cells.push({kind:'cell', ship:s, c:sc.c, r:sc.r, type:sc.type, crew:sc.crew, lvl:sc.lvl||1, hp:max, max, alive:true, hit:0, cd:crew?rand(0.5,1.5):0, aim:-0.15, recoil:0, act:0, target:null, retarget:0, bob:Math.random()*TAU, pop:0, burst:0, burstT:0}); }
  let maxR=0; for(const c of spec.cells) maxR=Math.max(maxR,c.r+1);
  s.topRows=Math.max(1,spec.frameRows||maxR);
  const bal=spec.bal, n=clamp(bal.n,1,6), R=bal.R, topY=-s.topRows*B, baseY=topY-22-R, hi=BAL_HIGH[n]||[];
  s.balloons=BAL_X[n].map((fx,i)=>{ const lx=fx*Math.max(s.w,150)*(n>=5?1.08:1);
    return {kind:'balloon', ship:s, lx, ly:baseY-(hi.indexOf(i)>=0?R*0.55:0), R, hp:bal.hp, max:bal.hp, lift:bal.lift, alive:true, hit:0, wob:Math.random()*TAU, ax:clamp(lx,-s.w/2+10,s.w/2-10), ay:topY, armor:bal.armor||1, look:bal.look,
      patches:[{x:rand(-0.5,0.3),y:rand(-0.5,0.1),a:rand(-0.6,0.6)},{x:rand(0,0.5),y:rand(0,0.5),a:rand(-0.6,0.6)},{x:rand(-0.4,0.2),y:rand(0.2,0.6),a:rand(-0.6,0.6)}]}; });
  return s;
}
function shipWeight(s){ let w=WEIGHT.hull; for(const c of s.cells) if(c.alive) w+=c.type==='W'?WEIGHT.wall:WEIGHT.crew; return w*s.weightMul; }
function shipLift(s){ let l=s.spec.rotorLift||0; for(const b of s.balloons) if(b.alive) l+=b.lift; return l; }
function effLift(s){ const depth=clamp((s.y-s.cruiseY)/(-s.cruiseY-HULL_H),0,1); return shipLift(s)*(1+0.6*depth); }
function designWeight(){ let w=WEIGHT.hull; const rows=STAT.rows(save.up.frame); for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++){ const v=save.grid[r][c]; if(v) w+=v==='W'?WEIGHT.wall:WEIGHT.crew; } return w; }
function designLift(){ return STAT.bCount(save.up.bCount)*STAT.bLift(save.up.bLift)+STAT.rotor(save.up.rotor); }
function isPlaced(id){ const rows=STAT.rows(save.up.frame); for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++) if(save.grid[r][c]===id) return true; return false; }

const bowX=s=>s.x+s.side*(s.w/2+56);
const sternX=s=>s.x-s.side*(s.w/2+45);
function hullRect(s){ const a=s.x+s.side*(-s.w/2-22), b=s.x+s.side*(s.w/2+46); return {x0:Math.min(a,b), x1:Math.max(a,b), y0:s.y-2, y1:s.y+HULL_H}; }
function cellPos(s,c){ return {x:s.x+s.side*(-s.w/2+c.c*B+B/2), y:s.y-(c.r+0.5)*B}; }
function balPos(s,b){ return {x:s.x+s.side*b.lx, y:s.y+b.ly+Math.sin(gt*1.3+b.wob)*2}; }
function partPos(p){ if(p.kind==='cell') return cellPos(p.ship,p); if(p.kind==='balloon') return balPos(p.ship,p); if(p.kind==='hull') return {x:p.ship.x+p.ship.side*p.ship.w*0.15, y:p.ship.y+20}; return {x:p.x, y:p.y}; }
function partAlive(p){ if(!p) return false; if(p.kind==='flier') return !p.dead; return p.alive&&!p.ship.dead; }
function muzzleBase(s,cell){ return {x:s.x+s.side*(-s.w/2+cell.c*B+B/2), y:s.y-cell.r*B-14}; }

/* ================= world state ================= */
let mode='hangar', paused=false, speedMul=1;
let preview=null, hs=1, hox=0, hoy=0, hfx=[], yardFlash=null;
let ships=[], fliers=[], projs=[], parts=[], coinsFx=[], burns=[];
let P=null, run=null, gt=0, shake=0;
const cam={x:0, y:0, s:1, gsy:0};
let curLoc=LOCS[0], curLocIdx=0;
let tab='yard', tool='W';
let coinTarget={x:0,y:0};
function setLoc(i){ curLocIdx=i; curLoc=LOCS[i]; }

/* ================= background ================= */
const cloudCache=new Map(), islandCache=new Map();
const TREE_COL=['#4f9a45','#7a9a3a','#2f6f5a','#3a2a2a','#3f6a4f','#2a3f6a'];
function cloudSprites(){
  const key=curLocIdx; if(cloudCache.has(key)) return cloudCache.get(key);
  const sk=curLoc.sky, arr=[];
  for(let v=0;v<4;v++){
    const c=document.createElement('canvas'); c.width=520; c.height=260; const x=c.getContext('2d'); x.scale(2,2);
    const n=5+v%3, blobs=[];
    for(let i=0;i<n;i++){ const u=i/(n-1); blobs.push({x:40+u*180+(h1(v*10+i)*20-10), y:84-Math.sin(u*Math.PI)*28-h1(v*7+i)*12, r:24+Math.sin(u*Math.PI)*24+h1(v*3+i*7)*10}); }
    x.save(); x.beginPath(); x.rect(0,0,260,106); x.clip();
    x.fillStyle=sk.cloudS; for(const b of blobs){ circ(x,b.x,b.y+6,b.r); x.fill(); }
    x.fillStyle=sk.cloud; for(const b of blobs){ circ(x,b.x-2,b.y-3,b.r*0.9); x.fill(); }
    x.restore(); arr.push(c);
  }
  cloudCache.set(key,arr); return arr;
}
function islandSprites(){
  const key=curLocIdx; if(islandCache.has(key)) return islandCache.get(key);
  const sk=curLoc.sky, arr=[], tree=TREE_COL[curLocIdx];
  for(let v=0;v<3;v++){
    const c=document.createElement('canvas'); c.width=480; c.height=460; const x=c.getContext('2d'); x.scale(2,2); x.lineJoin='round'; x.lineCap='round';
    const tipX=100+h1(v+3)*40;
    if(v!==1){ const wf=x.createLinearGradient(0,70,0,200); const wc=curLoc.ground==='volcano'?'255,120,40':'170,225,255'; wf.addColorStop(0,'rgba('+wc+',.95)'); wf.addColorStop(1,'rgba('+wc+',0)'); x.fillStyle=wf; x.fillRect(158+v*6,70,9,140); }
    x.beginPath(); x.moveTo(18,70); x.quadraticCurveTo(58,150,tipX,222); x.quadraticCurveTo(152,140,222,70); x.closePath();
    const g=x.createLinearGradient(0,60,0,220); g.addColorStop(0,sk.rockA); g.addColorStop(1,sk.rockB); x.fillStyle=g; x.fill(); x.lineWidth=4; x.strokeStyle=INK; x.stroke();
    x.strokeStyle='rgba(30,20,25,.35)'; x.lineWidth=3; x.beginPath(); x.moveTo(45,100); x.lineTo(110,108); x.lineTo(190,98); x.moveTo(75,140); x.lineTo(150,146); x.stroke();
    x.beginPath(); x.ellipse(120,68,104,20,0,0,TAU); x.fillStyle=sk.island; x.fill(); x.lineWidth=4; x.strokeStyle=INK; x.stroke();
    x.fillStyle=sk.island; for(let i=0;i<7;i++){ const px=34+i*28; x.beginPath(); x.arc(px,80,7,0,Math.PI); x.fill(); x.lineWidth=2.5; x.stroke(); }
    const trees=v===2?[70,150,175]:[60,95];
    for(const tx of trees){
      if(curLoc.ground==='peaks'){ x.fillStyle=tree; x.beginPath(); x.moveTo(tx,14); x.lineTo(tx+15,58); x.lineTo(tx-15,58); x.closePath(); x.fill(); x.lineWidth=2.5; x.strokeStyle=INK; x.stroke(); x.fillStyle='#ffffff'; x.beginPath(); x.moveTo(tx,14); x.lineTo(tx+6,30); x.lineTo(tx-6,30); x.closePath(); x.fill(); continue; }
      x.fillStyle='#7a5230'; x.fillRect(tx-3,40,6,22); x.strokeStyle=INK; x.lineWidth=2.5; x.strokeRect(tx-3,40,6,22); circ(x,tx,34,15); x.fillStyle=tree; x.fill(); x.stroke(); circ(x,tx-5,29,5); x.fillStyle='rgba(255,255,255,.25)'; x.fill(); }
    if(v!==2){ const hx=140; x.fillStyle='#f3e3c3'; x.fillRect(hx,36,34,26); x.lineWidth=3; x.strokeStyle=INK; x.strokeRect(hx,36,34,26); x.beginPath(); x.moveTo(hx-5,38); x.lineTo(hx+17,18); x.lineTo(hx+39,38); x.closePath(); x.fillStyle='#d8483b'; x.fill(); x.stroke(); x.fillStyle=curLoc.ground==='night'?'#ffd86b':'#9fe0ff'; x.fillRect(hx+8,44,8,8); x.strokeRect(hx+8,44,8,8); }
    arr.push(c);
  }
  islandCache.set(key,arr); return arr;
}
function drawLayer(sprites,spacing,par,yFn,scFn,alpha,skipP,seed){
  const off=cam.x*par;
  const i0=Math.floor((off-500)/spacing), i1=Math.floor((off+W+200)/spacing);
  ctx.globalAlpha=alpha;
  for(let i=i0;i<=i1;i++){
    if(h1(i*3.7+seed)<skipP) continue;
    const sp=sprites[Math.floor(h1(i*1.3+seed)*sprites.length)];
    const sc=scFn(i), x=i*spacing-off+h1(i*5.1+seed)*spacing*0.5, y=yFn(i);
    ctx.drawImage(sp,x,y,sp.width*sc,sp.height*sc);
  }
  ctx.globalAlpha=1;
}
let flashT=0, nextFlash=4, flashX=0;
function drawSkyBack(){
  const sk=curLoc.sky;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,sk.top); g.addColorStop(0.55,sk.mid); g.addColorStop(1,sk.bot);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const sx=W*0.8, sy=Math.min(H*0.17,140);
  if(curLoc.ground==='night'){
    for(let i=0;i<110;i++){ const x=h1(i*3.1)*W, y=h1(i*7.7)*H*0.7, a=0.4+0.6*Math.abs(Math.sin(gt*(0.5+h1(i)*2)+i)); ctx.fillStyle='rgba(255,255,255,'+a+')'; ctx.fillRect(x,y,h1(i*1.9)<0.15?2.4:1.4,h1(i*1.9)<0.15?2.4:1.4); }
    ctx.globalAlpha=0.32;
    for(const [col,yb,ph] of [['#5dffb0',0.22,0],['#b37bff',0.3,2]]){ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,H*yb); for(let x=0;x<=W+20;x+=20) ctx.lineTo(x,H*yb+Math.sin(x*0.006+gt*0.4+ph)*30); for(let x=W+20;x>=0;x-=20) ctx.lineTo(x,H*yb+70+Math.sin(x*0.006+gt*0.4+ph+0.6)*24); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha=1;
    circ(ctx,sx,sy,30); ctx.fillStyle=sk.sun; ctx.fill(); circ(ctx,sx+11,sy-6,26); ctx.fillStyle=sk.top; ctx.fill();
  } else {
    const sg=ctx.createRadialGradient(sx,sy,10,sx,sy,170); sg.addColorStop(0,'rgba(255,250,220,'+(curLoc.ground==='sea'?0.25:0.85)+')'); sg.addColorStop(1,'rgba(255,250,220,0)');
    ctx.fillStyle=sg; ctx.fillRect(sx-170,sy-170,340,340);
    if(curLoc.ground!=='sea'){ circ(ctx,sx,sy,38); ctx.fillStyle=sk.sun; ctx.fill(); }
  }
  drawLayer(islandSprites(),560,0.06,i=>H*0.16+h1(i*9.1)*H*0.22,i=>0.22+h1(i*2.3)*0.2,0.55,0.35,11);
  drawLayer(cloudSprites(),300,0.14,i=>H*0.05+h1(i*4.7)*H*0.5,i=>0.28+h1(i*6.1)*0.22,curLoc.ground==='sea'?0.95:0.75,curLoc.ground==='sea'?0:0.2,23);
  if(flashT>0){
    ctx.strokeStyle='rgba(255,255,240,'+Math.min(1,flashT*4)+')'; ctx.lineWidth=3; ctx.beginPath(); let x=flashX, y=0; ctx.moveTo(x,y);
    for(let i=0;i<8;i++){ x+=h1(i+flashX)*40-20; y+=H*0.07; ctx.lineTo(x,y); } ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.35,flashT)+')'; ctx.fillRect(0,0,W,H);
  }
}
function ridge(par,hf,fill,stroke){
  const s=cam.s, gy=cam.gsy;
  ctx.fillStyle=fill; ctx.beginPath(); ctx.moveTo(0,H);
  for(let x=0;x<=W+12;x+=12){ const wx=cam.x*par+x/s; ctx.lineTo(x,gy-hf(wx)*s); }
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=3; ctx.stroke(); }
}
function ridgeY(par,hf,x){ return cam.gsy-hf(cam.x*par+x/cam.s)*cam.s; }
function eachSlot(par,spacing,fn){ const s=cam.s, off=cam.x*par, i0=Math.floor(off/spacing)-1, i1=Math.floor((off+W/s)/spacing)+1; for(let i=i0;i<=i1;i++){ const wx=i*spacing+h1(i)*spacing*0.4; fn(i,(wx-off)*s,wx); } }
function drawGround(){
  const sk=curLoc.sky, s=cam.s, gy=cam.gsy;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const hz=()=>{ ctx.fillStyle=sk.haze; ctx.fillRect(0,gy-130*s,W,H); };
  switch(curLoc.ground){
    case 'hills': {
      ridge(0.3,wx=>64+26*Math.sin(wx*0.0045)+14*Math.sin(wx*0.013+1.7),sk.far); hz();
      const nh=wx=>14+9*Math.sin(wx*0.008)+5*Math.sin(wx*0.021+0.6);
      ridge(0.55,nh,sk.near,sk.nearD);
      eachSlot(0.55,46,(i,x)=>{ if(h1(i*2.9)<0.45) return; const r=(5+h1(i*7)*4)*s; ctx.fillStyle=sk.nearD; circ(ctx,x,ridgeY(0.55,nh,x)-r*0.6,r); ctx.fill(); });
      fields(sk.field,sk.nearD); break; }
    case 'mesa': {
      const mh=wx=>{ const v=Math.sin(wx*0.0035)+0.6*Math.sin(wx*0.0091+1.3); return v>0.55?118:v>0.15?55+(v-0.15)/0.4*63:v>-0.4?40:30; };
      ridge(0.3,mh,sk.far,'rgba(90,40,20,.35)'); hz();
      const nh=wx=>16+10*Math.sin(wx*0.006)+6*Math.sin(wx*0.017+2);
      ridge(0.55,nh,sk.near,sk.nearD);
      eachSlot(0.55,90,(i,x)=>{ if(h1(i*4.1)<0.6) return; const y=ridgeY(0.55,nh,x), k=s*(0.8+h1(i)*0.6); ctx.fillStyle='#4f8a3a'; ctx.strokeStyle=INK; ctx.lineWidth=1.5; rr(ctx,x-3*k,y-22*k,6*k,22*k,3*k); ctx.fill(); ctx.stroke(); rr(ctx,x-10*k,y-15*k,5*k,9*k,2.5*k); ctx.fill(); ctx.stroke(); });
      fields(sk.field,sk.nearD); break; }
    case 'peaks': {
      const ph=wx=>50+130*Math.pow(1-Math.abs(Math.sin(wx*0.0045)),1.6)+30*Math.pow(1-Math.abs(Math.sin(wx*0.013+1.1)),2);
      const pg=ctx.createLinearGradient(0,gy-190*s,0,gy-40*s); pg.addColorStop(0,'#ffffff'); pg.addColorStop(0.45,'#e8f1fb'); pg.addColorStop(1,sk.far);
      ridge(0.3,ph,pg,'rgba(80,110,150,.4)'); hz();
      const nh=wx=>16+9*Math.sin(wx*0.007)+5*Math.sin(wx*0.019+0.6);
      ridge(0.55,nh,sk.near,sk.nearD);
      eachSlot(0.55,52,(i,x)=>{ if(h1(i*3.3)<0.45) return; const y=ridgeY(0.55,nh,x), k=s*(0.7+h1(i*5)*0.6); ctx.fillStyle='#2f6f5a'; ctx.beginPath(); ctx.moveTo(x,y-26*k); ctx.lineTo(x+9*k,y); ctx.lineTo(x-9*k,y); ctx.closePath(); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.moveTo(x,y-26*k); ctx.lineTo(x+4*k,y-16*k); ctx.lineTo(x-4*k,y-16*k); ctx.closePath(); ctx.fill(); });
      fields('#ffffff',sk.nearD); break; }
    case 'volcano': {
      ridge(0.3,wx=>50+60*Math.pow(1-Math.abs(Math.sin(wx*0.004)),1.4),sk.far);
      eachSlot(0.3,1300,(i,x)=>{ if(h1(i*6.6)<0.3) return; const k=s, top=gy-210*k;
        ctx.fillStyle='#3a2226'; ctx.beginPath(); ctx.moveTo(x-170*k,gy); ctx.lineTo(x-26*k,top); ctx.lineTo(x+26*k,top); ctx.lineTo(x+170*k,gy); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(255,110,40,.8)'; ctx.lineWidth=3*k; ctx.beginPath(); ctx.moveTo(x-8*k,top); ctx.lineTo(x-30*k,top+70*k); ctx.lineTo(x-20*k,top+130*k); ctx.moveTo(x+10*k,top); ctx.lineTo(x+26*k,top+90*k); ctx.stroke();
        const gl=ctx.createRadialGradient(x,top,2,x,top,60*k); gl.addColorStop(0,'rgba(255,170,60,.9)'); gl.addColorStop(1,'rgba(255,90,30,0)'); ctx.fillStyle=gl; circ(ctx,x,top,60*k); ctx.fill();
        for(let j=0;j<4;j++){ const u=((gt*0.15+j/4)%1); ctx.fillStyle='rgba(70,60,70,'+(0.5*(1-u))+')'; circ(ctx,x+Math.sin(j*2+gt*0.3)*20*k,top-u*160*k,(18+u*40)*k); ctx.fill(); } });
      hz();
      const nh=wx=>14+8*Math.sin(wx*0.009)+5*Math.sin(wx*0.02+1);
      ridge(0.55,nh,sk.near,'#ff6a2a');
      ctx.lineWidth=Math.max(2,4*s); for(let k=0;k<3;k++){ const y0=gy+(16+k*26)*s; if(y0>H) break; ctx.strokeStyle='rgba(255,'+(110+k*20)+',40,.85)'; ctx.beginPath(); for(let x=0;x<=W+16;x+=16){ const wx=cam.x*(0.6+k*0.05)+x/s; const y=y0+Math.sin(wx*0.01+k*2)*6*s; x?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke(); }
      break; }
    case 'sea': {
      eachSlot(0.3,700,(i,x)=>{ if(h1(i*2.2)<0.5) return; const k=s*(0.6+h1(i*4)*0.6); ctx.fillStyle=sk.far; ctx.beginPath(); ctx.moveTo(x-60*k,gy); ctx.lineTo(x-20*k,gy-50*k); ctx.lineTo(x+10*k,gy-40*k); ctx.lineTo(x+50*k,gy); ctx.closePath(); ctx.fill(); });
      const sg=ctx.createLinearGradient(0,gy-8*s,0,H); sg.addColorStop(0,sk.field); sg.addColorStop(0.3,sk.near); sg.addColorStop(1,sk.nearD);
      ctx.fillStyle=sg; ctx.fillRect(0,gy-8*s,W,H);
      ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=2;
      for(let k=0;k<8;k++){ const y0=gy-4*s+k*16*Math.max(0.7,s); if(y0>H) break; const par=0.55+k*0.06; ctx.beginPath(); for(let x=0;x<=W+16;x+=16){ const wx=cam.x*par+x/s; const y=y0+Math.sin(wx*0.025+gt*2+k)*3; x?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke(); }
      hz(); break; }
    case 'night': {
      ridge(0.3,wx=>60+24*Math.sin(wx*0.004)+12*Math.sin(wx*0.012+1),sk.far); hz();
      const nh=wx=>12+6*Math.sin(wx*0.008);
      eachSlot(0.55,64,(i,x)=>{ const k=s, bw=(30+h1(i*3)*34)*k, bh=(24+h1(i*5)*60)*k, by=gy-10*k;
        ctx.fillStyle=sk.near; ctx.fillRect(x-bw/2,by-bh,bw,bh+20*k);
        if(h1(i*9)<0.4){ ctx.beginPath(); ctx.moveTo(x-bw/2-3*k,by-bh); ctx.lineTo(x,by-bh-16*k); ctx.lineTo(x+bw/2+3*k,by-bh); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle=sk.field; for(let wy=0;wy<4;wy++) for(let wx=0;wx<3;wx++){ if(h1(i*13+wy*7+wx)<0.55) continue; const px=x-bw/2+6*k+wx*(bw-12*k)/3, py=by-bh+8*k+wy*13*k; if(py>by-4*k) continue; ctx.fillRect(px,py,4*k,5*k); } });
      ridge(0.55,nh,sk.nearD); break; }
  }
}
function fields(c1,c2){
  const s=cam.s, bandTop=cam.gsy+6*s;
  for(let k=0;k<4;k++){ const y=bandTop+k*24*Math.max(0.6,s); if(y>H) break; const o2=cam.x*(0.6+k*0.08), pw=150*s;
    const j0=Math.floor(o2*s/pw)-1, j1=j0+Math.ceil(W/pw)+2;
    for(let j=j0;j<=j1;j++){ const x=j*pw-o2*s; ctx.fillStyle=h1(j*3.1+k)<0.5?c1:c2; ctx.globalAlpha=0.5; ctx.fillRect(x+3,y,pw-6,20*Math.max(0.6,s)); } ctx.globalAlpha=1; }
}
function drawMidClouds(){
  const cl=cloudSprites(), s=cam.s;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const off=cam.x*0.5*s, spacing=520*s, i0=Math.floor((off-400*s)/spacing), i1=Math.floor((off+W)/spacing)+1;
  ctx.globalAlpha=0.9;
  for(let i=i0;i<=i1;i++){ if(h1(i*8.3)<0.3) continue; const sp=cl[i&3], sc=(0.45+h1(i*1.7)*0.35)*s, x=i*spacing-off+h1(i*2.2)*200*s, y=cam.gsy-(260+h1(i*4.4)*320)*s; ctx.drawImage(sp,x,y,sp.width*sc,sp.height*sc); }
  ctx.globalAlpha=1;
}
function drawFrontClouds(){
  const cl=cloudSprites(), s=cam.s;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const off=cam.x*1.3*s, spacing=1100*s, i0=Math.floor((off-600*s)/spacing), i1=Math.floor((off+W)/spacing)+1;
  ctx.globalAlpha=0.5;
  for(let i=i0;i<=i1;i++){ if(h1(i*5.9)<0.55) continue; const sp=cl[(i+1)&3], sc=(0.9+h1(i*3.3)*0.4)*s; ctx.drawImage(sp,i*spacing-off,cam.gsy-(60+h1(i*7.7)*380)*s,sp.width*sc,sp.height*sc); }
  ctx.globalAlpha=1;
}
let wpart=[], wType='-';
function updWeather(dt){
  const t=curLoc.weather;
  if(t!==wType){ wType=t; wpart=[]; const n={snow:70,ash:55,rain:90,dust:40}[t]||0; for(let i=0;i<n;i++) wpart.push({x:Math.random()*W,y:Math.random()*H,s:Math.random()}); }
  for(const p of wpart){
    if(t==='snow'){ p.y+=(25+p.s*40)*dt; p.x+=(Math.sin(gt*1.5+p.s*10)*20-10)*dt; }
    else if(t==='ash'){ p.y+=(15+p.s*25)*dt; p.x-=(20+p.s*20)*dt; }
    else if(t==='rain'){ p.y+=(650+p.s*200)*dt; p.x-=150*dt; }
    else if(t==='dust'){ p.x-=(180+p.s*200)*dt; p.y+=Math.sin(gt*2+p.s*8)*15*dt; }
    if(p.y>H+10){ p.y=-10; p.x=Math.random()*(W+100); }
    if(p.x<-20){ p.x=W+20; p.y=Math.random()*H; }
  }
  if(t==='rain'){ flashT=Math.max(0,flashT-dt); nextFlash-=dt; if(nextFlash<=0){ nextFlash=rand(5,11); flashT=0.3; flashX=rand(W*0.1,W*0.9); if(mode==='battle') Snd.play('thunder',0.35); } }
  else flashT=0;
}
function drawWeather(){
  if(!wpart.length) return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const t=wType;
  if(t==='rain'){ ctx.strokeStyle='rgba(200,220,255,.5)'; ctx.lineWidth=1.3; ctx.beginPath(); for(const p of wpart){ ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+4,p.y-15); } ctx.stroke(); return; }
  for(const p of wpart){
    if(t==='snow'){ ctx.fillStyle='rgba(255,255,255,.9)'; circ(ctx,p.x,p.y,1.4+p.s*2.2); ctx.fill(); }
    else if(t==='ash'){ ctx.fillStyle=p.s<0.2?'rgba(255,140,60,.9)':'rgba(90,80,90,.6)'; circ(ctx,p.x,p.y,1+p.s*1.8); ctx.fill(); }
    else if(t==='dust'){ ctx.fillStyle='rgba(255,230,180,.45)'; ctx.fillRect(p.x,p.y,2+p.s*6,1.4); }
  }
}

/* ================= icons ================= */
const ICONS={};
function iconTier(key){ return key==='wall'||key==='erase'?tierOf(save.up.wall):key==='hull'?hullTierOf(save.up.hull):key==='thrust'?propTier(save.up.thrust):key==='blift'||key==='bhp'||key==='bcount'||key==='bpatch'?btierOf(save.up.bHp):0; }
function icon(key){
  const tier=iconTier(key), k=key+'#'+tier;
  if(ICONS[k]) return ICONS[k];
  const c=document.createElement('canvas'); c.width=c.height=112; const x=c.getContext('2d'); x.scale(2,2); x.lineJoin='round'; x.lineCap='round';
  try{ drawIcon(x,key,tier); }catch(e){ console.error('icon',key,e); }
  let url=''; try{ url=c.toDataURL(); }catch(e){}
  return ICONS[k]=url;
}
function fakeBalloon(lx,ly,R,look,armor){ return {lx,ly,R,hp:1,max:1,alive:true,hit:0,wob:0,armor:armor||1,look,patches:[{x:0.2,y:0.1,a:0.3}]}; }
function fakeHullShip(tier){ return {w:72,spec:{pirate:false,hullLvl:1,hullPal:HULLS[tier||0],thrustLvl:1},hull:{hp:1,max:1,hit:0},dead:false}; }
function drawIcon(x,key,tier){
  x.strokeStyle=INK; x.lineWidth=2;
  const bl='p'+btierOf(save?save.up.bHp:1);
  if(key.startsWith('crew-')){ const id=key.slice(5); const L=LOOK[id]; circ(x,28,28,26); x.fillStyle=L&&L.legend?'#ffe7a0':'#c4e7fc'; x.fill(); x.save(); x.beginPath(); x.arc(28,28,26,0,TAU); x.clip(); drawPortrait(x,id,26,58,1.75,0); x.restore(); if(L&&L.legend){ circ(x,28,28,25); x.lineWidth=3; x.strokeStyle='#d4801a'; x.stroke(); } return; }
  if(key.startsWith('crate-')){ drawCrate(x,28,32,44,key.slice(6),0); return; }
  if(key.startsWith('gems')){ const k=+key.slice(4)||1; const pts=[[28,30,14],[16,38,10],[40,38,10],[22,22,9],[36,22,9],[28,42,11]]; for(let i=Math.min(pts.length,k)-1;i>=0;i--) drawGem(x,pts[i][0],pts[i][1],pts[i][2]); return; }
  switch(key){
    case 'wall': drawBlock(x,10,10,MATS[tier],1,0); return;
    case 'erase': x.globalAlpha=0.55; drawBlock(x,10,10,MATS[tier],1,0); x.globalAlpha=1; x.lineWidth=9; x.strokeStyle=INK; line(x,14,14,42,42); line(x,42,14,14,42); x.lineWidth=5; x.strokeStyle='#f0503f'; line(x,14,14,42,42); line(x,42,14,14,42); return;
    case 'tabyard': x.save(); x.translate(4,10); x.scale(0.8,0.8); drawBlock(x,0,10,MATS[0],1,0); x.restore(); circ(x,40,18,11); x.fillStyle='#66d33e'; x.fill(); x.lineWidth=2.4; x.stroke(); x.lineWidth=3.4; x.strokeStyle='#ffffff'; line(x,40,12,40,24); line(x,34,18,46,18); return;
    case 'hull': x.save(); x.translate(26,22); x.scale(0.42,0.42); drawHull(x,fakeHullShip(tier)); x.restore(); return;
    case 'frame': x.save(); x.translate(28,50); x.scale(0.55,0.55); drawScaffold(x,{w:72,cols:2,topRows:2,cells:[{c:0,r:0,alive:true}]}); drawBlock(x,-36,-36,MATS[0],1,0); x.restore(); return;
    case 'autorep': x.save(); x.translate(26,30); x.scale(0.4,0.4); drawHull(x,fakeHullShip(0)); x.restore(); x.save(); x.translate(30,20); x.rotate(-0.7); rr(x,-2,-2.5,22,5,2.5); x.fillStyle='#9aa3b1'; x.fill(); x.stroke(); circ(x,22,0,6); x.fill(); x.stroke(); x.fillStyle='#4a5160'; x.fillRect(22,-2,7,4); x.restore(); x.fillStyle='#66d33e'; x.fillRect(8,8,12,4); x.fillRect(12,4,4,12); return;
    case 'powder': rr(x,14,16,28,32,8); x.fillStyle='#8a5a32'; x.fill(); x.lineWidth=2.4; x.stroke(); x.fillStyle='#3a3f4d'; x.fillRect(14,22,28,4); x.fillRect(14,38,28,4); x.strokeRect(14,22,28,4); x.strokeRect(14,38,28,4); x.fillStyle='#1b2140'; x.font='bold 10px Rubik, sans-serif'; x.textAlign='center'; x.fillStyle='#ffd23f'; x.fillText('TNT',28,35); x.strokeStyle='#8a5a32'; x.lineWidth=2.4; x.beginPath(); x.moveTo(30,16); x.quadraticCurveTo(36,6,44,8); x.stroke(); x.fillStyle='#ffd23f'; star(x,45,8,6,2.4,6); x.fill(); return;
    case 'sights': circ(x,28,28,17); x.lineWidth=4; x.strokeStyle=INK; x.stroke(); x.lineWidth=2.4; x.strokeStyle='#f0503f'; x.stroke(); x.lineWidth=4; x.strokeStyle=INK; for(const [a,b,c2,d] of [[28,6,28,18],[28,38,28,50],[6,28,18,28],[38,28,50,28]]) line(x,a,b,c2,d); x.lineWidth=2.4; x.strokeStyle='#f0503f'; for(const [a,b,c2,d] of [[28,6,28,18],[28,38,28,50],[6,28,18,28],[38,28,50,28]]) line(x,a,b,c2,d); x.fillStyle='#f0503f'; circ(x,28,28,3.2); x.fill(); return;
    case 'loot': for(const [cx,cy] of [[18,40],[38,40],[28,30],[20,24],[36,22]]) drawCoinArt(x,cx,cy,10); return;
    case 'bcount': x.save(); x.translate(28,30); x.scale(0.5,0.5); drawBalloon(x,fakeBalloon(-26,-6,24,bl),0); drawBalloon(x,fakeBalloon(26,-6,24,bl),0); drawBalloon(x,fakeBalloon(0,-18,26,bl),0); x.restore(); return;
    case 'blift': x.save(); x.translate(24,30); x.scale(0.62,0.62); drawBalloon(x,fakeBalloon(0,0,32,bl),0); x.restore(); x.fillStyle='#66d33e'; x.beginPath(); x.moveTo(46,10); x.lineTo(54,22); x.lineTo(49,22); x.lineTo(49,34); x.lineTo(43,34); x.lineTo(43,22); x.lineTo(38,22); x.closePath(); x.fill(); x.lineWidth=2; x.stroke(); return;
    case 'bhp': x.save(); x.translate(28,28); x.scale(0.62,0.62); drawBalloon(x,fakeBalloon(0,0,32,bl,12),0); x.restore(); return;
    case 'bpatch': { x.save(); x.translate(26,28); x.scale(0.62,0.62); const b=fakeBalloon(0,0,32,bl); b.hp=0.3; drawBalloon(x,b,0); x.restore(); circ(x,44,14,9); x.fillStyle='#66d33e'; x.fill(); x.lineWidth=2; x.stroke(); x.fillStyle='#ffffff'; x.fillRect(42.5,8,3,12); x.fillRect(38,12.5,12,3); return; }
    case 'thrust': { const col=PROPC[tier]; x.save(); x.translate(28,28); for(let i=0;i<3;i++){ x.save(); x.rotate(i*TAU/3-0.4); ell(x,0,-12,6,13); x.fillStyle=i%2?col.b:col.a; x.fill(); x.lineWidth=2; x.stroke(); x.restore(); } circ(x,0,0,6); x.fillStyle=col.hub; x.fill(); x.stroke(); x.restore(); return; }
    case 'rotor': { const col=PROPC[2]; rr(x,25,18,6,14,2); x.fillStyle='#5d6372'; x.fill(); x.stroke(); ell(x,28,16,22,4); x.fillStyle=col.a; x.fill(); x.stroke(); circ(x,28,16,4); x.fillStyle=col.hub; x.fill(); x.stroke(); x.strokeStyle='#ffffff'; x.lineWidth=3; for(const ax of [14,28,42]) line(x,ax,36,ax,46); x.strokeStyle=INK; x.lineWidth=1.5; for(const ax of [14,28,42]){ x.beginPath(); x.moveTo(ax-4,43); x.lineTo(ax,49); x.lineTo(ax+4,43); x.stroke(); } return; }
    case 'boost': case 'ram': x.strokeStyle='#ffffff'; x.lineWidth=3.5; for(const [y,l] of [[18,16],[28,22],[38,16]]) line(x,6,y,6+l,y); x.beginPath(); x.moveTo(24,14); x.lineTo(52,28); x.lineTo(24,42); x.closePath(); x.fillStyle=key==='ram'?'#f2c14e':'#c9d2dc'; x.fill(); x.lineWidth=2.6; x.strokeStyle=INK; x.stroke(); x.fillStyle='rgba(255,255,255,.6)'; x.beginPath(); x.moveTo(28,19); x.lineTo(44,27); x.lineTo(28,26); x.closePath(); x.fill(); return;
    case 'dodge': x.lineWidth=5; x.strokeStyle=INK; x.beginPath(); x.moveTo(10,42); x.quadraticCurveTo(14,14,40,16); x.stroke(); x.lineWidth=3; x.strokeStyle='#ffffff'; x.stroke(); x.beginPath(); x.moveTo(36,8); x.lineTo(48,16); x.lineTo(36,24); x.closePath(); x.fillStyle='#ffffff'; x.fill(); x.lineWidth=2.4; x.strokeStyle=INK; x.stroke(); rr(x,30,34,20,6,3); x.fillStyle='#f0503f'; x.fill(); x.stroke(); return;
    case 'ballast': drawBag(x,28,30,1.7); return;
    case 'gear': drawGear(x,28,28,22); return;
    case 'gem': drawGem(x,28,28,24); return;
    case 'coins': for(const [cx,cy] of [[18,38],[38,38],[28,26]]) drawCoinArt(x,cx,cy,13); return;
    case 'gearpile': drawGear(x,20,34,14); drawGear(x,38,22,15,'#d6dde8'); return;
    case 'map': x.save(); x.translate(28,28); x.rotate(-0.1); rr(x,-22,-17,44,34,4); x.fillStyle='#f3e3c3'; x.fill(); x.lineWidth=2.4; x.stroke(); x.strokeStyle='#c9a46a'; x.lineWidth=1.5; line(x,-7,-17,-7,17); line(x,7,-17,7,17); x.setLineDash([3,3]); x.strokeStyle='#d8483b'; x.lineWidth=2.2; x.beginPath(); x.moveTo(-16,10); x.quadraticCurveTo(-4,-12,8,4); x.quadraticCurveTo(12,8,14,-6); x.stroke(); x.setLineDash([]); x.strokeStyle='#d8483b'; x.lineWidth=3; line(x,10,-10,18,-2); line(x,18,-10,10,-2); x.restore(); return;
    case 'wheel': { x.save(); x.translate(28,30); const cols=['#f0503f','#ffd23f','#3fd3ff','#66d33e','#9b62ec','#ff9a3a']; for(let i=0;i<6;i++){ x.beginPath(); x.moveTo(0,0); x.arc(0,0,22,i*TAU/6,(i+1)*TAU/6); x.closePath(); x.fillStyle=cols[i]; x.fill(); } circ(x,0,0,22); x.lineWidth=2.6; x.strokeStyle=INK; x.stroke(); circ(x,0,0,5); x.fillStyle='#ffffff'; x.fill(); x.stroke(); x.beginPath(); x.moveTo(-6,-27); x.lineTo(6,-27); x.lineTo(0,-16); x.closePath(); x.fillStyle='#ffffff'; x.fill(); x.stroke(); x.restore(); return; }
    case 'shop': drawGem(x,28,26,20); x.fillStyle='#66d33e'; circ(x,43,42,9); x.fill(); x.lineWidth=2; x.stroke(); x.fillStyle='#ffffff'; x.fillRect(41.5,36,3,12); x.fillRect(37,40.5,12,3); return;
    case 'power': x.fillStyle='#ffb43a'; x.beginPath(); x.moveTo(30,4); x.lineTo(14,32); x.lineTo(26,32); x.lineTo(22,52); x.lineTo(42,22); x.lineTo(30,22); x.lineTo(36,4); x.closePath(); x.fill(); x.lineWidth=2.6; x.stroke(); x.fillStyle='rgba(255,255,255,.6)'; x.beginPath(); x.moveTo(30,8); x.lineTo(20,28); x.lineTo(24,28); x.closePath(); x.fill(); return;
    case 'ad': rr(x,6,12,44,32,6); x.fillStyle='#9b62ec'; x.fill(); x.lineWidth=2.6; x.stroke(); x.beginPath(); x.moveTo(23,20); x.lineTo(36,28); x.lineTo(23,36); x.closePath(); x.fillStyle='#ffffff'; x.fill(); x.lineWidth=1.8; x.stroke(); return;
    case 'lock': rr(x,14,24,28,24,5); x.fillStyle='#e2ab3c'; x.fill(); x.lineWidth=2.6; x.stroke(); x.lineWidth=5; x.strokeStyle=INK; x.beginPath(); x.arc(28,24,9,Math.PI,TAU); x.stroke(); x.fillStyle=INK; circ(x,28,34,3); x.fill(); return;
    case 'sound-on': case 'sound-off': x.fillStyle='#ffffff'; x.beginPath(); x.moveTo(10,22); x.lineTo(18,22); x.lineTo(28,13); x.lineTo(28,43); x.lineTo(18,34); x.lineTo(10,34); x.closePath(); x.fill(); x.lineWidth=2.4; x.stroke(); x.strokeStyle='#ffffff'; x.lineWidth=3.4; if(key==='sound-on'){ x.beginPath(); x.arc(30,28,8,-0.9,0.9); x.stroke(); x.beginPath(); x.arc(30,28,15,-0.9,0.9); x.stroke(); } else { line(x,35,21,47,35); line(x,47,21,35,35); } return;
    case 'pause': x.fillStyle='#ffffff'; rr(x,15,12,9,32,3); x.fill(); x.lineWidth=2.4; x.stroke(); rr(x,32,12,9,32,3); x.fill(); x.stroke(); return;
    case 'close': x.lineWidth=8; x.strokeStyle=INK; line(x,16,16,40,40); line(x,40,16,16,40); x.lineWidth=4.5; x.strokeStyle='#ffffff'; line(x,16,16,40,40); line(x,40,16,16,40); return;
    case 'shipmini': x.save(); x.translate(28,40); x.scale(0.34,0.34); drawBalloon(x,fakeBalloon(0,-62,34,'p0'),0); x.strokeStyle='#4a3a2a'; x.lineWidth=3; line(x,-14,-34,-14,-4); line(x,14,-34,14,-4); drawHull(x,fakeHullShip(0)); x.restore(); return;
    case 'skull': case 'skullboss': circ(x,28,28,24); x.fillStyle=key==='skull'?'#6a4a9e':'#b52a3e'; x.fill(); x.lineWidth=3; x.stroke(); drawSkull(x,28,26,13); return;
  }
}
