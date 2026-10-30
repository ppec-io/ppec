/* ==========================================================================
   Site behaviour — no dependencies.
   Contact details come from js/config.js, properties from js/projects-data.js.
   ========================================================================== */
(function () {
  "use strict";

  var S = window.SITE || {};
  var PROJECTS = window.PROJECTS || [];

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function isHttp(url) { return /^https?:\/\//i.test(url || ""); }

  var LABELS = { available: "Available", ongoing: "Ongoing", completed: "Completed" };
  var EMPTY = {
    available: "No properties are listed at the moment. Please contact us for current availability.",
    ongoing: "No ongoing projects are listed at the moment.",
    completed: "Completed projects will be listed here.",
    featured: "Featured properties and projects will appear here."
  };

  /* ---------- Links built from config ---------- */
  function waLink(message) {
    return "https://wa.me/" + encodeURIComponent(S.whatsappNumber || "") +
      "?text=" + encodeURIComponent(message || S.whatsappMessage || "");
  }
  function mapsLink() {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.mapQuery || "");
  }

  /* ---------- Fill contact details from config ---------- */
  function fillSiteDetails() {
    var text = {
      phone: S.phoneDisplay,
      email: S.email,
      address: (S.addressLines || []).join("\n"),
      brand: S.brandName,
      legal: S.legalName,
      year: String(new Date().getFullYear())
    };
    $$("[data-site]").forEach(function (el) {
      var v = text[el.getAttribute("data-site")];
      if (v) el.textContent = v;
    });

    var hrefs = {
      tel: S.phoneTel ? "tel:" + S.phoneTel : "",
      mail: S.email ? "mailto:" + S.email : "",
      wa: S.whatsappNumber ? waLink() : "",
      map: S.mapQuery ? mapsLink() : ""
    };
    $$("[data-site-href]").forEach(function (el) {
      var v = hrefs[el.getAttribute("data-site-href")];
      if (v) el.setAttribute("href", v);
    });

    var frame = $("#map-frame");
    if (frame && S.mapQuery) {
      frame.setAttribute("src", "https://maps.google.com/maps?q=" + encodeURIComponent(S.mapQuery) + "&output=embed");
    }

    // Social links: only shown when a real https:// URL is supplied
    $$("[data-social]").forEach(function (box) {
      var count = 0;
      Object.keys(S.social || {}).forEach(function (name) {
        var url = S.social[name];
        if (!isHttp(url)) return;
        var a = make("a", "", name);
        a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.setAttribute("aria-label", name + " (opens in a new tab)");
        box.appendChild(a); count++;
      });
      if (!count) box.hidden = true;
    });
  }

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var btn = $(".nav-toggle");
    var nav = $("#primary-nav");
    if (!btn || !nav) return;

    function setOpen(open, returnFocus) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (!open && returnFocus) btn.focus();
    }
    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false, true);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    var mq = window.matchMedia("(min-width: 921px)");
    var onChange = function () { if (mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else mq.addListener(onChange);
  }

  /* ---------- Property / project cards ---------- */
  function buildCard(p, light) {
    var card = make("article", "card" + (light ? " card--light" : ""));

    var media = make("div", "card__media");
    var img = make("img");
    img.src = p.image; img.alt = p.imageAlt || p.title;
    img.width = 800; img.height = 600; img.loading = "lazy"; img.decoding = "async";
    media.appendChild(img);
    media.appendChild(make("span", "badge", LABELS[p.category] || p.category));
    if (p.placeholder) media.appendChild(make("span", "badge badge--sample", "Sample"));
    card.appendChild(media);

    var body = make("div", "card__body");
    body.appendChild(make("h3", "card__title", p.title));
    var loc = make("p", "card__loc");
    loc.appendChild(make("span", "icon icon-pin"));
    loc.lastChild.setAttribute("aria-hidden", "true");
    loc.appendChild(make("span", "", p.location));
    body.appendChild(loc);
    body.appendChild(make("p", "card__desc", p.description));
    if (p.statusNote) body.appendChild(make("p", "card__note", p.statusNote));

    var actions = make("div", "card__actions");
    var enq = make("a", "btn btn--sm " + (light ? "btn--dark" : "btn--gold"), "Enquire");
    enq.href = "contact.html?enquiry=" + encodeURIComponent(p.id);
    enq.setAttribute("aria-label", "Make an enquiry about " + p.title);
    var wa = make("a", "btn btn--sm " + (light ? "btn--ghost-dark" : "btn--ghost"));
    wa.href = waLink("Hello, I would like to enquire about " + p.title + ".");
    wa.target = "_blank"; wa.rel = "noopener noreferrer";
    wa.setAttribute("aria-label", "Ask about " + p.title + " on WhatsApp (opens in a new tab)");
    var waIcon = make("span", "icon icon-whatsapp"); waIcon.setAttribute("aria-hidden", "true");
    wa.appendChild(waIcon); wa.appendChild(document.createTextNode("WhatsApp"));
    actions.appendChild(enq); actions.appendChild(wa);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  function renderProjects() {
    $$("[data-projects]").forEach(function (box) {
      var key = box.getAttribute("data-projects");
      var light = box.getAttribute("data-card-style") === "light";
      var items = PROJECTS.filter(function (p) {
        return key === "featured" ? p.featured : p.category === key;
      });
      box.textContent = "";
      if (!items.length) { box.appendChild(make("p", "empty", EMPTY[key] || "")); return; }
      items.forEach(function (p) { box.appendChild(buildCard(p, light)); });
    });
    var notice = $("#sample-notice");
    if (notice) {
      notice.hidden = !PROJECTS.some(function (p) { return p.placeholder; });
    }
  }

  /* ---------- Enquiry form (email- or WhatsApp-based; no backend) ---------- */
  function initForm() {
    var form = $("#enquiry-form");
    if (!form) return;

    var f = {
      name: form.elements.name, phone: form.elements.phone, email: form.elements.email,
      interest: form.elements.interest, message: form.elements.message
    };
    var status = $("#form-status");

    // Build the interest list: services + each listed property/project
    var group = $("#interest-projects");
    if (group) {
      PROJECTS.forEach(function (p) {
        var o = make("option", "", p.title + " (" + (LABELS[p.category] || p.category) + ")");
        o.value = "project:" + p.id;
        group.appendChild(o);
      });
      if (!PROJECTS.length) group.remove();
    }

    // Pre-fill when arriving from a property card: contact.html?enquiry=<id>
    var wanted = new URLSearchParams(window.location.search).get("enquiry");
    if (wanted) {
      var hit = PROJECTS.filter(function (p) { return p.id === wanted; })[0];
      if (hit) {
        f.interest.value = "project:" + hit.id;
        if (!f.message.value) f.message.value = "Hello, I would like to know more about " + hit.title + ".";
      }
    }

    function interestLabel() {
      var opt = f.interest.options[f.interest.selectedIndex];
      return opt && opt.value ? opt.textContent : "General enquiry";
    }
    function setError(field, msg) {
      var wrap = field.closest(".field");
      var err = $(".field__error", wrap);
      wrap.classList.toggle("has-error", !!msg);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
      return !msg;
    }
    function validate() {
      var ok = true;
      var name = f.name.value.trim();
      var email = f.email.value.trim();
      var phone = f.phone.value.trim();
      var msg = f.message.value.trim();
      ok = setError(f.name, name.length < 2 ? "Please enter your name." : "") && ok;
      var emailBad = email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      var phoneBad = phone && phone.replace(/\D/g, "").length < 7;
      ok = setError(f.email, emailBad ? "Please enter a valid email address." : "") && ok;
      ok = setError(f.phone, phoneBad ? "Please enter a valid phone number." : "") && ok;
      if (!email && !phone) {
        ok = setError(f.email, "Please give an email address or a phone number so we can reply.") && ok;
      }
      ok = setError(f.message, msg.length < 10 ? "Please write a short message (at least 10 characters)." : "") && ok;
      if (!ok) {
        var first = $(".has-error input, .has-error textarea, .has-error select", form);
        if (first) first.focus();
      }
      return ok;
    }
    function summary() {
      var lines = [
        "Name: " + f.name.value.trim(),
        f.phone.value.trim() ? "Phone: " + f.phone.value.trim() : "",
        f.email.value.trim() ? "Email: " + f.email.value.trim() : "",
        "Interested in: " + interestLabel(),
        "",
        f.message.value.trim()
      ];
      return lines.filter(function (l, i) { return l !== "" || i === 4; }).join("\n");
    }
    function say(msg, ok) {
      status.textContent = msg;
      status.className = "form__status " + (ok ? "is-ok" : "is-err");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) { say("Please correct the highlighted fields.", false); return; }
      var subject = "Website enquiry: " + interestLabel() + " — " + f.name.value.trim();
      var href = "mailto:" + S.email + "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(summary());
      say("Opening your email app… If nothing opens, please email us directly at " + S.email + ".", true);
      window.location.href = href;
    });

    var waBtn = $("#send-whatsapp");
    if (waBtn) {
      waBtn.addEventListener("click", function () {
        if (!validate()) { say("Please correct the highlighted fields.", false); return; }
        say("Opening WhatsApp…", true);
        window.open(waLink(summary()), "_blank", "noopener");
      });
    }
  }

  /* ---------- Subtle scroll reveal ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------- Placeholder highlighter: add ?placeholders=1 to any URL ---------- */
  function initPlaceholderMode() {
    if (new URLSearchParams(window.location.search).get("placeholders") === "1") {
      document.body.classList.add("show-ph");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSiteDetails();
    renderProjects();
    initNav();
    initForm();
    initPlaceholderMode();
    initReveal();
  });
})();
