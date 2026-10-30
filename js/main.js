/* Platinum Properties — site behaviour (vanilla JS, no dependencies) */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var PROPS = window.PROPERTIES || [];
  var CATS = window.PROPERTY_CATEGORIES || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  document.documentElement.classList.add("js");

  /* ---------- Config binding (phone, email, address, WhatsApp) ---------- */
  function waLink(text) {
    var base = "https://wa.me/" + (SITE.whatsapp || "");
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }
  function bindConfig() {
    $$("[data-site]").forEach(function (el) {
      var v = SITE[el.getAttribute("data-site")];
      if (v) el.textContent = v;
    });
    $$("[data-link='tel']").forEach(function (a) { a.href = "tel:" + SITE.phone; });
    $$("[data-link='mail']").forEach(function (a) { a.href = "mailto:" + SITE.email; });
    $$("[data-link='wa']").forEach(function (a) {
      a.href = waLink(a.getAttribute("data-wa-text") || "Hello, I would like to make an enquiry.");
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    var yr = $("#year");
    if (yr) yr.textContent = new Date().getFullYear();

    // Social links: only render accounts that have been filled in
    $$("[data-socials]").forEach(function (box) {
      var labels = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", x: "X", tiktok: "TikTok" };
      var any = false;
      Object.keys(labels).forEach(function (k) {
        var url = SITE.social && SITE.social[k];
        if (!url) return;
        var a = document.createElement("a");
        a.href = url; a.textContent = labels[k]; a.target = "_blank"; a.rel = "noopener noreferrer";
        box.appendChild(a); any = true;
      });
      if (!any) box.remove();
    });

    // Map
    var frame = $("#map-frame");
    if (frame) {
      frame.src = SITE.mapEmbedUrl ||
        "https://www.google.com/maps?q=" + encodeURIComponent(SITE.mapQuery || SITE.address || "") + "&output=embed";
    }
    var mapLink = $("#map-link");
    if (mapLink) {
      mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(SITE.mapQuery || SITE.address || "");
    }
  }

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = $(".nav-toggle"), nav = $("#site-nav");
    if (!toggle || !nav) return;
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) setOpen(false); });
  }

  /* ---------- Property cards ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function card(p) {
    var art = el("article", "prop reveal");
    var media = el("div", "prop-media");
    var img = el("img"); img.src = p.image; img.alt = p.placeholder ? "Placeholder image for " + p.name : p.name + " — " + p.location;
    img.loading = "lazy"; img.width = 800; img.height = 600;
    media.appendChild(img);
    if (p.placeholder) media.appendChild(el("span", "tag", "Placeholder"));
    var body = el("div", "prop-body");
    body.appendChild(el("div", "prop-loc", p.location));
    body.appendChild(el("h3", null, p.name));
    body.appendChild(el("p", null, p.description));
    body.appendChild(el("div", "prop-status", p.status));
    var a = el("a", "btn btn--dark btn--sm", "Enquire about this");
    a.href = "contact.html?property=" + encodeURIComponent(p.id) + "#enquiry";
    body.appendChild(a);
    art.appendChild(media); art.appendChild(body);
    return art;
  }
  function renderProperties() {
    var feat = $("#featured-grid");
    if (feat) {
      var f = PROPS.filter(function (p) { return p.featured; }).slice(0, 3);
      if (!f.length) f = PROPS.slice(0, 3);
      f.forEach(function (p) { feat.appendChild(card(p)); });
    }
    var host = $("#property-categories");
    if (host) {
      CATS.forEach(function (c) {
        var items = PROPS.filter(function (p) { return p.category === c.key; });
        var block = el("section", "cat-block"); block.id = c.key;
        var head = el("div", "cat-head");
        head.appendChild(el("h2", null, c.title));
        head.appendChild(el("p", null, c.intro));
        block.appendChild(head);
        if (!items.length) {
          block.appendChild(el("p", "empty-note", "No entries at the moment. Please enquire for the latest updates."));
        } else {
          var grid = el("div", "prop-grid");
          items.forEach(function (p) { grid.appendChild(card(p)); });
          block.appendChild(grid);
        }
        host.appendChild(block);
      });
    }
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------- Contact form (mailto / WhatsApp — no backend) ---------- */
  function initForm() {
    var form = $("#enquiry-form");
    if (!form) return;
    var f = form.elements;

    // Pre-fill from ?property=<id>
    var params = new URLSearchParams(window.location.search);
    var pid = params.get("property");
    if (pid) {
      var p = PROPS.filter(function (x) { return x.id === pid; })[0];
      if (p) {
        f.type.value = "Property enquiry";
        f.message.value = "Hello, I would like to enquire about \"" + p.name + "\" (" + p.location + "). Please send me more information.";
      }
    }

    function setErr(name, msg) {
      var field = f[name].closest(".field");
      var err = $(".err", field);
      field.classList.toggle("has-error", !!msg);
      f[name].setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
      return !msg;
    }
    function validate() {
      var ok = true;
      ok = setErr("name", f.name.value.trim().length < 2 ? "Please enter your name." : "") && ok;
      ok = setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) ? "" : "Please enter a valid email address.") && ok;
      var ph = f.phone.value.trim();
      ok = setErr("phone", ph && !/^[+()\d\s-]{7,20}$/.test(ph) ? "Please enter a valid phone number." : "") && ok;
      ok = setErr("message", f.message.value.trim().length < 10 ? "Please write a short message (at least 10 characters)." : "") && ok;
      if (!ok) { var first = $(".has-error input, .has-error textarea", form); if (first) first.focus(); }
      return ok;
    }
    function summary() {
      var lines = [
        "Enquiry type: " + f.type.value,
        "Name: " + f.name.value.trim(),
        "Email: " + f.email.value.trim()
      ];
      if (f.phone.value.trim()) lines.push("Phone: " + f.phone.value.trim());
      lines.push("", f.message.value.trim());
      return lines.join("\n");
    }
    var status = $("#form-status");
    function say(html) { status.innerHTML = html; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var subject = "Website enquiry: " + f.type.value;
      var href = "mailto:" + SITE.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(summary());
      say("Opening your email app… If nothing opens, email us directly at <a href=\"mailto:" + SITE.email + "\">" + SITE.email + "</a>.");
      window.location.href = href;
    });
    var wa = $("#wa-send");
    if (wa) wa.addEventListener("click", function () {
      if (!validate()) return;
      say("Opening WhatsApp…");
      window.open(waLink("Website enquiry\n" + summary()), "_blank", "noopener");
    });
    $$("input, textarea", form).forEach(function (i) {
      i.addEventListener("input", function () { if (i.closest(".field").classList.contains("has-error")) validate(); });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindConfig(); initNav(); renderProperties(); initForm(); initReveal();
  });
})();
