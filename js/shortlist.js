/* ==========================================================================
   shortlist.js — "Saved properties" kept in THIS browser only (localStorage).
   Nothing is sent anywhere. Adds a heart link to the header and exposes
   PP.shortlist for the heart buttons on cards and detail pages.
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, el = PP.el;
  var KEY = "pp-shortlist-v1", MAX = 24, MAX_COMPARE = 3;
  var ID = /^[\w-]{1,60}$/;
  var state = read();

  function read() {
    var out = { saved: [], compare: [] };
    try {
      var d = JSON.parse(PP.local.get(KEY) || "null");
      if (d && Array.isArray(d.saved)) {
        d.saved.forEach(function (x) {
          if (x && (x.t === "property" || x.t === "project") && ID.test(x.id || "")) out.saved.push({ t: x.t, id: x.id });
        });
        out.saved = out.saved.slice(0, MAX);
      }
      if (d && Array.isArray(d.compare)) {
        d.compare.forEach(function (id) { if (ID.test(id || "") && out.saved.some(function (s) { return s.t === "property" && s.id === id; })) out.compare.push(id); });
        out.compare = out.compare.slice(0, MAX_COMPARE);
      }
    } catch (e) { /* corrupt value: start empty */ }
    return out;
  }
  function write() { PP.local.set(KEY, JSON.stringify(state)); changed(); }
  function changed() { document.dispatchEvent(new CustomEvent("pp:shortlist")); }

  var api = PP.shortlist = {
    max: MAX, maxCompare: MAX_COMPARE,
    items: function () { return state.saved.slice(); },
    count: function () { return state.saved.length; },
    has: function (t, id) { return state.saved.some(function (s) { return s.t === t && s.id === id; }); },
    toggle: function (t, id) {
      if (!ID.test(id || "")) return false;
      if (api.has(t, id)) { api.remove(t, id); return false; }
      if (state.saved.length >= MAX) return null;           // list full
      state.saved.push({ t: t, id: id }); write(); return true;
    },
    remove: function (t, id) {
      state.saved = state.saved.filter(function (s) { return !(s.t === t && s.id === id); });
      if (t === "property") state.compare = state.compare.filter(function (c) { return c !== id; });
      write();
    },
    clear: function () { state.saved = []; state.compare = []; write(); },
    compareList: function () { return state.compare.slice(); },
    inCompare: function (id) { return state.compare.indexOf(id) > -1; },
    toggleCompare: function (id) {
      var i = state.compare.indexOf(id);
      if (i > -1) { state.compare.splice(i, 1); write(); return true; }
      if (state.compare.length >= MAX_COMPARE) return false;
      if (!api.has("property", id)) return false;
      state.compare.push(id); write(); return true;
    },
    /* Heart button. Kept in step with the stored list on every page. */
    button: function (t, rec, cls) {
      var b = el("button", cls || "save", null, { type: "button" });
      var icon = el("span", "save__icon", null, { "aria-hidden": "true" });
      var lbl = el("span", "visually-hidden save__label");
      b.appendChild(icon); b.appendChild(lbl);
      function sync() {
        var on = api.has(t, rec.id);
        b.setAttribute("aria-pressed", on ? "true" : "false");
        lbl.textContent = (on ? "Remove from shortlist: " : "Save to shortlist: ") + rec.name;
        b.classList.toggle("is-on", on);
      }
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var r = api.toggle(t, rec.id);
        if (r === null) announce("Your shortlist is full (" + MAX + " items). Remove one to add another.");
        else announce(r ? rec.name + " saved to your shortlist." : rec.name + " removed from your shortlist.");
      });
      document.addEventListener("pp:shortlist", sync);
      sync();
      return b;
    }
  };

  /* Polite spoken confirmation (a single shared live region) */
  var live = null;
  function announce(msg) {
    if (!live) {
      live = el("div", "visually-hidden", null, { role: "status", "aria-live": "polite" });
      document.body.appendChild(live);
    }
    live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30);
  }
  api.announce = announce;

  /* Header link with count badge */
  function addHeaderLink() {
    var nav = PP.$("#primary-nav");
    if (!nav || PP.$(".nav__saved", nav)) return;
    var a = el("a", "nav__saved", null, { href: "shortlist.html" });
    var cur = /(^|\/)shortlist\.html$/.test(location.pathname);
    if (cur) a.setAttribute("aria-current", "page");
    a.appendChild(el("span", "save__icon", null, { "aria-hidden": "true" }));
    var txt = el("span", "nav__saved-text", "Shortlist");
    var cnt = el("span", "nav__count", "0", { "aria-hidden": "true" });
    a.appendChild(txt); a.appendChild(cnt);
    var cta = PP.$(".btn", nav);
    nav.insertBefore(a, cta || null);
    function sync() {
      var n = api.count();
      cnt.textContent = String(n); cnt.hidden = n === 0; a.classList.toggle("has-items", n > 0);
      a.setAttribute("aria-label", n ? "Shortlist, " + n + (n === 1 ? " item saved" : " items saved") : "Shortlist, empty");
    }
    document.addEventListener("pp:shortlist", sync); sync();
  }

  /* Other tabs / windows changing the list */
  window.addEventListener("storage", function (e) { if (e.key === KEY) { state = read(); changed(); } });

  PP.ready(addHeaderLink);
})();
