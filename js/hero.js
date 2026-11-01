/* ==========================================================================
   hero.js — home page hero slider (multiple slides, each with its own content and
   transition) and the 3D "coverflow" showcase of featured properties.
   Slides come from data/hero.json. Transitions available (set per slide with
   "transition"): fade, slide-left, slide-right, slide-up, zoom, wipe, cube (3D), flip (3D).
   Pure CSS 3D transforms are used: no libraries, nothing to download.
   The slider respects "reduce motion": no autoplay, no animated transitions.
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, el = PP.el, $ = PP.$, UI = PP.ui;
  var mqReduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var FX = ["fade", "slide-left", "slide-right", "slide-up", "zoom", "wipe", "cube", "flip"];
  var DWELL = 7000;       // time each slide stays on screen (ms)
  var DURATION = 1100;    // must match the transition time in style.css (--hero-dur)

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ======================================================================
     Hero slider
     ====================================================================== */
  function initHero(root) {
    var stage = $("[data-hero-stage]", root);
    var bar = $("[data-hero-bar]", root);
    if (!stage || !bar) return;

    var slides = [], recs = [], idx = 0, busy = false, timer = null;
    var userPaused = false, hovering = false, focusing = false, hidden = false;
    var ui = {};

    function setHalf() { stage.style.setProperty("--half", (stage.offsetWidth / 2) + "px"); }

    /* Off-screen slides must not be reachable by keyboard or screen reader. */
    function setLive(slide, on) {
      slide.setAttribute("aria-hidden", on ? "false" : "true");
      if (on) slide.removeAttribute("inert"); else slide.setAttribute("inert", "");
      PP.$$("a, button", slide).forEach(function (a) { if (on) a.removeAttribute("tabindex"); else a.tabIndex = -1; });
    }

    function buildSlide(rec, i, n) {
      var fx = FX.indexOf(rec.transition) > -1 ? rec.transition : "fade";
      var s = el("div", "hero-slide", null, {
        role: "group", "aria-roledescription": "slide", "aria-label": (i + 1) + " of " + n, "data-fx": fx
      });
      var media = el("div", "hero-slide__media");
      var img = el("img", "", null, { alt: (rec.image && rec.image.alt) || "", width: "1600", height: "900", decoding: "async" });
      if (rec.image && rec.image.position) img.style.objectPosition = rec.image.position;
      if (i === 0) { img.src = rec.image.src; img.setAttribute("fetchpriority", "high"); } else { img.setAttribute("data-src", rec.image.src); }
      media.appendChild(img);
      s.appendChild(media);

      var inner = el("div", "container hero-slide__inner");
      var c = el("div", "hero-slide__content");
      var kids = [];
      if (PP.has(rec.eyebrow)) kids.push(el("span", "eyebrow", rec.eyebrow));
      var h = el("h2", "hero-slide__title", rec.title || "");
      if (PP.has(rec.titleEm)) { h.appendChild(document.createTextNode(" ")); h.appendChild(el("em", "", rec.titleEm)); }
      kids.push(h);
      if (PP.has(rec.text)) kids.push(el("p", "hero-slide__text", rec.text));
      var row = el("div", "btn-row");
      if (rec.cta && rec.cta.href) row.appendChild(UI.link("btn btn--gold", rec.cta.label || "Learn more", rec.cta.href));
      if (rec.cta2 && rec.cta2.href) row.appendChild(UI.link("btn btn--ghost", rec.cta2.label || "Contact", rec.cta2.href));
      if (row.children.length) kids.push(row);
      kids.forEach(function (k, n2) { k.style.setProperty("--i", n2); c.appendChild(k); });
      inner.appendChild(c);
      s.appendChild(inner);
      setLive(s, i === 0);
      return s;
    }

    /* A slide image is only downloaded shortly before it is needed. */
    function loadImage(i) {
      return new Promise(function (resolve) {
        var img = $("img", slides[i]);
        if (!img) { resolve(); return; }
        var src = img.getAttribute("data-src");
        if (!src) { resolve(); return; }
        img.removeAttribute("data-src");
        var done = false;
        function fin() { if (!done) { done = true; resolve(); } }
        img.addEventListener("load", fin); img.addEventListener("error", fin);
        img.src = src;
        setTimeout(fin, 2500);   // never block the slider on a slow image
      });
    }

    /* ---------- controls ---------- */
    function btn(cls, label, text) {
      var b = el("button", "hero__btn " + cls, text, { type: "button", "aria-label": label });
      return b;
    }
    function buildControls(n) {
      PP.clear(bar);
      var wrap = el("div", "container hero__controls");
      var left = el("div", "hero__count");
      ui.cur = el("span", "hero__cur", "01");
      ui.progress = el("span", "hero__progress", null, { "aria-hidden": "true" });
      ui.fill = el("i"); ui.progress.appendChild(ui.fill);
      left.appendChild(ui.cur); left.appendChild(ui.progress); left.appendChild(el("span", "hero__tot", pad(n)));
      wrap.appendChild(left);

      ui.dots = el("div", "hero__dots", null, { role: "group", "aria-label": "Choose slide" });
      for (var i = 0; i < n; i++) (function (k) {
        var d = el("button", "hero__dot", null, { type: "button", "aria-label": "Go to slide " + (k + 1) + " of " + n });
        d.addEventListener("click", function () { userGo(k); });
        ui.dots.appendChild(d);
      })(i);
      wrap.appendChild(ui.dots);

      var right = el("div", "hero__buttons");
      ui.prev = btn("hero__prev", "Previous slide", "‹");
      ui.play = btn("hero__play", "Pause slideshow", "");
      ui.next = btn("hero__next", "Next slide", "›");
      ui.prev.addEventListener("click", function () { userGo(idx - 1, -1); });
      ui.next.addEventListener("click", function () { userGo(idx + 1, 1); });
      ui.play.addEventListener("click", function () { userPaused = !userPaused; syncPlay(); });
      right.appendChild(ui.prev); right.appendChild(ui.play); right.appendChild(ui.next);
      wrap.appendChild(right);
      bar.appendChild(wrap);
    }
    function isPlaying() { return !mqReduce.matches && !userPaused && slides.length > 1; }
    function syncPlay() {
      var playing = isPlaying();
      ui.play.setAttribute("aria-label", userPaused ? "Play slideshow" : "Pause slideshow");
      ui.play.className = "hero__btn hero__play" + (userPaused || mqReduce.matches ? " is-paused" : "");
      ui.play.hidden = mqReduce.matches;
      stage.setAttribute("aria-live", playing ? "off" : "polite");
      root.classList.toggle("is-paused", !playing);
      schedule();
    }
    function syncUi() {
      ui.cur.textContent = pad(idx + 1);
      PP.$$(".hero__dot", ui.dots).forEach(function (d, i) { if (i === idx) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    }

    /* ---------- timing ---------- */
    function restartProgress() {
      ui.fill.style.animation = "none"; void ui.fill.offsetWidth; ui.fill.style.animation = "";
    }
    function schedule() {
      clearTimeout(timer); timer = null;
      restartProgress();
      if (!isPlaying() || hovering || focusing || hidden) { root.classList.add("is-idle"); return; }
      root.classList.remove("is-idle");
      timer = setTimeout(function () { go(idx + 1, 1); }, DWELL);
    }

    /* ---------- moving between slides ---------- */
    function userGo(to, dir) { go(to, dir, true); }
    function go(to, dir, fromUser) {
      var n = slides.length;
      to = ((to % n) + n) % n;
      if (busy || to === idx) { if (!busy) schedule(); return; }
      if (!dir) dir = to > idx ? 1 : -1;
      busy = true;
      clearTimeout(timer);
      var from = slides[idx], next = slides[to];

      loadImage(to).then(function () {
        function finish() {
          from.classList.remove("is-leaving");
          setLive(from, false);
          busy = false;
          schedule();
          if (slides[(idx + 1) % n]) loadImage((idx + 1) % n);   // warm the following slide
        }
        idx = to;
        syncUi();
        setLive(next, true);
        if (mqReduce.matches) {
          from.classList.remove("is-active"); next.classList.add("is-active");
          finish(); return;
        }
        stage.setAttribute("data-fx", next.getAttribute("data-fx"));
        stage.setAttribute("data-dir", dir > 0 ? "1" : "-1");
        next.classList.add("is-entering");
        void next.offsetWidth;                          // lock in the starting position
        from.classList.remove("is-active"); from.classList.add("is-leaving");
        next.classList.remove("is-entering"); next.classList.add("is-active");
        setTimeout(finish, DURATION + 60);
      });
    }

    /* ---------- pointer: swipe + 3D tilt ---------- */
    var sx = null, sy = null;
    stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) userGo(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }, { passive: true });

    var raf = 0;
    root.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || mqReduce.matches) return;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = root.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        stage.style.setProperty("--px", (x * -22).toFixed(1) + "px");
        stage.style.setProperty("--py", (y * -14).toFixed(1) + "px");
        stage.style.setProperty("--ry", (x * 5).toFixed(2) + "deg");
        stage.style.setProperty("--rx", (y * -4).toFixed(2) + "deg");
      });
    });
    root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { hovering = true; schedule(); } });
    root.addEventListener("pointerleave", function () {
      hovering = false; schedule();
      ["--px", "--py", "--ry", "--rx"].forEach(function (p) { stage.style.removeProperty(p); });
    });
    root.addEventListener("focusin", function () { focusing = true; schedule(); });
    root.addEventListener("focusout", function (e) { if (!root.contains(e.relatedTarget)) { focusing = false; schedule(); } });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { userGo(idx + 1, 1); }
      else if (e.key === "ArrowLeft") { userGo(idx - 1, -1); }
    });
    document.addEventListener("visibilitychange", function () { hidden = document.hidden; schedule(); });
    var onMotion = function () { syncPlay(); };
    if (mqReduce.addEventListener) mqReduce.addEventListener("change", onMotion); else if (mqReduce.addListener) mqReduce.addListener(onMotion);
    window.addEventListener("resize", setHalf);

    /* ---------- start ---------- */
    function start(list) {
      recs = list;
      var n = list.length;
      var frag = document.createDocumentFragment();
      list.forEach(function (r, i) { var s = buildSlide(r, i, n); slides.push(s); frag.appendChild(s); });
      slides[0].classList.add("is-active");
      PP.clear(stage); stage.appendChild(frag);
      setHalf();
      if (n > 1) {
        buildControls(n);
        syncUi(); syncPlay();
        var warm = function () { loadImage(1); };
        if (document.readyState === "complete") warm(); else window.addEventListener("load", warm);
      } else { PP.clear(bar); }
    }

    PP.loadData("hero").then(function (list) {
      list = list.filter(function (r) { return r.image && r.image.src; })
                 .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      if (list.length) start(list);      // otherwise the static first slide in the page stays
    }).catch(function () { /* keep the static first slide; nothing else to do */ });
  }

  /* ======================================================================
     3D coverflow showcase (featured properties / projects)
     ====================================================================== */
  function initShowcase(box) {
    var kind = box.getAttribute("data-showcase") === "projects" ? "projects" : "properties";
    var type = kind === "projects" ? "project" : "property";
    var cur = 0, items = [], nodes = [], drag = null;

    function render() {
      nodes.forEach(function (n, i) {
        var o = i - cur, ax = Math.abs(o);
        n.style.setProperty("--o", o);
        n.style.setProperty("--ax", Math.min(ax, 4));
        n.style.zIndex = String(50 - ax);
        n.classList.toggle("is-current", o === 0);
        n.setAttribute("aria-hidden", o === 0 ? "false" : "true");
        PP.$$("a", n).forEach(function (a) { a.tabIndex = o === 0 ? 0 : -1; });
        n.setAttribute("aria-label", (i + 1) + " of " + nodes.length);
      });
      if (ui2.prev) { ui2.prev.disabled = cur === 0; ui2.next.disabled = cur === nodes.length - 1; }
      PP.$$(".cf__dot", box).forEach(function (d, i) { if (i === cur) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    }
    function to(i) { cur = Math.max(0, Math.min(nodes.length - 1, i)); render(); }
    var ui2 = {};

    function build() {
      PP.clear(box);
      var cf = el("div", "cf", null, { role: "region", "aria-roledescription": "carousel", "aria-label": "Featured " + kind + " (3D view)" });
      var track = el("div", "cf__track");
      items.forEach(function (r, i) {
        var url = PP.detailUrl(type, r.id);
        var it = el("div", "cf__item", null, { role: "group", "aria-roledescription": "slide" });
        var a = el("a", "cf__media", null, { href: url, "aria-label": "View details: " + r.name });
        a.appendChild(UI.img(UI.thumb(UI.firstImage(r)), { width: 640, height: 480, fallbackAlt: "" }));
        if (r.placeholder) a.appendChild(el("span", "badge badge--sample", "Sample"));
        it.appendChild(a);
        var cap = el("div", "cf__cap");
        var cat = UI.categoryLabel(type, r);
        if (cat) cap.appendChild(el("p", "card__cat", cat));
        cap.appendChild(el("h3", "cf__title", r.name));
        if (PP.has(r.location)) cap.appendChild(el("p", "cf__loc", r.location));
        if (typeof r.price === "number") cap.appendChild(el("p", "cf__price", PP.formatPrice(r.price)));
        cap.appendChild(UI.link("btn btn--gold btn--sm", "View details", url));
        it.appendChild(cap);
        it.addEventListener("click", function (e) {
          if (nodes.indexOf(it) !== cur) { e.preventDefault(); to(nodes.indexOf(it)); }
        }, true);
        nodes.push(it); track.appendChild(it);
      });
      cf.appendChild(track);

      var nav = el("div", "cf__nav");
      ui2.prev = el("button", "hero__btn", "‹", { type: "button", "aria-label": "Previous " + type });
      ui2.next = el("button", "hero__btn", "›", { type: "button", "aria-label": "Next " + type });
      ui2.prev.addEventListener("click", function () { to(cur - 1); });
      ui2.next.addEventListener("click", function () { to(cur + 1); });
      var dots = el("div", "cf__dots");
      items.forEach(function (r, i) {
        var d = el("button", "hero__dot cf__dot", null, { type: "button", "aria-label": "Show " + r.name });
        d.addEventListener("click", function () { to(i); });
        dots.appendChild(d);
      });
      nav.appendChild(ui2.prev); nav.appendChild(dots); nav.appendChild(ui2.next);
      cf.appendChild(nav);
      box.appendChild(cf);

      cf.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); to(cur + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); to(cur - 1); }
      });
      // swipe / drag
      track.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, id: e.pointerId }; });
      track.addEventListener("pointerup", function (e) {
        if (!drag) return;
        var dx = e.clientX - drag.x; drag = null;
        if (Math.abs(dx) > 50) to(cur + (dx < 0 ? 1 : -1));
      });
      track.addEventListener("pointercancel", function () { drag = null; });
      // gentle 3D tilt on the front card (mouse only)
      track.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse" || mqReduce.matches) return;
        var n = nodes[cur]; if (!n) return;
        var r = n.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        if (Math.abs(x) > .75 || Math.abs(y) > .75) { n.style.removeProperty("--tx"); n.style.removeProperty("--ty"); return; }
        n.style.setProperty("--tx", (x * 8).toFixed(2) + "deg");
        n.style.setProperty("--ty", (y * -6).toFixed(2) + "deg");
      });
      track.addEventListener("pointerleave", function () { nodes.forEach(function (n) { n.style.removeProperty("--tx"); n.style.removeProperty("--ty"); }); });
      cur = Math.min(1, nodes.length - 1);
      if (nodes.length < 3) cur = 0;
      render();
    }

    function go() {
      UI.state(box, "loading");
      PP.loadData(kind).then(function (all) {
        items = all.filter(function (r) { return r.featured; }).sort(function (a, b) { return PP.byNewest(a, b) || PP.byText(a.name, b.name); }).slice(0, 6);
        if (!items.length) { UI.state(box, "empty", "Featured " + kind + " will appear here."); return; }
        build();
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  PP.ready(function () {
    PP.$$("[data-hero]").forEach(initHero);
    PP.$$("[data-showcase]").forEach(initShowcase);
  });
})();
