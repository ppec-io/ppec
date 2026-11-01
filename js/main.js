/* ==========================================================================
   main.js — behaviour shared by every page (no dependencies).
   Contact details come from js/config.js; catalogue content from data/*.json
   (see core.js, catalogue.js, detail.js, gallery.js, content.js).
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, $ = PP.$, $$ = PP.$$, make = PP.el;
  function isHttp(url) { return /^https?:\/\//i.test(url || ""); }

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
      tel: PP.telLink(),
      mail: S.email ? "mailto:" + S.email : "",
      wa: S.whatsappNumber ? PP.waLink() : "",
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

  /* ---------- Organisation structured data (built from config; only supplied details) ---------- */
  function addOrganisationSchema() {
    if (!$("[data-schema='organization']")) return;
    var data = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": S.brandName,
      "url": S.siteUrl
    };
    if (S.legalName) data.legalName = S.legalName;
    if (S.phoneTel) data.telephone = S.phoneTel;
    if (S.email) data.email = S.email;
    data.logo = PP.abs("assets/images/logo-horizontal.png");
    var lines = S.addressLines || [];
    if (lines.length) {
      data.address = { "@type": "PostalAddress", "streetAddress": lines[0], "addressLocality": (lines[1] || "").split(",")[0].trim(), "addressRegion": ((lines[1] || "").split(",")[1] || "").trim(), "addressCountry": "GH" };
    }
    var sameAs = Object.keys(S.social || {}).map(function (k) { return S.social[k]; }).filter(isHttp);
    if (sameAs.length) data.sameAs = sameAs;
    var tag = make("script", "", JSON.stringify(data), { type: "application/ld+json" });
    document.head.appendChild(tag);
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
      var hd = $(".site-header"); if (hd) hd.classList.toggle("nav-open", open);
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
    var mq = window.matchMedia("(min-width: 1101px)");
    var onChange = function () { if (mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else mq.addListener(onChange);
  }

  /* ---------- Sub-menu under "About Us" (Our Team, Careers, FAQ) ---------- */
  function initSubmenus() {
    $$(".nav__item--sub").forEach(function (item) {
      var btn = $(".nav__subtoggle", item);
      if (!btn) return;
      function set(open) { item.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); }
      btn.addEventListener("click", function (e) { e.stopPropagation(); set(!item.classList.contains("is-open")); });
      document.addEventListener("click", function (e) { if (!item.contains(e.target)) set(false); });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && item.classList.contains("is-open")) { set(false); btn.focus(); e.stopPropagation(); }
      });
    });
  }

  /* ---------- Home page: header turns solid after scrolling past the top ---------- */
  function initHeaderScroll() {
    var header = $(".site-header");
    if (!header || !document.body.classList.contains("home")) return;
    function update() { header.classList.toggle("is-solid", window.scrollY > 40); }
    update();
    window.addEventListener("scroll", update, { passive: true });
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
    var refUrl = "";   // address of the property / project being enquired about

    function addOptions(group, items, prefix, labelFn) {
      if (!group) return;
      items.forEach(function (r) {
        var o = make("option", "", labelFn(r));
        o.value = prefix + ":" + r.id;
        group.appendChild(o);
      });
    }
    function interestLabel() {
      var opt = f.interest.options[f.interest.selectedIndex];
      return opt && opt.value ? opt.textContent : "General enquiry";
    }

    // Interest list: services, properties and projects come from the JSON files.
    // The static service options in the page remain as a fallback if the data cannot load.
    var wanted = PP.params().get("enquiry");
    function preselect(props, projs) {
      if (!wanted) return;
      var p = PP.findById(props, wanted), j = PP.findById(projs, wanted);
      var rec = p || j; if (!rec) return;
      f.interest.value = (p ? "property:" : "project:") + rec.id;
      refUrl = PP.abs(PP.detailUrl(p ? "property" : "project", rec.id));
      if (!f.message.value) f.message.value = "Hello, I would like to know more about " + rec.name + ".";
    }
    Promise.all([PP.loadData("services"), PP.loadData("properties"), PP.loadData("projects")]).then(function (res) {
      var services = res[0].sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      var svcGroup = $("#interest-services");
      if (svcGroup && services.length) { PP.clear(svcGroup); addOptions(svcGroup, services, "service", function (s) { return s.title; }); }
      addOptions($("#interest-properties"), res[1], "property", function (r) { return r.name; });
      addOptions($("#interest-projects"), res[2], "project", function (r) { return r.name; });
      ["#interest-properties", "#interest-projects"].forEach(function (id) { var g = $(id); if (g && !g.children.length) g.remove(); });
      preselect(res[1], res[2]);
    }).catch(function () {
      ["#interest-properties", "#interest-projects"].forEach(function (id) { var g = $(id); if (g) g.remove(); });
    });

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
        refUrl && /^(property|project):/.test(f.interest.value) ? "Page: " + refUrl : "",
        "",
        f.message.value.trim()
      ];
      return lines.filter(function (l, i) { return l !== "" || i === 5; }).join("\n");
    }
    function say(msg, ok) {
      status.textContent = msg;
      status.className = "form__status " + (ok ? "is-ok" : "is-err");
    }
    // keep the reference address in step with the chosen property / project
    f.interest.addEventListener("change", function () {
      var m = /^(property|project):(.+)$/.exec(f.interest.value);
      refUrl = m ? PP.abs(PP.detailUrl(m[1], m[2])) : "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) { say("Please correct the highlighted fields.", false); return; }
      var subject = "Website enquiry: " + interestLabel() + " — " + f.name.value.trim();
      say("Opening your email app… If nothing opens, please email us directly at " + S.email + ".", true);
      window.location.href = PP.mailLink(subject, summary());
    });

    var waBtn = $("#send-whatsapp");
    if (waBtn) {
      waBtn.addEventListener("click", function () {
        if (!validate()) { say("Please correct the highlighted fields.", false); return; }
        say("Opening WhatsApp…", true);
        window.open(PP.waLink(summary()), "_blank", "noopener");
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
    if (PP.params().get("placeholders") === "1") document.body.classList.add("show-ph");
  }

  PP.ready(function () {
    fillSiteDetails();
    addOrganisationSchema();
    initNav();
    initSubmenus();
    initHeaderScroll();
    initForm();
    initPlaceholderMode();
    initReveal();
  });
})();
