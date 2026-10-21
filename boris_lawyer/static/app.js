(function () {
  "use strict";

  var MODAL_TEXT = {
    consultation: {
      title: "Запись на консультацию",
      sub: "Консультация — 12 000 ₽, до 60 минут. Выберите удобную дату — Борис подтвердит запись.",
      button: "Записаться",
      success: "Борис подтвердит время консультации в течение рабочего дня."
    },
    callback: {
      title: "Обратный звонок",
      sub: "Оставьте номер — Борис перезвонит сам в удобное вам время.",
      button: "Жду звонка",
      success: "Борис перезвонит вам в указанное время или как только освободится."
    },
    question: {
      title: "Вопрос юристу",
      sub: "Опишите ситуацию — первичная оценка по заявке бесплатна.",
      button: "Отправить вопрос",
      success: "Борис изучит вопрос и ответит в течение рабочего дня."
    },
    service: {
      title: "Заказ услуги",
      sub: "Оставьте контакты — Борис уточнит детали и подготовит договор.",
      button: "Отправить заявку",
      success: "Борис свяжется с вами, чтобы обсудить детали и стоимость."
    }
  };

  var modal = document.querySelector("[data-modal]");
  var modalForm = modal.querySelector("[data-form='modal']");
  var modalSuccess = modal.querySelector("[data-modal-success]");
  var lastFocus = null;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function toast(text) {
    var t = $("[data-toast]");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 4000);
  }

  function isoDate(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  /* ---------- navigation ---------- */
  var navToggle = $("[data-nav-toggle]");
  var nav = $("[data-nav]");
  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $all("a", nav).forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  $all("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- modal ---------- */
  function setModalType(type) {
    var cfg = MODAL_TEXT[type] || MODAL_TEXT.consultation;
    modalForm.elements.type.value = type;
    $("[data-modal-title]", modal).textContent = cfg.title;
    $("[data-modal-sub]", modal).textContent = cfg.sub;
    $("[data-submit-label]", modal).textContent = cfg.button;
    $("[data-success-text]", modal).textContent = cfg.success;

    $all("[data-show]", modalForm).forEach(function (el) {
      var visible = el.getAttribute("data-show").split(" ").indexOf(type) !== -1;
      el.hidden = !visible;
      // скрытые поля не отправляются и не конфликтуют по имени
      $all("input, select, textarea", el).forEach(function (f) { f.disabled = !visible; });
      if (el.matches("input, select, textarea")) el.disabled = !visible;
    });
    $("[data-phone-required]", modal).hidden = type !== "callback";
    $("[data-message-required]", modal).hidden = type !== "question";
  }

  function openModal(type, service) {
    lastFocus = document.activeElement;
    modalForm.reset();
    clearErrors(modalForm);
    setStatus(modalForm, "", "");
    setModalType(type);
    if (service && modalForm.elements.service) modalForm.elements.service.value = service;
    modalForm.hidden = false;
    modalSuccess.hidden = true;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    setTimeout(function () { modalForm.elements.name.focus(); }, 50);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-modal]");
    if (opener) {
      e.preventDefault();
      nav.classList.remove("open");
      openModal(opener.getAttribute("data-open-modal"), opener.getAttribute("data-service"));
      return;
    }
    if (e.target.closest("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {           // удерживаем фокус внутри окна
      var focusables = $all("button, input, select, textarea, a[href]", modal)
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // дата: не раньше завтра, воскресенье недоступно
  var dateInput = modalForm.elements.date;
  var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  var maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 60);
  dateInput.min = isoDate(tomorrow);
  dateInput.max = isoDate(maxDate);
  dateInput.addEventListener("change", function () {
    var d = new Date(dateInput.value + "T12:00:00");
    showError(modalForm, "date", d.getDay() === 0 ? "В воскресенье приёма нет — выберите другой день" : "");
  });

  /* ---------- forms ---------- */
  function clearErrors(form) {
    $all("[data-error]", form).forEach(function (el) { el.textContent = ""; });
    $all(".field.invalid", form).forEach(function (el) { el.classList.remove("invalid"); });
  }

  function showError(form, name, text) {
    var el = $("[data-error='" + name + "']", form);
    if (el) {
      el.textContent = text;
      var field = el.closest(".field");
      if (field) field.classList.toggle("invalid", !!text);
    }
  }

  function setStatus(form, text, kind) {
    var el = $(".form-status", form);
    el.textContent = text;
    el.className = "form-status" + (kind ? " " + kind : "");
  }

  function collect(form) {
    var data = {};
    $all("input, select, textarea", form).forEach(function (f) {
      if (!f.name || f.disabled) return;
      data[f.name] = f.type === "checkbox" ? f.checked : f.value.trim();
    });
    return data;
  }

  function validate(form, data) {
    var errors = {};
    if (!data.name || data.name.length < 2) errors.name = "Укажите имя";
    if (!data.phone && !data.email) errors.phone = "Укажите телефон или e-mail для связи";
    if (data.phone && !/^[0-9+()\-\s]{6,40}$/.test(data.phone)) errors.phone = "Проверьте номер телефона";
    if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) errors.email = "Проверьте адрес e-mail";
    if (data.type === "callback" && !data.phone) errors.phone = "Для обратного звонка нужен телефон";
    if (data.type === "question" && (!data.message || data.message.length < 10)) errors.message = "Опишите вопрос подробнее (от 10 символов)";
    if (data.type === "consultation") {
      if (!data.date) errors.date = "Выберите дату";
      else if (new Date(data.date + "T12:00:00").getDay() === 0) errors.date = "В воскресенье приёма нет";
      if (!data.time) errors.time = "Выберите время";
    }
    if (!data.consent) errors.consent = "Нужно согласие на обработку данных";
    return errors;
  }

  function submitForm(form, onSuccess) {
    // ошибка поля исчезает, как только пользователь начинает его исправлять
    ["input", "change"].forEach(function (evt) {
      form.addEventListener(evt, function (e) {
        var name = e.target.name;
        if (!name || name === "date") return;
        showError(form, name, "");
        if ($(".form-status", form).classList.contains("err")) setStatus(form, "", "");
        if (name === "phone" || name === "email") showError(form, "phone", "");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(form);
      var data = collect(form);
      var errors = validate(form, data);
      var names = Object.keys(errors);
      if (names.length) {
        names.forEach(function (n) { showError(form, n, errors[n]); });
        setStatus(form, "Проверьте отмеченные поля", "err");
        var bad = form.elements[names[0]];
        if (bad && bad.focus && !bad.length) bad.focus();
        return;
      }
      var btn = form.querySelector("[type=submit]");
      btn.disabled = true;
      setStatus(form, "Отправляем…", "");

      fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (r) {
          if (r.ok) {
            onSuccess(r.body);
            return;
          }
          var fields = r.body.fields || {};
          Object.keys(fields).forEach(function (n) { showError(form, n, fields[n]); });
          setStatus(form, r.body.error || "Не удалось отправить заявку", "err");
        })
        .catch(function () {
          setStatus(form, "Нет связи с сервером. Проверьте подключение и попробуйте ещё раз.", "err");
        })
        .then(function () { btn.disabled = false; });
    });
  }

  submitForm(modalForm, function (body) {
    modalForm.hidden = true;
    modalSuccess.hidden = false;
    var num = body && body.id ? " Номер заявки: " + body.id + "." : "";
    var txt = $("[data-success-text]", modal);
    txt.textContent = txt.textContent.replace(/ Номер заявки: \d+\.$/, "") + num;
    $("button", modalSuccess).focus();
  });

  var questionForm = $("[data-form='question']");
  submitForm(questionForm, function (body) {
    questionForm.reset();
    setStatus(questionForm, "Вопрос отправлен" + (body && body.id ? " (заявка №" + body.id + ")" : "") +
      ". Борис ответит в течение рабочего дня.", "ok");
    toast("Спасибо! Ваш вопрос получен.");
  });
})();
