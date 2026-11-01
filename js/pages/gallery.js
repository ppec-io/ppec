/* Gallery: category filters, responsive grid and the image viewer. */
(function () {
  "use strict";
  var P = window.PPEC;

  document.addEventListener("DOMContentLoaded", function () {
    var grid = P.$("#gallery-grid");
    if (!grid) return;
    var chips = P.$("#gallery-filters");
    var count = P.$("#gallery-count");
    var all = [], tax = {}, cat = "";

    function run() {
      P.clear(grid);
      grid.appendChild(P.ui.loading("Loading gallery…"));
      Promise.all([P.data.published("gallery"), P.data.taxonomy()])
        .then(function (r) {
          all = r[0]; tax = r[1];
          var want = new URLSearchParams(window.location.search).get("category");
          if (want && all.some(function (i) { return i.category === want; })) cat = want;
          buildChips();
          render();
        })
        .catch(function (err) {
          console.error(err);
          P.clear(grid);
          grid.appendChild(P.ui.error("We could not load the gallery right now.", run));
        });
    }

    function buildChips() {
      P.clear(chips);
      var used = {};
      all.forEach(function (i) { used[i.category] = (used[i.category] || 0) + 1; });
      var opts = [{ id: "", label: "All", n: all.length }];
      (tax.galleryCategories || []).forEach(function (c) { if (used[c.id]) opts.push({ id: c.id, label: c.label, n: used[c.id] }); });
      Object.keys(used).forEach(function (id) {
        if (!opts.some(function (o) { return o.id === id; })) opts.push({ id: id, label: P.label([], id), n: used[id] });
      });
      chips.hidden = opts.length < 3;           // a single category needs no filter
      opts.forEach(function (o) {
        var b = P.el("button", "chip", o.label + " (" + o.n + ")", { type: "button", "aria-pressed": String(o.id === cat) });
        b.addEventListener("click", function () {
          cat = o.id;
          P.$$(".chip", chips).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          render();
        });
        chips.appendChild(b);
      });
    }

    function render() {
      var list = all.filter(function (i) { return !cat || i.category === cat; });
      P.clear(grid);
      grid.removeAttribute("aria-busy");
      if (!list.length) {
        grid.appendChild(P.ui.empty(all.length ? "No images in this category yet." : "Photographs will be added to the gallery soon."));
        count.textContent = "";
        return;
      }
      var viewer = list.map(function (i) {
        return { src: i.src, alt: i.alt, caption: [i.title, i.caption].filter(Boolean).join(" — ") };
      });
      list.forEach(function (it, n) {
        var li = P.el("div", "tile");
        var b = P.el("button", "tile__btn", null, { type: "button" });
        b.appendChild(P.el("img", "", null, { src: P.asset(it.thumb || it.src), alt: it.alt || it.title || "", width: 480, height: 360, loading: "lazy", decoding: "async" }));
        if (it.placeholder) b.appendChild(P.ui.badge("Sample", "badge--sample"));
        b.addEventListener("click", function () { P.lightbox.open(viewer, n); });
        li.appendChild(b);
        li.appendChild(P.el("p", "tile__cap", it.title));
        grid.appendChild(li);
      });
      count.textContent = "Showing " + list.length + (list.length === 1 ? " image" : " images");
    }
    run();
  });
})();
