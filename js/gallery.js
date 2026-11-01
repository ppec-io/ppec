/* ==========================================================================
   gallery.js — gallery.html: category filters, responsive grid and lightbox.
   Records come from data/gallery.json (published only).
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el, UI = PP.ui;
  var root = PP.$("[data-gallery]");
  if (!root) return;

  var cats = (S.taxonomy || {}).galleryCategories || [];
  var filtersBox = PP.$("#gallery-filters");
  var gridBox = PP.$("#gallery-grid");
  var countEl = PP.$("#gallery-count");
  var all = [], current = "";

  function visible() { return all.filter(function (g) { return !current || g.category === current; }); }

  function renderGrid() {
    var items = visible();
    PP.clear(gridBox);
    if (!items.length) { UI.state(gridBox, "empty", "There are no images in this category yet."); }
    var lbItems = items.map(function (g) {
      return { src: g.src, alt: g.alt || g.title || "", caption: (g.title ? g.title + (g.alt ? " — " + g.alt : "") : g.alt) };
    });
    items.forEach(function (g, i) {
      var b = el("button", "gallery-item", null, { type: "button", "aria-label": (g.title || g.alt || "Gallery image") + (g.placeholder ? " (sample)" : "") + ": enlarge image" });
      b.appendChild(UI.img({ src: g.thumb || g.src, alt: g.alt || g.title || "" }, { width: 600, height: 450 }));
      if (g.title) b.appendChild(el("span", "gallery-item__cap", g.title));
      if (g.placeholder) b.className += " is-sample";
      b.addEventListener("click", function () { UI.openLightbox(lbItems, i, b); });
      gridBox.appendChild(b);
    });
    countEl.textContent = items.length + (items.length === 1 ? " image" : " images");
  }

  function renderFilters() {
    PP.clear(filtersBox);
    var present = {};
    all.forEach(function (g) { present[g.category] = true; });
    var opts = [{ key: "", label: "All" }].concat(cats.filter(function (c) { return present[c.key]; }));
    opts.forEach(function (o) {
      var b = el("button", "chip-btn", o.label, { type: "button", "aria-pressed": o.key === current ? "true" : "false" });
      b.addEventListener("click", function () {
        current = o.key;
        PP.$$(".chip-btn", filtersBox).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        renderGrid();
      });
      filtersBox.appendChild(b);
    });
  }

  function init() {
    UI.state(gridBox, "loading");
    PP.loadData("gallery").then(function (items) {
      all = items.filter(function (g) { return PP.has(g.src); });
      if (!all.length) { PP.clear(filtersBox); UI.state(gridBox, "empty", "Gallery images will appear here soon."); return; }
      var p = PP.params().get("category");
      if (p && cats.some(function (c) { return c.key === p; })) current = p;
      renderFilters();
      renderGrid();
      var notice = PP.$("#sample-notice");
      if (notice) notice.hidden = !all.some(function (g) { return g.placeholder; });
    }).catch(function (err) { UI.dataError(gridBox, err, init); });
  }

  PP.ready(init);
})();
