(function () {
  const data = window.LFP_DATA;
  const STORAGE_KEY = "lexflow_intake_v1";

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const screens = {};
  qsa("[data-screen]").forEach(function (el) {
    screens[el.dataset.screen] = el;
  });

  let currentScreen = "home";
  let quizStep = 0;

  /** @type {Record<string, string>} */
  let intake = {};

  function loadIntake() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) intake = JSON.parse(raw);
    } catch (e) {
      intake = {};
    }
  }

  function saveIntake() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intake));
    } catch (e) {
      /* ignore */
    }
  }

  function showToast(message) {
    const toast = qs("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("toast--show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("toast--show");
    }, 2600);
  }

  function navigate(screenId) {
    const next = screens[screenId];
    if (!next) return;

    const prev = screens[currentScreen];
    if (prev) {
      prev.classList.remove("screen--active");
      prev.hidden = true;
    }

    currentScreen = screenId;
    next.hidden = false;
    requestAnimationFrame(function () {
      next.classList.add("screen--active");
    });

    if (screenId === "payment") {
      var pf = qs("#payForm");
      var ps = qs("#paySuccess");
      if (pf) pf.hidden = false;
      if (ps) ps.hidden = true;
      renderOrderSummary();
    }
    if (screenId === "questionnaire") {
      quizStep = 0;
      renderQuizStep();
      const backBtn = qs("#quizBack");
      if (backBtn) backBtn.style.visibility = quizStep === 0 ? "hidden" : "";
    }

    const nav = qs(".nav");
    const toggle = qs("#menuToggle");
    if (nav) nav.classList.remove("nav--open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function buildQuizSteps() {
    const container = qs("#quizSteps");
    const steps = data.questionnaire;
    qs("#qStepTotal").textContent = String(steps.length);

    container.innerHTML = steps
      .map(function (step, i) {
        if (step.type === "radio") {
          const opts = step.options
            .map(function (o) {
              const hint = o.hint ? "<small>" + escapeHtml(o.hint) + "</small>" : "";
              return (
                '<label class="option">' +
                '<input type="radio" name="' +
                escapeHtml(step.name) +
                '" value="' +
                escapeHtml(o.value) +
                '" />' +
                '<span class="option-text"><strong>' +
                escapeHtml(o.title) +
                "</strong>" +
                hint +
                "</span></label>"
              );
            })
            .join("");
          return (
            '<div class="quiz-step" data-quiz-step="' +
            i +
            '">' +
            '<p class="quiz-question">' +
            escapeHtml(step.question) +
            "</p>" +
            '<div class="option-group">' +
            opts +
            "</div></div>"
          );
        }
        if (step.type === "select") {
          const opts = step.options
            .map(function (o) {
              return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + "</option>";
            })
            .join("");
          return (
            '<div class="quiz-step" data-quiz-step="' +
            i +
            '">' +
            '<p class="quiz-question">' +
            escapeHtml(step.question) +
            '</p><label class="field"><span>Jurisdiction</span>' +
            '<select name="' +
            escapeHtml(step.name) +
            '" required>' +
            opts +
            "</select></label></div>"
          );
        }
        if (step.type === "textarea") {
          const val = intake[step.name] ? escapeHtml(intake[step.name]) : "";
          return (
            '<div class="quiz-step" data-quiz-step="' +
            i +
            '">' +
            '<p class="quiz-question">' +
            escapeHtml(step.question) +
            '</p><label class="field"><span>Your summary</span>' +
            '<textarea name="' +
            escapeHtml(step.name) +
            '" placeholder="' +
            escapeHtml(step.placeholder || "") +
            '" maxlength="1200">' +
            val +
            "</textarea></label></div>"
          );
        }
        return "";
      })
      .join("");
  }

  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = String(s);
    return div.innerHTML;
  }

  function renderQuizStep() {
    const steps = data.questionnaire;
    qs("#qStepNum").textContent = String(quizStep + 1);
    var pct = ((quizStep + 1) / steps.length) * 100;
    var bar = qs("#qProgressBar");
    var progress = qs("#qProgress");
    if (bar) bar.style.width = pct + "%";
    if (progress) progress.setAttribute("aria-valuenow", Math.round(pct));

    qsa(".quiz-step").forEach(function (el, i) {
      el.classList.toggle("quiz-step--active", i === quizStep);
    });

    var backBtn = qs("#quizBack");
    if (backBtn) backBtn.style.visibility = quizStep === 0 ? "hidden" : "";

    var nextBtn = qs("#quizNext");
    if (nextBtn) nextBtn.textContent = quizStep === steps.length - 1 ? "Finish & review" : "Continue";
  }

  function collectStepValues() {
    var step = data.questionnaire[quizStep];
    var form = qs("#quizForm");
    if (step.type === "radio") {
      var selected = form.querySelector('input[name="' + step.name + '"]:checked');
      if (!selected) return false;
      intake[step.id] = selected.value;
      return true;
    }
    if (step.type === "select") {
      var sel = form.querySelector('select[name="' + step.name + '"]');
      if (!sel || !sel.value) return false;
      intake[step.id] = sel.value;
      return true;
    }
    if (step.type === "textarea") {
      var ta = form.querySelector('textarea[name="' + step.name + '"]');
      if (!ta || !ta.value.trim()) return false;
      intake[step.id] = ta.value.trim();
      return true;
    }
    return true;
  }

  function computePrice() {
    var p = data.pricing;
    var doc = intake.doc_type || "other";
    var urg = intake.urgency || "standard";
    var mult = (p.docTypeMultiplier[doc] || 1) * (p.urgencyMultiplier[urg] || 1);
    var total = Math.round(p.base * mult);
    return { total: total, mult: mult };
  }

  function renderOrderSummary() {
    var p = data.pricing;
    var doc = intake.doc_type || "other";
    var juris = intake.jurisdiction || "";
    var urg = intake.urgency || "standard";
    var brief = intake.brief || "";
    var labels = p.docLabel;
    var jurisLabel = p.jurisdictionLabel[juris] || juris;
    var urgLabel = urg === "expedited" ? "Expedited (48–72 hours)" : "Standard (5–7 business days)";
    var price = computePrice();

    var html =
      "<dl>" +
      "<dt>Document</dt><dd>" +
      escapeHtml(labels[doc] || doc) +
      "</dd>" +
      "<dt>Jurisdiction</dt><dd>" +
      escapeHtml(jurisLabel) +
      "</dd>" +
      "<dt>Turnaround</dt><dd>" +
      escapeHtml(urgLabel) +
      "</dd>" +
      "<dt>Your summary</dt><dd>" +
      (brief ? escapeHtml(brief.length > 200 ? brief.slice(0, 200) + "…" : brief) : "—") +
      "</dd>" +
      "<dt>Estimated total (demo)</dt><dd><strong>$" +
      price.total.toLocaleString("en-US") +
      "</strong></dd></dl>";

    var orderEl = qs("#orderSummary");
    if (orderEl) orderEl.innerHTML = html;

    var amt = qs("#payAmount");
    if (amt) amt.textContent = "$" + price.total.toLocaleString("en-US");
  }

  function chatBubble(text, role) {
    var wrap = qs("#chatMessages");
    if (!wrap) return;
    var div = document.createElement("div");
    div.className = "msg msg--" + (role === "user" ? "user" : "bot");
    div.textContent = text;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function botReply(userText) {
    var lower = userText.toLowerCase();
    var cfg = data.chat.replies;
    for (var i = 0; i < cfg.length; i++) {
      var keys = cfg[i].keys;
      for (var j = 0; j < keys.length; j++) {
        if (lower.includes(keys[j])) {
          return cfg[i].text;
        }
      }
    }
    var fb = data.chat.fallback;
    var hash = userText.split("").reduce(function (acc, c) {
      return acc + c.charCodeAt(0);
    }, 0);
    return fb[hash % fb.length];
  }

  function simulateTypingThenReply(reply) {
    chatBubble("…", "meta");
    var meta = qs("#chatMessages").lastElementChild;
    var delay = data.chat.typingMs.min + Math.random() * (data.chat.typingMs.max - data.chat.typingMs.min);
    setTimeout(function () {
      if (meta && meta.classList.contains("msg--meta")) meta.remove();
      chatBubble(reply, "bot");
    }, delay);
  }

  function initChatPlaceholder() {
    var wrap = qs("#chatMessages");
    if (!wrap || wrap.dataset.inited === "1") return;
    wrap.dataset.inited = "1";
    chatBubble(data.chat.welcome, "bot");
  }

  function normalizeCardInput() {
    var num = qs("#cardNumber");
    if (!num) return;
    num.addEventListener("input", function () {
      var v = num.value.replace(/\D/g, "").slice(0, 16);
      num.value = v.replace(/(.{4})/g, "$1 ").trim();
    });
    var exp = qs("#expiry");
    if (exp)
      exp.addEventListener("input", function () {
        var v = exp.value.replace(/\D/g, "").slice(0, 4);
        if (v.length >= 2) exp.value = v.slice(0, 2) + " / " + v.slice(2);
        else exp.value = v;
      });
    var cvc = qs("#cvc");
    if (cvc)
      cvc.addEventListener("input", function () {
        cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4);
      });
  }

  function validateDemoPayment() {
    var name = qs("#cardName").value.trim();
    var raw = qs("#cardNumber").value.replace(/\s/g, "");
    var expDigits = qs("#expiry").value.replace(/\D/g, "");
    var cvc = qs("#cvc").value;
    if (name.length < 2) {
      showToast("Enter name on card.");
      return false;
    }
    if (raw.length < 13) {
      showToast("Enter a valid card number.");
      return false;
    }
    if (expDigits.length !== 4) {
      showToast("Use expiry MM / YY — e.g. 12 / 28.");
      return false;
    }
    var mm = expDigits.slice(0, 2);
    var yy = expDigits.slice(2, 4);
    if (+mm < 1 || +mm > 12) {
      showToast("Check expiry month.");
      return false;
    }
    if (cvc.length < 3) {
      showToast("Enter CVC.");
      return false;
    }
    return true;
  }

  function bind() {
    qsa("[data-nav]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        var dest = el.getAttribute("data-nav");
        if (dest === "chat") initChatPlaceholder();
        if (dest) {
          e.preventDefault();
          navigate(dest);
        }
      });
    });

    qsa(".logo[data-nav]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        navigate("home");
      });
    });

    var menuToggle = qs("#menuToggle");
    var nav = qs(".nav");
    if (menuToggle && nav) {
      menuToggle.addEventListener("click", function () {
        var open = !nav.classList.contains("nav--open");
        nav.classList.toggle("nav--open", open);
        menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    qs("#quizNext").addEventListener("click", function () {
      if (!collectStepValues()) {
        showToast("Please complete this step.");
        return;
      }
      saveIntake();
      var steps = data.questionnaire;
      if (quizStep < steps.length - 1) {
        quizStep += 1;
        renderQuizStep();
      } else {
        intake["completed_at"] = new Date().toISOString();
        saveIntake();
        showToast("Intake saved. Review payment when ready.");
        navigate("payment");
      }
    });

    qs("#quizBack").addEventListener("click", function () {
      if (quizStep > 0) {
        quizStep -= 1;
        renderQuizStep();
      }
    });

    var chatForm = qs("#chatForm");
    if (chatForm) {
      chatForm.addEventListener("submit", function (e) {
        e.preventDefault();
        initChatPlaceholder();
        var inp = qs("#chatInput");
        var text = inp.value.trim();
        if (!text) return;
        inp.value = "";
        chatBubble(text, "user");
        simulateTypingThenReply(botReply(text));
      });
    }

    var clearBtn = qs("#clearChat");
    if (clearBtn)
      clearBtn.addEventListener("click", function () {
        var wrap = qs("#chatMessages");
        if (wrap) {
          wrap.innerHTML = "";
          wrap.dataset.inited = "0";
          initChatPlaceholder();
        }
      });

    var payForm = qs("#payForm");
    if (payForm) {
      payForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateDemoPayment()) return;
        payForm.hidden = true;
        var success = qs("#paySuccess");
        if (success) success.hidden = false;
        showToast("Demo payment complete.");
      });
    }

    normalizeCardInput();
  }

  function init() {
    loadIntake();
    buildQuizSteps();
    applyPrefillRadiosAfterBuild();

    quizStep = 0;
    renderQuizStep();
    navigate("home");
    bind();
  }

  function applyPrefillRadiosAfterBuild() {
    var ids = {};
    data.questionnaire.forEach(function (s) {
      ids[s.id] = true;
    });
    Object.keys(intake).forEach(function (key) {
      if (!ids[key]) return;
      var val = intake[key];
      if (val == null || val === "") return;
      qsa('input[type="radio"][name="' + key + '"]').forEach(function (inp) {
        if (inp.value === String(val)) inp.checked = true;
      });
      var sel = document.querySelector('select[name="' + key + '"]');
      if (sel) sel.value = String(val);
      var ta = document.querySelector('textarea[name="' + key + '"]');
      if (ta) ta.value = val;
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
