/* Submarine art (detailed SVG rendered once per skin and hull tier) + animated preview stages for menus. */
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
  function drawSubProcedural(ctx, x, y, angle, r, skin, o) {
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


  // ---------------------------------------------------------------- detailed SVG art
  // Coordinates of the art (viewBox 0 0 320 160): hull from x=34 to x=308, centre (171, 80).
  const ART_W = 320, ART_H = 160, ART_CX = 171, ART_CY = 80, ART_LEN = 274, ART_RES = 1.6, ART_SCALE = 2.8;
  const HULL = 'M74,46 H246 C284,46 306,64 308,80 C306,96 284,114 246,114 H74 C50,114 34,100 34,80 C34,60 50,46 74,46 Z';

  function tierOf(hullLevel) { return hullLevel >= 7 ? 3 : hullLevel >= 4 ? 2 : 1; }

  function subSvg(skin, tier) {
    const H = skin.hull, D = skin.dark, A = skin.accent, G = skin.glow;
    const st = tier >= 3 ? 9 : 12; // sail top
    const fin = tier >= 3 ? 8 : 14;
    const rivets = [];
    for (let x = 84; x <= 276; x += 12) { rivets.push(`<circle cx="${x}" cy="60" r="1.5"/>`); rivets.push(`<circle cx="${x + 6}" cy="105" r="1.5"/>`); }
    const panels = [100, 132, 164, 196, 228, 260].map(x => `<path d="M${x},46 V114"/>`).join('');
    let extra = '', deck = '';
    if (tier >= 2) {
      extra += [82, 138, 194].map(x => `<rect x="${x}" y="101" width="52" height="12" rx="3" fill="${shade(D, -0.2)}" stroke="#0007" stroke-width="1"/>
        <circle cx="${x + 6}" cy="107" r="1.8" fill="#ffffff66"/><circle cx="${x + 46}" cy="107" r="1.8" fill="#ffffff66"/>`).join('');
      deck += `<ellipse cx="104" cy="46" rx="15" ry="4" fill="url(#mt)"/><path d="M93,46 Q93,32 104,32 Q115,32 115,46 Z" fill="url(#sl)" stroke="#0008" stroke-width="1.3"/>
        <rect x="112" y="35" width="26" height="5" rx="2.5" fill="url(#mt)" stroke="#0008" stroke-width="1"/><circle cx="104" cy="38" r="2.4" fill="${G}"/>`;
    }
    if (tier >= 3) {
      deck += [74, 84, 122, 132].map(x => `<rect x="${x}" y="41.5" width="8" height="5" rx="1" fill="${shade(D, -0.3)}" stroke="#0008" stroke-width="0.8"/>`).join('');
      extra += `<rect x="54" y="46" width="6" height="68" fill="${A}" opacity="0.95"/><rect x="63" y="46" width="3" height="68" fill="${G}" opacity="0.85"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${ART_W * ART_RES}" height="${ART_H * ART_RES}" viewBox="0 0 ${ART_W} ${ART_H}">
<defs>
 <linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(H, 0.55)}"/><stop offset="0.15" stop-color="${shade(H, 0.28)}"/><stop offset="0.48" stop-color="${H}"/><stop offset="0.8" stop-color="${D}"/><stop offset="1" stop-color="${shade(D, -0.5)}"/></linearGradient>
 <linearGradient id="sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(H, 0.45)}"/><stop offset="0.45" stop-color="${H}"/><stop offset="1" stop-color="${D}"/></linearGradient>
 <linearGradient id="fn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(D, -0.3)}"/><stop offset="1" stop-color="${shade(H, -0.12)}"/></linearGradient>
 <linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8fb"/><stop offset="0.5" stop-color="#9aa8b6"/><stop offset="1" stop-color="#4b5866"/></linearGradient>
 <radialGradient id="gl" cx="0.35" cy="0.35" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="${G}"/><stop offset="1" stop-color="${shade(G, -0.55)}"/></radialGradient>
 <linearGradient id="sp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.65"/><stop offset="0.75" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <clipPath id="hc"><path d="${HULL}"/></clipPath>
</defs>
<path d="M70,50 L48,${fin + 4} Q46,${fin} 51,${fin} L63,${fin} Q67,${fin} 69,${fin + 5} L92,48 Z" fill="url(#fn)" stroke="#0008" stroke-width="1.6"/>
<path d="M70,110 L48,${160 - fin - 4} Q46,${160 - fin} 51,${160 - fin} L63,${160 - fin} Q67,${160 - fin} 69,${160 - fin - 5} L92,112 Z" fill="url(#fn)" stroke="#0008" stroke-width="1.6"/>
<path d="M34,70 L24,73.5 Q20,80 24,86.5 L34,90 Z" fill="url(#mt)" stroke="#0008" stroke-width="1.2"/>
<path d="M${134 - (tier >= 3 ? 4 : 0)},48 L145,${st + 7} Q147,${st} 155,${st} H195 Q202,${st} 204,${st + 7} L${216 + (tier >= 3 ? 4 : 0)},48 Z" fill="url(#sl)" stroke="#0009" stroke-width="1.7"/>
<path d="M147,${st + 5} Q149,${st + 2} 156,${st + 2} H194 Q199,${st + 2} 201,${st + 6}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="2.2"/>
${[157, 170, 183].map(x => `<rect x="${x}" y="${st + 10}" width="10" height="6.5" rx="3" fill="url(#gl)" stroke="#0008" stroke-width="0.9"/>`).join('')}
${tier >= 3 ? `<rect x="148" y="${st + 22}" width="52" height="3" rx="1.5" fill="${A}"/>` : ''}
<path d="M198,${st + 20} L236,${st + 15} Q242,${st + 16} 236,${st + 21.5} L200,${st + 26} Z" fill="url(#fn)" stroke="#0008" stroke-width="1.2"/>
<path d="M166,${st} V${st - 8} H176" fill="none" stroke="#3b4652" stroke-width="2.8" stroke-linecap="round"/>
<path d="M187,${st} L191,${st - 7}" stroke="#3b4652" stroke-width="1.8"/>
<circle cx="191" cy="${st - 7}" r="2.4" fill="#ff5050"/>
${deck}
<path d="${HULL}" fill="url(#hl)"/>
<g clip-path="url(#hc)">
 <rect x="20" y="92" width="300" height="9" fill="${A}"/>
 <rect x="20" y="101" width="300" height="2" fill="#0005"/>
 <g stroke="#0003" stroke-width="1.3" fill="none">${panels}<path d="M34,62 H308 M34,104 H308"/></g>
 <g fill="#0004">${rivets.join('')}</g>
 ${extra}
 <ellipse cx="292" cy="78" rx="26" ry="34" fill="#fff" opacity="0.08"/>
 <rect x="62" y="50" width="214" height="7" rx="3.5" fill="url(#sp)"/>
 <rect x="30" y="106" width="290" height="12" fill="#000" opacity="0.3"/>
</g>
<path d="${HULL}" fill="none" stroke="#000" stroke-opacity="0.6" stroke-width="2.2"/>
<path d="M80,47.5 H244" stroke="#fff" stroke-opacity="0.35" stroke-width="1.1"/>
<rect x="112" y="41.5" width="18" height="5.5" rx="2" fill="${shade(D, -0.2)}" stroke="#0008" stroke-width="0.8"/>
<rect x="238" y="43" width="12" height="4.5" rx="1.5" fill="${shade(D, -0.2)}" stroke="#0008" stroke-width="0.8"/>
<path d="M244,60 L272,53 Q278,53 274,58.5 L248,66 Z" fill="url(#fn)" stroke="#0008" stroke-width="1.1"/>
${[212, 230, 248].map(x => `<circle cx="${x}" cy="77" r="8" fill="url(#mt)" stroke="#0009" stroke-width="1.1"/><circle cx="${x}" cy="77" r="5.6" fill="url(#gl)"/><circle cx="${x - 2}" cy="74.8" r="1.6" fill="#fff" opacity="0.9"/>`).join('')}
<ellipse cx="292" cy="74" rx="7" ry="11" fill="url(#gl)" stroke="#0009" stroke-width="1.1"/>
<circle cx="304" cy="90" r="2.8" fill="#fff" opacity="0.9"/>
</svg>`;
  }

  const artCache = {};
  function getArt(skin, tier) {
    skin = skin || DEFAULT_SKIN;
    const key = (skin.id || 'default') + ':' + tier;
    let a = artCache[key];
    if (a) return a;
    a = artCache[key] = { ready: false, tints: {} };
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = ART_W * ART_RES;
      c.height = ART_H * ART_RES;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      a.canvas = c;
      a.ready = true;
    };
    img.onerror = () => { a.failed = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(subSvg(skin, tier));
    return a;
  }

  /** Silhouette of the art filled with one colour (hit flash, ice, acid, enemy outline). */
  function tint(a, color) {
    let c = a.tints[color];
    if (c) return c;
    c = document.createElement('canvas');
    c.width = a.canvas.width;
    c.height = a.canvas.height;
    const x = c.getContext('2d');
    x.drawImage(a.canvas, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    a.tints[color] = c;
    return c;
  }

  function drawSub(ctx, x, y, angle, r, skin, o) {
    o = o || {};
    skin = skin || DEFAULT_SKIN;
    const a = getArt(skin, o.tier || 1);
    if (!a.ready) return drawSubProcedural(ctx, x, y, angle, r, skin, o);
    const k = r * ART_SCALE / ART_LEN;
    const t = o.t || 0;
    const dx = -ART_CX * k, dy = -ART_CY * k, dw = ART_W * k, dh = ART_H * k;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (Math.cos(angle) < 0) ctx.scale(1, -1);
    const baseAlpha = o.alpha != null ? o.alpha : 1;
    ctx.globalAlpha = baseAlpha;
    const nose = (308 - ART_CX) * k;
    if (o.light) {
      const g = ctx.createRadialGradient(nose, 0, 4, nose, 0, r * 8.5);
      g.addColorStop(0, rgba(skin.glow, 0.34));
      g.addColorStop(1, rgba(skin.glow, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(nose - 2, -r * 0.12);
      ctx.lineTo(nose + r * 8.5, -r * 2.8);
      ctx.lineTo(nose + r * 8.5, r * 2.8);
      ctx.lineTo(nose - 2, r * 0.12);
      ctx.closePath();
      ctx.fill();
    }
    if (o.outline) {
      ctx.globalAlpha = baseAlpha * (0.55 + 0.45 * Math.sin(t * 8));
      const s = 1.1;
      ctx.drawImage(tint(a, o.outline), dx * s, dy * s, dw * s, dh * s);
      ctx.globalAlpha = baseAlpha;
    }
    ctx.drawImage(a.canvas, dx, dy, dw, dh);
    // propeller (animated)
    const px = (22 - ART_CX) * k;
    const bladeH = 40 * k;
    for (let b = 0; b < 2; b++) {
      const sn = Math.sin((o.prop || 0) + b * Math.PI / 2);
      ctx.fillStyle = b ? '#7f8d9b' : '#c9d3dc';
      ctx.beginPath();
      ctx.ellipse(px, 0, 4 * k, Math.max(1, bladeH * Math.abs(sn)), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5a6876';
    ctx.beginPath();
    ctx.arc(px + 2 * k, 0, 5 * k, 0, Math.PI * 2);
    ctx.fill();
    if (o.slow) { ctx.globalAlpha = baseAlpha * 0.45; ctx.drawImage(tint(a, '#bff3ff'), dx, dy, dw, dh); }
    if (o.burn) { ctx.globalAlpha = baseAlpha * (0.25 + 0.15 * Math.sin(t * 10)); ctx.drawImage(tint(a, '#7dff4d'), dx, dy, dw, dh); }
    if (o.hit > 0) { ctx.globalAlpha = baseAlpha * Math.min(1, o.hit) * 0.7; ctx.drawImage(tint(a, '#ffffff'), dx, dy, dw, dh); }
    ctx.globalAlpha = baseAlpha;
    if (o.stun) {
      const L = r * 2.6, Hh = r * 0.9;
      ctx.strokeStyle = 'rgba(140,240,255,0.9)';
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      for (let n = 0; n < 3; n++) {
        ctx.beginPath();
        let ax = -L / 2 + Math.random() * L, ay = (Math.random() - 0.5) * Hh * 1.6;
        ctx.moveTo(ax, ay);
        for (let q = 0; q < 4; q++) { ax += (Math.random() - 0.5) * r; ay += (Math.random() - 0.5) * r; ctx.lineTo(ax, ay); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- animated preview stages
  const stages = new Set();
  let raf = 0;
  let lastStage = 0;
  function loop(ts) {
    raf = 0;
    if (ts - lastStage < 32) { raf = requestAnimationFrame(loop); return; } // menus: ~30 fps is enough
    lastStage = ts;
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
    setSize(hullLevel) { this.size = 1 + (hullLevel - 1) * 0.053; this.tier = tierOf(hullLevel); }
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
      drawSub(ctx, cx, cy, ang, r, this.skin, { t, prop: this.prop, light: false, tier: this.tier || 1 });
    }
  }

  DD.drawSub = drawSub;
  DD.subArt = { get: getArt, tierOf, svg: subSvg };
  DD.SubStage = SubStage;
  DD.color = { shade, rgba };
  DD.DEFAULT_SKIN = DEFAULT_SKIN;
})();
