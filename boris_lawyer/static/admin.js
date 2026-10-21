(function () {
  "use strict";

  var STATUS_LABEL = { new: "Новые", in_progress: "В работе", done: "Завершены", rejected: "Отклонены" };
  var FIELD_LABEL = {
    phone: "Телефон", email: "E-mail", contact_method: "Связь", service: "Услуга",
    date: "Дата", time: "Время", format: "Формат", ip: "IP"
  };
  var state = { requests: [], types: {}, filter: "all", query: "" };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function toast(text) {
    var t = $("[data-toast]");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 3000);
  }

  function api(path, body) {
    var opts = { credentials: "same-origin" };
    if (body !== undefined) {
      opts.method = "POST";
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(body);
    }
    return fetch(path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401 && path.indexOf("/login") === -1) showLoggedIn(false);
        if (!res.ok) throw new Error(data.error || "Ошибка " + res.status);
        return data;
      });
    });
  }

  function showLoggedIn(isIn) {
    $all("[data-when]").forEach(function (el) {
      el.hidden = el.getAttribute("data-when") !== (isIn ? "in" : "out");
    });
    if (!isIn) setTimeout(function () { $("[data-login] input").focus(); }, 0);
  }

  function load() {
    return api("/api/admin/requests").then(function (data) {
      state.requests = data.requests;
      state.types = data.types;
      renderStats(data.counts, data.requests.length);
      render();
    });
  }

  function renderStats(counts, total) {
    var box = $("[data-stats]");
    box.textContent = "";
    [["Всего", total], [STATUS_LABEL.new, counts.new], [STATUS_LABEL.in_progress, counts.in_progress],
     [STATUS_LABEL.done, counts.done]].forEach(function (pair) {
      var d = document.createElement("div");
      d.className = "stat";
      var s = document.createElement("strong"); s.textContent = pair[1] || 0;
      var l = document.createElement("span"); l.textContent = pair[0];
      d.appendChild(s); d.appendChild(l); box.appendChild(d);
    });
  }

  function matches(r) {
    if (state.filter !== "all" && r.status !== state.filter) return false;
    if (!state.query) return true;
    var hay = [r.name, r.phone, r.email, r.service, r.message, r.note].join(" ").toLowerCase();
    return hay.indexOf(state.query) !== -1;
  }

  function render() {
    var list = $("[data-list]");
    var tpl = $("#request-tpl");
    list.textContent = "";
    var items = state.requests.filter(matches);
    $("[data-empty]").hidden = items.length > 0;
    items.forEach(function (r) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      node.classList.add("status-" + r.status);
      $(".request-type", node).textContent = "#" + r.id + " · " + (state.types[r.type] || r.type);
      $(".request-name", node).textContent = r.name;
      $(".request-time", node).textContent = r.created_at;
      var dl = $(".request-fields", node);
      Object.keys(FIELD_LABEL).forEach(function (k) {
        if (!r[k]) return;
        var wrap = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = FIELD_LABEL[k];
        var dd = document.createElement("dd");
        if (k === "phone") {
          var a = document.createElement("a");
          a.href = "tel:" + r.phone.replace(/[^0-9+]/g, "");
          a.textContent = r.phone;
          dd.appendChild(a);
        } else if (k === "email") {
          var m = document.createElement("a");
          m.href = "mailto:" + r.email;
          m.textContent = r.email;
          dd.appendChild(m);
        } else {
          dd.textContent = r[k];
        }
        wrap.appendChild(dt); wrap.appendChild(dd); dl.appendChild(wrap);
      });
      $(".request-message", node).textContent = r.message || "";
      var note = $(".note", node);
      note.value = r.note || "";
      var sel = $(".status-select", node);
      sel.value = r.status;
      sel.addEventListener("change", function () {
        api("/api/admin/requests/" + r.id, { status: sel.value })
          .then(function () { toast("Статус обновлён"); return load(); })
          .catch(function (e) { toast(e.message); });
      });
      $("[data-save]", node).addEventListener("click", function () {
        api("/api/admin/requests/" + r.id, { note: note.value })
          .then(function () { r.note = note.value; toast("Заметка сохранена"); })
          .catch(function (e) { toast(e.message); });
      });
      $("[data-delete]", node).addEventListener("click", function () {
        if (!confirm("Удалить заявку #" + r.id + "? Это действие необратимо.")) return;
        api("/api/admin/requests/" + r.id + "/delete", {})
          .then(function () { toast("Заявка удалена"); return load(); })
          .catch(function (e) { toast(e.message); });
      });
      list.appendChild(node);
    });
  }

  /* ---------- events ---------- */
  $("[data-login]").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var status = $(".form-status", form);
    status.textContent = "Проверяем…";
    status.className = "form-status";
    api("/api/admin/login", { password: form.elements.password.value })
      .then(function () {
        form.reset();
        status.textContent = "";
        showLoggedIn(true);
        return load();
      })
      .catch(function (err) {
        status.textContent = err.message;
        status.className = "form-status err";
      });
  });

  $("[data-logout]").addEventListener("click", function () {
    api("/api/admin/logout", {}).then(function () { showLoggedIn(false); });
  });

  $("[data-refresh]").addEventListener("click", function () {
    load().then(function () { toast("Список обновлён"); });
  });

  $all("[data-filter]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $all("[data-filter]").forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      state.filter = chip.getAttribute("data-filter");
      render();
    });
  });

  $("[data-search]").addEventListener("input", function (e) {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });

  // автообновление раз в 30 секунд, чтобы новые заявки появлялись сами
  setInterval(function () {
    if (!$("[data-when='in']").hidden && document.visibilityState === "visible") load().catch(function () {});
  }, 30000);

  api("/api/admin/me").then(function (d) {
    showLoggedIn(d.admin);
    if (d.admin) load();
  });
})();
