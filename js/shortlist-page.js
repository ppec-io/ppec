/* ==========================================================================
   shortlist-page.js — shortlist.html: saved items, comparison table, share text.
   Uses PP.shortlist (this browser only). Only published records are shown.
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el, UI = PP.ui, SL = PP.shortlist;
  var root = PP.$("[data-shortlist-page]");
  if (!root || !SL) return;

  var T = S.taxonomy || {};
  var props = [], projs = [];
  var lastKey = "";
  var ui = {};

  function rec(t, id) { return PP.findById(t === "project" ? projs : props, id); }
  function key() { return SL.items().map(function (x) { return x.t + ":" + x.id; }).join("|"); }

  function shareText() {
    var lines = ["My shortlist from " + S.brandName + ":"];
    SL.items().forEach(function (x) {
      var r = rec(x.t, x.id);
      if (r) lines.push("- " + r.name + " (ref. " + r.id + "): " + PP.abs(PP.detailUrl(x.t, x.id)));
    });
    return lines.join("\n");
  }

  function toolbar(n) {
    var bar = el("div", "sl-bar");
    bar.appendChild(el("p", "sl-bar__count", n + (n === 1 ? " item saved" : " items saved")));
    var row = el("div", "btn-row");
    var wa = UI.link("btn btn--dark btn--sm", "", PP.waLink(shareText()));
    wa.target = "_blank"; wa.rel = "noopener noreferrer";
    wa.appendChild(el("span", "icon icon-whatsapp", null, { "aria-hidden": "true" }));
    wa.appendChild(document.createTextNode("Ask us about these"));
    wa.setAttribute("aria-label", "Ask us about these on WhatsApp (opens in a new tab)");
    row.appendChild(wa);
    row.appendChild(UI.link("btn btn--ghost-dark btn--sm", "Email this list to us", PP.mailLink("My shortlist", shareText())));
    var copy = el("button", "btn btn--ghost-dark btn--sm", "Copy list", { type: "button" });
    var msg = el("span", "sl-bar__msg", null, { role: "status" });
    copy.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText()).then(function () { msg.textContent = "List copied"; }, function () { msg.textContent = "Copy is not available in this browser."; });
      } else { msg.textContent = "Copy is not available in this browser."; }
    });
    var clr = el("button", "btn btn--ghost-dark btn--sm", "Clear all", { type: "button" });
    clr.addEventListener("click", function () {
      if (window.confirm("Remove every item from your shortlist?")) SL.clear();
    });
    row.appendChild(copy); row.appendChild(clr); row.appendChild(msg);
    bar.appendChild(row);
    return bar;
  }

  function savedCards() {
    var grid = el("div", "grid grid--3 sl-grid");
    SL.items().forEach(function (x) {
      var r = rec(x.t, x.id);
      if (!r) return;
      var wrap = el("div", "sl-item");
      wrap.appendChild(UI.card(x.t, r, true));
      if (x.t === "property") {
        var lab = el("label", "compare-check");
        var cb = el("input", "", null, { type: "checkbox", "data-compare": r.id });
        cb.checked = SL.inCompare(r.id);
        cb.addEventListener("change", function () {
          var ok = SL.toggleCompare(r.id);
          if (!ok && cb.checked) { cb.checked = false; ui.hint.textContent = "You can compare up to " + SL.maxCompare + " properties. Untick one first."; }
        });
        lab.appendChild(cb);
        lab.appendChild(el("span", "", "Compare this property"));
        wrap.appendChild(lab);
      }
      grid.appendChild(wrap);
    });
    return grid;
  }

  function val(v) { return PP.has(v) ? String(v) : "—"; }

  function compareTable() {
    var ids = SL.compareList().filter(function (id) { return rec("property", id); });
    ui.compare.hidden = false;
    PP.clear(ui.compareBody);
    if (ids.length < 2) {
      ui.compareBody.appendChild(el("p", "state__msg", ids.length ? "Tick one more property to compare." : "Tick “Compare this property” on two or three saved properties to see them side by side."));
      return;
    }
    var rows = [
      ["Category", function (r) { return UI.categoryLabel("property", r); }],
      ["Location", function (r) { return r.location; }],
      ["Price", function (r) { return typeof r.price === "number" ? PP.formatPrice(r.price) : "Price on enquiry"; }],
      ["Availability", function (r) { return PP.label(T.availability, r.availability); }],
      ["Bedrooms", function (r) { return (r.specs || {}).bedrooms; }],
      ["Bathrooms", function (r) { return (r.specs || {}).bathrooms; }],
      ["Floor area", function (r) { return (r.specs || {}).floorArea; }],
      ["Land size", function (r) { return (r.specs || {}).landSize; }]
    ];
    var wrap = el("div", "compare-wrap", null, { role: "region", "aria-label": "Property comparison table", tabindex: "0" });
    var tbl = el("table", "compare");
    tbl.appendChild(el("caption", "visually-hidden", "Comparison of selected properties"));
    var head = el("tr"); head.appendChild(el("td", "compare__corner"));
    ids.forEach(function (id) {
      var r = rec("property", id);
      var th = el("th", "compare__head", null, { scope: "col" });
      var a = UI.link("compare__img", "", PP.detailUrl("property", id));
      a.setAttribute("aria-hidden", "true"); a.tabIndex = -1;
      a.appendChild(UI.img(UI.thumb(UI.firstImage(r)), { width: 320, height: 240, fallbackAlt: "" }));
      th.appendChild(a);
      th.appendChild(UI.link("compare__name", r.name, PP.detailUrl("property", id)));
      var rm = el("button", "compare__remove", "Remove", { type: "button", "aria-label": "Remove " + r.name + " from comparison" });
      rm.addEventListener("click", function () { SL.toggleCompare(id); });
      th.appendChild(rm);
      head.appendChild(th);
    });
    var thead = el("thead"); thead.appendChild(head); tbl.appendChild(thead);
    var tb = el("tbody");
    rows.forEach(function (row) {
      var tr = el("tr"); tr.appendChild(el("th", "compare__label", row[0], { scope: "row" }));
      ids.forEach(function (id) { tr.appendChild(el("td", "", val(row[1](rec("property", id))))); });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl);
    ui.compareBody.appendChild(wrap);
  }

  function renderAll() {
    PP.clear(ui.list);
    var items = SL.items();
    // drop saved items that are no longer published
    var gone = items.filter(function (x) { return !rec(x.t, x.id); });
    gone.forEach(function (x) { SL.remove(x.t, x.id); });
    if (gone.length) { ui.note.hidden = false; ui.note.textContent = gone.length + (gone.length === 1 ? " saved item is" : " saved items are") + " no longer available and was removed."; return; }   // remove() re-renders
    var n = SL.count();
    if (!n) {
      var empty = el("div", "state state--empty");
      empty.appendChild(el("p", "state__msg", "Your shortlist is empty. Tap the heart on any property or project to save it here."));
      var row = el("div", "btn-row");
      row.appendChild(UI.link("btn btn--dark", "Browse properties", "properties.html"));
      row.appendChild(UI.link("btn btn--ghost-dark", "Browse projects", "projects.html"));
      empty.appendChild(row);
      ui.list.appendChild(empty);
      ui.compare.hidden = true;
      return;
    }
    ui.list.appendChild(el("h2", "visually-hidden", "Saved items"));
    ui.list.appendChild(toolbar(n));
    ui.list.appendChild(savedCards());
    compareTable();
  }

  function onChange() {
    var k = key();
    if (k !== lastKey) { lastKey = k; renderAll(); } else { compareTable(); }
    PP.$$("[data-compare]", ui.list).forEach(function (cb) { cb.checked = SL.inCompare(cb.getAttribute("data-compare")); });
  }

  function init() {
    PP.clear(root);
    ui.note = el("p", "notice", null, { role: "status" }); ui.note.hidden = true;
    ui.hint = el("p", "sl-hint", null, { role: "status" });
    ui.list = el("div", "sl-list");
    ui.compare = el("section", "sl-compare", null, { "aria-labelledby": "compare-title" }); ui.compare.hidden = true;
    ui.compare.appendChild(el("h2", "section-title", "Compare properties", { id: "compare-title" }));
    ui.compareBody = el("div");
    ui.compare.appendChild(ui.compareBody);
    root.appendChild(ui.note); root.appendChild(ui.list); root.appendChild(ui.hint); root.appendChild(ui.compare);
    UI.state(ui.list, "loading");
    Promise.all([PP.loadData("properties"), PP.loadData("projects")]).then(function (res) {
      props = res[0]; projs = res[1];
      document.addEventListener("pp:shortlist", onChange);
      lastKey = key(); renderAll();
    }).catch(function (err) { UI.dataError(ui.list, err, init); });
  }

  PP.ready(init);
})();
