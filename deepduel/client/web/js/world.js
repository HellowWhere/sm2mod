/*
 * Pre-rendered battle art. Everything static (sea bed with all its details, rocks, mine and
 * torpedo bodies) is drawn ONCE into off-screen canvases when a battle starts; every frame then
 * only copies the visible part. Lots of detail at almost no per-frame cost on the phone.
 */
window.DD = window.DD || {};
(function () {
  function rnd(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
  }
  const sh = (hex, f) => DD.color.shade(hex, f);
  const rgba = (hex, a) => DD.color.rgba(hex, a);

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  function bedAt(map, x) {
    const i = Math.max(0, Math.min(map.bed.length - 2, Math.floor(x / map.step)));
    const t = Math.max(0, Math.min(1, (x - i * map.step) / map.step));
    return map.bed[i] * (1 - t) + map.bed[i + 1] * t;
  }

  function irregular(ctx, x, y, r, rr, n, flatBottom) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      let k = r * (0.84 + rr() * 0.3);
      let py = y + Math.sin(a) * k;
      if (flatBottom && py > y) py = y + (py - y) * 0.35;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * k, py);
      else ctx.lineTo(x + Math.cos(a) * k, py);
    }
    ctx.closePath();
  }

  function star(ctx, x, y, r, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 - Math.PI / 2;
      const k = i % 2 ? r * 0.42 : r;
      ctx.lineTo(Math.cos(a) * k, Math.sin(a) * k);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r);
    g.addColorStop(0, sh(color, 0.35));
    g.addColorStop(1, sh(color, -0.35));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function urchin(ctx, x, y, r, rr) {
    ctx.strokeStyle = '#1b1426';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 22; i++) {
      const a = Math.PI + (i / 21) * Math.PI;
      const l = r * (1.4 + rr() * 0.8);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 1, x, y, r);
    g.addColorStop(0, '#6b4a7a');
    g.addColorStop(1, '#1e1228');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, 0);
    ctx.fill();
  }

  function shell(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const g = ctx.createLinearGradient(0, -r, 0, r * 0.3);
    g.addColorStop(0, '#fff1df');
    g.addColorStop(1, '#d99a6c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.25);
    ctx.arc(0, r * 0.25, r, Math.PI * 1.1, Math.PI * 1.9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,30,0.6)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i <= 4; i++) {
      const a = Math.PI * 1.1 + i / 4 * Math.PI * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.25);
      ctx.lineTo(Math.cos(a) * r, r * 0.25 + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function branchCoral(ctx, x, y, h, color, rr, depth) {
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    const grow = (px, py, ang, len, w, d) => {
      const nx = px + Math.cos(ang) * len, ny = py + Math.sin(ang) * len;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + Math.cos(ang + 0.3) * len * 0.5, py + Math.sin(ang + 0.3) * len * 0.5, nx, ny);
      ctx.stroke();
      if (d <= 0) {
        ctx.fillStyle = sh(color, 0.35);
        ctx.beginPath();
        ctx.arc(nx, ny, w * 0.7, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      grow(nx, ny, ang - 0.35 - rr() * 0.3, len * 0.72, w * 0.72, d - 1);
      grow(nx, ny, ang + 0.35 + rr() * 0.3, len * 0.72, w * 0.72, d - 1);
    };
    grow(x, y, -Math.PI / 2 + (rr() - 0.5) * 0.3, h * 0.42, Math.max(2, h * 0.09), depth);
  }

  function brainCoral(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.5, 1, x, y, r);
    g.addColorStop(0, sh(color, 0.3));
    g.addColorStop(1, sh(color, -0.4));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.75, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = rgba('#000000', 0.25);
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * i / 4, r * 0.75 * i / 4, 0, Math.PI, 0);
      ctx.stroke();
    }
  }

  function anemone(ctx, x, y, h, color) {
    ctx.fillStyle = sh(color, -0.5);
    ctx.fillRect(x - 2, y - h * 0.6, 4, h * 0.6);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.28;
      const ex = x + Math.cos(a) * h * 0.55, ey = y - h * 0.6 + Math.sin(a) * h * 0.55;
      ctx.strokeStyle = rgba(color, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.6);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tubeWorms(ctx, x, y, n, rr) {
    for (let i = 0; i < n; i++) {
      const tx = x + (i - n / 2) * 5, th = 14 + rr() * 22;
      ctx.fillStyle = '#e8e0d0';
      ctx.fillRect(tx - 1.8, y - th, 3.6, th);
      ctx.fillStyle = '#ff3d5e';
      ctx.beginPath();
      ctx.arc(tx, y - th, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function chimney(ctx, x, y, rr) {
    const h = 60 + rr() * 50;
    const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0);
    g.addColorStop(0, '#2a2022');
    g.addColorStop(0.5, '#4a3a3a');
    g.addColorStop(1, '#1a1214');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 4);
    ctx.lineTo(x - 8, y - h);
    ctx.lineTo(x + 8, y - h);
    ctx.lineTo(x + 18, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,120,40,0.85)';
    ctx.beginPath();
    ctx.ellipse(x, y - h, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * The whole sea bed as one image. Returns {canvas, x0, y0, res}: world point (x, y) is at
   * canvas pixel ((x - x0) * res, (y - y0) * res).
   */
  function buildBed(map, theme, quality, vents) {
    let minBed = Infinity;
    map.bed.forEach(y => { minBed = Math.min(minBed, y); });
    const x0 = -200, x1 = map.w + 200, y0 = minBed - 150, y1 = map.h + 80;
    let res = quality === 'low' ? 0.55 : 1.0;
    const maxPx = quality === 'low' ? 1.6e6 : 3.6e6;
    if ((x1 - x0) * (y1 - y0) * res * res > maxPx) res = Math.sqrt(maxPx / ((x1 - x0) * (y1 - y0)));
    const c = canvas((x1 - x0) * res, (y1 - y0) * res);
    const ctx = c.getContext('2d');
    ctx.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    const rr = rnd(map.bed.reduce((a, b) => a + b, 7) | 0);

    const path = new Path2D();
    path.moveTo(x0, y1 + 10);
    path.lineTo(x0, map.bed[0]);
    map.bed.forEach((y, i) => path.lineTo(i * map.step, y));
    path.lineTo(x1, map.bed[map.bed.length - 1]);
    path.lineTo(x1, y1 + 10);
    path.closePath();

    const g = ctx.createLinearGradient(0, minBed, 0, y1);
    g.addColorStop(0, theme.bed[0]);
    g.addColorStop(0.35, sh(theme.bed[0], -0.25));
    g.addColorStop(1, theme.bed[1]);
    ctx.fillStyle = g;
    ctx.fill(path);

    // ---- inside the ground
    ctx.save();
    ctx.clip(path);
    const contour = (off) => {
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 25) {
        const y = bedAt(map, x) + off + Math.sin(x * 0.013 + off) * 6;
        if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    };
    [[22, 16, 0.16, 1], [52, 22, 0.14, -1], [95, 30, 0.12, 1], [150, 40, 0.12, -1], [220, 46, 0.1, 1]].forEach(([off, w, a, sgn]) => {
      contour(off);
      ctx.lineWidth = w;
      ctx.strokeStyle = sgn > 0 ? rgba('#ffffff', a * 0.6) : rgba('#000000', a);
      ctx.stroke();
    });
    for (let i = 0; i < 260; i++) {
      const x = x0 + rr() * (x1 - x0);
      const y = bedAt(map, x) + 12 + rr() * 320;
      const r = 2 + rr() * 9;
      ctx.fillStyle = rgba('#000000', 0.12 + rr() * 0.15);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.4, r, rr() * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.08);
      ctx.beginPath();
      ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // sand ripples just below the surface
    ctx.strokeStyle = rgba('#ffffff', theme.glow ? 0.08 : 0.22);
    ctx.lineWidth = 1.4;
    for (let x = x0; x < x1; x += 11 + rr() * 8) {
      const y = bedAt(map, x) + 7 + rr() * 12;
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.quadraticCurveTo(x, y - 3, x + 7, y);
      ctx.stroke();
    }
    if (map.theme === 2) {
      // glowing lava cracks
      ctx.shadowColor = '#ff6a1a';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(255,120,40,0.75)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 22; i++) {
        let x = x0 + rr() * (x1 - x0), y = bedAt(map, x) + 20 + rr() * 140;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += 10 + rr() * 22; y += (rr() - 0.4) * 22; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    } else if (map.theme === 1) {
      for (let i = 0; i < 160; i++) {
        const x = x0 + rr() * (x1 - x0), y = bedAt(map, x) + 6 + rr() * 200;
        ctx.fillStyle = rgba('#5ff8ff', 0.25 + rr() * 0.4);
        ctx.fillRect(x, y, 1.6, 1.6);
      }
    }
    ctx.restore();

    // ---- on the surface
    ctx.beginPath();
    map.bed.forEach((y, i) => { if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * map.step, y); });
    ctx.strokeStyle = rgba('#000000', 0.35);
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.32);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // half-buried boulders
    for (let i = 0; i < 22; i++) {
      const x = rr() * map.w, y = bedAt(map, x) + 4, r = 14 + rr() * 26;
      irregular(ctx, x, y, r, rr, 11, true);
      const bg = ctx.createLinearGradient(x - r, y - r, x + r, y + r * 0.4);
      bg.addColorStop(0, sh(theme.rock[0], 0.15));
      bg.addColorStop(1, theme.rock[1]);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = rgba('#000000', 0.4);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // pebbles
    for (let i = 0; i < 320; i++) {
      const x = rr() * map.w, y = bedAt(map, x) + 1, r = 1.5 + rr() * 4.5;
      const pg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 0.5, x, y, r);
      pg.addColorStop(0, sh(theme.rock[0], 0.4));
      pg.addColorStop(1, sh(theme.rock[1], 0.1));
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.3, r, 0, Math.PI, 0);
      ctx.fill();
    }
    // seagrass tufts
    ctx.lineCap = 'round';
    for (let i = 0; i < 120; i++) {
      const x = rr() * map.w, y = bedAt(map, x) + 2;
      ctx.strokeStyle = rgba(theme.plant, 0.85);
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 4; k++) {
        const hh = 8 + rr() * 16;
        ctx.beginPath();
        ctx.moveTo(x + k * 2, y);
        ctx.quadraticCurveTo(x + k * 2 + (rr() - 0.5) * 8, y - hh * 0.6, x + k * 2 + (rr() - 0.5) * 12, y - hh);
        ctx.stroke();
      }
    }
    // theme decorations
    for (let i = 0; i < 46; i++) {
      const x = 60 + rr() * (map.w - 120), y = bedAt(map, x) + 2, pick = rr();
      const col = theme.coral[Math.floor(rr() * theme.coral.length)];
      if (map.theme === 0) {
        if (pick < 0.3) branchCoral(ctx, x, y, 40 + rr() * 50, col, rr, 3);
        else if (pick < 0.5) brainCoral(ctx, x, y, 12 + rr() * 14, col);
        else if (pick < 0.7) star(ctx, x, y - 5, 7 + rr() * 6, rr() * 3, rr() < 0.5 ? '#ff7a3d' : '#ff4d6d');
        else if (pick < 0.85) shell(ctx, x, y - 2, 6 + rr() * 5, (rr() - 0.5) * 0.8);
        else urchin(ctx, x, y, 6 + rr() * 5, rr);
      } else if (map.theme === 1) {
        if (pick < 0.35) anemone(ctx, x, y, 24 + rr() * 20, col);
        else if (pick < 0.6) tubeWorms(ctx, x, y, 3 + Math.floor(rr() * 4), rr);
        else if (pick < 0.8) branchCoral(ctx, x, y, 30 + rr() * 40, col, rr, 2);
        else urchin(ctx, x, y, 6 + rr() * 5, rr);
      } else {
        if (pick < 0.45) {
          // basalt columns
          const n = 2 + Math.floor(rr() * 3);
          for (let k = 0; k < n; k++) {
            const ch = 20 + rr() * 50, cx = x + k * 13;
            const cg = ctx.createLinearGradient(cx - 6, 0, cx + 6, 0);
            cg.addColorStop(0, '#2a2224'); cg.addColorStop(0.5, '#4a3e40'); cg.addColorStop(1, '#1a1416');
            ctx.fillStyle = cg;
            ctx.fillRect(cx - 6, y - ch, 12, ch + 6);
            ctx.fillStyle = '#5a4c4e';
            ctx.fillRect(cx - 6, y - ch, 12, 3);
          }
        } else if (pick < 0.7) urchin(ctx, x, y, 6 + rr() * 5, rr);
        else star(ctx, x, y - 5, 6 + rr() * 5, rr() * 3, '#ff8a3d');
      }
    }
    (vents || []).forEach(v => chimney(ctx, v.x, bedAt(map, v.x), rr));
    return { canvas: c, x0, y0, res };
  }

  /** One rock with shading, cracks and moss / barnacles / lava veins. */
  function buildRock(rock, theme, themeIdx, quality, seed) {
    const res = quality === 'low' ? 0.6 : 1.2;
    const pad = 12, size = (rock.r * 1.2 + pad) * 2;
    const c = canvas(size * res, size * res);
    const ctx = c.getContext('2d');
    ctx.setTransform(res, 0, 0, res, 0, 0);
    const cx = size / 2, cy = size / 2, rr = rnd(seed);
    ctx.save();
    ctx.translate(cx - rock.x, cy - rock.y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.save();
    ctx.translate(5, 7);
    ctx.fill(rock.p);
    ctx.restore();
    const g = ctx.createLinearGradient(rock.x - rock.r, rock.y - rock.r, rock.x + rock.r, rock.y + rock.r);
    g.addColorStop(0, sh(theme.rock[0], 0.25));
    g.addColorStop(0.5, theme.rock[0]);
    g.addColorStop(1, theme.rock[1]);
    ctx.fillStyle = g;
    ctx.fill(rock.p);
    ctx.save();
    ctx.clip(rock.p);
    // facets
    for (let i = 0; i < 7; i++) {
      const a = rr() * Math.PI * 2, d = rr() * rock.r * 0.7;
      const fx = rock.x + Math.cos(a) * d, fy = rock.y + Math.sin(a) * d;
      ctx.fillStyle = rr() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';
      irregular(ctx, fx, fy, rock.r * (0.25 + rr() * 0.3), rr, 6, false);
      ctx.fill();
    }
    // cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      let x = rock.x + (rr() - 0.5) * rock.r, y = rock.y + (rr() - 0.5) * rock.r;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (rr() - 0.5) * rock.r * 0.5; y += (rr() - 0.3) * rock.r * 0.4; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    if (themeIdx === 0) {
      // algae on top
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (rr() - 0.5) * 2;
        ctx.fillStyle = rgba(rr() < 0.5 ? '#4fae5a' : '#7cc25a', 0.55);
        ctx.beginPath();
        ctx.ellipse(rock.x + Math.cos(a) * rock.r * 0.8, rock.y + Math.sin(a) * rock.r * 0.8, rock.r * 0.25, rock.r * 0.12, a, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (themeIdx === 1) {
      for (let i = 0; i < 26; i++) {
        const a = rr() * Math.PI * 2, d = rock.r * (0.3 + rr() * 0.65);
        ctx.fillStyle = 'rgba(220,235,245,0.55)';
        ctx.beginPath();
        ctx.arc(rock.x + Math.cos(a) * d, rock.y + Math.sin(a) * d, 1.5 + rr() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.shadowColor = '#ff6a1a';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = 'rgba(255,120,40,0.8)';
      ctx.lineWidth = 2;
      let x = rock.x - rock.r * 0.6, y = rock.y + (rr() - 0.5) * rock.r * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += rock.r * 0.22; y += (rr() - 0.5) * rock.r * 0.35; ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke(rock.p);
    ctx.save();
    ctx.clip(rock.p);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 5;
    ctx.translate(2, 3);
    ctx.stroke(rock.p);
    ctx.restore();
    ctx.restore();
    return { canvas: c, x: rock.x - size / 2, y: rock.y - size / 2, size };
  }

  // ---------------------------------------------------------------- projectile sprites
  const sprites = {};
  const SPR_RES = 3;

  function torpedoSprite(kind) {
    const heavy = kind === 'torp_heavy', small = kind === 'bomblet' || kind === 'torp_swarm';
    const L = heavy ? 36 : kind === 'torp_shkval' ? 34 : small ? 17 : 28;
    const H = heavy ? 9.5 : kind === 'torp_shkval' ? 5.6 : small ? 4.8 : 6.8;
    const tip = { torp: '#d9372b', torp_fast: '#ffd34d', torp_homing: '#ff6b3d', torp_cluster: '#b46cff', torp_heavy: '#c92a20',
      torp_emp: '#3dfcff', bomblet: '#b46cff', torp_net: '#3fd26b', torp_ghost: '#c9a8ff', torp_swarm: '#ff8a3d', torp_shkval: '#ffd34d' }[kind] || '#d9372b';
    const W = L + 16, Hc = H * 2 + 14;
    const c = canvas(W * SPR_RES, Hc * SPR_RES);
    const ctx = c.getContext('2d');
    ctx.setTransform(SPR_RES, 0, 0, SPR_RES, W / 2 * SPR_RES, Hc / 2 * SPR_RES);
    // fins
    ctx.fillStyle = '#4f5f6e';
    ctx.strokeStyle = '#1b2733';
    ctx.lineWidth = 0.8;
    [[-1], [1]].forEach(([sg]) => {
      ctx.beginPath();
      ctx.moveTo(-L / 2 + 5, sg * H * 0.6);
      ctx.lineTo(-L / 2 - 2, sg * (H + 4));
      ctx.lineTo(-L / 2 - 4, sg * (H + 4));
      ctx.lineTo(-L / 2 - 1, sg * H * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    // propeller ring
    ctx.fillStyle = '#8796a5';
    ctx.fillRect(-L / 2 - 5, -H * 0.85, 2.4, H * 1.7);
    ctx.strokeRect(-L / 2 - 5, -H * 0.85, 2.4, H * 1.7);
    // body
    const bg = ctx.createLinearGradient(0, -H, 0, H);
    bg.addColorStop(0, '#f4f8fb');
    bg.addColorStop(0.35, '#b6c4d0');
    bg.addColorStop(0.7, '#7d8d9c');
    bg.addColorStop(1, '#3f4b57');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-L / 2, -H * 0.8);
    ctx.lineTo(L / 2 - H, -H);
    ctx.lineTo(L / 2 - H, H);
    ctx.lineTo(-L / 2, H * 0.8);
    ctx.quadraticCurveTo(-L / 2 - 2, 0, -L / 2, -H * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
    // nose cone
    const tg = ctx.createLinearGradient(0, -H, 0, H);
    tg.addColorStop(0, sh(tip, 0.5));
    tg.addColorStop(0.5, tip);
    tg.addColorStop(1, sh(tip, -0.5));
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(L / 2 - H, -H);
    ctx.quadraticCurveTo(L / 2 + H * 0.9, -H * 0.6, L / 2 + H * 0.4, 0);
    ctx.quadraticCurveTo(L / 2 + H * 0.9, H * 0.6, L / 2 - H, H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // bands, panel lines, rivets, highlight
    ctx.fillStyle = tip;
    ctx.fillRect(-L * 0.08, -H, 2.6, H * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.6;
    [-L * 0.3, L * 0.15].forEach(x => { ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x, H); ctx.stroke(); });
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = -L / 2 + 4; x < L / 2 - H - 1; x += 4) { ctx.beginPath(); ctx.arc(x, H * 0.45, 0.45, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-L / 2 + 3, -H * 0.62, L - H - 5, 1.1);
    if (kind === 'torp_net') {
      ctx.strokeStyle = 'rgba(20,60,30,0.7)';
      ctx.lineWidth = 0.6;
      for (let x = -L * 0.25; x < L * 0.3; x += 4) { ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x + 4, H); ctx.moveTo(x + 4, -H); ctx.lineTo(x, H); ctx.stroke(); }
    }
    if (kind === 'torp_cluster') {
      ctx.fillStyle = '#1b2733';
      [-4, 2].forEach(x => ctx.fillRect(x, -H, 1.4, H * 2));
    }
    return c;
  }

  function mineSprite() {
    const R = 12, W = 44;
    const c = canvas(W * SPR_RES, W * SPR_RES);
    const ctx = c.getContext('2d');
    ctx.setTransform(SPR_RES, 0, 0, SPR_RES, W / 2 * SPR_RES, W / 2 * SPR_RES);
    // horns (contact detonators)
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      const hg = ctx.createLinearGradient(-2, 0, 2, 0);
      hg.addColorStop(0, '#3a4652'); hg.addColorStop(0.5, '#a8b6c3'); hg.addColorStop(1, '#3a4652');
      ctx.fillStyle = hg;
      ctx.fillRect(-1.8, -R - 6, 3.6, 7);
      ctx.fillStyle = '#c9a24a';
      ctx.beginPath();
      ctx.arc(0, -R - 6.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, 1, 0, 0, R);
    g.addColorStop(0, '#c4d0da');
    g.addColorStop(0.45, '#6f7f8d');
    g.addColorStop(1, '#262f38');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#141b22';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // equator band with rivets
    ctx.fillStyle = 'rgba(20,28,36,0.65)';
    ctx.fillRect(-R, -1.8, R * 2, 3.6);
    ctx.fillStyle = '#b8c6d2';
    for (let x = -R + 2.5; x < R - 1; x += 3.4) { ctx.beginPath(); ctx.arc(x, 0, 0.7, 0, Math.PI * 2); ctx.fill(); }
    // lifting eye
    ctx.strokeStyle = '#8796a5';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, R + 2.5, 2.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-R * 0.4, -R * 0.45, R * 0.28, R * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  function depthSprite() {
    const W = 26, H = 34;
    const c = canvas(W * SPR_RES, H * SPR_RES);
    const ctx = c.getContext('2d');
    ctx.setTransform(SPR_RES, 0, 0, SPR_RES, W / 2 * SPR_RES, H / 2 * SPR_RES);
    const g = ctx.createLinearGradient(-9, 0, 9, 0);
    g.addColorStop(0, '#2f3a45'); g.addColorStop(0.3, '#a8b6c3'); g.addColorStop(0.6, '#6f7f8d'); g.addColorStop(1, '#232c35');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-9, -12, 18, 24, 4) : ctx.rect(-9, -12, 18, 24);
    ctx.fill();
    ctx.strokeStyle = '#141b22';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(-9, -7, 18, 3);
    ctx.fillRect(-9, 4, 18, 3);
    ctx.fillStyle = '#1b2733';
    for (let x = -7; x <= 7; x += 3.5) { ctx.fillRect(x, -7, 1.4, 3); ctx.fillRect(x + 1.2, 4, 1.4, 3); }
    const cap = ctx.createLinearGradient(-10, 0, 10, 0);
    cap.addColorStop(0, '#3a4652'); cap.addColorStop(0.4, '#c4d0da'); cap.addColorStop(1, '#3a4652');
    ctx.fillStyle = cap;
    ctx.fillRect(-10, -14, 20, 3);
    ctx.fillRect(-10, 11, 20, 3);
    ctx.fillStyle = '#5d6b78';
    ctx.fillRect(-3, -17, 6, 3);
    return c;
  }

  function mortarSprite() {
    const W = 22;
    const c = canvas(W * SPR_RES, W * SPR_RES);
    const ctx = c.getContext('2d');
    ctx.setTransform(SPR_RES, 0, 0, SPR_RES, W / 2 * SPR_RES, W / 2 * SPR_RES);
    const g = ctx.createRadialGradient(-2.5, -2.5, 0.5, 0, 0, 8);
    g.addColorStop(0, '#9aa8b6'); g.addColorStop(1, '#1e252d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f151b';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(-2, -10.5, 4, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-3, -3, 2.6, 1.4, -0.7, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  function sprite(kind) {
    if (sprites[kind]) return sprites[kind];
    let c = null;
    if (kind === 'mine') c = mineSprite();
    else if (kind === 'depth') c = depthSprite();
    else if (kind === 'mortar') c = mortarSprite();
    else if (kind && (kind.startsWith('torp') || kind === 'bomblet')) c = torpedoSprite(kind);
    sprites[kind] = c;
    return c;
  }

  DD.world = { buildBed, buildRock, sprite, SPR_RES };
})();
