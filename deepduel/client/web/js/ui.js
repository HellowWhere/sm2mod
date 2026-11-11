/* Shared UI helpers: screens, toasts, modals, formatting, profile state, menu background. */
window.DD = window.DD || {};
(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    profile: null,
    catalog: null,
    server: null,
    cat: null,
    timeOffset: 0,
    page: 'home',
    settings: { sound: true, vibro: true, quality: 'high' },
  };

  function indexCatalog(c) {
    const idx = (arr) => { const m = {}; (arr || []).forEach(x => { m[x.id] = x; }); return m; };
    return {
      parts: idx(c.parts), partList: c.parts,
      weapons: idx(c.weapons), weaponList: c.weapons,
      crates: idx(c.crates), crateList: c.crates,
      skins: idx(c.skins), skinList: c.skins,
      products: idx(c.products), productList: c.products,
      gemItems: idx(c.gemItems), gemItemList: c.gemItems,
      rarities: idx(c.rarities), rarityList: c.rarities,
      leagues: c.leagues, bp: c.bp, raw: c,
    };
  }

  const UI = {
    $, $$, esc, state,

    now() { return Date.now() + state.timeOffset; },

    fmt(n) { return Math.round(n || 0).toLocaleString('ru-RU'); },

    fmtTime(ms) {
      const s = Math.max(0, Math.floor(ms / 1000));
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
      if (d > 0) return `${d} д ${h} ч`;
      if (h > 0) return `${h} ч ${m} мин`;
      return `${m}:${String(ss).padStart(2, '0')}`;
    },

    show(id) {
      $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + id));
      state.screen = id;
      const rh = $('#rotate-hint');
      if (rh) rh.classList.toggle('enabled', id === 'battle' || id === 'main');
      BG.setActive(id !== 'battle');
    },

    toast(text, type) {
      const el = document.createElement('div');
      el.className = 'toast' + (type ? ' ' + type : '');
      el.textContent = text;
      $('#toast-root').appendChild(el);
      setTimeout(() => el.remove(), 3100);
      if (type === 'err') DD.sfx.play('error', 0.6);
    },

    vibrate(ms) {
      if (!state.settings.vibro) return;
      if (!window.DeepDuelAndroid && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      try {
        if (window.DeepDuelAndroid && window.DeepDuelAndroid.vibrate) window.DeepDuelAndroid.vibrate(ms);
        else if (navigator.vibrate) navigator.vibrate(ms);
      } catch (e) {}
    },

    /** Opens a modal. html = inner content. Returns {el, close}. */
    modal(html, opts) {
      opts = opts || {};
      const back = document.createElement('div');
      back.className = 'modal-back';
      back.innerHTML = `<div class="modal panel ${opts.wide ? 'wide' : ''}">${opts.noClose ? '' : '<button class="icon-btn close"><i data-icon="close"></i></button>'}${html}</div>`;
      $('#modal-root').appendChild(back);
      DD.icons.hydrate(back);
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        back.remove();
        if (opts.onClose) opts.onClose();
      };
      const cb = $('.close', back);
      if (cb) cb.onclick = () => { DD.sfx.play('click', 0.5); close(); };
      back.addEventListener('pointerdown', (e) => { if (e.target === back && !opts.noClose) close(); });
      return { el: back, box: $('.modal', back), close };
    },

    confirm(text, okLabel, opts) {
      opts = opts || {};
      return new Promise(resolve => {
        const m = UI.modal(`<h2>${esc(opts.title || 'Подтверждение')}</h2><div>${text}</div>
          <div class="modal-actions"><button class="btn btn-ghost" data-no>Отмена</button><button class="btn ${opts.cls || 'btn-gold'}" data-yes>${esc(okLabel || 'Да')}</button></div>`,
        { onClose: () => resolve(false) });
        $('[data-no]', m.el).onclick = () => m.close();
        $('[data-yes]', m.el).onclick = () => { resolve(true); m.el.remove(); };
      });
    },

    /** Runs a server request, shows errors as toasts, disables the button meanwhile. */
    async run(btn, fn) {
      if (btn) btn.disabled = true;
      try {
        return await fn();
      } catch (e) {
        UI.toast(e.message || String(e), 'err');
        return null;
      } finally {
        if (btn) btn.disabled = false;
      }
    },

    setCatalog(c) {
      // The RuStore build shows prices in rubles: 1 US cent of the server price = 1 ruble ($1.49 -> 149 ₽).
      if (c && c.products && UI.store() === 'rustore') {
        c.products.forEach(p => { p.priceText = String(p.price).replace(/\B(?=(\d{3})+$)/g, ' ') + ' ₽'; });
      }
      state.catalog = c;
      state.cat = indexCatalog(c);
    },

    /** Which store this build was made for: 'global' or 'rustore' (browser = 'global'). */
    store() {
      try { const a = window.DeepDuelAndroid; return a && a.store ? a.store() : 'global'; } catch (e) { return 'global'; }
    },

    setProfile(p) {
      if (!p) return;
      state.profile = p;
      if (p.now) state.timeOffset = p.now - Date.now();
      UI.renderTopbar();
      if (DD.pages && state.screen === 'main') DD.pages.refresh();
    },

    renderTopbar() {
      const p = state.profile;
      if (!p) return;
      $('#tb-name').textContent = p.name;
      $('#tb-level').textContent = p.level;
      $('#tb-xp').style.width = Math.min(100, (p.xp / p.xpNext) * 100) + '%';
      $('#tb-trophies').textContent = UI.fmt(p.trophies);
      $('#tb-coins').textContent = UI.fmt(p.coins);
      $('#tb-gems').textContent = UI.fmt(p.gems);
      const crates = Object.values(p.crates || {}).reduce((a, b) => a + b, 0);
      UI.badge('#badge-crates', crates);
      UI.badge('#badge-pass', UI.claimableBp());
      const offer = p.lossOfferUntil > UI.now();
      const b = $('#badge-shop');
      b.textContent = offer ? '!' : '';
      b.classList.toggle('show', offer);
    },

    badge(sel, n) {
      const b = $(sel);
      if (!b) return;
      b.textContent = n > 99 ? '99+' : n;
      b.classList.toggle('show', n > 0);
    },

    claimableBp() {
      const p = state.profile, c = state.cat;
      if (!p || !c) return 0;
      let n = 0;
      for (let l = 1; l <= p.bp.level; l++) {
        if (!p.bp.free.includes(l)) n++;
        if (p.bp.premium && !p.bp.prem.includes(l)) n++;
      }
      return n;
    },

    league(trophies) {
      const ls = state.cat.leagues;
      let i = 0;
      ls.forEach((l, k) => { if (trophies >= l.min) i = k; });
      return { idx: i, ...ls[i], next: ls[i + 1] || null };
    },

    rarityColor(r) {
      const x = state.cat && state.cat.rarities[r];
      return x ? x.color : '#9fb3c8';
    },

    rewardIcon(r) {
      switch (r.type) {
        case 'coins': return DD.icons.get('coin');
        case 'gems': return DD.icons.get('gem');
        case 'crate': { const c = state.cat.crates[r.id]; return DD.icons.crateSvg(c ? c.color : '#8fa7bd'); }
        case 'skin': {
          const s = state.cat.skins[r.id] || DD.DEFAULT_SKIN;
          return `<svg viewBox="0 0 40 24"><rect x="3" y="7" width="32" height="12" rx="6" fill="${s.hull}" stroke="#0008"/><rect x="3" y="14" width="32" height="2.5" fill="${s.accent}"/><path d="M14 7 l2 -5 h6 l2 5z" fill="${s.dark}"/><circle cx="24" cy="12" r="1.6" fill="${s.glow}"/></svg>`;
        }
        default: return DD.icons.get('gift');
      }
    },

    rewardLabel(r, short) {
      switch (r.type) {
        case 'coins': return short ? UI.fmt(r.n) : UI.fmt(r.n) + ' монет';
        case 'gems': return short ? UI.fmt(r.n) : UI.fmt(r.n) + ' жемчуга';
        case 'crate': { const c = state.cat.crates[r.id]; const nm = c ? c.name : 'Ящик'; return (r.n > 1 ? r.n + '× ' : '') + (short ? nm.replace(' ящик', '') : nm); }
        case 'skin': { const s = state.cat.skins[r.id]; return (short ? '' : 'Окраска ') + '«' + (s ? s.name : r.id) + '»'; }
        default: return '';
      }
    },

    /** Value of a part stat at a level. */
    partStat(partId, statIdx, level) {
      const p = state.cat.parts[partId];
      return p.stats[statIdx].v[level - 1];
    },

    fmtStat(v, unit) {
      const n = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
      return UI.fmt(n) + (unit || '');
    },
  };

  // ---------------------------------------------------------------- menu background
  const BG = {
    active: true,
    t: 0,
    parts: [],
    init() {
      this.c = $('#bg');
      this.ctx = this.c.getContext('2d');
      for (let i = 0; i < 60; i++) this.parts.push(this.newPart(true));
      let last = 0;
      const loop = (ts) => {
        requestAnimationFrame(loop);
        if (!this.active || ts - last < 32) return; // the menu background needs only ~30 fps
        last = ts;
        this.draw(ts / 1000);
      };
      requestAnimationFrame(loop);
    },
    newPart(any) {
      return { x: Math.random(), y: any ? Math.random() : 1.05, r: 0.6 + Math.random() * 2.2, v: 0.006 + Math.random() * 0.02, w: Math.random() * 6, bubble: Math.random() < 0.25 };
    },
    setActive(a) { this.active = a; },
    draw(t) {
      const c = this.c, ctx = this.ctx;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const dt = this.t ? Math.min(0.05, t - this.t) : 0.016;
      this.t = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0b3a64');
      g.addColorStop(0.45, '#062246');
      g.addColorStop(1, '#020a17');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const x = w * (i / 5) + Math.sin(t * 0.21 + i * 1.7) * w * 0.05;
        const rg = ctx.createLinearGradient(0, 0, 0, h * 0.85);
        rg.addColorStop(0, 'rgba(120,210,255,0.10)');
        rg.addColorStop(1, 'rgba(120,210,255,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(x - 30, 0);
        ctx.lineTo(x + 30, 0);
        ctx.lineTo(x + 140 + Math.sin(t * 0.3 + i) * 30, h);
        ctx.lineTo(x + 40, h);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const p of this.parts) {
        p.y -= p.v * dt * (p.bubble ? 3 : 1);
        p.x += Math.sin(t + p.w) * 0.0004;
        if (p.y < -0.05) Object.assign(p, this.newPart(false));
        if (p.bubble) {
          ctx.strokeStyle = 'rgba(190,240,255,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, p.r * 1.6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(200,235,255,0.35)';
          ctx.fillRect(p.x * w, p.y * h, p.r, p.r);
        }
      }
      const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    },
  };

  UI.BG = BG;
  DD.ui = UI;
})();
