/* Boot, connection flow, account handling, host-server screen (Android) and battle wiring. */
window.DD = window.DD || {};
DD.VERSION = '1.0.0';
(function () {
  const UI = DD.ui, $ = UI.$, $$ = UI.$$, esc = UI.esc, S = UI.state;
  const A = () => window.DeepDuelAndroid || null;

  const store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  const M = {
    token: null,
    serverId: null,
    hostTimer: null,
    pendingEnd: null,

    init() {
      Object.assign(S.settings, store.get('dd_settings', {}));
      DD.sfx.enabled = S.settings.sound;
      UI.BG.init();
      DD.icons.hydrate();
      DD.pages.init();
      DD.battle.init();
      M.logoStage = new DD.SubStage(M.makeCanvas($('#logo-sub')), { water: false, scale: 1.1 });

      if (A()) $('#host-block').classList.remove('hidden');
      $('#btn-host').onclick = () => { DD.sfx.init(); M.showHost(); };
      $('#btn-connect').onclick = () => { DD.sfx.init(); M.goFullscreen(); M.connect($('#inp-addr').value); };
      $('#inp-addr').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-connect').click(); });
      $('#btn-register').onclick = (e) => M.register(e.currentTarget);
      $('#inp-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-register').click(); });
      $('#btn-restore').onclick = () => M.restoreModal();
      $$('[data-back]').forEach(b => b.addEventListener('click', () => { DD.sfx.play('click', 0.5); if (b.dataset.back === 'connect') M.leaveServer(); else UI.show(b.dataset.back); }));
      $('#btn-host-toggle').onclick = () => M.toggleHost();
      $('#btn-host-play').onclick = () => {
        const port = +$('#inp-port').value || 8765;
        M.connect('127.0.0.1:' + port);
      };

      const N = DD.net;
      N.on('profile', (m) => UI.setProfile(m.profile));
      N.on('notice', (m) => UI.toast(m.text, 'ok'));
      N.on('kicked', (m) => { N.close(); UI.toast(m.text, 'err'); M.leaveServer(); });
      N.on('queue', (m) => DD.pages.queueInfo(m));
      N.on('match', (m) => M.onMatch(m));
      N.on('s', (m) => DD.battle.onSnapshot(m));
      N.on('end', (m) => M.onEnd(m));
      N.onDisconnect = () => {
        $('#overlay-conn').classList.remove('hidden');
        $('#overlay-conn-text').textContent = 'Связь с сервером потеряна. Переподключение…';
      };
      N.onReconnect = async () => {
        $('#overlay-conn-text').textContent = 'Вход…';
        try {
          await M.auth(true);
        } catch (e) {
          UI.toast(e.message, 'err');
        }
        $('#overlay-conn').classList.add('hidden');
      };
      window.ddBack = M.back;
      $('#overlay-conn-cancel').onclick = () => { $('#overlay-conn').classList.add('hidden'); M.leaveServer(); };
      document.addEventListener('visibilitychange', () => { if (document.hidden) DD.battle.input.f = false; });

      M.renderRecent();
      // Opened from a game server in a browser -> connect to it directly
      const servedByGame = /^https?:$/.test(location.protocol) && location.hostname !== 'appassets.androidplatform.net' && !A();
      if (servedByGame) {
        $('#inp-addr').value = location.host;
        $('#connect-hint').textContent = 'Вы открыли игру с сервера ' + location.host + '. Нажмите «Войти».';
        M.connect(location.host, true);
      } else {
        const recent = store.get('dd_recent', []);
        if (recent.length) $('#inp-addr').value = recent[0].addr;
        UI.show('connect');
        if (recent.length && store.get('dd_autoconnect', true)) M.connect(recent[0].addr, true);
      }
    },

    makeCanvas(host) {
      const c = document.createElement('canvas');
      host.appendChild(c);
      return c;
    },

    saveSettings() { store.set('dd_settings', S.settings); },

    goFullscreen() {
      if (A()) return;
      try {
        const el = document.documentElement;
        if (!document.fullscreenElement && el.requestFullscreen && matchMedia('(pointer: coarse)').matches) {
          el.requestFullscreen().then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
        }
      } catch (e) {}
    },

    // ------------------------------------------------------------ recent servers
    renderRecent() {
      const list = store.get('dd_recent', []);
      const box = $('#recent');
      box.innerHTML = list.slice(0, 5).map((r, i) => `<button data-i="${i}"><b>${esc(r.name || 'Сервер')}</b><span>${esc(r.addr)}</span><span class="x" data-x="${i}">✕</span></button>`).join('');
      $$('button', box).forEach(b => b.onclick = (e) => {
        const i = +b.dataset.i;
        if (e.target.dataset.x != null) {
          list.splice(i, 1);
          store.set('dd_recent', list);
          M.renderRecent();
          return;
        }
        DD.sfx.init();
        M.goFullscreen();
        $('#inp-addr').value = list[i].addr;
        M.connect(list[i].addr);
      });
    },

    addRecent(addr, name, serverId) {
      let list = store.get('dd_recent', []);
      list = list.filter(r => r.addr !== addr && (!serverId || r.serverId !== serverId || r.addr === addr));
      list.unshift({ addr, name, serverId, t: Date.now() });
      store.set('dd_recent', list.slice(0, 8));
    },

    // ------------------------------------------------------------ connection & accounts
    async connect(addr, silent) {
      addr = (addr || '').trim();
      if (!addr) { UI.toast('Введите адрес сервера', 'err'); return; }
      const ov = $('#overlay-conn');
      ov.classList.remove('hidden');
      $('#overlay-conn-text').textContent = 'Подключение к ' + DD.net.normAddr(addr) + '…';
      try {
        const w = await DD.net.connect(addr);
        M.serverId = w.serverId;
        M.serverName = w.name;
        M.addRecent(DD.net.addr, w.name, w.serverId);
        store.set('dd_autoconnect', true);
        if (A() && /^(127\.0\.0\.1|localhost)(:|$)/.test(DD.net.addr)) {
          try {
            const info = JSON.parse(A().serverInfo());
            if (info.adminKey) M.setAdminKey(info.adminKey);
          } catch (e) {}
        }
        const acc = store.get('dd_accounts', {})[w.serverId];
        if (acc && acc.token) {
          M.token = acc.token;
          try {
            await M.auth(false);
          } catch (e) {
            if (e.message === 'unknown_token') {
              M.forgetAccount();
              M.showRegister();
            } else throw e;
          }
        } else {
          M.showRegister();
        }
      } catch (e) {
        DD.net.close();
        if (!silent) UI.toast(e.message || 'Не удалось подключиться', 'err');
        else store.set('dd_autoconnect', false);
        UI.show('connect');
        M.renderRecent();
      } finally {
        ov.classList.add('hidden');
      }
    },

    showRegister() {
      $('#reg-server').textContent = (M.serverName || '') + ' (' + DD.net.addr + ')';
      UI.show('register');
      setTimeout(() => $('#inp-name').focus(), 100);
    },

    async auth(reconnect) {
      const d = await DD.net.req('auth', { token: M.token });
      M.enter(d, reconnect);
    },

    async register(btn) {
      const name = $('#inp-name').value.trim();
      DD.sfx.init();
      const d = await UI.run(btn, () => DD.net.req('register', { name }));
      if (!d) return;
      M.token = d.token;
      M.rememberAccount(d.profile.name);
      M.enter(d, false);
      DD.sfx.play('upgrade');
      setTimeout(() => UI.toast('Добро пожаловать на борт, капитан! В «Ящиках» вас ждут 2 подарка.', 'ok'), 400);
    },

    rememberAccount(name) {
      const accs = store.get('dd_accounts', {});
      accs[M.serverId] = { token: M.token, name: name || (S.profile && S.profile.name) || '' };
      store.set('dd_accounts', accs);
    },

    forgetAccount() {
      const accs = store.get('dd_accounts', {});
      delete accs[M.serverId];
      store.set('dd_accounts', accs);
      M.token = null;
    },

    restoreModal() {
      const m = UI.modal(`<h2>Вход по коду аккаунта</h2><div class="muted">Код можно посмотреть в настройках на старом устройстве.</div>
        <div class="row" style="margin-top:10px"><input class="input" id="rs-code" placeholder="Код аккаунта" autocomplete="off"><button class="btn btn-gold" id="rs-go">Войти</button></div>`);
      $('#rs-go', m.el).onclick = async (e) => {
        const code = $('#rs-code', m.el).value.trim();
        if (!code) return;
        M.token = code;
        const d = await UI.run(e.currentTarget, () => DD.net.req('auth', { token: code }));
        if (!d) { M.token = null; return; }
        m.close();
        M.rememberAccount(d.profile.name);
        M.enter(d, false);
      };
    },

    enter(d, reconnect) {
      if (d.token) M.token = d.token;
      UI.setCatalog(d.catalog);
      S.server = d.server;
      M.rememberAccount(d.profile.name);
      const inBattle = S.screen === 'battle' && DD.battle.active;
      UI.setProfile(d.profile);
      if (!inBattle) {
        UI.show('main');
        DD.pages.show(reconnect ? DD.pages.current : 'home');
      }
    },

    leaveServer() {
      DD.net.close();
      DD.battle.stop();
      DD.pages.hideQueue();
      $('#modal-root').innerHTML = '';
      store.set('dd_autoconnect', false);
      S.profile = null;
      UI.show('connect');
      M.renderRecent();
    },

    adminKey() {
      return (store.get('dd_admin', {}))[M.serverId] || '';
    },
    setAdminKey(k) {
      const a = store.get('dd_admin', {});
      if (k) a[M.serverId] = k; else delete a[M.serverId];
      store.set('dd_admin', a);
    },

    // ------------------------------------------------------------ battle flow
    async queue() {
      if (!DD.net.connected) { UI.toast('Нет связи с сервером', 'err'); return; }
      try {
        const r = await DD.net.req('queue_join');
        DD.pages.showQueue(() => DD.net.req('queue_leave').catch(() => {}));
        DD.pages.queueInfo({ online: r.online, searching: 1, waited: 0, botAfter: r.botAfter });
      } catch (e) {
        UI.toast(e.message, 'err');
      }
    },

    onMatch(m) {
      DD.pages.hideQueue();
      $$('#modal-root > .modal-back').forEach(x => x.remove());
      DD.sfx.play('found');
      UI.vibrate(60);
      DD.battle.start(m);
    },

    onEnd(m) {
      UI.setProfile(m.profile);
      DD.battle.finale(m.result);
      setTimeout(() => {
        DD.battle.stop();
        UI.show('main');
        DD.pages.show('home');
        DD.pages.showResult(m.result, (again) => { if (again) M.queue(); });
      }, 1600);
    },

    /** Android back button. Returns true when handled. */
    back() {
      const modals = $$('#modal-root > *');
      if (modals.length) {
        const top = modals[modals.length - 1];
        if (top.id === 'queue') { $('#q-cancel').click(); return true; }
        if (top.classList.contains('result')) { $('#res-home', top).click(); return true; }
        if (top.classList.contains('opening')) return true;
        top.remove();
        return true;
      }
      if (S.screen === 'battle') { $('#btn-surrender').click(); return true; }
      if (S.screen === 'main' && DD.pages.current !== 'home') { DD.pages.show('home'); return true; }
      if (S.screen === 'host' || S.screen === 'register') { UI.show('connect'); return true; }
      return false;
    },

    // ------------------------------------------------------------ host server (Android only)
    showHost() {
      if (!A()) return;
      UI.show('host');
      M.updateHost();
      clearInterval(M.hostTimer);
      M.hostTimer = setInterval(() => { if (S.screen === 'host') M.updateHost(); else clearInterval(M.hostTimer); }, 1000);
    },

    updateHost() {
      let info;
      try { info = JSON.parse(A().serverInfo()); } catch (e) { return; }
      const st = $('#host-status');
      st.classList.toggle('on', info.running);
      $('b', st).textContent = info.running ? 'Сервер работает' : 'Сервер выключен';
      $('#btn-host-toggle').textContent = info.running ? 'Остановить' : 'Запустить';
      $('#btn-host-toggle').className = 'btn ' + (info.running ? 'btn-red' : 'btn-gold');
      $('#btn-host-play').disabled = !info.running;
      $('#inp-port').disabled = info.running;
      if (info.port && info.running) $('#inp-port').value = info.port;
      const ips = info.ips || [];
      $('#host-ips').innerHTML = info.running ? (ips.length ? ips.map(x => `<div class="ip">${esc(x.ip)}:${info.port}<small>${esc(x.name)}</small></div>`).join('') : '<div class="muted">Нет сети. Включите Wi-Fi или точку доступа.</div>') : '<div class="muted">—</div>';
      $('#host-admin').textContent = info.running ? info.adminKey : '—';
      $('#host-stats').textContent = info.running ? `Игроков на сервере: ${info.players} · онлайн: ${info.online} · боёв идёт: ${info.battles}` : 'Данные игроков хранятся в памяти приложения на этом телефоне.';
    },

    toggleHost() {
      let info;
      try { info = JSON.parse(A().serverInfo()); } catch (e) { info = { running: false }; }
      if (info.running) {
        UI.confirm('Остановить сервер? Все игроки будут отключены.', 'Остановить', { cls: 'btn-red' }).then(ok => {
          if (!ok) return;
          if (DD.net.connected && /^(127\.0\.0\.1|localhost)/.test(DD.net.addr)) DD.net.close();
          A().stopServer();
          setTimeout(M.updateHost, 300);
        });
        return;
      }
      const port = Math.max(1024, Math.min(65535, +$('#inp-port').value || 8765));
      let res;
      try { res = JSON.parse(A().startServer(port)); } catch (e) { res = { ok: false, error: String(e) }; }
      if (!res.ok) UI.toast('Не удалось запустить сервер: ' + (res.error || ''), 'err');
      else { UI.toast('Сервер запущен!', 'ok'); DD.sfx.play('upgrade'); }
      setTimeout(M.updateHost, 400);
    },
  };

  DD.main = M;
  DD.game = { queue: () => M.queue() };
  window.addEventListener('DOMContentLoaded', M.init);
})();
