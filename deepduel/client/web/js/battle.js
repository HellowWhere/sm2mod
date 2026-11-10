/* Battle screen: renders server snapshots with interpolation, handles touch / keyboard controls. */
window.DD = window.DD || {};
(function () {
  const UI = DD.ui, $ = UI.$, S = UI.state;
  const TICK_MS = 1000 / 30;
  const INTERP_TICKS = 2.2;
  const VIEW_H = 560;

  const THEMES = [
    { name: 'Коралловая лагуна', water: ['#1a8fb8', '#0b4f7a', '#05284a'], bed: ['#c9a96e', '#6b5333'], rock: ['#5f6f7a', '#2a333b'], far: 'rgba(8,50,80,0.55)', plant: '#3fae5a', coral: ['#ff6f91', '#ffb36b', '#c86bff'], glow: null },
    { name: 'Глубоководный каньон', water: ['#155f9a', '#0a3363', '#030f24'], bed: ['#3e5266', '#18222e'], rock: ['#3b4c5e', '#141c26'], far: 'rgba(5,25,55,0.6)', plant: '#2b7d8a', coral: ['#3dfcff', '#7ab8ff', '#b46cff'], glow: 'rgba(60,220,255,0.6)' },
    { name: 'Вулканический разлом', water: ['#1d5a78', '#102c45', '#0c0d18'], bed: ['#3a2c2c', '#140c0e'], rock: ['#3d3334', '#171112'], far: 'rgba(30,15,20,0.55)', plant: '#6b4a3a', coral: ['#ff8a3d', '#ffcc33', '#ff4d5e'], glow: 'rgba(255,110,40,0.7)' },
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAng(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }
  function rnd(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
  }

  const B = {
    active: false,
    M: null,
    snaps: [],
    clockOffset: null,
    lastEvK: 0,
    particles: [],
    lights: [],
    rings: [],
    texts: [],
    shake: 0,
    cam: { x: 0, y: 0, init: false },
    input: { x: 0, y: 0, f: false, b: false },
    sentInput: null,
    lastSend: 0,
    keys: {},
    joy: null,
    lastPhase: -1,
    lastCount: -1,
    opLast: null,
    hitFlash: { me: 0, op: 0 },
    hurtFlash: 0,
    prop: { me: 0, op: 0 },
    alertT: 0,

    init() {
      B.canvas = $('#game');
      B.ctx = B.canvas.getContext('2d');
      B.mini = $('#minimap');
      B.mctx = B.mini.getContext('2d');
      B.setupControls();
      window.addEventListener('resize', () => B.resize());
    },

    resize() {
      const c = B.canvas;
      const low = S.settings.quality === 'low';
      B.dpr = Math.min(window.devicePixelRatio || 1, low ? 1 : 1.75);
      B.W = c.clientWidth;
      B.H = c.clientHeight;
      c.width = Math.round(B.W * B.dpr);
      c.height = Math.round(B.H * B.dpr);
      B.scale = B.H / VIEW_H;
      if (B.W / B.scale > 1500) B.scale = B.W / 1500;
    },

    // ================================================================ lifecycle
    start(m) {
      const fresh = !B.M || B.M.bid !== m.bid;
      B.M = m;
      B.me = m.subs[m.you];
      B.op = m.subs[1 - m.you];
      B.theme = THEMES[m.map.theme % THEMES.length];
      if (fresh) {
        B.snaps = [];
        B.clockOffset = null;
        B.lastEvK = 0;
        B.particles = [];
        B.lights = [];
        B.rings = [];
        B.texts = [];
        B.cam.init = false;
        B.lastPhase = -1;
        B.lastCount = -1;
        B.opLast = null;
        B.buildWorld();
        m.subs.forEach(sub => DD.subArt.get(S.cat.skins[sub.skin] || DD.DEFAULT_SKIN, DD.subArt.tierOf(sub.hull || 1)));
      }
      B.active = true;
      B.endPending = false;
      UI.show('battle');
      B.resize();
      B.buildHud();
      DD.sfx.ambientOn();
      if (window.DeepDuelAndroid && window.DeepDuelAndroid.keepScreenOn) window.DeepDuelAndroid.keepScreenOn(true);
      if (!B.raf) B.raf = requestAnimationFrame(B.frame);
    },

    stop() {
      B.active = false;
      DD.sfx.ambientOff();
      B.input = { x: 0, y: 0, f: false, b: false };
      B.keys = {};
      B.releaseJoy();
      if (window.DeepDuelAndroid && window.DeepDuelAndroid.keepScreenOn) window.DeepDuelAndroid.keepScreenOn(false);
    },

    buildWorld() {
      const map = B.M.map;
      const bed = new Path2D();
      bed.moveTo(-200, map.h + 400);
      bed.lineTo(-200, map.bed[0]);
      map.bed.forEach((y, i) => bed.lineTo(i * map.step, y));
      bed.lineTo(map.w + 200, map.bed[map.bed.length - 1]);
      bed.lineTo(map.w + 200, map.h + 400);
      bed.closePath();
      B.bedPath = bed;
      const r = rnd(map.bed.reduce((a, b) => a + b, 0) | 0);
      B.rocks = map.rocks.map(([x, y, rr]) => {
        const p = new Path2D();
        const n = 13;
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2;
          const k = rr * (0.86 + r() * 0.26);
          if (i === 0) p.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
          else p.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
        }
        p.closePath();
        return { x, y, r: rr, p };
      });
      B.plants = [];
      for (let x = 30; x < map.w; x += 22 + r() * 40) {
        const kind = r();
        B.plants.push({ x, h: 30 + r() * 90, kind: kind < 0.55 ? 'kelp' : kind < 0.85 ? 'coral' : 'stone', c: Math.floor(r() * 3), ph: r() * 6, w: 4 + r() * 8 });
      }
      B.vents = [];
      if (map.theme === 2) for (let i = 0; i < 6; i++) B.vents.push({ x: 150 + r() * (map.w - 300), t: 0 });
      B.far = [[], []];
      for (let L = 0; L < 2; L++) {
        let x = -400;
        while (x < map.w + 800) {
          B.far[L].push({ x, h: 200 + r() * (L ? 420 : 300), w: 120 + r() * 260 });
          x += 140 + r() * 260;
        }
      }
      B.snow = [];
      for (let i = 0; i < 90; i++) B.snow.push({ x: r() * map.w, y: r() * map.h, s: 0.6 + r() * 1.8, z: 0.4 + r() * 0.8 });
    },

    buildHud() {
      $('#hud-me-name').textContent = B.me.name;
      $('#hud-op-name').textContent = B.op.name;
      const lg = S.cat.leagues[B.op.league];
      $('#hud-op-tag').textContent = (B.op.bot ? 'БОТ · ' : '') + (lg ? lg.name : '') + ' · ' + B.op.trophies + ' 🏆';
      const box = $('#ctl-torps');
      box.innerHTML = '';
      const pos = [{ r: 100, b: 64 }, { r: 16, b: 106 }, { r: 92, b: 136 }];
      B.torpBtns = B.me.torps.map((wid, i) => {
        const w = S.cat.weapons[wid];
        const b = document.createElement('button');
        b.className = 'ctl ctl-torp';
        b.style.right = pos[i].r + 'px';
        b.style.bottom = pos[i].b + 'px';
        b.innerHTML = `${DD.icons.weaponSvg(w ? w.kind : 'torp', w ? UI.rarityColor(w.rarity) : '#fff').replace('<svg', '<svg class="wpic"')}<div class="cdfill"></div><div class="cdnum"></div>`;
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); B.torp(i); b.classList.add('down'); });
        const up = () => b.classList.remove('down');
        b.addEventListener('pointerup', up);
        b.addEventListener('pointercancel', up);
        b.addEventListener('pointerleave', up);
        box.appendChild(b);
        return b;
      });
      DD.icons.hydrate($('#hud'));
    },

    /** Big explosion on the destroyed submarine when the server reports the end. */
    finale(res) {
      if (!B.cur || res.reason !== 'destroyed') return;
      const victims = res.outcome > 0 ? [B.cur.op || B.opLast] : res.outcome < 0 ? [B.cur.me] : [B.cur.me, B.cur.op];
      victims.forEach((v, i) => {
        if (!v) return;
        setTimeout(() => {
          for (let k = 0; k < 3; k++) setTimeout(() => B.event(['boom', v.x + (Math.random() - 0.5) * 50, v.y + (Math.random() - 0.5) * 30, 120, 0]), k * 220);
        }, i * 300);
      });
      UI.vibrate(200);
    },

    torp(i) {
      DD.net.send('act', { a: 'torp', i });
    },
    sonar() {
      DD.net.send('act', { a: 'sonar' });
    },

    // ================================================================ network
    onSnapshot(s) {
      if (!B.active) return;
      const now = performance.now();
      const est = now - s.k * TICK_MS;
      if (B.clockOffset == null || est < B.clockOffset) B.clockOffset = est;
      else B.clockOffset += (est - B.clockOffset) * 0.01;
      B.snaps.push(s);
      if (B.snaps.length > 40) B.snaps.shift();
    },

    // ================================================================ controls
    setupControls() {
      const scr = $('#scr-battle');
      const joy = $('#joy'), knob = $('#joy-knob');
      const R = 52;
      scr.addEventListener('pointerdown', (e) => {
        if (!B.active || e.target.closest('.ctl') || e.target.closest('.hud-flag')) return;
        DD.sfx.init();
        if (e.clientX > window.innerWidth * 0.55 || B.joy) return;
        B.joy = { id: e.pointerId, x: e.clientX, y: e.clientY };
        joy.style.left = (e.clientX - 60) + 'px';
        joy.style.top = (e.clientY - 60) + 'px';
        joy.style.bottom = 'auto';
        joy.classList.add('active');
        knob.style.transform = 'translate(0,0)';
        try { scr.setPointerCapture(e.pointerId); } catch (err) {}
      });
      scr.addEventListener('pointermove', (e) => {
        if (!B.joy || e.pointerId !== B.joy.id) return;
        let dx = e.clientX - B.joy.x, dy = e.clientY - B.joy.y;
        const l = Math.hypot(dx, dy);
        if (l > R) { dx = dx / l * R; dy = dy / l * R; }
        knob.style.transform = `translate(${dx}px,${dy}px)`;
        B.input.x = dx / R;
        B.input.y = dy / R;
      });
      const end = (e) => { if (B.joy && e.pointerId === B.joy.id) B.releaseJoy(); };
      scr.addEventListener('pointerup', end);
      scr.addEventListener('pointercancel', end);

      const hold = (el, key) => {
        el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); DD.sfx.init(); B.input[key] = true; el.classList.add('down'); try { el.setPointerCapture(e.pointerId); } catch (err) {} });
        const up = (e) => { B.input[key] = false; el.classList.remove('down'); };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('lostpointercapture', up);
      };
      hold($('#ctl-fire'), 'f');
      hold($('#ctl-boost'), 'b');
      $('#ctl-sonar').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); B.sonar(); });
      $('#btn-surrender').addEventListener('click', async () => {
        const ok = await UI.confirm('Сдаться? Это засчитается как поражение.', 'Сдаться', { cls: 'btn-red' });
        if (ok) DD.net.req('surrender').catch(() => {});
      });
      scr.addEventListener('contextmenu', (e) => e.preventDefault());

      window.addEventListener('keydown', (e) => {
        if (!B.active || e.repeat) return;
        if (e.target && e.target.tagName === 'INPUT') return;
        B.keys[e.code] = true;
        if (e.code === 'Space' || e.code === 'KeyJ') B.input.f = true;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') B.input.b = true;
        if (e.code === 'KeyE' || e.code === 'KeyK' || e.code === 'Digit1') B.torp(0);
        if (e.code === 'KeyL' || e.code === 'Digit2') B.torp(1);
        if (e.code === 'Semicolon' || e.code === 'Digit3') B.torp(2);
        if (e.code === 'KeyQ') B.sonar();
        if (e.code === 'Space') e.preventDefault();
      });
      window.addEventListener('keyup', (e) => {
        B.keys[e.code] = false;
        if (e.code === 'Space' || e.code === 'KeyJ') B.input.f = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') B.input.b = false;
      });
    },

    releaseJoy() {
      B.joy = null;
      B.input.x = 0;
      B.input.y = 0;
      const joy = $('#joy');
      joy.classList.remove('active');
      joy.style.left = '';
      joy.style.top = '';
      joy.style.bottom = '';
      $('#joy-knob').style.transform = 'translate(0,0)';
    },

    sendInput(now) {
      let x = B.input.x, y = B.input.y;
      const k = B.keys;
      const kx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      const ky = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
      if (kx || ky) { const l = Math.hypot(kx, ky); x = kx / l; y = ky / l; }
      const cur = { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, f: B.input.f ? 1 : 0, b: B.input.b ? 1 : 0 };
      const prev = B.sentInput;
      const changed = !prev || prev.x !== cur.x || prev.y !== cur.y || prev.f !== cur.f || prev.b !== cur.b;
      if ((changed && now - B.lastSend > 45) || now - B.lastSend > 250) {
        DD.net.send('input', cur);
        B.sentInput = cur;
        B.lastSend = now;
      }
    },

    // ================================================================ interpolation
    sample(now) {
      const snaps = B.snaps;
      if (!snaps.length) return null;
      const rt = (now - B.clockOffset) / TICK_MS - INTERP_TICKS;
      let i = snaps.length - 1;
      while (i > 0 && snaps[i - 1].k > rt) i--;
      let s0, s1, t;
      if (i === 0 && snaps[0].k > rt) { s0 = s1 = snaps[0]; t = 0; }
      else if (snaps[i].k <= rt) { s0 = s1 = snaps[i]; t = Math.min(3, rt - snaps[i].k); }
      else { s0 = snaps[i - 1]; s1 = snaps[i]; t = (rt - s0.k) / Math.max(1, s1.k - s0.k); }
      while (snaps.length > 3 && snaps[1].k < rt - 30) snaps.shift();
      // run events of snapshots that are now "on screen"
      for (const s of snaps) {
        if (s.k > B.lastEvK && s.k <= rt + 0.001) {
          B.lastEvK = s.k;
          if (s.ev && s.ev.length) s.ev.forEach(B.event);
        }
      }
      const ex = s0 === s1 ? t * TICK_MS / 1000 : 0; // extrapolation seconds
      const subAt = (a, b) => {
        if (!a && !b) return null;
        if (!a) a = b;
        if (!b) b = a;
        if (ex > 0) return { x: b[0] + b[3] * ex, y: b[1] + b[4] * ex, a: b[2], vx: b[3], vy: b[4] };
        return { x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t), a: lerpAng(a[2], b[2], t), vx: lerp(a[3], b[3], t), vy: lerp(a[4], b[4], t) };
      };
      const me = subAt(s0.me, s1.me);
      me.hp = s1.me[5]; me.en = s1.me[6]; me.boost = s1.me[7]; me.stun = s1.me[8]; me.slow = s1.me[9]; me.lock = s1.me[10]; me.burn = s1.me[11];
      let op = null;
      if (s1.op) {
        op = subAt(s0.op || s1.op, s1.op);
        op.boost = s1.op[5]; op.stun = s1.op[6]; op.slow = s1.op[7]; op.pinged = s1.op[8]; op.burn = s1.op[9];
      }
      const prev = {};
      (s0.pr || []).forEach(p => { prev[p[0]] = p; });
      const pr = (s1.pr || []).map(p => {
        const q = prev[p[0]];
        if (q && ex === 0) return { id: p[0], k: p[1], x: lerp(q[2], p[2], t), y: lerp(q[3], p[3], t), a: lerpAng(q[4], p[4], t), mine: p[5] };
        return { id: p[0], k: p[1], x: p[2], y: p[3], a: p[4], mine: p[5] };
      });
      return { s: s1, me, op, pr };
    },

    // ================================================================ events → effects
    event(e) {
      const [type, x, y, p1, p2] = e;
      const meIdx = B.M.you;
      const me = B.cur && B.cur.me;
      const dist = me ? Math.hypot(x - me.x, y - me.y) : 0;
      const vol = Math.max(0.08, 1 - dist / 1800);
      const pan = me ? Math.max(-1, Math.min(1, (x - me.x) / 900)) : 0;
      switch (type) {
        case 'boom': {
          const size = p1 || 50;
          B.lights.push({ x, y, r: size * 2.4, life: 0.5, max: 0.5, c: '255,190,110' });
          B.rings.push({ x, y, r: 6, vr: size * 5, life: 0.5, max: 0.5, c: '255,230,190', w: 4 });
          for (let i = 0; i < 26; i++) B.bubble(x + (Math.random() - 0.5) * size, y + (Math.random() - 0.5) * size, 2 + Math.random() * 5, (Math.random() - 0.5) * 200, -40 - Math.random() * 160);
          for (let i = 0; i < 14; i++) B.particles.push({ t: 'spark', x, y, vx: (Math.random() - 0.5) * 520, vy: (Math.random() - 0.5) * 520, life: 0.35 + Math.random() * 0.3, max: 0.6, c: '255,200,120', s: 3 });
          B.particles.push({ t: 'smoke', x, y, vx: 0, vy: -20, life: 1.4, max: 1.4, s: size * 0.8 });
          B.shake = Math.max(B.shake, Math.max(0, 1 - dist / 900) * 14);
          DD.sfx.play(size > 70 ? 'boom' : 'smallboom', vol, pan);
          break;
        }
        case 'fire': {
          B.lights.push({ x, y, r: 60, life: 0.12, max: 0.12, c: '255,230,160' });
          const kind = B.M.kinds[p2] || '';
          const snd = { bullet: 'rapid', rail: 'zap', plasma: 'zap', cryo: 'zap', sonic: 'zap', ion: 'zap', tesla: 'zap', vortex: 'zap', pellet: 'heavyshot', mortar: 'heavyshot' }[kind] || 'shot';
          DD.sfx.play(snd, vol * (p1 === meIdx ? 0.55 : 0.8), pan);
          if (kind === 'tesla') B.lights.push({ x, y, r: 120, life: 0.15, max: 0.15, c: '150,230,255' });
          break;
        }
        case 'launch':
          for (let i = 0; i < 10; i++) B.bubble(x, y, 2 + Math.random() * 3, (Math.random() - 0.5) * 80, -20 - Math.random() * 60);
          DD.sfx.play('torp', vol * 0.8, pan);
          break;
        case 'drop':
          for (let i = 0; i < 6; i++) B.bubble(x, y, 2 + Math.random() * 2, (Math.random() - 0.5) * 40, -30);
          DD.sfx.play('click', vol * 0.6, pan);
          break;
        case 'hit': {
          const mine = p2 === meIdx;
          B.texts.push({ x: x + (Math.random() - 0.5) * 20, y, txt: '-' + p1, life: 1.1, max: 1.1, c: mine ? '#ff6b7a' : '#ffe680', big: p1 >= 200 });
          for (let i = 0; i < 8; i++) B.particles.push({ t: 'spark', x, y: y + 20, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 0.3, max: 0.3, c: '255,240,200', s: 2.5 });
          if (mine) { B.hitFlash.me = 1; B.hurtFlash = Math.min(1, 0.35 + p1 / 400); UI.vibrate(Math.min(120, 30 + p1 / 4)); DD.sfx.play('hurt', 0.7); }
          else { B.hitFlash.op = 1; DD.sfx.play('hit', vol, pan); }
          break;
        }
        case 'spark':
          for (let i = 0; i < 5; i++) B.particles.push({ t: 'spark', x, y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 0.25, max: 0.25, c: '200,230,255', s: 2 });
          B.bubble(x, y, 2, 0, -30);
          break;
        case 'ping': {
          const mine = p1 === meIdx;
          B.rings.push({ x, y, r: 10, vr: 1500, life: 1.7, max: 1.7, c: mine ? '80,255,230' : '255,90,110', w: 3, ping: true });
          DD.sfx.play('ping', mine ? 0.8 : 0.6, pan);
          if (!mine) { B.alert('Вас засекли сонаром!', 'red', 2.2); DD.sfx.play('alarm', 0.5); }
          break;
        }
        case 'stun':
          for (let i = 0; i < 14; i++) B.particles.push({ t: 'spark', x, y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.6, max: 0.6, c: '120,240,255', s: 3 });
          B.lights.push({ x, y, r: 160, life: 0.5, max: 0.5, c: '120,240,255' });
          if (p1 === meIdx) B.alert('Системы отключены!', 'blue', 2);
          DD.sfx.play('zap', vol, pan);
          break;
        case 'acid':
          for (let i = 0; i < 12; i++) B.particles.push({ t: 'spark', x, y, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220, life: 0.6, max: 0.6, c: '140,255,90', s: 3.5 });
          if (p1 === meIdx) B.alert('Корпус разъедает кислота!', 'red', 1.5);
          DD.sfx.play('hit', vol, pan);
          break;
        case 'burn':
          B.texts.push({ x: x + (Math.random() - 0.5) * 24, y, txt: '-' + p1, life: 0.9, max: 0.9, c: '#9dff5d', big: false });
          if (Math.random() < 0.6) B.bubble(x, y + 20, 2 + Math.random() * 2, 0, -40);
          break;
        case 'drain':
          for (let i = 0; i < 12; i++) B.particles.push({ t: 'spark', x, y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.5, max: 0.5, c: '160,140,255', s: 3 });
          B.lights.push({ x, y, r: 110, life: 0.3, max: 0.3, c: '150,130,255' });
          if (p1 === meIdx) B.alert('Аккумулятор разряжен!', 'blue', 1.4);
          DD.sfx.play('zap', vol, pan);
          break;
        case 'knock':
          B.rings.push({ x, y, r: 10, vr: 500, life: 0.45, max: 0.45, c: '160,230,255', w: 3 });
          if (p1 === meIdx) { B.shake = Math.max(B.shake, 10); UI.vibrate(60); }
          break;
        case 'freeze':
          for (let i = 0; i < 8; i++) B.particles.push({ t: 'spark', x, y, vx: (Math.random() - 0.5) * 140, vy: (Math.random() - 0.5) * 140, life: 0.7, max: 0.7, c: '200,245,255', s: 3 });
          if (p1 === meIdx) B.alert('Винт заморожен!', 'blue', 1.5);
          break;
        case 'split':
          B.lights.push({ x, y, r: 70, life: 0.2, max: 0.2, c: '220,180,255' });
          DD.sfx.play('click', vol, pan);
          break;
        default: break;
      }
    },

    bubble(x, y, r, vx, vy) {
      if (B.particles.length > 600) return;
      B.particles.push({ t: 'bubble', x, y, vx, vy, life: 1.5 + Math.random(), max: 2.5, s: r });
    },

    alert(text, cls, secs) {
      const el = $('#hud-alert');
      el.textContent = text;
      el.className = 'hud-alert show ' + cls;
      B.alertT = secs;
    },

    // ================================================================ main loop
    frame(ts) {
      B.raf = 0;
      if (!B.active) return;
      B.raf = requestAnimationFrame(B.frame);
      const now = performance.now();
      const dt = B.lastFrame ? Math.min(0.05, (now - B.lastFrame) / 1000) : 0.016;
      B.lastFrame = now;
      B.sendInput(now);
      const cur = B.sample(now);
      if (!cur) return;
      B.cur = cur;
      B.update(dt, cur);
      B.draw(dt, cur, ts / 1000);
      B.hud(dt, cur);
    },

    update(dt, cur) {
      const me = cur.me, op = cur.op;
      const map = B.M.map;
      // camera
      const tx = me.x + me.vx * 0.35, ty = me.y + me.vy * 0.25;
      if (!B.cam.init) { B.cam.x = tx; B.cam.y = ty; B.cam.init = true; }
      const k = 1 - Math.exp(-dt * 5);
      B.cam.x += (tx - B.cam.x) * k;
      B.cam.y += (ty - B.cam.y) * k;
      const hw = B.W / B.scale / 2, hh = B.H / B.scale / 2;
      B.cam.x = Math.max(hw - 120, Math.min(map.w - hw + 120, B.cam.x));
      B.cam.y = Math.max(hh - 140, Math.min(map.h - hh + 60, B.cam.y));
      // propellers & trails
      const sp = Math.hypot(me.vx, me.vy);
      B.prop.me += dt * (4 + sp / 12) * (me.boost ? 1.8 : 1);
      if (Math.random() < dt * (sp / 18 + (me.boost ? 30 : 0))) B.trail(me, B.me.r);
      if (op) {
        const so = Math.hypot(op.vx, op.vy);
        B.prop.op += dt * (4 + so / 12);
        if (Math.random() < dt * (so / 18 + (op.boost ? 30 : 0))) B.trail(op, B.op.r);
        B.opLast = { x: op.x, y: op.y, a: op.a, t: performance.now() };
      }
      // low hp smoke
      const myFrac = me.hp / B.me.maxHp;
      if (myFrac < 0.35 && Math.random() < dt * 8) B.bubble(me.x + (Math.random() - 0.5) * B.me.r, me.y - B.me.r * 0.6, 2 + Math.random() * 3, (Math.random() - 0.5) * 30, -50);
      // torpedo trails
      for (const p of cur.pr) {
        const kind = B.M.kinds[p.k];
        if (kind && kind.startsWith('torp') || kind === 'bomblet' || kind === 'depth') {
          if (Math.random() < dt * 30) B.bubble(p.x - Math.cos(p.a) * 14, p.y - Math.sin(p.a) * 14, 1 + Math.random() * 2.5, (Math.random() - 0.5) * 20, -15 - Math.random() * 20);
        }
      }
      for (const v of B.vents) {
        if (Math.random() < dt * 6) B.bubble(v.x + (Math.random() - 0.5) * 16, B.bedAt(v.x) - 4, 1.5 + Math.random() * 3, (Math.random() - 0.5) * 10, -60 - Math.random() * 40);
      }
      // particles
      for (const p of B.particles) {
        p.life -= dt;
        if (p.t === 'bubble') {
          p.vx *= Math.pow(0.3, dt);
          p.vy += (-90 - p.vy) * dt * 1.5;
          p.x += p.vx * dt + Math.sin(p.life * 6 + p.s) * 0.3;
          p.y += p.vy * dt;
          if (p.y < 4) p.life = 0;
        } else {
          p.vx *= Math.pow(0.05, dt);
          p.vy *= Math.pow(0.05, dt);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.t === 'smoke') p.s += dt * 40;
        }
      }
      B.particles = B.particles.filter(p => p.life > 0);
      for (const l of B.lights) l.life -= dt;
      B.lights = B.lights.filter(l => l.life > 0);
      for (const r of B.rings) { r.life -= dt; r.r += r.vr * dt; if (!r.ping) r.vr *= Math.pow(0.02, dt); }
      B.rings = B.rings.filter(r => r.life > 0);
      for (const t of B.texts) { t.life -= dt; t.y -= 40 * dt; }
      B.texts = B.texts.filter(t => t.life > 0);
      B.hitFlash.me = Math.max(0, B.hitFlash.me - dt * 5);
      B.hitFlash.op = Math.max(0, B.hitFlash.op - dt * 5);
      B.hurtFlash = Math.max(0, B.hurtFlash - dt * 2);
      B.shake = Math.max(0, B.shake - dt * 30);
      if (B.alertT > 0) { B.alertT -= dt; if (B.alertT <= 0) $('#hud-alert').className = 'hud-alert'; }
    },

    trail(sub, r) {
      const back = r * 1.45;
      B.bubble(sub.x - Math.cos(sub.a) * back, sub.y - Math.sin(sub.a) * back, 1 + Math.random() * 3, -Math.cos(sub.a) * 40 + (Math.random() - 0.5) * 30, -Math.sin(sub.a) * 40 - 10);
    },

    bedAt(x) {
      const m = B.M.map;
      const i = Math.max(0, Math.min(m.bed.length - 2, Math.floor(x / m.step)));
      const t = Math.max(0, Math.min(1, (x - i * m.step) / m.step));
      return m.bed[i] * (1 - t) + m.bed[i + 1] * t;
    },

    // ================================================================ drawing
    draw(dt, cur, t) {
      const ctx = B.ctx, map = B.M.map, th = B.theme;
      const W = B.W, H = B.H, dpr = B.dpr, sc = B.scale;
      const sx = (Math.random() - 0.5) * B.shake, sy = (Math.random() - 0.5) * B.shake;
      const ox = W / 2 - B.cam.x * sc + sx, oy = H / 2 - B.cam.y * sc + sy;
      const world = () => ctx.setTransform(sc * dpr, 0, 0, sc * dpr, ox * dpr, oy * dpr);
      const screen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const low = S.settings.quality === 'low';
      const vx0 = B.cam.x - W / sc / 2 - 50, vx1 = B.cam.x + W / sc / 2 + 50;

      // water
      screen();
      const g = ctx.createLinearGradient(0, oy, 0, oy + map.h * sc);
      g.addColorStop(0, th.water[0]);
      g.addColorStop(0.45, th.water[1]);
      g.addColorStop(1, th.water[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // surface band
      if (oy > -40) {
        ctx.fillStyle = 'rgba(200,245,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(0, oy);
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, oy + Math.sin(x * 0.03 + t * 2) * 3 + 4);
        ctx.lineTo(W, 0);
        ctx.lineTo(0, 0);
        ctx.fill();
        if (oy > 0) { ctx.fillStyle = '#9ed8f0'; ctx.fillRect(0, 0, W, oy); }
      }
      // far silhouettes (parallax)
      for (let L = 0; L < 2; L++) {
        const par = L ? 0.6 : 0.35;
        ctx.fillStyle = L ? th.far : th.far.replace(/[\d.]+\)$/, '0.35)');
        const fox = W / 2 - B.cam.x * sc * par, foy = H / 2 - B.cam.y * sc * par + (1 - par) * map.h * sc * 0.5;
        ctx.beginPath();
        ctx.moveTo(fox - 400 * sc, H + 10);
        for (const f of B.far[L]) {
          const x = fox + f.x * sc * par;
          if (x < -400 || x > W + 400) continue;
          const base = foy + map.h * sc * par;
          ctx.lineTo(x, base);
          ctx.lineTo(x + f.w * 0.3 * sc * par, base - f.h * sc * par);
          ctx.lineTo(x + f.w * 0.7 * sc * par, base - f.h * 0.85 * sc * par);
          ctx.lineTo(x + f.w * sc * par, base);
        }
        ctx.lineTo(W + 400, H + 10);
        ctx.fill();
      }
      // light rays
      if (!low) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 7; i++) {
          const x = ((i * 260 - B.cam.x * sc * 0.5) % (W + 400) + W + 400) % (W + 400) - 200 + Math.sin(t * 0.3 + i) * 30;
          const top = Math.max(0, oy);
          const rg = ctx.createLinearGradient(0, top, 0, top + H * 0.9);
          rg.addColorStop(0, 'rgba(170,230,255,0.13)');
          rg.addColorStop(1, 'rgba(170,230,255,0)');
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.moveTo(x - 25, top);
          ctx.lineTo(x + 25, top);
          ctx.lineTo(x + 170, top + H);
          ctx.lineTo(x + 60, top + H);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      // marine snow
      ctx.fillStyle = 'rgba(220,240,255,0.35)';
      for (const p of B.snow) {
        const x = ((p.x - B.cam.x * p.z) * sc + W / 2 + t * 6 * p.z) % W;
        const y = (((p.y - B.cam.y * p.z) * sc + H / 2 + t * 10 * p.z) % H + H) % H;
        ctx.fillRect((x + W) % W, y, p.s, p.s);
      }

      world();
      // sea bed
      const bg = ctx.createLinearGradient(0, map.h - 450, 0, map.h + 100);
      bg.addColorStop(0, th.bed[0]);
      bg.addColorStop(1, th.bed[1]);
      ctx.fillStyle = bg;
      ctx.fill(B.bedPath);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 3;
      ctx.stroke(B.bedPath);
      // plants
      for (const p of B.plants) {
        if (p.x < vx0 || p.x > vx1) continue;
        const by = B.bedAt(p.x) + 4;
        if (p.kind === 'kelp') {
          ctx.strokeStyle = th.plant;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(p.x, by);
          const sw = Math.sin(t * 1.2 + p.ph) * 14;
          ctx.quadraticCurveTo(p.x + sw, by - p.h * 0.5, p.x + sw * 1.6, by - p.h);
          ctx.stroke();
        } else if (p.kind === 'coral') {
          ctx.fillStyle = th.coral[p.c];
          if (th.glow) { ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 2 + p.ph); }
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(p.x + (k - 1) * p.w, by - p.w * (1 + (k % 2)), p.w * 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = th.rock[1];
          ctx.beginPath();
          ctx.ellipse(p.x, by, p.w * 2, p.w, 0, Math.PI, 0);
          ctx.fill();
        }
      }
      for (const v of B.vents) {
        if (v.x < vx0 || v.x > vx1) continue;
        const by = B.bedAt(v.x);
        const vg = ctx.createRadialGradient(v.x, by, 2, v.x, by, 60);
        vg.addColorStop(0, 'rgba(255,120,40,0.6)');
        vg.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = vg;
        ctx.fillRect(v.x - 60, by - 60, 120, 120);
      }
      // rocks
      for (const r of B.rocks) {
        if (r.x + r.r < vx0 || r.x - r.r > vx1) continue;
        const rg = ctx.createLinearGradient(r.x - r.r, r.y - r.r, r.x + r.r, r.y + r.r);
        rg.addColorStop(0, th.rock[0]);
        rg.addColorStop(1, th.rock[1]);
        ctx.fillStyle = rg;
        ctx.fill(r.p);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 3;
        ctx.stroke(r.p);
      }
      // projectiles
      for (const p of cur.pr) B.drawProj(ctx, p, t);
      // subs
      const me = cur.me, op = cur.op;
      const vis = B.me.vision;
      const opInside = op && Math.hypot(op.x - me.x, op.y - me.y) < vis * 0.9;
      const skinOf = (sub) => S.cat.skins[sub.skin] || DD.DEFAULT_SKIN;
      const tierOf = (sub) => DD.subArt.tierOf(sub.hull || 1);
      if (op && opInside) DD.drawSub(ctx, op.x, op.y, op.a, B.op.r, skinOf(B.op), { t, tier: tierOf(B.op), prop: B.prop.op, light: !low, hit: B.hitFlash.op, stun: op.stun, slow: op.slow, burn: op.burn });
      DD.drawSub(ctx, me.x, me.y, me.a, B.me.r, skinOf(B.me), { t, tier: tierOf(B.me), prop: B.prop.me, light: !low, hit: B.hitFlash.me, stun: me.stun, slow: me.slow, burn: me.burn });
      // particles
      for (const p of B.particles) {
        const a = Math.max(0, p.life / p.max);
        if (p.t === 'bubble') {
          ctx.globalAlpha = Math.min(1, a * 1.5) * 0.7;
          ctx.strokeStyle = '#d8f6ff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.t === 'smoke') {
          ctx.globalAlpha = a * 0.35;
          ctx.fillStyle = '#1a2430';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = `rgb(${p.c})`;
          ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
        }
      }
      ctx.globalAlpha = 1;

      // darkness beyond sonar vision
      screen();
      const mx = (me.x - B.cam.x) * sc + W / 2 + sx, my = (me.y - B.cam.y) * sc + H / 2 + sy;
      const dg = ctx.createRadialGradient(mx, my, vis * 0.62 * sc, mx, my, vis * 1.02 * sc);
      dg.addColorStop(0, 'rgba(1,6,16,0)');
      dg.addColorStop(1, 'rgba(1,6,16,0.84)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, 0, W, H);

      // things visible through the dark: lights, enemy contact, projectile lights, rings
      world();
      ctx.globalCompositeOperation = 'lighter';
      for (const l of B.lights) {
        const a = l.life / l.max;
        const lg = ctx.createRadialGradient(l.x, l.y, 1, l.x, l.y, l.r);
        lg.addColorStop(0, `rgba(${l.c},${0.7 * a})`);
        lg.addColorStop(1, `rgba(${l.c},0)`);
        ctx.fillStyle = lg;
        ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      }
      for (const p of cur.pr) {
        const kind = B.M.kinds[p.k];
        const c = p.mine ? '80,255,220' : (kind === 'mine' ? '255,60,60' : '255,220,150');
        const rr = kind && kind.startsWith('torp') ? 26 : 14;
        const lg = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, rr);
        lg.addColorStop(0, `rgba(${c},0.55)`);
        lg.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = lg;
        ctx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (op && !opInside) DD.drawSub(ctx, op.x, op.y, op.a, B.op.r, skinOf(B.op), { t, tier: tierOf(B.op), prop: B.prop.op, hit: B.hitFlash.op, outline: '#ff4d5e', stun: op.stun, slow: op.slow, burn: op.burn });
      for (const r of B.rings) {
        const a = r.life / r.max;
        ctx.strokeStyle = `rgba(${r.c},${a * (r.ping ? 0.7 : 0.8)})`;
        ctx.lineWidth = r.w / (r.ping ? sc : 1);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // screen-space overlays
      screen();
      ctx.textAlign = 'center';
      for (const tx of B.texts) {
        const a = Math.min(1, tx.life / tx.max * 2);
        const px = (tx.x - B.cam.x) * sc + W / 2, py = (tx.y - B.cam.y) * sc + H / 2;
        ctx.globalAlpha = a;
        ctx.font = `900 ${tx.big ? 26 : 18}px Segoe UI, Roboto, sans-serif`;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(tx.txt, px, py);
        ctx.fillStyle = tx.c;
        ctx.fillText(tx.txt, px, py);
      }
      ctx.globalAlpha = 1;
      // enemy name tag
      if (op) {
        const px = (op.x - B.cam.x) * sc + W / 2 + sx, py = (op.y - B.cam.y) * sc + H / 2 + sy - B.op.r * sc * 1.9;
        ctx.font = '800 12px Segoe UI, Roboto, sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.strokeText(B.op.name, px, py);
        ctx.fillStyle = '#ff8a96';
        ctx.fillText(B.op.name, px, py);
        const hpw = 46, f = Math.max(0, cur.s.oh / B.op.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(px - hpw / 2, py + 4, hpw, 5);
        ctx.fillStyle = '#ff4d5e';
        ctx.fillRect(px - hpw / 2, py + 4, hpw * f, 5);
      }
      // off-screen enemy indicator / last known position
      const target = op || (B.opLast && performance.now() - B.opLast.t < 6000 ? B.opLast : null);
      if (target) {
        const px = (target.x - B.cam.x) * sc + W / 2, py = (target.y - B.cam.y) * sc + H / 2;
        const off = px < 20 || px > W - 20 || py < 20 || py > H - 20;
        const fade = op ? 1 : Math.max(0.15, 1 - (performance.now() - B.opLast.t) / 6000);
        if (off) {
          const ang = Math.atan2(py - H / 2, px - W / 2);
          const ex = Math.max(28, Math.min(W - 28, W / 2 + Math.cos(ang) * W));
          const ey = Math.max(70, Math.min(H - 28, H / 2 + Math.sin(ang) * W));
          const cx2 = Math.max(28, Math.min(W - 28, ex)), cy2 = Math.max(70, Math.min(H - 28, ey));
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(cx2, cy2);
          ctx.rotate(ang);
          ctx.fillStyle = op ? '#ff4d5e' : '#ff9aa5';
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-8, -10);
          ctx.lineTo(-8, 10);
          ctx.fill();
          ctx.restore();
          ctx.globalAlpha = fade;
          ctx.font = '800 11px Segoe UI, Roboto, sans-serif';
          ctx.fillStyle = '#ffd0d5';
          ctx.fillText(Math.round(Math.hypot(target.x - me.x, target.y - me.y)) + (op ? '' : ' ?'), cx2 - Math.cos(ang) * 22, cy2 - Math.sin(ang) * 22 + 4);
          ctx.globalAlpha = 1;
        } else if (!op) {
          ctx.globalAlpha = fade * 0.8;
          ctx.strokeStyle = '#ff6b7a';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, B.op.r * sc * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = '900 16px Segoe UI, Roboto, sans-serif';
          ctx.fillStyle = '#ff9aa5';
          ctx.fillText('?', px, py + 6);
          ctx.globalAlpha = 1;
        }
      }
      if (B.hurtFlash > 0) {
        const hg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
        hg.addColorStop(0, 'rgba(255,0,30,0)');
        hg.addColorStop(1, `rgba(255,0,30,${B.hurtFlash * 0.45})`);
        ctx.fillStyle = hg;
        ctx.fillRect(0, 0, W, H);
      }
    },

    drawProj(ctx, p, t) {
      const kind = B.M.kinds[p.k];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      switch (kind) {
        case 'shell':
          ctx.fillStyle = '#ffd36b';
          ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,200,100,0.35)'; ctx.fillRect(-26, -2, 20, 4);
          break;
        case 'bullet':
          ctx.fillStyle = '#fff3c4'; ctx.fillRect(-8, -1.5, 14, 3);
          break;
        case 'pellet':
          ctx.fillStyle = '#ffb86b'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'sonic':
          ctx.strokeStyle = 'rgba(140,255,240,0.85)'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(-12, 0, 22, -0.9, 0.9); ctx.stroke();
          ctx.strokeStyle = 'rgba(140,255,240,0.4)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(-22, 0, 22, -0.8, 0.8); ctx.stroke();
          break;
        case 'cryo':
          ctx.fillStyle = 'rgba(190,245,255,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e8fdff'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'rail':
          ctx.fillStyle = 'rgba(120,230,255,0.4)'; ctx.fillRect(-70, -4, 80, 8);
          ctx.fillStyle = '#e8fbff'; ctx.fillRect(-60, -1.5, 72, 3);
          break;
        case 'plasma': {
          const r = 10 + Math.sin(t * 20) * 2;
          ctx.fillStyle = 'rgba(140,255,120,0.45)'; ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#eaffd9'; ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'mine': {
          ctx.rotate(-p.a + t * 0.5);
          ctx.fillStyle = '#4d5a66';
          for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-1.5, -17, 3, 7); }
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = '#6b7a88'; ctx.fill();
          ctx.strokeStyle = '#1b2733'; ctx.lineWidth = 2; ctx.stroke();
          const blink = Math.sin(t * 8) > 0;
          ctx.fillStyle = p.mine ? (blink ? '#4dffd2' : '#1a8070') : (blink ? '#ff3030' : '#801818');
          ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'twin':
          ctx.fillStyle = '#ffd36b';
          ctx.beginPath(); ctx.ellipse(0, 0, 8, 3.2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,200,100,0.35)'; ctx.fillRect(-22, -1.8, 16, 3.6);
          break;
        case 'mortar': {
          ctx.rotate(-p.a + t * 6);
          const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
          g.addColorStop(0, '#8a96a3'); g.addColorStop(1, '#262d36');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = Math.sin(t * 20) > 0 ? '#ffb03b' : '#ff5a1f'; ctx.beginPath(); ctx.arc(5, -5, 2.2, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'acid':
          ctx.fillStyle = 'rgba(140,255,90,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#9dff5d'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#eaffd9'; ctx.beginPath(); ctx.arc(2, -1.5, 1.8, 0, Math.PI * 2); ctx.fill();
          break;
        case 'ion':
          ctx.fillStyle = 'rgba(150,130,255,0.4)'; ctx.beginPath(); ctx.ellipse(-6, 0, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e6e0ff'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
          break;
        case 'vortex':
          ctx.rotate(t * 14);
          ctx.strokeStyle = 'rgba(170,235,255,0.9)'; ctx.lineWidth = 3;
          for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.arc(0, 0, 12, 0, 1.6); ctx.stroke(); }
          ctx.fillStyle = 'rgba(200,245,255,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'tesla': {
          ctx.strokeStyle = 'rgba(150,230,255,0.55)'; ctx.lineWidth = 6;
          const zig = () => { ctx.beginPath(); ctx.moveTo(8, 0); for (let i = 1; i <= 6; i++) ctx.lineTo(8 - i * 12, (Math.random() - 0.5) * 14); ctx.stroke(); };
          zig();
          ctx.strokeStyle = '#f2fdff'; ctx.lineWidth = 2; zig();
          break;
        }
        case 'depth': {
          ctx.rotate(-p.a + Math.sin(t * 3 + p.id) * 0.3);
          ctx.fillStyle = '#5d6b78'; ctx.fillRect(-8, -11, 16, 22);
          ctx.fillStyle = '#ffd34d'; ctx.fillRect(-8, -7, 16, 3); ctx.fillRect(-8, 4, 16, 3);
          ctx.strokeStyle = '#1b2733'; ctx.lineWidth = 1.5; ctx.strokeRect(-8, -11, 16, 22);
          ctx.fillStyle = Math.sin(t * 9) > 0 ? (p.mine ? '#4dffd2' : '#ff3030') : '#401010';
          ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
          break;
        }
        default: {
          // torpedoes
          const heavy = kind === 'torp_heavy';
          const small = kind === 'bomblet' || kind === 'torp_swarm';
          const L = heavy ? 34 : kind === 'torp_shkval' ? 32 : small ? 16 : 26, Hh = heavy ? 9 : kind === 'torp_shkval' ? 5.5 : small ? 4.6 : 6.5;
          const tip = { torp: '#d9372b', torp_fast: '#ffd34d', torp_homing: '#ff6b3d', torp_cluster: '#b46cff', torp_heavy: '#d9372b', torp_emp: '#3dfcff', bomblet: '#b46cff', torp_net: '#3fd26b', torp_ghost: '#c9a8ff', torp_swarm: '#ff8a3d', torp_shkval: '#ffd34d' }[kind] || '#d9372b';
          if (kind === 'torp_ghost') ctx.globalAlpha = p.mine ? 0.55 : 0.4;
          if (kind === 'torp_shkval') { ctx.fillStyle = 'rgba(230,250,255,0.35)'; ctx.beginPath(); ctx.ellipse(-4, 0, L / 2 + 14, Hh + 6, 0, 0, Math.PI * 2); ctx.fill(); }
          const tg = ctx.createLinearGradient(0, -Hh, 0, Hh);
          tg.addColorStop(0, '#eef4f8'); tg.addColorStop(0.45, '#9fb0c0'); tg.addColorStop(1, '#46535f');
          ctx.fillStyle = tg;
          ctx.beginPath();
          ctx.ellipse(0, 0, L / 2, Hh, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = tip;
          ctx.fillRect(-L * 0.12, -Hh, 2.5, Hh * 2);
          ctx.beginPath();
          ctx.ellipse(L / 2 - Hh * 0.6, 0, Hh * 0.9, Hh * 0.9, 0, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
          ctx.fillStyle = '#5d7084';
          ctx.fillRect(-L / 2 - 3, -Hh - 2, 5, Hh * 2 + 4);
          if (kind === 'torp_emp') {
            ctx.strokeStyle = 'rgba(120,240,255,0.8)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, L / 2 + 4 + Math.sin(t * 15) * 2, 0, Math.PI * 2); ctx.stroke();
          }
          if (kind === 'torp_homing' && Math.sin(t * 12) > 0) {
            ctx.fillStyle = '#ff2020'; ctx.beginPath(); ctx.arc(L / 2 - 2, 0, 2.5, 0, Math.PI * 2); ctx.fill();
          }
          if (!p.mine) { ctx.strokeStyle = 'rgba(255,80,90,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, L / 2 + 2, Hh + 2, 0, 0, Math.PI * 2); ctx.stroke(); }
        }
      }
      ctx.restore();
    },

    // ================================================================ HUD
    hud(dt, cur) {
      const s = cur.s;
      const me = cur.me;
      const setW = (el, v) => { const w = Math.max(0, Math.min(100, v)).toFixed(1) + '%'; if (el._w !== w) { el.style.width = w; el._w = w; } };
      const setT = (el, v) => { if (el._t !== v) { el.textContent = v; el._t = v; } };
      B.$ = B.$ || {
        mhp: $('#hud-me-hp'), mht: $('#hud-me-hpt'), men: $('#hud-me-en'), ohp: $('#hud-op-hp'), oht: $('#hud-op-hpt'),
        timer: $('#hud-timer'), count: $('#hud-count'), fire: $('#ctl-fire circle'), sonarFill: $('#ctl-sonar .cdfill'), sonar: $('#ctl-sonar'),
        boost: $('#ctl-boost'), enbar: $('.bar.en'), ping: $('#hud-ping'),
      };
      const h = B.$;
      setW(h.mhp, me.hp / B.me.maxHp * 100);
      setT(h.mht, Math.max(0, Math.round(me.hp)) + ' / ' + Math.round(B.me.maxHp));
      setW(h.men, me.en);
      h.enbar.classList.toggle('lock', !!me.lock);
      setW(h.ohp, s.oh / B.op.maxHp * 100);
      setT(h.oht, Math.max(0, Math.round(s.oh)) + ' / ' + Math.round(B.op.maxHp));
      const tm = Math.ceil(s.tm);
      setT(h.timer, Math.floor(tm / 60) + ':' + String(tm % 60).padStart(2, '0'));
      h.timer.classList.toggle('low', tm <= 20 && s.ph === 1);
      setT(h.ping, DD.net.latency + ' мс');
      // countdown
      if (s.ph === 0) {
        const n = Math.ceil(s.cd);
        if (n !== B.lastCount && n > 0 && n <= 3) {
          B.lastCount = n;
          h.count.textContent = n;
          h.count.classList.remove('show');
          void h.count.offsetWidth;
          h.count.classList.add('show');
          DD.sfx.play('count', 0.6);
        }
      } else if (B.lastPhase === 0 && s.ph === 1) {
        h.count.textContent = 'В БОЙ!';
        h.count.classList.remove('show');
        void h.count.offsetWidth;
        h.count.classList.add('show');
        DD.sfx.play('go', 0.7);
        setTimeout(() => h.count.classList.remove('show'), 900);
      }
      B.lastPhase = s.ph;
      // cooldowns
      const gc = s.gc && s.gc.length ? Math.min.apply(null, s.gc) : 0;
      h.fire.style.strokeDashoffset = String(283 * (1 - gc));
      (s.tc || []).forEach((v, i) => {
        const b = B.torpBtns && B.torpBtns[i];
        if (!b) return;
        const fill = b.querySelector('.cdfill'), num = b.querySelector('.cdnum');
        fill.style.height = (v * 100).toFixed(0) + '%';
        b.classList.toggle('cooling', v > 0);
        const w = S.cat.weapons[B.me.torps[i]];
        const secs = w ? Math.ceil(v * w.cd) : 0;
        setT(num, v > 0 ? String(secs) : '');
      });
      h.sonarFill.style.height = (s.sc * 100).toFixed(0) + '%';
      h.sonar.classList.toggle('cooling', s.sc > 0);
      h.boost.classList.toggle('cooling', !!me.lock || me.en < 5);
      if (s.det && B.alertT <= 0) B.alert('Вы обнаружены!', 'red', 0.5);
      if (!B._mm || performance.now() - B._mm > 120) { B._mm = performance.now(); B.minimap(cur); }
    },

    minimap(cur) {
      const c = B.mctx, map = B.M.map;
      const w = B.mini.width, h = B.mini.height;
      const kx = w / map.w, ky = h / map.h;
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(120,180,220,0.35)';
      c.beginPath();
      c.moveTo(0, h);
      map.bed.forEach((y, i) => c.lineTo(i * map.step * kx, y * ky));
      c.lineTo(w, h);
      c.fill();
      c.fillStyle = 'rgba(120,180,220,0.45)';
      for (const r of map.rocks) { c.beginPath(); c.arc(r[0] * kx, r[1] * ky, Math.max(2, r[2] * kx), 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 1;
      c.strokeRect((B.cam.x - B.W / B.scale / 2) * kx, (B.cam.y - B.H / B.scale / 2) * ky, B.W / B.scale * kx, B.H / B.scale * ky);
      c.strokeStyle = 'rgba(80,255,230,0.3)';
      c.beginPath();
      c.arc(cur.me.x * kx, cur.me.y * ky, B.me.vision * kx, 0, Math.PI * 2);
      c.stroke();
      const dot = (x, y, col, r) => { c.fillStyle = col; c.beginPath(); c.arc(x * kx, y * ky, r, 0, Math.PI * 2); c.fill(); };
      dot(cur.me.x, cur.me.y, '#4dff9a', 3.5);
      if (cur.op) dot(cur.op.x, cur.op.y, '#ff4d5e', 3.5);
      else if (B.opLast && performance.now() - B.opLast.t < 6000) dot(B.opLast.x, B.opLast.y, 'rgba(255,120,130,0.45)', 3);
    },
  };

  DD.battle = B;
})();
