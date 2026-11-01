/* ==========================================================================
   catalogue.js — searchable, filterable listing for properties.html and projects.html.
   The page opts in with  <main data-catalogue="properties">  or  "projects".
   Records come from data/properties.json or data/projects.json (published only).
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el, UI = PP.ui;
  var root = PP.$("[data-catalogue]");
  if (!root) return;

  var isProp = root.getAttribute("data-catalogue") === "properties";
  var T = S.taxonomy || {};
  var cfg = isProp ? {
    type: "property", data: "properties", cats: T.propertyCategories,
    statusKey: "availability", statuses: T.availability, statusLabel: "Availability",
    plural: "properties", singular: "property"
  } : {
    type: "project", data: "projects", cats: T.projectCategories,
    statusKey: "projectStatus", statuses: T.projectStatuses, statusLabel: "Development status",
    plural: "projects", singular: "project"
  };

  var all = [];
  var state = {
    q: "", cat: "", loc: "", status: "", min: "", max: "", sort: "featured",
    view: PP.store.get("pp-view") === "list" ? "list" : "grid",
    shown: S.pageSize || 9
  };
  var ui = {};   // references to the toolbar controls and result nodes

  var resultsBox = PP.$("#catalogue-results");
  var toolsBox = PP.$("#catalogue-tools");
  var featBox = PP.$("#catalogue-featured");
  var featWrap = PP.$("#catalogue-featured-wrap");

  /* ---------- Toolbar ---------- */
  function field(id, labelText, control, cls) {
    var w = el("div", "field" + (cls ? " " + cls : ""));
    w.appendChild(el("label", "", labelText, { "for": id }));
    w.appendChild(control);
    return w;
  }
  function select(id, options, allLabel) {
    var s = el("select", "", null, { id: id });
    if (allLabel) s.appendChild(new Option(allLabel, ""));
    options.forEach(function (o) { s.appendChild(new Option(o.label, o.key)); });
    return s;
  }

  function buildToolbar() {
    PP.clear(toolsBox);
    var form = el("form", "toolbar", null, { role: "search", "aria-label": "Search and filter " + cfg.plural });
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    var row = el("div", "toolbar__row");

    ui.q = el("input", "", null, { id: "f-q", type: "search", placeholder: "Search by name, location or feature", autocomplete: "off" });
    row.appendChild(field("f-q", "Search", ui.q, "toolbar__search"));

    ui.cat = select("f-cat", cfg.cats, "All categories");
    row.appendChild(field("f-cat", "Category", ui.cat));

    var locs = {};
    all.forEach(function (r) { if (PP.has(r.location)) locs[r.location] = true; });
    var locList = Object.keys(locs).sort(PP.byText).map(function (l) { return { key: l, label: l }; });
    if (locList.length > 1) {
      ui.loc = select("f-loc", locList, "All locations");
      row.appendChild(field("f-loc", "Location", ui.loc));
    }

    ui.status = select("f-status", cfg.statuses, "Any");
    row.appendChild(field("f-status", cfg.statusLabel, ui.status));

    var anyPrice = isProp && all.some(function (r) { return typeof r.price === "number"; });
    if (anyPrice) {
      ui.min = el("input", "", null, { id: "f-min", type: "number", min: "0", step: "any", inputmode: "numeric", placeholder: "No minimum" });
      ui.max = el("input", "", null, { id: "f-max", type: "number", min: "0", step: "any", inputmode: "numeric", placeholder: "No maximum" });
      row.appendChild(field("f-min", "Min price (" + (S.currency || "GHS") + ")", ui.min));
      row.appendChild(field("f-max", "Max price (" + (S.currency || "GHS") + ")", ui.max));
    }

    var sorts = [{ key: "featured", label: "Featured first" }, { key: "newest", label: "Newest" }];
    if (anyPrice) {
      sorts.push({ key: "price-asc", label: "Price: low to high" });
      sorts.push({ key: "price-desc", label: "Price: high to low" });
    }
    sorts.push({ key: "location", label: "Location (A–Z)" });
    sorts.push({ key: "name", label: "Name (A–Z)" });
    ui.sort = select("f-sort", sorts);
    row.appendChild(field("f-sort", "Sort by", ui.sort));
    form.appendChild(row);

    var foot = el("div", "toolbar__foot");
    ui.count = el("p", "toolbar__count", null, { "aria-live": "polite", role: "status" });
    foot.appendChild(ui.count);
    var right = el("div", "toolbar__right");
    ui.reset = el("button", "btn btn--ghost-dark btn--sm", "Reset filters", { type: "button" });
    right.appendChild(ui.reset);
    var vt = el("div", "viewtoggle", null, { role: "group", "aria-label": "Layout" });
    ui.gridBtn = el("button", "viewtoggle__btn", "Grid", { type: "button" });
    ui.listBtn = el("button", "viewtoggle__btn", "List", { type: "button" });
    vt.appendChild(ui.gridBtn); vt.appendChild(ui.listBtn);
    right.appendChild(vt);
    foot.appendChild(right);
    form.appendChild(foot);
    toolsBox.appendChild(form);

    // events
    var timer;
    ui.q.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.q = ui.q.value; refilter(); }, 150);
    });
    bindChange(ui.cat, "cat"); bindChange(ui.loc, "loc"); bindChange(ui.status, "status"); bindChange(ui.sort, "sort");
    if (ui.min) { ui.min.addEventListener("input", function () { state.min = ui.min.value; refilter(); }); }
    if (ui.max) { ui.max.addEventListener("input", function () { state.max = ui.max.value; refilter(); }); }
    ui.reset.addEventListener("click", resetAll);
    ui.gridBtn.addEventListener("click", function () { setView("grid"); });
    ui.listBtn.addEventListener("click", function () { setView("list"); });
    syncView();
  }
  function bindChange(ctrl, key) {
    if (!ctrl) return;
    ctrl.addEventListener("change", function () { state[key] = ctrl.value; refilter(); });
  }

  function setView(v) {
    state.view = v; PP.store.set("pp-view", v); syncView();
    ui.results.className = "results cards--" + v;
  }
  function syncView() {
    ui.gridBtn.setAttribute("aria-pressed", state.view === "grid" ? "true" : "false");
    ui.listBtn.setAttribute("aria-pressed", state.view === "list" ? "true" : "false");
  }

  function resetAll() {
    state.q = state.cat = state.loc = state.status = state.min = state.max = "";
    state.sort = "featured";
    ui.q.value = ""; ui.cat.value = ""; ui.status.value = ""; ui.sort.value = "featured";
    if (ui.loc) ui.loc.value = "";
    if (ui.min) ui.min.value = "";
    if (ui.max) ui.max.value = "";
    refilter();
    ui.q.focus();
  }

  /* ---------- Filtering and sorting ---------- */
  function haystack(r) {
    var parts = [r.name, r.location, r.description, UI.categoryLabel(cfg.type, r)];
    (r.amenities || []).forEach(function (a) { parts.push(a); });
    (r.features || []).forEach(function (a) { parts.push(a); });
    return parts.join(" ").toLowerCase();
  }
  function matches(r) {
    if (state.cat && r.category !== state.cat) return false;
    if (state.loc && r.location !== state.loc) return false;
    if (state.status && r[cfg.statusKey] !== state.status) return false;
    var min = state.min !== "" ? Number(state.min) : null;
    var max = state.max !== "" ? Number(state.max) : null;
    if (min !== null && !isNaN(min)) { if (typeof r.price !== "number" || r.price < min) return false; }
    if (max !== null && !isNaN(max)) { if (typeof r.price !== "number" || r.price > max) return false; }
    var q = state.q.trim().toLowerCase();
    if (q) {
      var h = haystack(r);
      var words = q.split(/\s+/);
      for (var i = 0; i < words.length; i++) if (h.indexOf(words[i]) === -1) return false;
    }
    return true;
  }
  function sorter() {
    var byName = function (a, b) { return PP.byText(a.name, b.name); };
    switch (state.sort) {
      case "newest": return function (a, b) { return PP.byNewest(a, b) || byName(a, b); };
      case "price-asc": return function (a, b) { return priceKey(a, 1) - priceKey(b, 1) || byName(a, b); };
      case "price-desc": return function (a, b) { return priceKey(b, -1) - priceKey(a, -1) || byName(a, b); };
      case "location": return function (a, b) { return PP.byText(a.location, b.location) || byName(a, b); };
      case "name": return byName;
      default: return function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || PP.byNewest(a, b) || byName(a, b); };
    }
  }
  // records without a price always sort last
  function priceKey(r, dir) { return typeof r.price === "number" ? r.price : (dir > 0 ? Infinity : -Infinity); }

  var filtered = [];
  function refilter() {
    filtered = all.filter(matches).sort(sorter());
    state.shown = S.pageSize || 9;
    render(false);
  }

  /* ---------- Rendering ---------- */
  function render(focusFirstNew) {
    var total = filtered.length;
    var count = Math.min(state.shown, total);
    var previouslyShown = ui.results ? ui.results.children.length : 0;

    PP.clear(ui.results);
    ui.results.className = "results cards--" + state.view;
    filtered.slice(0, count).forEach(function (r) { ui.results.appendChild(UI.card(cfg.type, r, true)); });

    ui.count.textContent = total
      ? (total > count ? "Showing " + count + " of " + total + " " + cfg.plural : total + " " + (total === 1 ? cfg.singular : cfg.plural))
      : "No " + cfg.plural + " match";

    PP.clear(ui.more);
    if (total === 0) {
      var again = el("button", "btn btn--dark btn--sm", "Reset filters", { type: "button" });
      again.addEventListener("click", resetAll);
      UI.state(ui.results, "empty", "No " + cfg.plural + " match your search. Try removing a filter or searching for something different.", [again]);
      ui.results.className = "results";
    } else if (total > count) {
      var more = el("button", "btn btn--dark", "Show more (" + (total - count) + " remaining)", { type: "button" });
      more.addEventListener("click", function () { state.shown += (S.pageSize || 9); render(true); });
      ui.more.appendChild(more);
    }
    if (focusFirstNew && previouslyShown < count) {
      var link = PP.$$(".card__titlelink", ui.results)[previouslyShown];
      if (link) link.focus();
    }
  }

  function renderFeatured() {
    if (!featBox) return;
    var feat = all.filter(function (r) { return r.featured; }).sort(sorter()).slice(0, 3);
    PP.clear(featBox);
    if (!feat.length) { if (featWrap) featWrap.hidden = true; return; }
    if (featWrap) featWrap.hidden = false;
    feat.forEach(function (r) { featBox.appendChild(UI.card(cfg.type, r, true)); });
  }

  /* ---------- Start ---------- */
  function applyParams() {
    var p = PP.params();
    var cat = p.get("category");
    if (cat && cfg.cats.some(function (c) { return c.key === cat; })) { state.cat = cat; ui.cat.value = cat; }
    var st = p.get("status");
    if (st && cfg.statuses.some(function (c) { return c.key === st; })) { state.status = st; ui.status.value = st; }
    var q = p.get("q");
    if (q) { state.q = q; ui.q.value = q; }
  }

  function init() {
    ui.results = el("div", "results cards--" + state.view);
    ui.more = el("div", "results__more");
    PP.clear(resultsBox);
    UI.state(resultsBox, "loading");
    toolsBox.hidden = true;

    PP.loadData(cfg.data).then(function (records) {
      all = records;
      PP.clear(resultsBox);
      if (!all.length) {
        if (featWrap) featWrap.hidden = true;
        UI.state(resultsBox, "empty", "No " + cfg.plural + " are listed at the moment. Please contact us for current information.", [
          UI.link("btn btn--dark btn--sm", "Contact us", "contact.html#enquiry")
        ]);
        return;
      }
      toolsBox.hidden = false;
      buildToolbar();
      resultsBox.appendChild(ui.results);
      resultsBox.appendChild(ui.more);
      applyParams();
      state.sort = "featured";
      renderFeatured();
      refilter();
      var sample = all.some(function (r) { return r.placeholder; });
      var notice = PP.$("#sample-notice");
      if (notice) notice.hidden = !sample;
    }).catch(function (err) {
      if (featWrap) featWrap.hidden = true;
      UI.dataError(resultsBox, err, init);
    });
  }

  PP.ready(init);
})();
