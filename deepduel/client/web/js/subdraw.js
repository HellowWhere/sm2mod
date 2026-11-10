/* Procedural submarine drawing + animated preview stages for menus. */
window.DD = window.DD || {};
(function () {
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, f) {
    const [r, g, b] = hexToRgb(hex);
    const m = (c) => Math.max(0, Math.min(255, Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f))));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  }
  function rgba(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  const DEFAULT_SKIN = { hull: '#f2b632', dark: '#8a5a12', accent: '#e85d2a', glow: '#fff2a8' };

  /**
   * Draws a submarine centred at (x, y), nose pointing along `angle`.
   * r = collision radius in px; the hull is about 2.6 r long.
   */
  function drawSub(ctx, x, y, angle, r, skin, o) {
    o = o || {};
    skin = skin || DEFAULT_SKIN;
    const L = r * 2.6, H = r * 0.92;
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (Math.cos(angle) < 0) ctx.scale(1, -1);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;

    if (o.light) {
      const g = ctx.createRadialGradient(L * 0.5, 0, 4, L * 0.5, 0, L * 3.2);
      g.addColorStop(0, rgba(skin.glow, 0.32));
      g.addColorStop(1, rgba(skin.glow, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(L * 0.48, -H * 0.12);
      ctx.lineTo(L * 3.4, -L * 1.05);
      ctx.lineTo(L * 3.4, L * 1.05);
      ctx.lineTo(L * 0.48, H * 0.12);
      ctx.closePath();
      ctx.fill();
    }

    // propeller
    const px = -L / 2 - r * 0.08;
    const ph = o.prop || 0;
    ctx.fillStyle = '#2a3440';
    ctx.fillRect(px, -H * 0.08, r * 0.2, H * 0.16);
    const bladeH = H * 0.85;
    for (let k = 0; k < 2; k++) {
      const s = Math.sin(ph + k * Math.PI / 2);
      ctx.fillStyle = k ? '#8d9aa8' : '#c4ced8';
      ctx.beginPath();
      ctx.ellipse(px - r * 0.04, 0, r * 0.1, Math.max(1, bladeH * 0.5 * Math.abs(s)), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#4a5866';
    ctx.beginPath();
    ctx.arc(px, 0, r * 0.11, 0, Math.PI * 2);
    ctx.fill();

    // tail fins
    ctx.fillStyle = shade(skin.hull, -0.35);
    ctx.beginPath();
    ctx.moveTo(-L * 0.36, -H * 0.38);
    ctx.lineTo(-L * 0.5, -H * 0.98);
    ctx.lineTo(-L * 0.47, -H * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-L * 0.36, H * 0.38);
    ctx.lineTo(-L * 0.5, H * 0.98);
    ctx.lineTo(-L * 0.47, H * 0.3);
    ctx.closePath();
    ctx.fill();

    // sail / conning tower
    const sg = ctx.createLinearGradient(0, -H * 1.1, 0, -H * 0.4);
    sg.addColorStop(0, shade(skin.hull, 0.25));
    sg.addColorStop(1, shade(skin.hull, -0.25));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-L * 0.14, -H * 0.42);
    ctx.lineTo(-L * 0.09, -H * 1.04);
    ctx.quadraticCurveTo(L * 0.02, -H * 1.12, L * 0.12, -H * 1.04);
    ctx.lineTo(L * 0.2, -H * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.stroke();
    ctx.strokeStyle = '#3b4652';
    ctx.lineWidth = Math.max(1.2, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(L * 0.03, -H * 1.06);
    ctx.lineTo(L * 0.03, -H * 1.42);
    ctx.lineTo(L * 0.1, -H * 1.42);
    ctx.stroke();
    ctx.fillStyle = shade(skin.hull, -0.4);
    ctx.fillRect(-L * 0.02, -H * 0.82, L * 0.16, H * 0.07);

    // hull
    const hull = new Path2D();
    hull.moveTo(-L / 2 + H / 2, -H / 2);
    hull.lineTo(L / 2 - H * 0.75, -H / 2);
    hull.bezierCurveTo(L / 2 - H * 0.1, -H / 2, L / 2 + H * 0.05, -H * 0.12, L / 2, 0);
    hull.bezierCurveTo(L / 2 + H * 0.05, H * 0.12, L / 2 - H * 0.1, H / 2, L / 2 - H * 0.75, H / 2);
    hull.lineTo(-L / 2 + H / 2, H / 2);
    hull.arc(-L / 2 + H / 2, 0, H / 2, Math.PI / 2, Math.PI * 1.5);
    hull.closePath();
    const hg = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
    hg.addColorStop(0, shade(skin.hull, 0.35));
    hg.addColorStop(0.42, skin.hull);
    hg.addColorStop(1, skin.dark);
    ctx.fillStyle = hg;
    ctx.fill(hull);
    ctx.save();
    ctx.clip(hull);
    ctx.fillStyle = skin.accent;
    ctx.fillRect(-L * 0.5, H * 0.1, L, H * 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-L * 0.5, -H * 0.38, L, H * 0.1);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let k = -2; k <= 2; k++) ctx.fillRect(k * L * 0.15 - 0.5, -H / 2, Math.max(1, r * 0.03), H);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.stroke(hull);

    // portholes
    ctx.save();
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = r * 0.35;
    ctx.fillStyle = skin.glow;
    for (const fx of [0.04, 0.17, 0.3]) {
      ctx.beginPath();
      ctx.arc(L * fx, -H * 0.06, H * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = Math.max(1, r * 0.035);
    for (const fx of [0.04, 0.17, 0.3]) {
      ctx.beginPath();
      ctx.arc(L * fx, -H * 0.06, H * 0.1, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (o.slow) {
      ctx.fillStyle = 'rgba(190,240,255,0.45)';
      ctx.fill(hull);
    }
    if (o.hit > 0) {
      ctx.globalAlpha = Math.min(1, o.hit) * 0.7 * (o.alpha != null ? o.alpha : 1);
      ctx.fillStyle = '#fff';
      ctx.fill(hull);
      ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    }
    if (o.stun) {
      ctx.strokeStyle = 'rgba(140,240,255,0.9)';
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        let ax = -L / 2 + Math.random() * L, ay = (Math.random() - 0.5) * H * 1.6;
        ctx.moveTo(ax, ay);
        for (let s = 0; s < 4; s++) {
          ax += (Math.random() - 0.5) * r;
          ay += (Math.random() - 0.5) * r;
          ctx.lineTo(ax, ay);
        }
        ctx.stroke();
      }
    }
    if (o.outline) {
      ctx.strokeStyle = o.outline;
      ctx.lineWidth = Math.max(2, r * 0.08);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.stroke(hull);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- animated preview stages
  const stages = new Set();
  let raf = 0;
  function loop(ts) {
    raf = 0;
    const t = ts / 1000;
    let any = false;
    stages.forEach(s => {
      if (!s.canvas.isConnected || s.canvas.offsetParent === null) return;
      any = true;
      s.draw(t);
    });
    if (stages.size) raf = requestAnimationFrame(loop);
    if (!any && !stages.size) raf = 0;
  }

  class SubStage {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.skin = DEFAULT_SKIN;
      this.size = 1;
      this.opts = Object.assign({ water: true, scale: 1 }, opts || {});
      this.bubbles = [];
      this.prop = 0;
      this.last = 0;
      stages.add(this);
      if (!raf) raf = requestAnimationFrame(loop);
    }
    setSkin(s) { if (s) this.skin = s; }
    setSize(hullLevel) { this.size = 1 + (hullLevel - 1) * 0.053; }
    destroy() { stages.delete(this); }
    draw(t) {
      const c = this.canvas, ctx = this.ctx;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth, h = c.clientHeight;
      if (!w || !h) return;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const dt = this.last ? Math.min(0.05, t - this.last) : 0.016;
      this.last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (this.opts.water) {
        for (let i = 0; i < 4; i++) {
          const x = w * (0.15 + i * 0.25) + Math.sin(t * 0.3 + i) * 20;
          const g = ctx.createLinearGradient(x, 0, x + 40, h);
          g.addColorStop(0, 'rgba(160,230,255,0.12)');
          g.addColorStop(1, 'rgba(160,230,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x - 18, 0);
          ctx.lineTo(x + 18, 0);
          ctx.lineTo(x + 70, h);
          ctx.lineTo(x - 10, h);
          ctx.fill();
        }
      }
      const base = Math.min(w / 3.4, h / 2.3) * this.opts.scale;
      const r = base / 1.35 * this.size * 0.82;
      const cx = w / 2, cy = h * 0.52 + Math.sin(t * 1.3) * h * 0.025;
      const ang = Math.sin(t * 0.7) * 0.05;
      this.prop += dt * 9;
      if (Math.random() < dt * 14) {
        this.bubbles.push({ x: cx - r * 1.45, y: cy + (Math.random() - 0.5) * r * 0.5, r: 1 + Math.random() * 3.5, vy: 20 + Math.random() * 30, life: 2.5 });
      }
      ctx.save();
      for (const b of this.bubbles) {
        b.life -= dt;
        b.y -= b.vy * dt;
        b.x -= 18 * dt + Math.sin(t * 3 + b.r) * 0.3;
        ctx.globalAlpha = Math.max(0, Math.min(1, b.life)) * 0.6;
        ctx.strokeStyle = '#bfefff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      this.bubbles = this.bubbles.filter(b => b.life > 0 && b.y > -10);
      const sh = ctx.createRadialGradient(cx, cy + r * 1.6, 2, cx, cy + r * 1.6, r * 2.2);
      sh.addColorStop(0, 'rgba(0,0,0,0.35)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sh;
      ctx.fillRect(cx - r * 3, cy + r * 0.8, r * 6, r * 1.8);
      drawSub(ctx, cx, cy, ang, r, this.skin, { t, prop: this.prop, light: false });
    }
  }

  DD.drawSub = drawSub;
  DD.SubStage = SubStage;
  DD.color = { shade, rgba };
  DD.DEFAULT_SKIN = DEFAULT_SKIN;
})();
