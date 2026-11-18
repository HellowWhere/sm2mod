/* ================= drawing primitives ================= */
function rr(c,x,y,w,h,r){ r=Math.max(0,Math.min(r,w/2,h/2)); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function circ(c,x,y,r){ c.beginPath(); c.arc(x,y,Math.max(0.01,r),0,TAU); }
function ell(c,x,y,rx,ry){ c.beginPath(); c.ellipse(x,y,Math.max(0.01,rx),Math.max(0.01,ry),0,0,TAU); }
function line(c,x1,y1,x2,y2){ c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); }
function star(c,x,y,r1,r2,n){ c.beginPath(); for(let i=0;i<n*2;i++){ const a=-Math.PI/2+i*Math.PI/n, r=i%2?r2:r1; c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } c.closePath(); }

function drawBlock(c,x,y,mat,ratio,flash){
  const s=B;
  rr(c,x+0.5,y+0.5,s-1,s-1,4); c.fillStyle=mat.base; c.fill();
  c.save(); c.clip();
  c.fillStyle=mat.light; c.fillRect(x,y,s,4); c.fillRect(x,y,3,s);
  c.globalAlpha=0.5; c.fillStyle=mat.dark; c.fillRect(x,y+s-5,s,5); c.fillRect(x+s-4,y,4,s); c.globalAlpha=1;
  c.strokeStyle=mat.dark; c.lineWidth=2;
  if(mat.pat==='planks'){
    c.beginPath(); c.moveTo(x,y+12); c.lineTo(x+s,y+12); c.moveTo(x,y+24); c.lineTo(x+s,y+24); c.stroke();
    c.lineWidth=4.5; line(c,x+5,y+s-5,x+s-5,y+5);
    c.fillStyle=INK; for(const [px,py] of [[5,5],[s-5,5],[5,s-5],[s-5,s-5]]){ circ(c,x+px,y+py,1.4); c.fill(); }
  } else if(mat.pat==='bricks'){
    c.beginPath();
    for(let i=1;i<3;i++){ c.moveTo(x,y+i*12); c.lineTo(x+s,y+i*12); }
    for(let i=0;i<3;i++){ const o=i%2?9:18; for(let xx=x+o; xx<x+s; xx+=18){ c.moveTo(xx,y+i*12); c.lineTo(xx,y+i*12+12); } }
    c.stroke();
  } else if(mat.pat==='plates'){
    rr(c,x+6,y+6,s-12,s-12,3); c.stroke();
    for(const [px,py] of [[5,5],[s-5,5],[5,s-5],[s-5,s-5]]){ circ(c,x+px,y+py,2.2); c.fillStyle=mat.light; c.fill(); c.lineWidth=1.2; c.strokeStyle=INK; c.stroke(); }
  } else {
    c.beginPath(); c.moveTo(x+4,y+s); c.lineTo(x+s*0.5,y+6); c.lineTo(x+s-4,y+s); c.moveTo(x+s*0.5,y+6); c.lineTo(x+s*0.5,y+s); c.stroke();
    c.globalAlpha=0.55; c.fillStyle='#ffffff'; c.beginPath(); c.moveTo(x+7,y+4); c.lineTo(x+13,y+4); c.lineTo(x+4,y+16); c.lineTo(x+4,y+10); c.closePath(); c.fill(); c.globalAlpha=1;
  }
  if(ratio<0.66){ c.strokeStyle=INK; c.lineWidth=1.6; c.beginPath(); c.moveTo(x+s*0.3,y); c.lineTo(x+s*0.42,y+s*0.3); c.lineTo(x+s*0.3,y+s*0.48); c.lineTo(x+s*0.5,y+s*0.68); c.stroke(); }
  if(ratio<0.33){ c.beginPath(); c.moveTo(x+s,y+s*0.55); c.lineTo(x+s*0.72,y+s*0.62); c.lineTo(x+s*0.66,y+s*0.86); c.lineTo(x+s*0.5,y+s); c.stroke(); c.fillStyle='rgba(20,15,30,.18)'; c.fillRect(x,y,s,s); }
  if(flash>0){ c.fillStyle='rgba(255,255,255,'+Math.min(0.8,flash*6)+')'; c.fillRect(x,y,s,s); }
  c.restore();
  rr(c,x+0.5,y+0.5,s-1,s-1,4); c.strokeStyle=INK; c.lineWidth=2.4; c.stroke();
}

/* ---------- crew ---------- */
function lookOf(type,pirate){ return pirate?(PLOOK[type]||PLOOK.gunner):(LOOK[type]||LOOK.gunner); }
function drawAura(c,x,y,t){
  const p=0.55+Math.sin(t*3)*0.2;
  const g=c.createRadialGradient(x,y,2,x,y,22); g.addColorStop(0,'rgba(255,214,90,'+p+')'); g.addColorStop(1,'rgba(180,110,255,0)');
  c.fillStyle=g; circ(c,x,y,22); c.fill();
}
function drawCrewBody(c,type,x,fy,t,pirate){
  const L=lookOf(type,pirate);
  const hy=fy-23+Math.sin(t*2.6)*0.7;
  c.lineWidth=2; c.strokeStyle=INK;
  if(L.hat==='hood'){ c.fillStyle=L.hatC; c.beginPath(); c.moveTo(x-4,fy-14); c.quadraticCurveTo(x-13,fy-6,x-11,fy); c.lineTo(x-3,fy); c.closePath(); c.fill(); c.stroke(); }
  if(L.hat==='winged'){ rr(c,x-9,hy+1,4,12,2); c.fillStyle='#ffd86b'; c.fill(); c.stroke(); }
  rr(c,x-7,fy-17,14,17,5); c.fillStyle=L.coat; c.fill(); c.stroke();
  c.fillStyle=L.trim; c.fillRect(x-6,fy-9,12,2.6);
  if(L.legend){ c.fillStyle='#ffd23f'; star(c,x+2,fy-13,2.6,1.1,5); c.fill(); }
  if(L.hat==='tesla'){ c.fillStyle=L.hatC; star(c,x-1,hy-2,10.5,6,7); c.fill(); c.lineWidth=1.6; c.stroke(); c.lineWidth=2; }
  if(L.hat==='robot'){
    rr(c,x-7.5,hy-7,15,14,3.5); c.fillStyle=L.skin; c.fill(); c.stroke();
    rr(c,x-1,hy-2.5,8.5,4.4,2); c.fillStyle='#1b2140'; c.fill();
    c.fillStyle='rgba(90,240,255,'+(0.75+Math.sin(t*6)*0.25)+')'; rr(c,x,hy-1.6,6.5,2.6,1.3); c.fill();
    c.lineWidth=1.5; line(c,x-2,hy-7,x-4,hy-12); c.fillStyle='#f0503f'; circ(c,x-4,hy-12.5,1.8); c.fill(); c.stroke();
    c.fillStyle='#ffd23f'; c.fillRect(x-6,hy+4,3,1.6);
    return;
  }
  circ(c,x,hy,7.2); c.fillStyle=L.skin; c.fill(); c.stroke();
  c.fillStyle=INK; circ(c,x+2.6,hy+0.3,1.25); c.fill(); circ(c,x+5.4,hy+0.3,1.25); c.fill();
  c.fillStyle='rgba(255,110,100,.45)'; circ(c,x+3.2,hy+3.3,1.6); c.fill();
  c.fillStyle=L.hatC; c.lineWidth=1.8; c.strokeStyle=INK;
  switch(L.hat){
    case 'aviator':
      c.beginPath(); c.arc(x,hy,7.9,Math.PI,TAU); c.closePath(); c.fill(); c.stroke();
      rr(c,x-8,hy-1,4.5,7.5,2); c.fill(); c.stroke();
      c.lineWidth=1.4; line(c,x-7,hy-4.8,x+7,hy-4.8);
      for(const gx of [x+1.6,x+5.6]){ circ(c,gx,hy-4.8,2.4); c.fillStyle='#9fe3ff'; c.fill(); c.stroke(); }
      break;
    case 'helmet':
      c.beginPath(); c.arc(x,hy-0.5,8.3,Math.PI,TAU); c.closePath(); c.fill(); c.stroke();
      rr(c,x-10,hy-2,20,3.4,1.7); c.fill(); c.stroke();
      c.fillStyle='#c9cfda'; circ(c,x+1,hy-5.5,1.3); c.fill();
      break;
    case 'beanie':
      c.beginPath(); c.arc(x,hy,8,Math.PI,TAU); c.closePath(); c.fill(); c.stroke();
      c.fillStyle='#d8483b'; rr(c,x-8.5,hy-3,17,3.8,1.5); c.fill(); c.stroke();
      c.fillStyle=L.hatC; circ(c,x-1.5,hy-9.5,2.8); c.fill(); c.stroke();
      break;
    case 'hardhat':
      c.beginPath(); c.ellipse(x,hy-1,8.6,8.2,0,Math.PI,TAU); c.closePath(); c.fill(); c.stroke();
      rr(c,x-9,hy-2.6,21,3.2,1.6); c.fill(); c.stroke();
      c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(x-1,hy-8.5,2.4,6);
      break;
    case 'tesla':
      rr(c,x+0.5,hy-2.6,8,4.4,2.2); c.fillStyle='#c79bff'; c.fill(); c.stroke();
      break;
    case 'beret':
      c.beginPath(); c.ellipse(x-0.5,hy-5.5,9,3.8,-0.18,0,TAU); c.fill(); c.stroke();
      circ(c,x-1,hy-9.3,1.6); c.fill(); c.stroke();
      c.fillStyle='#e2ab3c'; circ(c,x+5,hy-6.5,1.5); c.fill();
      break;
    case 'pilot':
      c.beginPath(); c.arc(x,hy-0.5,8.4,Math.PI*0.95,TAU+0.1); c.closePath(); c.fill(); c.stroke();
      c.fillStyle='#d8483b'; c.fillRect(x-1.2,hy-8.6,2.4,7);
      rr(c,x-1,hy-2.3,10,4.8,2.4); c.fillStyle='#ffb43a'; c.fill(); c.stroke();
      break;
    case 'mask':
      c.beginPath(); c.arc(x,hy,8,Math.PI,TAU); c.closePath(); c.fill(); c.stroke();
      circ(c,x+3.4,hy-0.4,2.3); c.fillStyle='#7dff8a'; c.fill(); c.stroke();
      circ(c,x+6.2,hy+3.6,3.1); c.fillStyle='#4a4f5c'; c.fill(); c.stroke();
      c.fillStyle='#2b2f3a'; circ(c,x+7.4,hy+4.4,1.2); c.fill();
      break;
    case 'ushanka':
      rr(c,x-9,hy-11,18,7.5,3.5); c.fill(); c.stroke();
      rr(c,x-9.5,hy-4,5,9,2.5); c.fill(); c.stroke();
      c.fillStyle='#b8946a'; rr(c,x-8,hy-5.6,17,3.4,1.7); c.fill(); c.stroke();
      break;
    case 'headband':
      c.fillStyle=L.hatC; rr(c,x-7.6,hy-5,15.2,3.2,1.6); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x-7,hy-4); c.lineTo(x-12,hy-1); c.lineTo(x-8,hy-1.5); c.closePath(); c.fill(); c.stroke();
      break;
    case 'knight':
      c.beginPath(); c.arc(x,hy,8.4,Math.PI*0.9,TAU+0.35); c.closePath(); c.fill(); c.stroke();
      c.fillStyle=INK; rr(c,x+1.5,hy-1.2,7,2,1); c.fill();
      c.fillStyle='#d8483b'; c.beginPath(); c.ellipse(x-3,hy-10,6,2.6,-0.5,0,TAU); c.fill(); c.stroke();
      break;
    case 'bicorne':
      c.beginPath(); c.moveTo(x-12,hy-3); c.quadraticCurveTo(x,hy-17,x+12,hy-3); c.quadraticCurveTo(x,hy-7,x-12,hy-3); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle='#f2c14e'; c.lineWidth=1.4; c.beginPath(); c.moveTo(x-10,hy-4.2); c.quadraticCurveTo(x,hy-8,x+10,hy-4.2); c.stroke();
      c.fillStyle='#f0503f'; circ(c,x+1,hy-8.5,2); c.fill(); c.strokeStyle=INK; c.lineWidth=1.2; c.stroke();
      break;
    case 'winged':
      c.beginPath(); c.arc(x,hy-0.5,8.2,Math.PI,TAU); c.closePath(); c.fill(); c.stroke();
      c.fillStyle='#ffffff'; c.beginPath(); c.moveTo(x-6,hy-5); c.lineTo(x-14,hy-12); c.lineTo(x-11,hy-6); c.lineTo(x-14,hy-4); c.closePath(); c.fill(); c.stroke();
      break;
    case 'hood':
      c.beginPath(); c.arc(x-0.5,hy+0.5,9,Math.PI*0.75,TAU+0.2); c.quadraticCurveTo(x+3,hy-3,x-2,hy+2); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle='#ffffff'; c.lineWidth=1.2; for(let i=0;i<3;i++){ const a=i*Math.PI/3; line(c,x-3+Math.cos(a)*2.6,hy-5+Math.sin(a)*2.6,x-3-Math.cos(a)*2.6,hy-5-Math.sin(a)*2.6); }
      break;
    case 'bandana':
      c.beginPath(); c.arc(x,hy,8,Math.PI,TAU); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x-7,hy-3); c.lineTo(x-13,hy-1); c.lineTo(x-9,hy+3); c.closePath(); c.fill(); c.stroke();
      c.fillStyle='#fff3e0'; for(const [dx,dy] of [[-3,-5],[2,-6],[5,-3],[-5,-2]]){ circ(c,x+dx,hy+dy,0.9); c.fill(); }
      if(L.patch){ c.fillStyle=INK; circ(c,x+5.4,hy+0.3,2.2); c.fill(); c.lineWidth=1.1; line(c,x+5,hy-1.8,x-6,hy-5); }
      break;
  }
}

function drawWeapon(c,type,x,fy,aim,recoil,t,act,loaded,skin){
  if(type==='shield'){
    c.save(); c.translate(x+5,fy-19);
    rr(c,0,0,9,20,3); c.fillStyle='#4a6fb0'; c.fill(); c.lineWidth=2; c.strokeStyle=INK; c.stroke();
    c.strokeStyle='#e2ab3c'; c.lineWidth=1.6; rr(c,1.6,1.6,5.8,16.8,2); c.stroke();
    c.fillStyle='#e2ab3c'; star(c,4.5,10,3,1.3,5); c.fill();
    if(act>0){ c.globalAlpha=Math.min(1,act); c.strokeStyle='#8ee8ff'; c.lineWidth=2; circ(c,4.5,10,14); c.stroke(); c.globalAlpha=1; }
    c.restore(); return;
  }
  c.save(); c.translate(x+1,fy-11);
  let a=aim;
  if(type==='mechanic') a=-0.7+Math.sin(t*7)*(act>0?0.6:0.12);
  if(type==='thunder') a=-1.1+(act>0?Math.sin(t*20)*0.15:0);
  if(type==='blizzard'||type==='valkyrie') a=Math.min(aim,-0.35);
  c.rotate(a); c.translate(-recoil*3.5,0);
  c.lineWidth=1.8; c.strokeStyle=INK;
  let mx=24;
  switch(type){
    case 'gunner':
      rr(c,-7,-2.6,11,5.2,2); c.fillStyle='#8a5a32'; c.fill(); c.stroke();
      rr(c,2,-1.7,23,3.4,1.2); c.fillStyle='#3c4253'; c.fill(); c.stroke(); mx=26; break;
    case 'cannon':
      rr(c,-5,-4.6,19,9.2,3); c.fillStyle='#3a3f4d'; c.fill(); c.stroke();
      c.fillStyle='#d19a2c'; c.fillRect(1,-4,2.4,8); c.fillRect(8,-4,2.4,8);
      rr(c,13,-5.8,5.5,11.6,2); c.fillStyle='#2b2f3a'; c.fill(); c.stroke(); mx=20; break;
    case 'harpoon':
      rr(c,-5,-3.2,15,6.4,2); c.fillStyle='#4f7fa8'; c.fill(); c.stroke();
      if(loaded){ rr(c,8,-0.9,14,1.8,0.9); c.fillStyle='#8a5a32'; c.fill(); c.beginPath(); c.moveTo(21,-3.4); c.lineTo(28,0); c.lineTo(21,3.4); c.closePath(); c.fillStyle='#dfe6ee'; c.fill(); c.stroke(); }
      break;
    case 'mechanic':
      rr(c,-1,-1.6,15,3.2,1.5); c.fillStyle='#9aa3b1'; c.fill(); c.stroke();
      circ(c,16,0,4.4); c.fill(); c.stroke(); c.fillStyle='#4a5160'; c.fillRect(16,-1.6,5,3.2); break;
    case 'tesla': case 'blizzard': {
      rr(c,-3,-1.5,17,3,1.5); c.fillStyle=type==='tesla'?'#3a2e55':'#c9e8f7'; c.fill(); c.stroke();
      if(type==='tesla'){ c.strokeStyle='#d58a3a'; c.lineWidth=1.7; for(const k of [4,7.5,11]){ ell(c,k,0,1.5,4.3); c.stroke(); } }
      const pulse=0.55+Math.sin(t*9)*0.25, col=type==='tesla'?'230,200,255':'190,240,255';
      const g=c.createRadialGradient(18,0,0,18,0,9); g.addColorStop(0,'rgba('+col+','+pulse+')'); g.addColorStop(1,'rgba('+col+',0)');
      c.fillStyle=g; circ(c,18,0,9); c.fill();
      if(type==='tesla'){ circ(c,18,0,3.4); c.fillStyle='#f6ecff'; c.fill(); c.strokeStyle='#8a54d6'; c.lineWidth=1.5; c.stroke(); }
      else { c.strokeStyle='#ffffff'; c.lineWidth=1.8; for(let i=0;i<3;i++){ const q=i*Math.PI/3+t; line(c,18+Math.cos(q)*5,Math.sin(q)*5,18-Math.cos(q)*5,-Math.sin(q)*5); } }
      mx=20; break; }
    case 'sniper':
      rr(c,-8,-2.6,12,5.2,2); c.fillStyle='#6b4a2b'; c.fill(); c.stroke();
      rr(c,3,-1.4,30,2.8,1); c.fillStyle='#2f3542'; c.fill(); c.stroke();
      rr(c,5,-6,11,3.6,1.5); c.fillStyle='#1b2140'; c.fill(); c.stroke(); c.fillStyle='#9fe3ff'; circ(c,16,-4.2,1.4); c.fill();
      mx=34; break;
    case 'rocket':
      rr(c,-9,-4.4,27,8.8,3.5); c.fillStyle='#5f6e3a'; c.fill(); c.stroke();
      c.fillStyle='#f0503f'; c.fillRect(13,-4,2.6,8); c.fillStyle='#ffd23f'; c.fillRect(-6,-4,2.6,8);
      if(loaded){ c.beginPath(); c.moveTo(18,-3.2); c.lineTo(24,0); c.lineTo(18,3.2); c.closePath(); c.fillStyle='#f0503f'; c.fill(); c.stroke(); }
      mx=22; break;
    case 'flamer':
      rr(c,-4,-3,15,6,2.5); c.fillStyle='#c98a2c'; c.fill(); c.stroke();
      rr(c,10,-2,8,4,1.5); c.fillStyle='#3a3f4d'; c.fill(); c.stroke();
      c.fillStyle='rgba(90,170,255,'+(0.6+Math.sin(t*30)*0.3)+')'; circ(c,20,0,1.8); c.fill();
      mx=20; break;
    case 'frost':
      rr(c,-4,-3.5,16,7,3); c.fillStyle='#e9f6ff'; c.fill(); c.stroke();
      c.fillStyle='#3b88b0'; c.fillRect(2,-3.5,2.4,7);
      c.beginPath(); c.moveTo(12,-4); c.lineTo(20,0); c.lineTo(12,4); c.lineTo(14,0); c.closePath(); c.fillStyle='#7fe3ff'; c.fill(); c.stroke();
      mx=21; break;
    case 'gatling': {
      rr(c,-5,-4.5,12,9,3); c.fillStyle='#6b7b8c'; c.fill(); c.stroke();
      const sp=(t*(act>0?40:6))%3;
      for(let i=0;i<3;i++){ const y=-3.4+((i+sp)%3)*2.6; rr(c,6,y-0.8,17,1.8,0.9); c.fillStyle=i===1?'#59606e':'#3c4253'; c.fill(); c.lineWidth=1; c.stroke(); }
      c.lineWidth=1.8; rr(c,21,-4.6,3,9.2,1.2); c.fillStyle='#2b2f3a'; c.fill(); c.stroke();
      mx=25; break; }
    case 'thunder':
      c.beginPath(); c.moveTo(0,-1.6); c.quadraticCurveTo(14,-4,26,-1); c.lineTo(26,1.2); c.quadraticCurveTo(14,1,0,1.6); c.closePath(); c.fillStyle='#e6edf5'; c.fill(); c.stroke();
      rr(c,-4,-3,4,6,1.5); c.fillStyle='#e2ab3c'; c.fill(); c.stroke();
      if(act>0||Math.sin(t*5)>0.7){ c.strokeStyle='#ffe066'; c.lineWidth=1.6; c.beginPath(); c.moveTo(24,-2); c.lineTo(28,-7); c.lineTo(26,-6); c.lineTo(31,-12); c.stroke(); }
      mx=27; break;
    case 'atlas': {
      rr(c,-3,-4,19,8,3.5); c.fillStyle='#8b97a8'; c.fill(); c.stroke();
      c.fillStyle='#4b5566'; c.fillRect(3,-4,2.4,8);
      const g=c.createRadialGradient(17,0,0,17,0,8); g.addColorStop(0,'rgba(120,255,255,.95)'); g.addColorStop(1,'rgba(60,200,255,0)');
      c.fillStyle=g; circ(c,17,0,8); c.fill(); c.fillStyle='#e8ffff'; circ(c,17,0,2.4); c.fill();
      mx=18; break; }
    case 'valkyrie':
      rr(c,-6,-1.2,30,2.4,1.2); c.fillStyle='#8a5a32'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(24,-3.6); c.lineTo(33,0); c.lineTo(24,3.6); c.closePath(); c.fillStyle='#ffd23f'; c.fill(); c.stroke();
      mx=32; break;
  }
  circ(c,0,1.5,2.6); c.fillStyle=skin||'#f2c49b'; c.fill(); c.strokeStyle=INK; c.lineWidth=1.6; c.stroke();
  if(recoil>0.6&&type!=='mechanic'&&type!=='thunder'&&type!=='valkyrie'){ c.fillStyle=type==='frost'||type==='blizzard'?'#bff4ff':type==='atlas'?'#8ff':'#fff3a0'; star(c,mx+3,0,7*recoil,3,6); c.fill(); }
  c.restore();
}
function drawPortrait(c,id,cx,fy,sc,t){
  c.save(); c.translate(cx,fy); c.scale(sc,sc);
  const L=LOOK[id]||LOOK.gunner;
  if(L.legend) drawAura(c,0,-16,t||0);
  drawCrewBody(c,id,0,0,t||0,false);
  drawWeapon(c,id,0,0,-0.25,0,t||0,0,true,L.skin);
  c.restore();
}

/* ---------- balloons, hull, ship ---------- */
function drawSkull(c,x,y,r){
  c.lineWidth=1.4; c.strokeStyle=INK; c.fillStyle='#f4efe2';
  rr(c,x-r*0.55,y+r*0.45,r*1.1,r*0.6,r*0.2); c.fill(); c.stroke();
  circ(c,x,y,r); c.fill(); c.stroke();
  c.fillStyle=INK; circ(c,x-r*0.38,y+r*0.05,r*0.26); c.fill(); circ(c,x+r*0.38,y+r*0.05,r*0.26); c.fill();
  c.beginPath(); c.moveTo(x,y+r*0.35); c.lineTo(x-r*0.12,y+r*0.58); c.lineTo(x+r*0.12,y+r*0.58); c.closePath(); c.fill();
}
function drawBalloon(c,b,t){
  const R=b.R, rx=R*0.9, look=BLOOK[b.look]||BLOOK.p0;
  const low=b.hp/b.max;
  const x=b.lx+(low<0.3?Math.sin(t*38)*0.9:0), y=b.ly+Math.sin(t*1.3+b.wob)*2;
  c.save(); c.translate(x,y);
  c.lineWidth=2; c.strokeStyle=INK;
  rr(c,-R*0.2,R*0.86,R*0.4,R*0.2,3); c.fillStyle=look.neck; c.fill(); c.stroke();
  ell(c,0,0,rx,R); c.fillStyle=look.a; c.fill();
  c.save(); c.clip();
  ell(c,0,0,rx*0.64,R*1.02); c.fillStyle=look.b; c.fill();
  ell(c,0,0,rx*0.27,R*1.04); c.fillStyle=look.a; c.fill();
  if(b.armor>=4){ c.strokeStyle='#e2ab3c'; c.lineWidth=R*0.11; c.beginPath(); c.ellipse(0,R*0.42,rx,R*0.12,0,0,Math.PI); c.stroke(); }
  if(b.armor>=8){ c.beginPath(); c.ellipse(0,-R*0.15,rx,R*0.12,0,0,Math.PI); c.stroke(); }
  if(b.armor>=12){ c.fillStyle='#fff3c4'; for(let i=-2;i<=2;i++){ circ(c,i*rx*0.36,R*0.5-Math.abs(i)*1.5,1.6); c.fill(); } }
  const g=c.createRadialGradient(-rx*0.35,-R*0.4,R*0.1,0,0,R*1.05);
  g.addColorStop(0,'rgba(255,255,255,0.32)'); g.addColorStop(0.45,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(20,20,60,0.38)');
  c.fillStyle=g; c.fillRect(-rx,-R,rx*2,R*2);
  if(low<0.6&&b.patches){ c.lineWidth=1.3; c.strokeStyle=INK; for(let i=0;i<b.patches.length;i++){ if(low>0.4&&i>0) break; const p=b.patches[i]; c.save(); c.translate(p.x*rx,p.y*R); c.rotate(p.a); rr(c,-R*0.13,-R*0.1,R*0.26,R*0.2,2); c.fillStyle=look.patch; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-R*0.08,-R*0.04); c.lineTo(-R*0.02,R*0.04); c.moveTo(R*0.02,-R*0.04); c.lineTo(R*0.08,R*0.04); c.stroke(); c.restore(); } }
  if(look.skull) drawSkull(c,0,-R*0.05,R*0.25);
  if(b.hit>0){ c.fillStyle='rgba(255,255,255,'+Math.min(0.8,b.hit*6)+')'; c.fillRect(-rx,-R,rx*2,R*2); }
  c.restore();
  c.save(); c.translate(-rx*0.42,-R*0.45); c.rotate(-0.5); ell(c,0,0,rx*0.13,R*0.24); c.fillStyle='rgba(255,255,255,.65)'; c.fill(); c.restore();
  ell(c,0,0,rx,R); c.strokeStyle=INK; c.lineWidth=2.6; c.stroke();
  c.restore();
}
function hullPath(c,w){
  const L=-w/2-14, R=w/2+20;
  c.beginPath(); c.moveTo(L,-2); c.lineTo(R,-2);
  c.bezierCurveTo(R+20,-2,R+26,10,R+20,22);
  c.bezierCurveTo(R+12,38,R-4,44,R-20,44);
  c.lineTo(L+16,44);
  c.bezierCurveTo(L+2,44,L-8,34,L-8,18);
  c.bezierCurveTo(L-8,6,L-6,-2,L,-2);
  c.closePath();
}
function drawHull(c,s){
  const w=s.w, L=-w/2-14, R=w/2+20, sp=s.spec, pal=sp.hullPal||HULLS[0];
  hullPath(c,w);
  const g=c.createLinearGradient(0,-2,0,HULL_H); g.addColorStop(0,pal.light); g.addColorStop(0.55,pal.base); g.addColorStop(1,pal.dark);
  c.fillStyle=g; c.fill();
  c.save(); hullPath(c,w); c.clip();
  c.strokeStyle=pal.dark; c.lineWidth=1.5; c.globalAlpha=0.75; c.beginPath();
  const bands=[-2,11,22,33];
  for(let k=0;k<bands.length;k++){ const y0=bands[k]; if(k>0){ c.moveTo(L-12,y0); c.lineTo(R+30,y0); } for(let xx=L-12+(k%2)*16; xx<R+30; xx+=32){ c.moveTo(xx,y0); c.lineTo(xx,y0+11); } }
  c.stroke(); c.globalAlpha=1;
  if(pal.keel){ c.fillStyle=pal.keel; c.fillRect(L-12,35,w+80,12); c.strokeStyle=INK; c.lineWidth=1.4; line(c,L-12,35,R+30,35); c.fillStyle=INK; for(let xx=L; xx<R+20; xx+=12){ circ(c,xx,40,1.3); c.fill(); } }
  c.fillStyle=pal.band; c.fillRect(L-12,1,w+80,6); c.strokeStyle=INK; c.lineWidth=1.4; c.beginPath(); c.moveTo(L-12,1); c.lineTo(R+30,1); c.moveTo(L-12,7); c.lineTo(R+30,7); c.stroke();
  if(sp.pirate){
    c.beginPath(); c.moveTo(R-34,25); c.quadraticCurveTo(R-6,42,R+18,22); c.quadraticCurveTo(R-8,30,R-34,25); c.closePath();
    c.fillStyle='#7a1620'; c.fill(); c.strokeStyle=INK; c.lineWidth=1.6; c.stroke();
    c.fillStyle='#fffaf0';
    for(let i=1;i<=6;i++){ const u=i/7, px=(1-u)*(1-u)*(R-34)+2*(1-u)*u*(R-8)+u*u*(R+18), py=(1-u)*(1-u)*25+2*(1-u)*u*30+u*u*22; c.beginPath(); c.moveTo(px-2.6,py-0.5); c.lineTo(px+2.6,py-0.5); c.lineTo(px,py+4.5); c.closePath(); c.fill(); c.lineWidth=1; c.stroke(); }
    circ(c,R-2,13,4); c.fillStyle='#fffaf0'; c.fill(); c.lineWidth=1.4; c.stroke(); circ(c,R-0.6,13.5,1.9); c.fillStyle=sp.boss?'#f0503f':INK; c.fill();
    c.lineWidth=2.2; line(c,R-8,8,R+3,10.5);
  }
  const hr=s.hull.hp/s.hull.max;
  if(hr<0.6){ c.strokeStyle=INK; c.lineWidth=1.8; c.beginPath(); c.moveTo(-w*0.1,-2); c.lineTo(-w*0.05,10); c.lineTo(-w*0.12,18); c.lineTo(-w*0.04,30); c.stroke(); }
  if(hr<0.3){ c.beginPath(); c.moveTo(w*0.25,44); c.lineTo(w*0.2,34); c.lineTo(w*0.28,26); c.lineTo(w*0.22,16); c.stroke(); c.fillStyle='rgba(20,10,10,.2)'; c.fillRect(L-12,-2,w+80,50); }
  if(s.hull.hit>0){ c.fillStyle='rgba(255,255,255,'+Math.min(0.7,s.hull.hit*5)+')'; c.fillRect(L-12,-2,w+80,50); }
  c.restore();
  hullPath(c,w); c.strokeStyle=INK; c.lineWidth=2.6; c.stroke();
  const pEnd=sp.pirate?R-40:R-8;
  for(let xx=L+18; xx<pEnd; xx+=34){ circ(c,xx,21,6.2); c.fillStyle='#e2ab3c'; c.fill(); c.lineWidth=1.8; c.strokeStyle=INK; c.stroke(); circ(c,xx,21,3.9); c.fillStyle=s.dead?'#3a3f4d':'#9fe0ff'; c.fill(); c.stroke(); c.fillStyle='rgba(255,255,255,.85)'; circ(c,xx-1.4,19.6,1.3); c.fill(); }
  c.beginPath(); c.moveTo(R+20,12); c.lineTo(R+38,20); c.lineTo(R+19,28); c.closePath();
  c.fillStyle=(sp.thrustLvl||1)>=10?'#f2c14e':'#c9d2dc'; c.fill(); c.lineWidth=2; c.strokeStyle=INK; c.stroke();
  c.fillStyle='rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(R+22,15); c.lineTo(R+33,20); c.lineTo(R+22,19); c.closePath(); c.fill();
}
function drawProp(c,x,y,len,n,a,col){
  ell(c,x,y,3.6,len+1); c.fillStyle='rgba(255,255,255,.3)'; c.fill();
  for(let i=0;i<n;i++){ const an=a+i*TAU/n, sy=Math.sin(an)*len, th=Math.cos(an);
    ell(c,x,y+sy/2,1.6+Math.abs(th)*2.6,Math.abs(sy)/2+0.6); c.fillStyle=th>=0?col.a:col.b; c.fill(); c.lineWidth=1.4; c.strokeStyle=INK; c.stroke(); }
  c.beginPath(); c.moveTo(x+1,y-4.5); c.lineTo(x-8,y); c.lineTo(x+1,y+4.5); c.closePath(); c.fillStyle=col.hub; c.fill(); c.lineWidth=1.6; c.stroke();
}
function drawStern(c,s){
  const tl=s.spec.thrustLvl||1, L=-s.w/2-14, col=PROPC[propTier(tl)];
  const ys=tl>=10?[11,31]:[21], blades=tl>=20?5:tl>=10?4:tl>=4?3:2, len=ys.length>1?14+Math.min(tl,40)*0.12:16+tl*0.6;
  for(const py of ys){
    rr(c,L-30,py-2.5,26,5,2); c.fillStyle='#5d6372'; c.fill(); c.lineWidth=1.6; c.strokeStyle=INK; c.stroke();
    drawProp(c,L-31,py,len,blades,s.propA+py*0.1,col);
  }
}
function drawRotor(c,s){
  const lv=s.spec.rotorLvl||0; if(!lv) return;
  const xs=lv>=5?[-s.w*0.28,s.w*0.28]:[0], len=15+Math.min(lv,30)*0.6, col=PROPC[Math.min(4,1+Math.floor(lv/8))];
  for(const x of xs){
    rr(c,x-2.6,40,5.2,15,2); c.fillStyle='#5d6372'; c.fill(); c.lineWidth=1.6; c.strokeStyle=INK; c.stroke();
    ell(c,x,57,len+1,3); c.fillStyle='rgba(255,255,255,.3)'; c.fill();
    for(let i=0;i<3;i++){ const an=s.propA*1.3+i*TAU/3+x, bx=Math.cos(an)*len, d=Math.sin(an);
      ell(c,x+bx/2,57+d*0.8,Math.abs(bx)/2+0.6,2.2); c.fillStyle=d>0?col.a:col.b; c.fill(); c.lineWidth=1.3; c.stroke(); }
    circ(c,x,57,3.3); c.fillStyle=col.hub; c.fill(); c.lineWidth=1.5; c.stroke();
  }
}
function drawFlag(c,s,t){
  const px=-s.w/2-6, top=-s.topRows*B-28;
  rr(c,px-1.8,top,3.6,-top-2,1.5); c.fillStyle='#6b4a2b'; c.fill(); c.lineWidth=1.5; c.strokeStyle=INK; c.stroke();
  const fw=28, fh=18;
  c.beginPath(); c.moveTo(px,top+2);
  for(let i=0;i<=8;i++){ const u=i/8; c.lineTo(px-u*fw,top+2+Math.sin(t*6-u*4)*2.6*u); }
  for(let i=8;i>=0;i--){ const u=i/8; c.lineTo(px-u*fw,top+2+fh+Math.sin(t*6-u*4)*2.6*u); }
  c.closePath(); c.fillStyle=s.spec.flag||'#2f6fd0'; c.fill(); c.lineWidth=1.8; c.stroke();
  const ex=px-fw*0.5, ey=top+2+fh/2+Math.sin(t*6-2)*1.3;
  if(s.spec.pirate) drawSkull(c,ex,ey-1,4.6);
  else { c.fillStyle='#ffd23f'; star(c,ex,ey,6,2.6,5); c.fill(); c.lineWidth=1.2; c.stroke(); }
  circ(c,px,top,2.8); c.fillStyle='#e2ab3c'; c.fill(); c.lineWidth=1.4; c.stroke();
}
function drawScaffold(c,s){
  const w=s.w, rows=s.topRows, x0=-w/2, top=-rows*B;
  c.lineCap='round';
  for(const pass of [0,1]){
    c.strokeStyle=pass?'#8a6440':INK; c.lineWidth=pass?3.2:6.4;
    c.beginPath();
    for(let i=0;i<=s.cols;i++){ c.moveTo(x0+i*B,-1); c.lineTo(x0+i*B,top); }
    for(let r=1;r<=rows;r++){ c.moveTo(x0,-r*B); c.lineTo(x0+w,-r*B); }
    c.stroke();
  }
  const filled=new Set(); for(const cell of s.cells) if(cell.alive) filled.add(cell.c+','+cell.r);
  c.strokeStyle='#6d4c30'; c.lineWidth=2;
  c.beginPath();
  for(let r=0;r<rows;r++) for(let col=0;col<s.cols;col++){ if(filled.has(col+','+r)) continue; const x=x0+col*B, y=-(r+1)*B; c.moveTo(x+5,y+5); c.lineTo(x+B-5,y+B-5); c.moveTo(x+B-5,y+5); c.lineTo(x+5,y+B-5); }
  c.stroke();
}
function drawRopes(c,s,t){
  c.strokeStyle='#4a3a2a'; c.lineWidth=1.6;
  c.beginPath();
  for(const b of s.balloons){ if(!b.alive) continue; const by=b.ly+Math.sin(t*1.3+b.wob)*2, rx=b.R*0.9;
    c.moveTo(b.lx-rx*0.5,by+b.R*0.82); c.lineTo(b.ax-9,b.ay);
    c.moveTo(b.lx+rx*0.5,by+b.R*0.82); c.lineTo(b.ax+9,b.ay);
    c.moveTo(b.lx,by+b.R*1.05); c.lineTo(b.ax,b.ay); }
  c.stroke();
}
function drawPost(c,s,cell,x,y,mat,covered,t){
  const L=lookOf(cell.crew,s.spec.pirate);
  rr(c,x+0.5,y+0.5,B-1,B-1,4); c.fillStyle=mat.inner; c.fill();
  if(L.legend) drawAura(c,x+B/2,y+B/2-4,t+cell.bob);
  drawCrewBody(c,cell.crew,x+B/2-1,y+B-3,t+cell.bob,s.spec.pirate);
  c.lineWidth=2.2; c.strokeStyle=INK; c.fillStyle=L.legend?'#f2c14e':mat.base;
  const py=y+B*0.56;
  rr(c,x+0.5,py,B-1,B-py+y-0.5,3); c.fill(); c.stroke();
  c.fillStyle=L.legend?'#fff3c4':mat.light; c.fillRect(x+3,py+2.5,B-6,2.5);
  const pt=covered?y+0.5:y+9;
  c.fillStyle=L.legend?'#f2c14e':mat.base;
  rr(c,x+0.5,pt,5.5,B-0.5-(pt-y),2); c.fill(); c.stroke();
  rr(c,x+B-6,pt,5.5,B-0.5-(pt-y),2); c.fill(); c.stroke();
  if(covered){ rr(c,x+0.5,y+0.5,B-1,5,2); c.fill(); c.stroke(); }
  else { rr(c,x-1,pt-4,8.5,5,2); c.fill(); c.stroke(); rr(c,x+B-7.5,pt-4,8.5,5,2); c.fill(); c.stroke(); }
  if(L.legend){ c.fillStyle='#b52a3e'; star(c,x+B/2,py+9,4,1.8,5); c.fill(); c.lineWidth=1; c.stroke(); }
  const ratio=cell.hp/cell.max;
  if(ratio<0.5){ c.strokeStyle=INK; c.lineWidth=1.5; c.beginPath(); c.moveTo(x+B*0.25,py); c.lineTo(x+B*0.38,py+7); c.lineTo(x+B*0.3,py+12); c.stroke(); }
  const loaded=cell.cd<crewRate(cell.crew,cell.lvl)*0.55;
  drawWeapon(c,cell.crew,x+B/2-1,y+B-3,cell.aim,cell.recoil,t+cell.bob,cell.act||0,loaded,L.skin);
  if(s.freeze>0){ rr(c,x+2,y+2,B-4,B-4,5); c.fillStyle='rgba(180,235,255,.55)'; c.fill(); c.strokeStyle='#ffffff'; c.lineWidth=1.5; c.stroke(); }
  else if(s.chill>0){ rr(c,x+0.5,y+0.5,B-1,B-1,4); c.fillStyle='rgba(150,220,255,.28)'; c.fill(); }
  if(cell.hit>0){ rr(c,x+0.5,y+0.5,B-1,B-1,4); c.fillStyle='rgba(255,255,255,'+Math.min(0.7,cell.hit*6)+')'; c.fill(); }
}
function drawCell(c,s,cell,t){
  const x=-s.w/2+cell.c*B, y=-(cell.r+1)*B;
  const pop=cell.pop>0?1+Math.sin(cell.pop*Math.PI)*0.18:1;
  if(pop!==1){ c.save(); c.translate(x+B/2,y+B/2); c.scale(pop,pop); c.translate(-x-B/2,-y-B/2); }
  const mat=MATS[s.matTier];
  if(cell.type==='W') drawBlock(c,x,y,mat,cell.hp/cell.max,cell.hit);
  else { let covered=false; for(const o of s.cells) if(o.alive&&o.c===cell.c&&o.r===cell.r+1){ covered=true; break; } drawPost(c,s,cell,x,y,mat,covered,t); }
  if(pop!==1) c.restore();
}
function drawShieldBubble(c,s,t){
  if(!(s.shield>0)) return;
  let top=-s.topRows*B-20; for(const b of s.balloons) if(b.alive) top=Math.min(top,b.ly-b.R-8);
  const cx=0, cy=(top+60)/2, rx=s.w/2+72, ry=(60-top)/2+10;
  const a=0.16+0.08*Math.sin(t*4)+0.25*clamp(s.shieldHit||0,0,1);
  ell(c,cx,cy,rx,ry); c.fillStyle='rgba(110,215,255,'+a+')'; c.fill();
  c.lineWidth=2.5; c.strokeStyle='rgba(170,235,255,'+(0.5+a)+')'; c.stroke();
}
function drawShip(c,s,t){
  c.save();
  c.translate(s.x,s.y+(s.dead?0:Math.sin(s.t*1.6)*2.5));
  if(s.rot) c.rotate(s.rot);
  c.scale(s.side,1);
  c.lineJoin='round'; c.lineCap='round';
  drawRopes(c,s,t);
  const order=s.balloons.filter(b=>b.alive).sort((a,b)=>a.ly-b.ly);
  for(const b of order) drawBalloon(c,b,t);
  drawFlag(c,s,t);
  drawStern(c,s);
  drawScaffold(c,s);
  drawRotor(c,s);
  drawHull(c,s);
  for(const cell of s.cells) if(cell.alive) drawCell(c,s,cell,t);
  if(!s.dead) drawShieldBubble(c,s,t);
  if(s.invuln>0&&Math.sin(t*25)>0){ c.globalAlpha=0.35; hullPath(c,s.w); c.fillStyle='#ffffff'; c.fill(); c.globalAlpha=1; }
  c.restore();
}

/* ---------- resource art ---------- */
function drawGear(c,x,y,r,col){
  c.beginPath();
  for(let i=0;i<32;i++){ const a=i/32*TAU, rad=(Math.floor(i/2)%2===0)?r:r*0.74; c.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad); }
  c.closePath(); c.fillStyle=col||'#b9c3d3'; c.fill(); c.lineWidth=Math.max(1.4,r*0.14); c.strokeStyle=INK; c.stroke();
  circ(c,x,y,r*0.48); c.fillStyle='#8c97a8'; c.fill(); c.stroke();
  circ(c,x,y,r*0.2); c.fillStyle=INK; c.fill();
  c.fillStyle='rgba(255,255,255,.55)'; circ(c,x-r*0.45,y-r*0.45,r*0.14); c.fill();
}
function drawGem(c,x,y,r){
  c.save(); c.translate(x,y);
  c.beginPath(); c.moveTo(-r,-0.25*r); c.lineTo(-0.55*r,-0.75*r); c.lineTo(0.55*r,-0.75*r); c.lineTo(r,-0.25*r); c.lineTo(0,r); c.closePath();
  const g=c.createLinearGradient(0,-r,0,r); g.addColorStop(0,'#c9f6ff'); g.addColorStop(0.5,'#3fd3ff'); g.addColorStop(1,'#1478c4');
  c.fillStyle=g; c.fill(); c.lineWidth=Math.max(1.4,r*0.12); c.strokeStyle=INK; c.lineJoin='round'; c.stroke();
  c.lineWidth=Math.max(0.8,r*0.06); c.strokeStyle='rgba(20,60,120,.6)';
  c.beginPath(); c.moveTo(-r,-0.25*r); c.lineTo(r,-0.25*r); c.moveTo(-0.3*r,-0.25*r); c.lineTo(0,r); c.lineTo(0.3*r,-0.25*r); c.moveTo(-0.55*r,-0.75*r); c.lineTo(-0.3*r,-0.25*r); c.lineTo(0,-0.75*r); c.lineTo(0.3*r,-0.25*r); c.lineTo(0.55*r,-0.75*r); c.stroke();
  c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-0.5*r,-0.62*r); c.lineTo(-0.25*r,-0.62*r); c.lineTo(-0.55*r,-0.32*r); c.closePath(); c.fill();
  c.restore();
}
const CRATE_PAL={wood:{body:'#b8783e',dark:'#7c4520',band:'#8a5a32',lock:'#e2ab3c'}, steel:{body:'#8d9bb0',dark:'#56647a',band:'#ffd23f',lock:'#3a3f4d'}, gold:{body:'#f2c14e',dark:'#b9801a',band:'#c0392b',lock:'#3fd3ff'}, ark:{body:'#f4f1ff',dark:'#9f8fe0',band:'#ffcc33',lock:'#3fd3ff'}};
function drawCrate(c,x,y,s,type,t){
  const P=CRATE_PAL[type]||CRATE_PAL.wood;
  c.save(); c.translate(x,y); c.scale(s/40,s/40); c.lineJoin='round'; c.lineWidth=2.4; c.strokeStyle=INK;
  if(type==='ark'||type==='gold'){ const g=c.createRadialGradient(0,0,4,0,0,28); g.addColorStop(0,type==='ark'?'rgba(170,140,255,.7)':'rgba(255,220,90,.6)'); g.addColorStop(1,'rgba(255,220,90,0)'); c.fillStyle=g; circ(c,0,0,28); c.fill(); }
  if(type==='ark'){ c.fillStyle='#ffffff'; for(const sgn of [-1,1]){ c.beginPath(); c.moveTo(sgn*16,-6); c.quadraticCurveTo(sgn*30,-18,sgn*27,-2); c.quadraticCurveTo(sgn*31,2,sgn*24,6); c.quadraticCurveTo(sgn*26,10,sgn*17,8); c.closePath(); c.fill(); c.stroke(); } }
  rr(c,-18,-6,36,22,4); c.fillStyle=P.body; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-18,-6); c.lineTo(-18,-11); c.quadraticCurveTo(0,-24,18,-11); c.lineTo(18,-6); c.closePath(); c.fillStyle=P.body; c.fill(); c.stroke();
  c.save(); rr(c,-18,-6,36,22,4); c.clip();
  c.strokeStyle=P.dark; c.lineWidth=1.6;
  if(type==='wood'){ line(c,-18,2,18,2); line(c,-18,9,18,9); }
  if(type==='steel'){ for(let i=-24;i<24;i+=8){ c.fillStyle=(i/8)%2?'#1b2140':'#ffd23f'; c.beginPath(); c.moveTo(i,16); c.lineTo(i+4,16); c.lineTo(i+10,10); c.lineTo(i+6,10); c.closePath(); c.fill(); } }
  c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(-18,10,36,6);
  c.restore();
  c.fillStyle=P.band; c.lineWidth=1.8; c.strokeStyle=INK;
  rr(c,-13,-15,4.5,31,1.5); c.fill(); c.stroke(); rr(c,8.5,-15,4.5,31,1.5); c.fill(); c.stroke();
  rr(c,-4.5,-9,9,10,2); c.fillStyle=P.lock; c.fill(); c.stroke(); c.fillStyle=INK; circ(c,0,-5,1.4); c.fill(); c.fillRect(-0.6,-5,1.2,3);
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(-15,-9); c.quadraticCurveTo(-6,-16,2,-17); c.lineTo(2,-14); c.quadraticCurveTo(-6,-13,-15,-7); c.closePath(); c.fill();
  if(type==='ark'||type==='gold'){ c.fillStyle='#ffffff'; star(c,15,-15,4+Math.sin((t||0)*4),1.4,4); c.fill(); }
  c.restore();
}
function drawBag(c,x,y,k){
  c.save(); c.translate(x,y); c.scale(k,k);
  c.lineWidth=1.8; c.strokeStyle=INK;
  c.beginPath(); c.moveTo(-9,-4); c.quadraticCurveTo(-12,9,0,10); c.quadraticCurveTo(12,9,9,-4); c.quadraticCurveTo(5,-8,0,-8); c.quadraticCurveTo(-5,-8,-9,-4); c.closePath();
  c.fillStyle='#d4ad6c'; c.fill(); c.stroke();
  c.fillStyle='#8a5a32'; rr(c,-4,-11,8,4,2); c.fill(); c.stroke();
  c.fillStyle=INK; c.font='bold 7px Rubik, sans-serif'; c.textAlign='center'; c.fillText('КГ',0,5);
  c.restore();
}
function drawCoinArt(c,x,y,r){
  circ(c,x,y,r); c.fillStyle='#ffd23f'; c.fill(); c.lineWidth=Math.max(1.4,r*0.16); c.strokeStyle=INK; c.stroke();
  circ(c,x,y,r*0.62); c.strokeStyle='#de9512'; c.lineWidth=Math.max(1,r*0.12); c.stroke();
  c.fillStyle='rgba(255,255,255,.7)'; circ(c,x-r*0.35,y-r*0.38,r*0.18); c.fill();
}
