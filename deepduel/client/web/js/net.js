/* WebSocket connection with request/response, ping and automatic reconnect. */
window.DD = window.DD || {};
(function () {
  const N = {
    ws: null,
    url: '',
    addr: '',
    connected: false,
    wantOpen: false,
    welcome: null,
    latency: 0,
    _id: 0,
    _pending: {},
    _handlers: {},
    _pingTimer: null,
    _retryTimer: null,
    onDisconnect: null,
    onReconnect: null,

    /** "192.168.1.5", "192.168.1.5:8765", "http://host:port/", "ws://..." -> ws url */
    toUrl(addr) {
      let a = String(addr || '').trim();
      if (!a) return '';
      let secure = false;
      a = a.replace(/^(wss?|https?):\/\//i, (m, p) => { secure = p.toLowerCase() === 'wss' || p.toLowerCase() === 'https'; return ''; });
      a = a.replace(/\/.*$/, '');
      if (!/:\d+$/.test(a) && !/^\[.*\]$/.test(a)) a += ':8765';
      return (secure ? 'wss://' : 'ws://') + a + '/ws';
    },

    normAddr(addr) {
      return String(addr || '').trim().replace(/^(wss?|https?):\/\//i, '').replace(/\/.*$/, '');
    },

    connect(addr, timeoutMs = 7000) {
      N.close();
      N.addr = N.normAddr(addr);
      N.url = N.toUrl(addr);
      N.wantOpen = true;
      return N._open(timeoutMs);
    },

    _open(timeoutMs) {
      return new Promise((resolve, reject) => {
        let done = false;
        let ws;
        try { ws = new WebSocket(N.url); } catch (e) { reject(new Error('Неверный адрес сервера')); return; }
        N.ws = ws;
        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          try { ws.close(); } catch (e) {}
          reject(new Error('Сервер не отвечает'));
        }, timeoutMs);
        ws.onmessage = (e) => {
          let m;
          try { m = JSON.parse(e.data); } catch (err) { return; }
          if (m.t === 'welcome' && !done) {
            done = true;
            clearTimeout(timer);
            N.connected = true;
            N.welcome = m;
            N._startPing();
            resolve(m);
            return;
          }
          N._dispatch(m);
        };
        ws.onclose = () => {
          clearTimeout(timer);
          const was = N.connected;
          N.connected = false;
          N._stopPing();
          for (const k in N._pending) { N._pending[k].reject(new Error('Нет связи с сервером')); }
          N._pending = {};
          if (!done) { done = true; reject(new Error('Не удалось подключиться')); return; }
          if (N.ws === ws && N.wantOpen && was) {
            if (N.onDisconnect) N.onDisconnect();
            N._scheduleRetry();
          }
        };
        ws.onerror = () => {};
      });
    },

    _scheduleRetry() {
      clearTimeout(N._retryTimer);
      N._retryTimer = setTimeout(async () => {
        if (!N.wantOpen) return;
        try {
          await N._open(5000);
          if (N.onReconnect) N.onReconnect();
        } catch (e) {
          N._scheduleRetry();
        }
      }, 1500);
    },

    close() {
      N.wantOpen = false;
      clearTimeout(N._retryTimer);
      N._stopPing();
      if (N.ws) { try { N.ws.close(); } catch (e) {} }
      N.ws = null;
      N.connected = false;
    },

    _startPing() {
      N._stopPing();
      N._pingTimer = setInterval(() => N.send('ping', { c: performance.now() }), 3000);
    },
    _stopPing() { clearInterval(N._pingTimer); N._pingTimer = null; },

    _dispatch(m) {
      if (m.t === 'res') {
        const p = N._pending[m.id];
        if (!p) return;
        delete N._pending[m.id];
        clearTimeout(p.timer);
        if (m.ok) p.resolve(m.d || {}); else p.reject(new Error(m.err || 'Ошибка'));
        return;
      }
      if (m.t === 'pong') { N.latency = Math.round(performance.now() - m.c); return; }
      const hs = N._handlers[m.t];
      if (hs) hs.forEach(h => { try { h(m); } catch (e) { console.error(e); } });
    },

    on(type, fn) { (N._handlers[type] = N._handlers[type] || []).push(fn); },

    send(t, data) {
      if (!N.ws || N.ws.readyState !== 1) return false;
      const m = Object.assign({ t }, data || {});
      N.ws.send(JSON.stringify(m));
      return true;
    },

    req(t, data, timeoutMs = 10000) {
      return new Promise((resolve, reject) => {
        if (!N.ws || N.ws.readyState !== 1) { reject(new Error('Нет связи с сервером')); return; }
        const id = ++N._id;
        const timer = setTimeout(() => {
          if (N._pending[id]) { delete N._pending[id]; reject(new Error('Сервер не ответил')); }
        }, timeoutMs);
        N._pending[id] = { resolve, reject, timer };
        N.ws.send(JSON.stringify(Object.assign({ t, id }, data || {})));
      });
    },
  };
  DD.net = N;
})();
