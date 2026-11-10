/* Menu pages (home, hangar, arsenal, crates, battle pass, shop, rating) and their dialogs. */
window.DD = window.DD || {};
(function () {
  const UI = DD.ui, $ = UI.$, $$ = UI.$$, esc = UI.esc, S = UI.state, I = DD.icons;
  const coinI = () => `<i data-icon="coin"></i>`;
  const gemI = () => `<i data-icon="gem"></i>`;

  const P = {
    current: 'home',
    stages: {},
    lb: null,
    lbTime: 0,

    init() {
      $$('#rail button').forEach(b => b.addEventListener('click', () => { DD.sfx.play('tab', 0.5); P.show(b.dataset.page); }));
      $('#tb-coins-btn').onclick = () => { P.show('shop'); setTimeout(() => P.scrollShop('currency'), 50); };
      $('#tb-gems-btn').onclick = () => { P.show('shop'); setTimeout(() => P.scrollShop('currency'), 50); };
      $('#tb-trophy').onclick = () => P.show('rating');
      $('#chip-player').onclick = () => P.profileModal();
      $('#btn-settings').onclick = () => P.settingsModal();
      setInterval(() => { if (S.screen === 'main' && (P.current === 'shop' || P.current === 'home')) P.tickTimers(); }, 1000);
    },

    show(id) {
      P.current = id;
      $$('#rail button').forEach(b => b.classList.toggle('active', b.dataset.page === id));
      $$('.content .page').forEach(p => p.classList.toggle('active', p.id === 'pg-' + id));
      P.render(id);
    },

    refresh() { P.render(P.current); },

    render(id) {
      const el = $('#pg-' + id);
      if (!el || !S.profile || !S.cat) return;
      const fn = P['r_' + id];
      if (fn) fn(el);
      I.hydrate(el);
    },

    stage(key, canvas, opts) {
      if (P.stages[key]) P.stages[key].destroy();
      const st = new DD.SubStage(canvas, opts);
      P.stages[key] = st;
      const p = S.profile;
      st.setSkin(S.cat.skins[p.skin]);
      st.setSize(p.parts.hull);
      return st;
    },

    // ============================================================ HOME
    r_home(el) {
      const p = S.profile, lg = UI.league(p.trophies);
      const d = p.daily;
      const base = Math.min(d.limit, S.server && S.server.dailyLimit ? S.server.dailyLimit : d.limit);
      let dots = '';
      for (let i = 0; i < d.limit; i++) dots += `<span class="${i < d.used ? 'on' : ''} ${i >= base ? 'extra' : ''}"></span>`;
      const bpPer = S.cat.bp.xpPerLevel, bpMax = S.cat.bp.levels;
      const bpInLevel = p.bp.level >= bpMax ? bpPer : p.bp.xp - p.bp.level * bpPer;
      const crates = Object.values(p.crates).reduce((a, b) => a + b, 0);
      const skin = S.cat.skins[p.skin];
      el.innerHTML = `<div class="home">
        <div class="home-stage"><canvas></canvas>
          <div class="league-badge">${I.shieldSvg(lg.color, lg.idx + 1).replace('<svg', '<svg class="shield"')}
            <div><b style="color:${lg.color}">${esc(lg.name)}</b><small>${UI.fmt(p.trophies)} кубков${lg.next ? ' · до «' + esc(lg.next.name) + '» ' + UI.fmt(lg.next.min - p.trophies) : ''}</small></div></div>
          <div class="stage-name">${esc(skin ? skin.name : '')} · корпус ур. ${p.parts.hull}</div>
        </div>
        <div class="home-side">
          <button class="battle-btn" id="btn-battle">В БОЙ!<small>Подводная дуэль 1 на 1</small></button>
          <div class="info-card"><span class="ic">${I.crateSvg('#3fa9f5')}</span><div class="txt">
            <b>Награды за бои: ${d.used} / ${d.limit}</b>
            <small>${d.used >= d.limit ? 'Лимит на сегодня исчерпан — бои дают только кубки и опыт пропуска' : 'Каждый бой приносит ящик и монеты'}</small>
            <div class="dots">${dots}</div></div>
            ${d.used >= d.limit ? '<button class="btn btn-pink btn-sm" id="home-ext">+10</button>' : ''}</div>
          <div class="info-card" id="home-bp"><span class="ic"><i data-icon="pass" style="color:var(--gold)"></i></span><div class="txt">
            <b>Боевой пропуск · ур. ${p.bp.level}${p.bp.premium ? ' · Премиум' : ''}</b>
            <small>${p.bp.level >= bpMax ? 'Все уровни пройдены!' : bpInLevel + ' / ' + bpPer + ' опыта до следующего уровня'}</small>
            <div class="prog gold"><span style="width:${(bpInLevel / bpPer) * 100}%"></span></div></div></div>
          <div class="info-card" id="home-crates"><span class="ic"><i data-icon="crate" style="color:var(--teal)"></i></span><div class="txt">
            <b>${crates ? 'Ящиков ждут открытия: ' + crates : 'Нет неоткрытых ящиков'}</b>
            <small>Побед: ${p.stats.wins} · Поражений: ${p.stats.losses} · Ничьих: ${p.stats.draws}</small></div></div>
        </div></div>`;
      P.stage('home', $('canvas', el), { scale: 0.85 });
      $('#btn-battle', el).onclick = () => { DD.sfx.init(); DD.sfx.play('click'); DD.game.queue(); };
      $('#home-bp', el).onclick = () => P.show('pass');
      $('#home-crates', el).onclick = () => P.show('crates');
      const ext = $('#home-ext', el);
      if (ext) ext.onclick = (e) => { e.stopPropagation(); P.buy('reward_day'); };
    },

    // ============================================================ HANGAR
    r_hangar(el) {
      const p = S.profile, c = S.cat;
      const keep = $('.parts', el);
      const scroll = keep ? keep.scrollTop : 0;
      const ins = c.products.instant_upgrade;
      const parts = c.partList.map(pt => {
        const l = p.parts[pt.id];
        const max = l >= pt.max;
        let pips = '';
        for (let i = 1; i <= pt.max; i++) pips += `<span class="${i <= l ? 'on' : ''}"></span>`;
        const stats = pt.stats.map(s => {
          const cur = s.v[l - 1], nxt = max ? null : s.v[l];
          return `${esc(s.n)} <b>${UI.fmtStat(cur, s.u)}</b>${nxt != null && nxt !== cur ? ` → <span class="up">${UI.fmtStat(nxt, s.u)}</span>` : ''}`;
        }).join(' · ');
        const cost = max ? 0 : pt.costs[l - 1];
        const acts = max ? `<div class="maxed">МАКС.</div>` :
          `<button class="btn btn-gold" data-up="${pt.id}" ${p.coins < cost ? 'data-poor="1"' : ''}>${coinI()}${UI.fmt(cost)}</button>
           ${ins ? `<button class="btn btn-ghost" data-instant="${pt.id}">Сразу · ${ins.price} ₽</button>` : ''}`;
        return `<div class="part"><div class="pic">${I.partIcon(pt.id)}</div>
          <div><div class="ttl"><b>${esc(pt.name)}</b><small>ур. ${l}/${pt.max}</small></div><div class="pips">${pips}</div><div class="st">${stats}</div></div>
          <div class="acts">${acts}</div></div>`;
      }).join('');
      const skins = c.skinList.map(s => {
        const own = p.skins.includes(s.id);
        return `<button class="skin ${p.skin === s.id ? 'on' : ''} ${own ? '' : 'locked'}" data-skin="${s.id}" title="${esc(s.name)}">
          <span class="sw" style="background:linear-gradient(180deg, ${s.hull} 0 55%, ${s.accent} 55% 75%, ${s.dark} 75%)"></span></button>`;
      }).join('');
      const L = (id) => p.parts[id];
      const hp = UI.partStat('hull', 0, L('hull'));
      el.innerHTML = `<div class="hangar">
        <div class="hangar-left">
          <div class="hangar-stage"><canvas></canvas>
            <div class="stat-sum"><span>Прочность <b>${UI.fmt(hp)}</b></span><span>Броня <b>${UI.fmtStat(UI.partStat('armor', 0, L('armor')), '%')}</b></span>
            <span>Скорость <b>${UI.fmtStat(UI.partStat('propeller', 0, L('propeller')), '')}</b></span><span>Обзор <b>${UI.fmtStat(UI.partStat('sonar', 0, L('sonar')), '')}</b></span>
            <span>Слоты <b>${p.guns.length}+${p.torps.length}</b></span></div></div>
          <div class="skins">${skins}</div>
        </div>
        <div class="parts scroll">${parts}</div></div>`;
      P.stage('hangar', $('canvas', el), { scale: 0.9 });
      $('.parts', el).scrollTop = scroll;
      $$('[data-up]', el).forEach(b => b.onclick = async () => {
        if (b.dataset.poor) { UI.toast('Не хватает монет. Монеты дают бои и ящики.', 'err'); return; }
        const r = await UI.run(b, () => DD.net.req('upgrade_part', { part: b.dataset.up }));
        if (!r) return;
        DD.sfx.play('upgrade');
        UI.vibrate(20);
        UI.setProfile(r.profile);
        UI.toast(`${c.parts[r.result.part].name}: уровень ${r.result.level}! +${r.result.xp} опыта`, 'ok');
        P.levelUps(r.result.levelUps);
      });
      $$('[data-instant]', el).forEach(b => b.onclick = () => P.buy('instant_upgrade', b.dataset.instant, c.parts[b.dataset.instant].name));
      $$('[data-skin]', el).forEach(b => b.onclick = async () => {
        const s = c.skins[b.dataset.skin];
        if (!p.skins.includes(s.id)) { UI.toast(`«${s.name}»: ${s.source}`); return; }
        const r = await UI.run(null, () => DD.net.req('skin', { skin: s.id }));
        if (r) { DD.sfx.play('click'); UI.setProfile(r.profile); }
      });
    },

    // ============================================================ ARSENAL
    r_arsenal(el) {
      const p = S.profile, c = S.cat;
      const keep = $('.weapons', el);
      const scroll = keep ? keep.scrollTop : 0;
      const slotHtml = (type, list, maxSlots, unlockAt) => {
        let h = '';
        for (let i = 0; i < maxSlots; i++) {
          const wid = list[i];
          if (i >= list.length) { h += `<div class="slot locked" title="Откроется на корпусе ур. ${unlockAt[i]}"><i data-icon="lock"></i><em>К${unlockAt[i]}</em></div>`; continue; }
          if (!wid) { h += `<button class="slot" data-slot="${type}:${i}">+</button>`; continue; }
          const w = c.weapons[wid], own = p.weapons[wid];
          h += `<button class="slot filled" data-w="${wid}" style="border-color:${UI.rarityColor(w.rarity)}">${I.weaponSvg(w.kind, UI.rarityColor(w.rarity)).replace('<svg', '<svg class="wpic"')}<em>${own ? own.level : 1}</em></button>`;
        }
        return h;
      };
      const order = c.weaponList.slice().sort((a, b) => {
        const oa = p.weapons[a.id] ? 0 : 1, ob = p.weapons[b.id] ? 0 : 1;
        if (oa !== ob) return oa - ob;
        if (a.type !== b.type) return a.type === 'gun' ? -1 : 1;
        return 0;
      });
      const cards = order.map(w => {
        const own = p.weapons[w.id];
        const col = UI.rarityColor(w.rarity);
        const eq = p.guns.includes(w.id) || p.torps.includes(w.id);
        let bar = '';
        let ready = false;
        if (own) {
          if (own.level >= 10) bar = `<div class="cardbar ready"><span style="width:100%"></span><em>МАКС.</em></div>`;
          else {
            const need = w.cards[own.level - 1];
            ready = own.cards >= need;
            bar = `<div class="cardbar ${ready ? 'ready' : ''}"><span style="width:${Math.min(100, own.cards / need * 100)}%"></span><em>${own.cards} / ${need}</em></div>`;
          }
        } else bar = `<div class="cardbar"><em>в ящиках</em></div>`;
        return `<button class="wcard ${own ? '' : 'locked'}" data-w="${w.id}" style="--c:${col}">
          ${own ? `<span class="lv">ур. ${own.level}</span>` : ''}${eq ? '<span class="eq">✓</span>' : ''}
          ${I.weaponSvg(w.kind, col).replace('<svg', '<svg class="wpic"')}<div class="wn">${esc(w.name)}</div>${bar}
          ${ready ? '<span class="up-arrow">▲</span>' : ''}</button>`;
      }).join('');
      el.innerHTML = `<div class="arsenal">
        <div class="loadout">
          <div class="slot-group"><span>Пушки</span>${slotHtml('gun', p.guns, 3, [1, 3, 7])}</div>
          <div class="slot-group"><span>Торпеды</span>${slotHtml('torp', p.torps, 3, [1, 5, 9])}</div>
          <div class="info-card" style="flex:1"><span class="ic"><i data-icon="info" style="color:var(--teal)"></i></span>
            <div class="txt"><b>Оружие и чертежи</b><small>Новое оружие выпадает из ящиков. Повторные находки — чертежи для улучшения. Больше слотов даёт улучшение корпуса.</small></div></div>
        </div>
        <div class="weapons scroll">${cards}</div></div>`;
      $('.weapons', el).scrollTop = scroll;
      $$('[data-w]', el).forEach(b => b.onclick = () => { DD.sfx.play('click', 0.5); P.weaponModal(b.dataset.w); });
      $$('[data-slot]', el).forEach(b => b.onclick = () => {
        const [type, idx] = b.dataset.slot.split(':');
        P.pickWeaponModal(type, +idx);
      });
    },

    weaponStats(w, level) {
      const dm = 1 + S.catalog.weaponDmgPerLevel * (level - 1);
      const cm = 1 - S.catalog.weaponCdPerLevel * (level - 1);
      return { dmg: w.dmg * dm, cd: w.cd * cm };
    },

    weaponModal(wid) {
      const p = S.profile, c = S.cat, w = c.weapons[wid], own = p.weapons[wid];
      const col = UI.rarityColor(w.rarity), rar = c.rarities[w.rarity];
      const lvl = own ? own.level : 1;
      const cur = P.weaponStats(w, lvl), nxt = own && lvl < 10 ? P.weaponStats(w, lvl + 1) : null;
      const dmgTxt = (v) => (w.count > 1 ? w.count + '×' : '') + Math.round(v);
      const list = w.type === 'gun' ? p.guns : p.torps;
      let equip = '';
      if (own) {
        equip = `<div class="equip-row"><span class="muted">Установить:</span>` + list.map((cur2, i) => {
          const occ = cur2 ? c.weapons[cur2] : null;
          const here = cur2 === wid;
          return `<button class="btn btn-sm ${here ? 'btn-teal' : 'btn-ghost'}" data-eq="${i}" ${here ? 'disabled' : ''}>Слот ${i + 1}${occ ? ' · ' + esc(occ.name) : ' · пусто'}</button>`;
        }).join('') + (list.indexOf(wid) >= 0 ? `<button class="btn btn-sm btn-ghost" data-uneq="${list.indexOf(wid)}">Снять</button>` : '') + `</div>`;
      }
      let upBtn = '';
      if (own && lvl < 10) {
        const needC = w.cards[lvl - 1], needM = w.coins[lvl - 1];
        const ok = own.cards >= needC && p.coins >= needM;
        upBtn = `<button class="btn btn-gold" id="w-up" ${ok ? '' : 'data-poor="1"'}>Улучшить · ${coinI()}${UI.fmt(needM)}</button>`;
      }
      const m = UI.modal(`<h2>${esc(w.name)} <span class="rar" style="color:${col}">${esc(rar ? rar.name : '')}</span></h2>
        <div class="wdetail"><div class="wpic" style="--c:${col}">${I.weaponSvg(w.kind, col)}</div>
        <div><div class="muted" style="margin-bottom:6px">${esc(w.desc)}</div>
        <table class="stats-table">
          <tr><td>Тип</td><td>${w.type === 'gun' ? 'Пушка (зажать «Огонь»)' : 'Торпеда (кнопка торпеды)'}</td></tr>
          <tr><td>Урон</td><td>${dmgTxt(cur.dmg)}${nxt ? ` → <span class="up">${dmgTxt(nxt.dmg)}</span>` : ''}</td></tr>
          <tr><td>Перезарядка</td><td>${cur.cd.toFixed(2)} с${nxt ? ` → <span class="up">${nxt.cd.toFixed(2)} с</span>` : ''}</td></tr>
          <tr><td>Дальность</td><td>${UI.fmt(w.range)}</td></tr>
          ${w.splash ? `<tr><td>Радиус взрыва</td><td>${w.splash}</td></tr>` : ''}
          <tr><td>Уровень</td><td>${own ? lvl + ' / 10' : 'не получено'}</td></tr>
          ${own && lvl < 10 ? `<tr><td>Чертежи</td><td>${own.cards} / ${w.cards[lvl - 1]}</td></tr>` : ''}
        </table></div></div>
        ${own ? equip : `<div class="hint">Это оружие можно найти в ящиках (${esc(rar ? rar.name.toLowerCase() : '')} редкость).</div>`}
        <div class="modal-actions">${own ? upBtn : `<button class="btn btn-teal" id="w-crates">К ящикам</button>`}</div>`);
      I.hydrate(m.el);
      const up = $('#w-up', m.el);
      if (up) up.onclick = async () => {
        if (up.dataset.poor) {
          const needC = w.cards[lvl - 1];
          UI.toast(own.cards < needC ? `Нужно чертежей: ${needC}. Их дают ящики.` : 'Не хватает монет', 'err');
          return;
        }
        const r = await UI.run(up, () => DD.net.req('upgrade_weapon', { weapon: wid }));
        if (!r) return;
        DD.sfx.play('upgrade');
        UI.setProfile(r.profile);
        m.close();
        UI.toast(`${w.name}: уровень ${r.result.level}! +${r.result.xp} опыта`, 'ok');
        P.levelUps(r.result.levelUps);
        P.weaponModal(wid);
      };
      $$('[data-eq]', m.el).forEach(b => b.onclick = async () => {
        const r = await UI.run(b, () => DD.net.req('equip', { slot: w.type, index: +b.dataset.eq, weapon: wid }));
        if (!r) return;
        DD.sfx.play('click');
        UI.setProfile(r.profile);
        m.close();
      });
      $$('[data-uneq]', m.el).forEach(b => b.onclick = async () => {
        const r = await UI.run(b, () => DD.net.req('equip', { slot: w.type, index: +b.dataset.uneq, weapon: '' }));
        if (!r) return;
        UI.setProfile(r.profile);
        m.close();
      });
      const wc = $('#w-crates', m.el);
      if (wc) wc.onclick = () => { m.close(); P.show('crates'); };
    },

    pickWeaponModal(type, idx) {
      const p = S.profile, c = S.cat;
      const opts = c.weaponList.filter(w => w.type === type && p.weapons[w.id]);
      if (!opts.length) { UI.toast('Нет подходящего оружия — ищите его в ящиках'); return; }
      const m = UI.modal(`<h2>${type === 'gun' ? 'Пушка' : 'Торпеда'} в слот ${idx + 1}</h2><div class="weapons" style="grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">` +
        opts.map(w => `<button class="wcard" data-pick="${w.id}" style="--c:${UI.rarityColor(w.rarity)}"><span class="lv">ур. ${p.weapons[w.id].level}</span>${I.weaponSvg(w.kind, UI.rarityColor(w.rarity)).replace('<svg', '<svg class="wpic"')}<div class="wn">${esc(w.name)}</div></button>`).join('') + `</div>`);
      $$('[data-pick]', m.el).forEach(b => b.onclick = async () => {
        const r = await UI.run(b, () => DD.net.req('equip', { slot: type, index: idx, weapon: b.dataset.pick }));
        if (!r) return;
        DD.sfx.play('click');
        UI.setProfile(r.profile);
        m.close();
      });
    },

    // ============================================================ CRATES
    r_crates(el) {
      const p = S.profile, c = S.cat;
      const gemFor = (id) => c.gemItemList.find(g => g.reward.type === 'crate' && g.reward.id === id);
      el.innerHTML = `<div class="page-title">Ящики <small>Монеты, жемчуг и чертежи оружия. Сегодня за бои: ${p.daily.used} / ${p.daily.limit}</small></div>
        <div class="crates">${c.crateList.map(cr => {
          const n = p.crates[cr.id] || 0;
          const g = gemFor(cr.id);
          const odds = cr.odds.map((o, i) => o > 0 ? `<span style="color:${c.rarityList[i].color}">${c.rarityList[i].name} ${o}%</span>` : '').filter(Boolean).join(' · ');
          return `<div class="crate-card ${n ? '' : 'empty'}" style="--c:${cr.color}">
            ${n ? `<span class="cnt">×${n}</span>` : ''}
            <div class="cpic">${I.crateSvg(cr.color)}</div><b>${esc(cr.name)}</b>
            <div class="odds">${cr.coins} монет · ${cr.stacks} вида чертежей<br>${odds}</div>
            ${n ? `<button class="btn btn-teal" data-open="${cr.id}">Открыть</button>` :
              g ? `<button class="btn btn-pink" data-gem="${g.id}">${gemI()}${g.price}</button>` : `<button class="btn btn-ghost" disabled>Нет</button>`}
          </div>`;
        }).join('')}</div>`;
      $$('[data-open]', el).forEach(b => b.onclick = () => P.openCrate(b.dataset.open));
      $$('[data-gem]', el).forEach(b => b.onclick = () => P.gemBuy(b.dataset.gem));
    },

    openCrate(type) {
      const c = S.cat, cr = c.crates[type];
      DD.sfx.init();
      const root = document.createElement('div');
      root.className = 'opening';
      root.innerHTML = `<div class="rays"></div><div class="ctitle" style="color:${cr.color}">${esc(cr.name)}</div>
        <div class="big-crate">${I.crateSvg(cr.color)}</div><div class="tap">Нажмите, чтобы открыть</div>`;
      $('#modal-root').appendChild(root);
      const box = $('.big-crate', root);
      let busy = false;
      const go = async () => {
        if (busy) return;
        busy = true;
        box.classList.add('shake');
        DD.sfx.play('click');
        const wait = new Promise(r => setTimeout(r, 700));
        let r;
        try {
          r = await DD.net.req('open_crate', { crate: type });
        } catch (e) {
          UI.toast(e.message, 'err');
          root.remove();
          return;
        }
        await wait;
        UI.setProfile(r.profile);
        P.showLoot(root, r.result, type);
      };
      box.onclick = go;
      $('.tap', root).onclick = go;
    },

    showLoot(root, res, type) {
      const c = S.cat, cr = c.crates[type];
      let best = 0;
      const items = [];
      items.push(`<div class="loot-item" style="--c:#ffc13b"><div class="lpic">${I.get('coin')}</div><b>+${UI.fmt(res.coins)}</b><small>монет</small></div>`);
      if (res.gems) items.push(`<div class="loot-item" style="--c:#ff7fd8"><div class="lpic">${I.get('gem')}</div><b>+${res.gems}</b><small>жемчуга</small></div>`);
      res.cards.forEach(cd => {
        const w = c.weapons[cd.id];
        const ri = c.rarityList.findIndex(r => r.id === w.rarity);
        best = Math.max(best, ri);
        items.push(`<div class="loot-item" style="--c:${UI.rarityColor(w.rarity)}">${cd.isNew ? '<span class="new">НОВОЕ!</span>' : ''}
          <div class="lpic">${I.weaponSvg(w.kind, UI.rarityColor(w.rarity))}</div><b>+${cd.n}</b><small>${esc(w.name)}<br>${cd.isNew ? 'оружие получено' : 'чертежи'}</small></div>`);
      });
      const more = S.profile.crates[type] || 0;
      root.innerHTML = `<div class="rays"></div><div class="ctitle" style="color:${cr.color}">${esc(cr.name)}</div>
        <div class="loot">${items.join('')}</div>
        <div class="row">${more ? `<button class="btn btn-teal" id="loot-more">Открыть ещё (${more})</button>` : ''}<button class="btn btn-gold" id="loot-ok">Отлично!</button></div>`;
      $$('.loot-item', root).forEach((it, i) => { it.style.animationDelay = (i * 0.18) + 's'; });
      I.hydrate(root);
      DD.sfx.play(best >= 3 ? 'legendary' : 'open');
      UI.vibrate(best >= 2 ? 60 : 25);
      res.cards.forEach((cd, i) => setTimeout(() => DD.sfx.play('reveal', 0.6), 300 + i * 180));
      $('#loot-ok', root).onclick = () => { root.remove(); P.levelUps(res.levelUps); };
      const lm = $('#loot-more', root);
      if (lm) lm.onclick = () => { root.remove(); P.levelUps(res.levelUps, () => P.openCrate(type)); };
    },

    levelUps(list, after) {
      if (!list || !list.length) { if (after) after(); return; }
      const last = list[list.length - 1];
      const rewards = list.map(l => `<div class="reward-row"><span class="ic">${UI.rewardIcon({ type: 'crate', id: l.crate })}</span><div><b>Уровень ${l.level}</b><small>${esc(S.cat.crates[l.crate].name)} + ${l.gems} жемчуга</small></div></div>`).join('');
      DD.sfx.play('win', 0.7);
      const m = UI.modal(`<h2 style="text-align:center;padding:0">Новый уровень капитана: ${last.level}!</h2>
        <div class="muted" style="text-align:center;margin-bottom:10px">Уровень растёт, когда вы улучшаете подлодку и оружие.</div>
        <div style="display:flex;flex-direction:column;gap:6px">${rewards}</div>
        <div class="modal-actions"><button class="btn btn-gold" data-ok>Забрать</button></div>`, { onClose: after });
      $('[data-ok]', m.el).onclick = () => m.close();
    },

    // ============================================================ BATTLE PASS
    r_pass(el) {
      const p = S.profile, c = S.cat, bp = c.bp;
      const old = $('.track', el);
      const prevScroll = old ? old.scrollLeft : null;
      const per = bp.xpPerLevel;
      const inLvl = p.bp.level >= bp.levels ? per : p.bp.xp - p.bp.level * per;
      const claimable = UI.claimableBp();
      const prem = c.products.bp_premium;
      let cols = '';
      for (let l = 1; l <= bp.levels; l++) {
        const reached = p.bp.level >= l;
        const cell = (r, track, claimed) => {
          const can = reached && !claimed && (track === 'free' || p.bp.premium);
          const cls = claimed ? 'claimed' : can ? 'claimable' : (!reached || (track === 'premium' && !p.bp.premium)) ? 'locked' : '';
          return `<button class="cell ${track === 'premium' ? 'prem' : ''} ${cls}" data-claim="${l}:${track}">
            ${track === 'premium' && !p.bp.premium ? '<span class="lock"><i data-icon="lock"></i></span>' : ''}
            <span class="rpic">${UI.rewardIcon(r)}</span><span>${esc(UI.rewardLabel(r, true))}</span></button>`;
        };
        cols += `<div class="tcol ${reached ? 'reached' : ''}"><div class="tnum">${l}</div>
          ${cell(bp.free[l - 1], 'free', p.bp.free.includes(l))}${cell(bp.premium[l - 1], 'premium', p.bp.prem.includes(l))}</div>`;
      }
      el.innerHTML = `<div class="pass">
        <div class="pass-head">
          <div class="pass-lvl"><span class="big">${p.bp.level}</span><div class="txt"><b>Сезон ${p.bp.season} · Боевой пропуск</b>
            <div class="prog gold"><span style="width:${inLvl / per * 100}%"></span></div>
            <small>${p.bp.level >= bp.levels ? 'Максимальный уровень' : inLvl + ' / ' + per + ' опыта'} · победа +${bp.xpWin}, поражение +${bp.xpLoss} · до конца сезона ${UI.fmtTime(p.bp.endsAt - UI.now())}</small></div></div>
          ${claimable ? `<button class="btn btn-teal" id="bp-all">Забрать всё (${claimable})</button>` : ''}
          ${p.bp.premium ? `<div class="pill" style="color:var(--gold)"><i data-icon="star"></i>Премиум активен</div>` :
            `<button class="btn btn-gold" id="bp-buy"><i data-icon="star"></i>Премиум · ${prem ? prem.price : ''} ₽</button>`}
        </div>
        <div class="track-wrap"><div class="track-labels"><div class="tl-free"><i data-icon="gift"></i>Бесплатно</div><div class="tl-prem"><i data-icon="star"></i>Премиум</div></div>
          <div class="track">${cols}</div></div></div>`;
      const tr = $('.track', el);
      if (prevScroll != null) tr.scrollLeft = prevScroll;
      else requestAnimationFrame(() => { tr.style.scrollBehavior = 'auto'; tr.scrollLeft = Math.max(0, (p.bp.level - 2) * 86); tr.style.scrollBehavior = ''; });
      $$('[data-claim]', el).forEach(b => b.onclick = async () => {
        const [l, track] = b.dataset.claim.split(':');
        const lvl = +l;
        if (p.bp.level < lvl) { UI.toast(`Откроется на ${lvl} уровне пропуска`); return; }
        if (track === 'premium' && !p.bp.premium) { P.buy('bp_premium'); return; }
        if ((track === 'free' ? p.bp.free : p.bp.prem).includes(lvl)) return;
        const r = await UI.run(b, () => DD.net.req('bp_claim', { level: lvl, track }));
        if (!r) return;
        DD.sfx.play('coin');
        UI.setProfile(r.profile);
        UI.toast('Получено: ' + UI.rewardLabel(r.result.reward), 'ok');
      });
      const all = $('#bp-all', el);
      if (all) all.onclick = async () => {
        all.disabled = true;
        let got = 0;
        for (let l = 1; l <= S.profile.bp.level; l++) {
          for (const track of ['free', 'premium']) {
            const pr = S.profile;
            if (track === 'premium' && !pr.bp.premium) continue;
            if ((track === 'free' ? pr.bp.free : pr.bp.prem).includes(l)) continue;
            try {
              const r = await DD.net.req('bp_claim', { level: l, track });
              S.profile = r.profile;
              got++;
            } catch (e) { UI.toast(e.message, 'err'); }
          }
        }
        DD.sfx.play('upgrade');
        UI.setProfile(S.profile);
        UI.toast(`Получено наград: ${got}`, 'ok');
      };
      const buy = $('#bp-buy', el);
      if (buy) buy.onclick = () => P.buy('bp_premium');
    },

    // ============================================================ SHOP
    r_shop(el) {
      const p = S.profile, c = S.cat;
      const mode = S.server ? S.server.paymentMode : 'test';
      const keep = $('.shop', el);
      const scroll = keep ? keep.scrollTop : 0;
      const banner = mode === 'test' ? `<div class="shop-banner test"><i data-icon="info"></i>Тестовый режим сервера: покупки выдаются сразу и бесплатно, реальные деньги не списываются.</div>`
        : mode === 'manual' ? `<div class="shop-banner manual"><i data-icon="info"></i>Покупки за ₽ подтверждает администратор сервера после оплаты. Номер заказа появится после нажатия «Купить».</div>`
          : `<div class="shop-banner off"><i data-icon="info"></i>Покупки за реальные деньги на этом сервере отключены.</div>`;
      const prodIcon = (pr) => {
        switch (pr.icon) {
          case 'bp': case 'bp_plus': return `<i data-icon="pass" style="color:var(--gold);font-size:46px"></i>`;
          case 'ext1': case 'ext7': return I.crateSvg('#ff7fd8');
          case 'pack1': return I.crateSvg('#3fa9f5');
          case 'pack2': return I.crateSvg('#b46cff');
          case 'pack3': case 'loss': return I.crateSvg('#ffb52e');
          case 'coins': return `<i data-icon="coin" style="font-size:46px"></i>`;
          default: return `<i data-icon="gem" style="font-size:${30 + (+(pr.icon.replace('gems', '')) || 1) * 4}px"></i>`;
        }
      };
      const prod = (id, extraCls) => {
        const pr = c.products[id];
        if (!pr) return '';
        const owned = (id === 'bp_premium' || id === 'bp_premium_plus') && p.bp.premium;
        let note = '';
        if (id === 'reward_week' && p.daily.extUntil > UI.now()) note = `<small style="color:var(--green)">Активно ещё ${UI.fmtTime(p.daily.extUntil - UI.now())}</small>`;
        return `<div class="offer ${extraCls || ''} ${owned ? 'owned' : ''}"><div class="opic">${prodIcon(pr)}</div><b>${esc(pr.name)}</b><small>${esc(pr.desc)}</small>${note}
          <button class="btn ${owned ? 'btn-ghost' : 'btn-gold'}" data-buy="${id}" ${owned || mode === 'off' ? 'disabled' : ''}>${owned ? 'Куплено' : pr.price + ' ₽'}</button></div>`;
      };
      const gemItem = (g) => {
        const owned = g.reward.type === 'skin' && p.skins.includes(g.reward.id);
        return `<div class="offer ${owned ? 'owned' : ''}"><div class="opic">${UI.rewardIcon(g.reward)}</div><b>${esc(g.name)}</b>
          <button class="btn ${owned ? 'btn-ghost' : 'btn-pink'}" data-gemitem="${g.id}" ${owned ? 'disabled' : ''}>${owned ? 'Есть' : gemI() + g.price}</button></div>`;
      };
      const loss = p.lossOfferUntil > UI.now() ? c.products.loss_bonus : null;
      el.innerHTML = `<div class="shop scroll">${banner}
        ${loss ? `<div class="offer hot big" style="margin-bottom:8px"><span class="ribbon">ТОЛЬКО СЕЙЧАС</span><div class="opic">${prodIcon(loss)}</div>
          <div class="otext"><b>${esc(loss.name)}</b><small>${esc(loss.desc)}</small><small>Осталось: <b class="timer" data-until="${p.lossOfferUntil}">${UI.fmtTime(p.lossOfferUntil - UI.now())}</b></small></div>
          <div style="width:140px"><button class="btn btn-gold" data-buy="loss_bonus" ${mode === 'off' ? 'disabled' : ''}>${loss.price} ₽</button></div></div>` : ''}
        <h3>Предложения</h3><div class="shop-grid">${prod('bp_premium', 'hot')}${prod('bp_premium_plus')}${prod('reward_day')}${prod('reward_week')}</div>
        <h3>Ящики</h3><div class="shop-grid">${prod('pack_rare')}${prod('pack_epic')}${prod('pack_legend', 'hot')}${c.gemItemList.filter(g => g.reward.type === 'crate').map(gemItem).join('')}</div>
        <h3 id="shop-currency">Жемчуг и монеты</h3><div class="shop-grid">${c.productList.filter(x => x.section === 'currency').map(x => prod(x.id)).join('')}${c.gemItemList.filter(g => g.reward.type === 'coins').map(gemItem).join('')}</div>
        <h3>Окраски</h3><div class="shop-grid">${c.gemItemList.filter(g => g.reward.type === 'skin').map(gemItem).join('')}</div>
        <div class="hint">Покупки зачисляются на аккаунт на этом сервере. <button class="btn btn-ghost btn-sm" id="my-orders">Мои заказы</button></div>
      </div>`;
      $('.shop', el).scrollTop = scroll;
      $$('[data-buy]', el).forEach(b => b.onclick = () => P.buy(b.dataset.buy));
      $$('[data-gemitem]', el).forEach(b => b.onclick = () => P.gemBuy(b.dataset.gemitem));
      $('#my-orders', el).onclick = () => P.ordersModal();
    },

    scrollShop(id) {
      const t = $('#shop-' + id);
      const sc = $('#pg-shop .shop');
      if (t && sc) sc.scrollTop = t.offsetTop - 8;
    },

    tickTimers() {
      $$('[data-until]').forEach(t => {
        const left = +t.dataset.until - UI.now();
        if (left <= 0) { if (P.current === 'shop') P.refresh(); return; }
        t.textContent = UI.fmtTime(left);
      });
      UI.renderTopbar();
    },

    async buy(id, param, paramName) {
      const pr = S.cat.products[id];
      if (!pr) return;
      const mode = S.server ? S.server.paymentMode : 'test';
      if (mode === 'off') { UI.toast('Покупки на этом сервере отключены', 'err'); return; }
      const note = mode === 'test' ? '<div class="hint">Тестовый режим: деньги не списываются, товар выдаётся сразу.</div>'
        : '<div class="hint">После нажатия создастся заказ. Администратор сервера выдаст товар после оплаты.</div>';
      const ok = await UI.confirm(`<div class="row" style="gap:14px"><div style="width:70px;height:60px">${pr.icon === 'upgrade' ? `<i data-icon="up" style="font-size:52px;color:var(--green)"></i>` : ''}</div>
        <div><b style="font-size:16px">${esc(pr.name)}${paramName ? ': ' + esc(paramName) : ''}</b><div class="muted">${esc(pr.desc)}</div></div></div>${note}`,
      `Купить за ${pr.price} ₽`, { title: 'Покупка' });
      if (!ok) return;
      const r = await UI.run(null, () => DD.net.req('buy', { product: id, param: param || '' }));
      if (!r) return;
      UI.setProfile(r.profile);
      if (r.result.status === 'granted') {
        DD.sfx.play('upgrade');
        UI.vibrate(40);
        const given = (r.result.given || []).filter(g => g.type && ['coins', 'gems', 'crate', 'skin'].includes(g.type));
        const up = (r.result.given || []).find(g => g.part);
        const sub = up ? `${pr.name}: ${S.cat.parts[up.part].name} — уровень ${up.level}` : pr.name;
        P.rewardsModal('Покупка получена!', given, sub);
        if (up) P.levelUps(up.levelUps);
      } else {
        const m = UI.modal(`<h2>Заказ №${r.result.orderId} создан</h2><div>«${esc(pr.name)}» за ${pr.price} ₽.</div>
          <div class="hint">Свяжитесь с владельцем сервера для оплаты и назовите номер заказа. Товар появится сразу после подтверждения.</div>
          <div class="modal-actions"><button class="btn btn-gold" data-ok>Понятно</button></div>`);
        $('[data-ok]', m.el).onclick = () => m.close();
      }
    },

    async gemBuy(itemId) {
      const g = S.cat.gemItems[itemId];
      if (!g) return;
      if (S.profile.gems < g.price) {
        UI.toast('Не хватает жемчуга', 'err');
        P.show('shop');
        setTimeout(() => P.scrollShop('currency'), 50);
        return;
      }
      const ok = await UI.confirm(`Купить «${esc(g.name)}» за ${g.price} жемчуга?`, 'Купить', { cls: 'btn-pink' });
      if (!ok) return;
      const r = await UI.run(null, () => DD.net.req('gem_buy', { item: itemId }));
      if (!r) return;
      DD.sfx.play('coin');
      UI.setProfile(r.profile);
      if (g.reward.type === 'crate') {
        const go = await UI.confirm(`${esc(UI.rewardLabel(g.reward))} получен. Открыть сейчас?`, 'Открыть', { title: 'Готово!', cls: 'btn-teal' });
        if (go) P.openCrate(g.reward.id);
      } else UI.toast('Получено: ' + UI.rewardLabel(r.result.reward), 'ok');
    },

    rewardsModal(title, list, sub) {
      const rows = (list || []).map(g => `<div class="reward-row"><span class="ic">${UI.rewardIcon(g)}</span><div><b>${esc(UI.rewardLabel(g))}</b></div></div>`).join('');
      const m = UI.modal(`<h2>${esc(title)}</h2>${sub ? `<div class="muted" style="margin-bottom:8px">${esc(sub)}</div>` : ''}
        <div style="display:flex;flex-direction:column;gap:6px">${rows || '<div class="muted">Готово!</div>'}</div>
        <div class="modal-actions"><button class="btn btn-gold" data-ok>Отлично</button></div>`);
      $('[data-ok]', m.el).onclick = () => m.close();
    },

    async ordersModal() {
      const r = await UI.run(null, () => DD.net.req('my_orders'));
      if (!r) return;
      const st = { pending: 'ожидает оплаты', granted: 'выдан', rejected: 'отклонён' };
      UI.modal(`<h2>Мои заказы</h2><div class="admin-orders">${r.orders.length ? r.orders.slice().reverse().map(o => `<div class="order ${o.status}"><div><b>№${o.id} · ${esc(o.productName)}</b><br><small>${new Date(o.created).toLocaleString('ru-RU')} · ${o.price} ₽</small></div><div><b>${st[o.status] || o.status}</b></div></div>`).join('') : '<div class="muted">Заказов пока нет</div>'}</div>`);
    },

    // ============================================================ RATING
    async r_rating(el) {
      if (!P.lb || Date.now() - P.lbTime > 8000) {
        el.innerHTML = `<div class="page-title">Рейтинг капитанов</div><div class="muted">Загрузка…</div>`;
        try {
          P.lb = await DD.net.req('leaderboard');
          P.lbTime = Date.now();
        } catch (e) {
          el.innerHTML = `<div class="page-title">Рейтинг капитанов</div><div class="muted">${esc(e.message)}</div>`;
          return;
        }
        if (P.current !== 'rating') return;
      }
      const d = P.lb, c = S.cat;
      el.innerHTML = `<div class="rating"><div class="page-title">Рейтинг капитанов <small>Ваше место: ${d.myRank} из ${d.total}</small></div>
        <div class="lb scroll">${d.top.map(r => {
          const lg = c.leagues[r.league];
          return `<div class="lb-row ${r.me ? 'me' : ''}"><span class="rk">${r.rank}</span>${I.shieldSvg(lg.color, r.league + 1).replace('<svg', '<svg class="shield"')}
            <span class="nm"><b>${esc(r.name)}</b>${r.online ? '<span class="on"></span>' : ''}<small>${esc(lg.name)} · ур. ${r.level}</small></span>
            <span class="tr"><i data-icon="trophy"></i>${UI.fmt(r.trophies)}</span></div>`;
        }).join('')}</div></div>`;
      I.hydrate(el);
    },

    // ============================================================ PROFILE / SETTINGS / ADMIN
    profileModal() {
      const p = S.profile, c = S.cat;
      const lg = UI.league(p.trophies);
      const leagues = c.leagues.map((l, i) => `<div class="lb-row ${i === lg.idx ? 'me' : ''}" style="grid-template-columns:30px 1fr auto">${I.shieldSvg(l.color, i + 1).replace('<svg', '<svg class="shield"')}<span class="nm"><b style="color:${l.color}">${esc(l.name)}</b></span><span class="tr"><i data-icon="trophy"></i>${UI.fmt(l.min)}+</span></div>`).join('');
      const total = p.stats.wins + p.stats.losses + p.stats.draws;
      UI.modal(`<h2>Капитан ${esc(p.name)}</h2>
        <div class="settings-grid"><div>
          <table class="stats-table"><tr><td>Уровень</td><td>${p.level} (${p.xp}/${p.xpNext})</td></tr>
          <tr><td>Кубки</td><td>${UI.fmt(p.trophies)}</td></tr><tr><td>Рекорд</td><td>${UI.fmt(p.maxTrophies)}</td></tr>
          <tr><td>Боёв</td><td>${total}</td></tr><tr><td>Побед</td><td>${p.stats.wins}${total ? ' (' + Math.round(p.stats.wins / total * 100) + '%)' : ''}</td></tr>
          <tr><td>Поражений</td><td>${p.stats.losses}</td></tr><tr><td>Оружия</td><td>${Object.keys(p.weapons).length} / ${c.weaponList.length}</td></tr></table>
          <div class="hint">Победа даёт кубки, поражение их отнимает. Кубки определяют лигу и соперников.</div>
        </div><div style="display:flex;flex-direction:column;gap:4px">${leagues}</div></div>`, { wide: true });
    },

    settingsModal() {
      const st = S.settings, p = S.profile;
      const android = !!window.DeepDuelAndroid;
      const m = UI.modal(`<h2>Настройки</h2>
        <div class="settings-grid">
          <div>
            <div class="field-label">Имя капитана</div>
            <div class="row"><input class="input" id="set-name" maxlength="16" value="${esc(p.name)}"><button class="btn btn-teal btn-sm" id="set-name-ok">OK</button></div>
            <div class="field-label">Звук и управление</div>
            <label class="toggle">Звуки <input type="checkbox" id="set-sound" ${st.sound ? 'checked' : ''}></label>
            <label class="toggle" style="margin-top:6px">Вибрация <input type="checkbox" id="set-vibro" ${st.vibro ? 'checked' : ''}></label>
            <label class="toggle" style="margin-top:6px">Экономия батареи (проще графика) <input type="checkbox" id="set-low" ${st.quality === 'low' ? 'checked' : ''}></label>
          </div>
          <div>
            <div class="field-label">Сервер</div>
            <div><b>${esc(S.server ? S.server.name : '')}</b> <span class="muted">${esc(DD.net.addr)}</span></div>
            <div class="row" style="margin-top:6px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" id="set-leave">Сменить сервер</button>
              <button class="btn btn-ghost btn-sm" id="set-admin">Админ-панель</button>
              ${android ? '<button class="btn btn-ghost btn-sm" id="set-host">Мой сервер</button>' : ''}
            </div>
            <div class="field-label">Код аккаунта</div>
            <div class="code-box" id="set-code">••••••••••••••••</div>
            <div class="row" style="margin-top:6px"><button class="btn btn-ghost btn-sm" id="set-show">Показать</button><button class="btn btn-ghost btn-sm" id="set-copy"><i data-icon="copy"></i>Копировать</button></div>
            <div class="hint">По этому коду можно войти в аккаунт с другого устройства. Никому не сообщайте его.</div>
          </div>
        </div><div class="hint">Глубинная дуэль · клиент ${DD.VERSION} · сервер ${esc(S.server ? S.server.version : '')} · пинг ${DD.net.latency} мс</div>`, { wide: true });
      const el = m.el;
      $('#set-sound', el).onchange = (e) => { st.sound = e.target.checked; DD.sfx.enabled = st.sound; DD.main.saveSettings(); };
      $('#set-vibro', el).onchange = (e) => { st.vibro = e.target.checked; DD.main.saveSettings(); };
      $('#set-low', el).onchange = (e) => { st.quality = e.target.checked ? 'low' : 'high'; DD.main.saveSettings(); };
      $('#set-name-ok', el).onclick = async (e) => {
        const r = await UI.run(e.currentTarget, () => DD.net.req('rename', { name: $('#set-name', el).value }));
        if (r) { UI.setProfile(r.profile); UI.toast('Имя изменено', 'ok'); DD.main.rememberAccount(); }
      };
      $('#set-show', el).onclick = () => { $('#set-code', el).textContent = DD.main.token || ''; };
      $('#set-copy', el).onclick = () => {
        const t = DD.main.token || '';
        const done = () => UI.toast('Код скопирован', 'ok');
        if (window.DeepDuelAndroid && window.DeepDuelAndroid.copyText) { window.DeepDuelAndroid.copyText(t); done(); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => { $('#set-code', el).textContent = t; });
        else { $('#set-code', el).textContent = t; }
      };
      $('#set-leave', el).onclick = () => { m.close(); DD.main.leaveServer(); };
      $('#set-admin', el).onclick = () => { m.close(); P.adminModal(); };
      const h = $('#set-host', el);
      if (h) h.onclick = () => { m.close(); DD.main.showHost(); };
    },

    async adminModal() {
      let key = DD.main.adminKey();
      if (!key) {
        const m = UI.modal(`<h2>Админ-панель</h2><div class="muted">Введите ключ администратора. Он показан на экране сервера (или в консоли ПК-сервера).</div>
          <div class="row" style="margin-top:10px"><input class="input" id="adm-key" placeholder="Ключ" autocapitalize="characters"><button class="btn btn-gold" id="adm-go">Войти</button></div>`);
        $('#adm-go', m.el).onclick = () => { const k = $('#adm-key', m.el).value.trim(); if (!k) return; DD.main.setAdminKey(k); m.close(); P.adminModal(); };
        return;
      }
      const A = (op, extra) => DD.net.req('admin', Object.assign({ key, op }, extra || {}));
      let stats;
      try { stats = await A('stats'); } catch (e) {
        UI.toast(e.message, 'err');
        if (/ключ/i.test(e.message)) DD.main.setAdminKey('');
        return;
      }
      const m = UI.modal(`<h2>Админ-панель сервера</h2>
        <div class="muted" id="adm-stats"></div>
        <div class="tabs"><button data-tab="orders" class="on">Заказы</button><button data-tab="players">Игроки</button><button data-tab="config">Настройки</button><button data-tab="gift">Подарок</button></div>
        <div id="adm-body"></div>`, { wide: true });
      const body = $('#adm-body', m.el);
      const showStats = (s) => {
        $('#adm-stats', m.el).innerHTML = `Игроков: <b>${s.players}</b> · онлайн: <b>${s.online}</b> · боёв идёт: <b>${s.battles}</b> · всего боёв: <b>${s.battlesPlayed}</b> · ждут подтверждения: <b>${s.pendingOrders}</b> · выручка: <b>${UI.fmt(s.revenue)} ₽</b>`;
      };
      showStats(stats);
      const tabs = {
        async orders() {
          const r = await A('orders');
          const st = { pending: 'ожидает', granted: 'выдан', rejected: 'отклонён' };
          body.innerHTML = `<div class="admin-orders">${r.orders.length ? r.orders.map(o => `<div class="order ${o.status}"><div><b>№${o.id} · ${esc(o.productName)}${o.param ? ' (' + esc(o.param) + ')' : ''}</b><br>
            <small>${esc(o.player)} · ${o.price} ₽ · ${new Date(o.created).toLocaleString('ru-RU')}${o.test ? ' · тест' : ''}</small></div>
            <div class="row">${o.status === 'pending' ? `<button class="btn btn-teal btn-sm" data-ap="${o.id}">Выдать</button><button class="btn btn-red btn-sm" data-rj="${o.id}">Отклонить</button>` : `<small>${st[o.status]}</small>`}</div></div>`).join('') : '<div class="muted">Заказов нет</div>'}</div>`;
          $$('[data-ap]', body).forEach(b => b.onclick = async () => { if (await UI.run(b, () => A('approve', { order: +b.dataset.ap }))) { UI.toast('Товар выдан', 'ok'); tabs.orders(); showStats(await A('stats')); } });
          $$('[data-rj]', body).forEach(b => b.onclick = async () => { if (await UI.run(b, () => A('reject', { order: +b.dataset.rj }))) { tabs.orders(); showStats(await A('stats')); } });
        },
        async players() {
          const r = await A('players');
          body.innerHTML = `<div class="admin-orders">${r.players.map(p => `<div class="order"><div><b>${esc(p.name)}</b>${p.online ? ' <span style="color:var(--green)">● онлайн</span>' : ''}<br>
            <small>ур. ${p.level} · кубки ${p.trophies} · монеты ${UI.fmt(p.coins)} · жемчуг ${UI.fmt(p.gems)} · потрачено ${p.spent} ₽</small></div>
            <div><button class="btn btn-ghost btn-sm" data-gift="${esc(p.name)}">Подарок</button></div></div>`).join('')}</div>`;
          $$('[data-gift]', body).forEach(b => b.onclick = () => { tabs.gift(b.dataset.gift); setTab('gift', true); });
        },
        async config() {
          const s = await A('stats');
          const c = s.config;
          const field = (k, label, v) => `<div class="field-label">${label}</div><div class="row"><input class="input" data-k="${k}" value="${esc(v)}"><button class="btn btn-teal btn-sm" data-save="${k}">Сохранить</button></div>`;
          body.innerHTML = `<div class="settings-grid"><div>
            <div class="field-label">Режим оплаты</div>
            <div class="row" style="flex-wrap:wrap">${['test', 'manual', 'off'].map(x => `<button class="btn btn-sm ${c.paymentMode === x ? 'btn-gold' : 'btn-ghost'}" data-mode="${x}">${{ test: 'Тест (бесплатно)', manual: 'Ручное подтверждение', off: 'Выключены' }[x]}</button>`).join('')}</div>
            <div class="hint">«Тест» — товары выдаются бесплатно (для проверки). «Ручное» — игрок создаёт заказ, вы получаете оплату и нажимаете «Выдать».</div>
            ${field('serverName', 'Название сервера', c.serverName)}</div><div>
            ${field('dailyCrateLimit', 'Ящиков за бои в день', c.dailyCrateLimit)}
            ${field('extendedDailyCrateLimit', 'Лимит с продлением на 7 дней', c.extendedDailyCrateLimit)}
            ${field('botWaitSeconds', 'Бот, если нет соперника, через (сек, 0 — никогда)', c.botWaitSeconds)}
            ${field('battleSeconds', 'Длительность боя (сек)', c.battleSeconds)}
            ${field('lossOfferMinutes', 'Утешительный набор доступен (мин)', c.lossOfferMinutes)}</div></div>`;
          $$('[data-mode]', body).forEach(b => b.onclick = async () => {
            if (await UI.run(b, () => A('set_config', { name: 'paymentMode', value: b.dataset.mode }))) { if (S.server) S.server.paymentMode = b.dataset.mode; UI.toast('Сохранено', 'ok'); tabs.config(); }
          });
          $$('[data-save]', body).forEach(b => b.onclick = async () => {
            const k = b.dataset.save;
            const v = $(`[data-k="${k}"]`, body).value;
            if (await UI.run(b, () => A('set_config', { name: k, value: v }))) UI.toast('Сохранено', 'ok');
          });
        },
        gift(name) {
          body.innerHTML = `<div class="settings-grid"><div>
            <div class="field-label">Имя игрока</div><input class="input" id="g-name" value="${esc(name || '')}" style="width:100%">
            <div class="field-label">Монеты</div><input class="input" id="g-coins" value="0" inputmode="numeric" style="width:100%">
            <div class="field-label">Жемчуг</div><input class="input" id="g-gems" value="0" inputmode="numeric" style="width:100%"></div><div>
            <div class="field-label">Ящик</div><div class="row" style="flex-wrap:wrap">${['', 'common', 'rare', 'epic', 'legendary'].map(x => `<button class="btn btn-sm btn-ghost" data-cr="${x}">${x ? esc(S.cat.crates[x].name) : 'нет'}</button>`).join('')}</div>
            <div class="field-label">Сколько ящиков</div><input class="input" id="g-cn" value="1" inputmode="numeric" style="width:100%">
            <button class="btn btn-gold btn-wide" id="g-send" style="margin-top:14px">Отправить подарок</button></div></div>`;
          let crate = '';
          $$('[data-cr]', body).forEach(b => b.onclick = () => { crate = b.dataset.cr; $$('[data-cr]', body).forEach(x => x.classList.toggle('btn-teal', x === b)); });
          $('#g-send', body).onclick = async (e) => {
            const r = await UI.run(e.currentTarget, () => A('grant', { name: $('#g-name', body).value.trim(), coins: +$('#g-coins', body).value || 0, gems: +$('#g-gems', body).value || 0, crate, crates: +$('#g-cn', body).value || 1 }));
            if (r) UI.toast('Подарок отправлен', 'ok');
          };
        },
      };
      const setTab = (t, noRender) => {
        $$('.tabs button', m.el).forEach(b => b.classList.toggle('on', b.dataset.tab === t));
        if (!noRender) tabs[t]().catch(e => UI.toast(e.message, 'err'));
      };
      $$('.tabs button', m.el).forEach(b => b.onclick = () => setTab(b.dataset.tab));
      setTab('orders');
    },

    // ============================================================ QUEUE & RESULT
    showQueue(onCancel) {
      P.hideQueue();
      const root = document.createElement('div');
      root.className = 'queue';
      root.id = 'queue';
      root.innerHTML = `<div class="queue-box panel"><div class="radar"></div><b style="font-size:18px">Поиск соперника…</b>
        <div class="qt" id="q-time">0:00</div><div class="muted" id="q-info">Ищем капитана с похожим числом кубков</div>
        <button class="btn btn-ghost" id="q-cancel">Отмена</button></div>`;
      $('#modal-root').appendChild(root);
      const t0 = Date.now();
      P._qTimer = setInterval(() => { const el = $('#q-time'); if (el) el.textContent = UI.fmtTime(Date.now() - t0); }, 250);
      $('#q-cancel', root).onclick = () => { P.hideQueue(); onCancel(); };
    },
    queueInfo(m) {
      const el = $('#q-info');
      if (!el) return;
      const bot = m.botAfter > 0 ? (m.waited < m.botAfter ? ` · бот через ${m.botAfter - m.waited} с` : ' · подбираем бота') : '';
      el.textContent = `Онлайн: ${m.online} · ищут бой: ${m.searching}${bot}`;
    },
    hideQueue() {
      clearInterval(P._qTimer);
      const q = $('#queue');
      if (q) q.remove();
    },

    showResult(res, onClose) {
      const c = S.cat, p = S.profile;
      const outcome = res.outcome;
      const title = outcome > 0 ? 'ПОБЕДА!' : outcome < 0 ? 'ПОРАЖЕНИЕ' : 'НИЧЬЯ';
      const cls = outcome > 0 ? 'win' : outcome < 0 ? 'lose' : 'draw';
      const reason = { destroyed: outcome > 0 ? 'Подлодка противника уничтожена' : outcome < 0 ? 'Ваша подлодка уничтожена' : 'Обе подлодки уничтожены', time: 'Время вышло — победа по прочности', surrender: outcome > 0 ? 'Противник сдался' : 'Вы сдались' }[res.reason] || '';
      const rows = [];
      if (res.limitReached) {
        rows.push(`<div class="reward-row warn"><span class="ic">${I.crateSvg('#555')}</span><div><b>Лимит наград исчерпан (${res.dailyUsed}/${res.dailyLimit})</b><small>Ящики и монеты за бои вернутся завтра</small></div>
          <button class="btn btn-pink btn-sm" id="res-ext">+10</button></div>`);
      } else {
        rows.push(`<div class="reward-row"><span class="ic">${I.get('coin')}</span><div><b>+${UI.fmt(res.coins)} монет</b><small>за бой</small></div></div>`);
        if (res.crate) rows.push(`<div class="reward-row"><span class="ic">${I.crateSvg(c.crates[res.crate].color)}</span><div><b>${esc(c.crates[res.crate].name)}</b><small>ящиков за сегодня: ${res.dailyUsed} / ${res.dailyLimit}</small></div><button class="btn btn-teal btn-sm" id="res-open">Открыть</button></div>`);
      }
      rows.push(`<div class="reward-row"><span class="ic"><i data-icon="pass" style="color:var(--gold)"></i></span><div><b>+${res.bpXp} опыта пропуска</b><small>${res.bpLevelUp ? 'Новый уровень пропуска: ' + p.bp.level + '!' : 'уровень пропуска ' + p.bp.level}</small></div></div>`);
      const lb = c.products.loss_bonus;
      const offer = outcome < 0 && res.lossOfferUntil && lb && S.server && S.server.paymentMode !== 'off';
      const root = document.createElement('div');
      root.className = 'result';
      root.innerHTML = `<div class="result-box">
        <div class="result-main">
          <div class="result-title ${cls}">${title}</div>
          <div class="muted">${esc(reason)} · соперник: ${esc(res.oppName)}</div>
          <div class="result-trophy ${outcome >= 0 ? 'plus' : 'minus'}"><i data-icon="trophy"></i>${res.trophies > 0 ? '+' : ''}${res.trophies} <span class="muted" style="font-size:14px">(всего ${UI.fmt(res.trophiesNow)})</span></div>
          ${res.oppBot ? '<div class="muted" style="font-size:11px">Бой с ботом: кубки ×0.5</div>' : ''}
          <div class="result-stats"><div><b>${UI.fmt(res.damage)}</b>урон</div><div><b>${res.hits}/${res.shots}</b>попаданий</div><div><b>${UI.fmt(res.taken)}</b>получено</div></div>
          <div class="row" style="margin-top:8px"><button class="btn btn-ghost" id="res-home">В порт</button><button class="btn btn-gold" id="res-again">Ещё бой</button></div>
        </div>
        <div class="result-side">${rows.join('')}
          ${offer ? `<div class="loss-offer"><b>Не повезло? ${esc(lb.name)}!</b><small>${esc(lb.desc)}</small>
            <div class="row"><span class="muted">Осталось <span class="timer" data-until="${res.lossOfferUntil}">${UI.fmtTime(res.lossOfferUntil - UI.now())}</span></span><div class="spacer"></div><button class="btn btn-gold btn-sm" id="res-loss">${lb.price} ₽</button></div></div>` : ''}
        </div></div>`;
      $('#modal-root').appendChild(root);
      I.hydrate(root);
      DD.sfx.play(outcome > 0 ? 'win' : outcome < 0 ? 'lose' : 'count');
      const timer = setInterval(() => {
        $$('[data-until]', root).forEach(t => { const left = +t.dataset.until - UI.now(); t.textContent = left > 0 ? UI.fmtTime(left) : '0:00'; });
      }, 1000);
      const close = (again) => { clearInterval(timer); root.remove(); onClose(again); };
      $('#res-home', root).onclick = () => close(false);
      $('#res-again', root).onclick = () => close(true);
      const op = $('#res-open', root);
      if (op) op.onclick = () => { close(false); P.show('crates'); P.openCrate(res.crate); };
      const ext = $('#res-ext', root);
      if (ext) ext.onclick = () => P.buy('reward_day');
      const ls = $('#res-loss', root);
      if (ls) ls.onclick = () => P.buy('loss_bonus');
    },
  };

  DD.pages = P;
})();
