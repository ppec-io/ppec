/* ==========================================================================
   Site-wide behaviour: contact details from config, mobile menu, scroll reveal,
   placeholder highlighter. Page-specific code lives in js/pages/.
   ========================================================================== */
(function () {
  "use strict";
  var P = window.PPEC;
  var S = window.SITE || {};
  var $ = P.$, $$ = P.$$;

  /* ---------- Fill contact details from js/config.js ---------- */
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

    var g = P.enquiry.general();
    var hrefs = {
      tel: g.tel,
      mail: S.email ? "mailto:" + S.email : "",
      wa: g.whatsapp,
      map: S.mapQuery ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.mapQuery) : ""
    };
    $$("[data-site-href]").forEach(function (el) {
      var v = hrefs[el.getAttribute("data-site-href")];
      if (v) el.setAttribute("href", v);
    });

    var frame = $("#map-frame");
    if (frame && S.mapQuery) {
      frame.setAttribute("src", "https://maps.google.com/maps?q=" + encodeURIComponent(S.mapQuery) + "&output=embed");
    }

    // Social links appear only when a real https:// address is supplied
    $$("[data-social]").forEach(function (box) {
      var n = 0;
      Object.keys(S.social || {}).forEach(function (name) {
        var url = S.social[name];
        if (!P.isHttp(url)) return;
        var a = P.el("a", "", name, { href: url, target: "_blank", rel: "noopener noreferrer", "aria-label": name + " (opens in a new tab)" });
        box.appendChild(a); n++;
      });
      if (!n) box.hidden = true;
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
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false, true);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    var mq = window.matchMedia("(min-width: 1101px)");      // keep in step with the breakpoint in css/style.css
    var onChange = function () { if (mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else mq.addListener(onChange);
  }

  /* ---------- Subtle scroll reveal (also usable for content added later) ---------- */
  var io = null;
  P.reveal = function (root) {
    var items = $$(".reveal:not(.is-visible)", root || document);
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("is-visible"); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    }
    items.forEach(function (i) { io.observe(i); });
  };

  /* ---------- Placeholder highlighter: add ?placeholders=1 to any page address ---------- */
  function initPlaceholderMode() {
    if (new URLSearchParams(window.location.search).get("placeholders") === "1") document.body.classList.add("show-ph");
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSiteDetails();
    initNav();
    initPlaceholderMode();
    P.reveal();
  });
})();
