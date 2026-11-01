/* Properties and Projects catalogue pages (properties.html, projects.html).
   One engine, configured by <main data-catalogue="property|project">. */
(function () {
  "use strict";
  var P = window.PPEC;
  var S = window.SITE || {};

  var CONFIG = {
    property: {
      file: "properties", catKey: "propertyCategories", statusKey: "availability", statusField: "availability",
      nouns: ["property", "properties"], hasPrice: true, emptyAll: "No properties are listed at the moment. Please contact us to hear about current availability."
    },
    project: {
      file: "projects", catKey: "projectCategories", statusKey: "projectStatuses", statusField: "projectStatus",
      nouns: ["project", "projects"], hasPrice: false, emptyAll: "No projects are listed at the moment. Please check back soon or contact us."
    }
  };
  var VIEW_KEY = "ppec-view";   // grid/list choice is remembered for the browser session

  document.addEventListener("DOMContentLoaded", function () {
    var root = P.$("[data-catalogue]");
    if (root) init(root);
  });

  function init(root) {
    var kind = root.getAttribute("data-catalogue");
    var C = CONFIG[kind];
    if (!C) return;

    var E = {
      q: P.$("#f-q"), cat: P.$("#f-cat"), loc: P.$("#f-loc"), status: P.$("#f-status"),
      min: P.$("#f-min"), max: P.$("#f-max"), priceBox: P.$("#price-filter"), sort: P.$("#f-sort"),
      count: P.$("#result-count"), reset: P.$("#f-reset"), results: P.$("#results"),
      more: P.$("#show-more"), moreWrap: P.$("#more-wrap"),
      featSec: P.$("#featured-section"), featList: P.$("#featured-list"), viewBtns: P.$$("[data-view]")
    };
    var state = {
      q: "", cat: "", loc: "", status: "", min: "", max: "", sort: "newest",
      shown: S.pageSize || 6, view: P.session.get(VIEW_KEY) === "list" ? "list" : "grid"
    };
    var all = [], tax = {}, pricedAny = false;

    start();

    function start() {
      P.ui.skeletons(E.results, 3);
      Promise.all([P.data.published(C.file), P.data.taxonomy()])
        .then(function (r) { all = r[0]; tax = r[1]; setup(); render(); })
        .catch(function (err) {
          console.error(err);
          P.clear(E.results);
          E.results.removeAttribute("aria-busy");
          E.results.appendChild(P.ui.error("We could not load the " + C.nouns[1] + " right now. Please try again, or contact us directly.", start));
          E.count.textContent = "";
        });
    }

    /* ---- fill the filter controls from the data ---- */
    function fillSelect(sel, items, firstLabel) {
      P.clear(sel);
      sel.appendChild(P.el("option", "", firstLabel, { value: "" }));
      items.forEach(function (it) { sel.appendChild(P.el("option", "", it.label, { value: it.value })); });
    }
    function present(list, field) {   // taxonomy entries that at least one record uses, in taxonomy order
      var used = {};
      all.forEach(function (r) { if (r[field]) used[r[field]] = true; });
      var out = (list || []).filter(function (t) { return used[t.id]; }).map(function (t) { return { value: t.id, label: t.label }; });
      Object.keys(used).forEach(function (id) {       // ids missing from the taxonomy still get an option
        if (!out.some(function (o) { return o.value === id; })) out.push({ value: id, label: P.label([], id) });
      });
      return out;
    }

    function setup() {
      fillSelect(E.cat, present(tax[C.catKey], "category"), "All categories");
      var locs = {};
      all.forEach(function (r) { if (r.location) locs[r.location] = true; });
      fillSelect(E.loc, Object.keys(locs).sort(function (a, b) { return a.localeCompare(b); }).map(function (l) { return { value: l, label: l }; }), "All locations");
      fillSelect(E.status, present(tax[C.statusKey], C.statusField), C.statusKey === "availability" ? "Any availability" : "Any status");

      pricedAny = C.hasPrice && all.some(function (r) { return P.priceAmount(r) != null; });
      if (E.priceBox) E.priceBox.hidden = !pricedAny;
      if (!pricedAny) {      // no verified prices yet: hide the price controls instead of showing empty ones
        P.$$("option[data-needs-price]", E.sort).forEach(function (o) { o.remove(); });
      }

      // Starting values from the address, e.g. properties.html?category=apartments
      var qs = new URLSearchParams(window.location.search);
      function fromParam(name, sel, key) {
        var v = qs.get(name);
        if (v && P.$$("option", sel).some(function (o) { return o.value === v; })) { sel.value = v; state[key] = v; }
      }
      fromParam("category", E.cat, "cat");
      fromParam("location", E.loc, "loc");
      fromParam("status", E.status, "status");
      if (qs.get("q")) { E.q.value = qs.get("q").slice(0, 80); state.q = E.q.value.trim(); }

      bind();
      applyView();
      renderFeatured();
    }

    /* ---- events ---- */
    function bind() {
      var t = null;
      E.q.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { state.q = E.q.value.trim(); changed(); }, 150);
      });
      [["cat", E.cat], ["loc", E.loc], ["status", E.status], ["sort", E.sort]].forEach(function (p) {
        p[1].addEventListener("change", function () { state[p[0]] = p[1].value; changed(); });
      });
      [["min", E.min], ["max", E.max]].forEach(function (p) {
        if (!p[1]) return;
        p[1].addEventListener("input", function () {
          var v = p[1].value.trim();
          state[p[0]] = v !== "" && !isNaN(Number(v)) && Number(v) >= 0 ? Number(v) : "";
          changed();
        });
      });
      E.q.form.addEventListener("submit", function (e) { e.preventDefault(); });
      E.reset.addEventListener("click", resetAll);
      E.viewBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          state.view = b.getAttribute("data-view") === "list" ? "list" : "grid";
          P.session.set(VIEW_KEY, state.view);
          applyView();
        });
      });
      E.more.addEventListener("click", function () {
        var before = E.results.children.length;
        state.shown += S.pageSize || 6;
        render();
        var first = E.results.children[before];       // move keyboard focus to the first new card
        var link = first && P.$("a", first);
        if (link) link.focus();
      });
    }

    function changed() { state.shown = S.pageSize || 6; render(); renderFeatured(); }
    function resetAll() {
      state.q = state.cat = state.loc = state.status = state.min = state.max = "";
      E.q.value = ""; E.cat.value = ""; E.loc.value = ""; E.status.value = "";
      if (E.min) E.min.value = ""; if (E.max) E.max.value = "";
      changed();
      E.q.focus();
    }
    function filtersActive() { return !!(state.q || state.cat || state.loc || state.status || state.min !== "" || state.max !== ""); }
    function applyView() {
      E.results.classList.toggle("results--list", state.view === "list");
      E.results.classList.toggle("results--grid", state.view !== "list");
      E.viewBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-view") === state.view)); });
    }

    /* ---- filtering and sorting ---- */
    function haystack(r) {
      return [r.title, r.location, r.summary,
        P.label(tax[C.catKey], r.category),
        P.label(tax[C.statusKey], r[C.statusField]),
        (r.tags || []).join(" ")].join(" ").toLowerCase();
    }
    function matches(r) {
      if (state.cat && r.category !== state.cat) return false;
      if (state.loc && (r.location || "") !== state.loc) return false;
      if (state.status && r[C.statusField] !== state.status) return false;
      if (state.min !== "" || state.max !== "") {
        var a = P.priceAmount(r);
        if (a == null) return false;
        if (state.min !== "" && a < state.min) return false;
        if (state.max !== "" && a > state.max) return false;
      }
      if (state.q) {
        var h = haystack(r);
        var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
        for (var i = 0; i < words.length; i++) if (h.indexOf(words[i]) === -1) return false;
      }
      return true;
    }
    function byNewest(a, b) {
      return (b.dateAdded || "").localeCompare(a.dateAdded || "") || String(a.title).localeCompare(String(b.title));
    }
    function byPrice(dir) {
      return function (a, b) {
        var x = P.priceAmount(a), y = P.priceAmount(b);
        if (x == null && y == null) return byNewest(a, b);
        if (x == null) return 1;            // records without a verified price go last
        if (y == null) return -1;
        return (x - y) * dir || byNewest(a, b);
      };
    }
    function comparator() {
      if (state.sort === "price-asc") return byPrice(1);
      if (state.sort === "price-desc") return byPrice(-1);
      if (state.sort === "location") return function (a, b) { return (a.location || "").localeCompare(b.location || "", "en", { sensitivity: "base" }) || byNewest(a, b); };
      return byNewest;
    }

    /* ---- rendering ---- */
    function render() {
      var list = all.filter(matches).sort(comparator());
      var frag = document.createDocumentFragment();
      list.slice(0, state.shown).forEach(function (r) { frag.appendChild(P.ui.card(r, kind, { tax: tax, light: true })); });

      P.clear(E.results);
      E.results.removeAttribute("aria-busy");
      if (!all.length) {
        E.results.appendChild(P.ui.empty(C.emptyAll));
        E.count.textContent = "";
      } else if (!list.length) {
        E.results.appendChild(P.ui.empty("No " + C.nouns[1] + " match your search or filters.", { label: "Reset filters", onClick: resetAll }));
        E.count.textContent = "No " + C.nouns[1] + " found";
      } else {
        E.results.appendChild(frag);
        var shown = Math.min(state.shown, list.length);
        E.count.textContent = "Showing " + shown + " of " + list.length + " " + C.nouns[list.length === 1 ? 0 : 1];
      }
      var remaining = Math.max(0, list.length - state.shown);
      E.moreWrap.hidden = remaining === 0;
      E.more.textContent = "Show more (" + remaining + " more)";
      E.reset.hidden = !filtersActive();
    }

    function renderFeatured() {
      if (!E.featSec) return;
      var feat = all.filter(function (r) { return r.featured; }).sort(byNewest).slice(0, 3);
      var show = feat.length > 0 && !filtersActive();
      E.featSec.hidden = !show;
      if (!show || E.featList.getAttribute("data-done")) return;
      feat.forEach(function (r) { E.featList.appendChild(P.ui.card(r, kind, { tax: tax, light: false })); });
      E.featList.setAttribute("data-done", "1");
    }
  }
})();
