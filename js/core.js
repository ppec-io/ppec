/* ==========================================================================
   core.js — shared helpers and data loading. No dependencies.
   Loaded after config.js and before every other script. Exposes window.PP.
   ========================================================================== */
(function () {
  "use strict";

  var S = window.SITE || {};
  var PP = window.PP = window.PP || {};
  PP.S = S;

  /* ---------- DOM helpers ---------- */
  PP.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  PP.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  PP.el = function (tag, cls, text, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = text;
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); });
    return e;
  };
  PP.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };
  PP.ready = function (fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn();
  };
  PP.params = function () { return new URLSearchParams(window.location.search); };

  /* ---------- Session storage (may be blocked: always wrapped) ---------- */
  PP.store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- URLs and contact links ---------- */
  // Absolute public URL for a site-relative path, built from SITE.siteUrl (base path lives in config.js).
  PP.abs = function (rel) {
    var base = S.siteUrl || "";
    if (base && base.charAt(base.length - 1) !== "/") base += "/";
    return base + String(rel || "").replace(/^\//, "");
  };
  PP.detailUrl = function (type, id) {
    return (type === "project" ? "project-details.html" : "property-details.html") + "?id=" + encodeURIComponent(id);
  };
  PP.waLink = function (message) {
    return "https://wa.me/" + encodeURIComponent(S.whatsappNumber || "") +
      "?text=" + encodeURIComponent(message || S.whatsappMessage || "");
  };
  PP.mailLink = function (subject, body) {
    return "mailto:" + (S.email || "") + "?subject=" + encodeURIComponent(subject || "") +
      "&body=" + encodeURIComponent(body || "");
  };
  PP.telLink = function () { return S.phoneTel ? "tel:" + S.phoneTel : ""; };

  // Standard enquiry text for a property or project. Includes its name and its page address.
  PP.enquiryText = function (type, rec) {
    var noun = type === "project" ? "project" : "property";
    return "Hello, I would like to enquire about the " + noun + " \"" + rec.name + "\" (ref. " + rec.id + ").\n" +
      PP.abs(PP.detailUrl(type, rec.id));
  };

  /* ---------- Formatting ---------- */
  PP.formatPrice = function (n) {
    if (typeof n !== "number" || !isFinite(n)) return "";
    try {
      return new Intl.NumberFormat("en-GH", { style: "currency", currency: S.currency || "GHS", maximumFractionDigits: 0 }).format(n);
    } catch (e) { return (S.currency || "") + " " + Math.round(n).toLocaleString("en-GB"); }
  };
  PP.formatDate = function (iso) {
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return "";
    try { return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return iso; }
  };
  PP.label = function (list, key) {
    for (var i = 0; i < (list || []).length; i++) if (list[i].key === key) return list[i].label;
    return key || "";
  };
  PP.has = function (v) { return v !== undefined && v !== null && String(v).trim() !== ""; };

  /* ---------- JSON data ---------- */
  // Only records with status "published" are ever returned; drafts never reach the page.
  var cache = {};
  PP.isPublished = function (r) { return !!r && r.status === "published" && PP.has(r.id); };

  PP.loadData = function (name) {
    if (cache[name]) return cache[name];
    var p = new Promise(function (resolve, reject) {
      if (window.location.protocol === "file:") {
        var err = new Error("file-protocol"); err.code = "file"; reject(err); return;
      }
      var url = (S.dataPath || "data/") + name + ".json";
      fetch(url, { headers: { "Accept": "application/json" } }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
        return res.json();
      }).then(function (data) {
        if (!Array.isArray(data)) throw new Error(url + " must contain a list of records");
        resolve(data.filter(PP.isPublished));
      }).catch(reject);
    });
    // allow retry after a failure
    p.catch(function () { delete cache[name]; });
    cache[name] = p;
    return p;
  };

  PP.findById = function (list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };

  /* ---------- Sorting helpers ---------- */
  PP.byText = function (a, b) { return String(a || "").localeCompare(String(b || ""), "en", { sensitivity: "base" }); };
  PP.byNewest = function (a, b) { return String(b.added || "").localeCompare(String(a.added || "")); };

  /* ---------- Page metadata (detail pages set these once a record is loaded) ---------- */
  PP.setMeta = function (opts) {
    if (opts.title) document.title = opts.title;
    function set(sel, attr, val) { var m = PP.$(sel); if (m && val) m.setAttribute(attr, val); }
    set('meta[name="description"]', "content", opts.description);
    set('meta[property="og:title"]', "content", opts.title);
    set('meta[property="og:description"]', "content", opts.description);
    set('meta[property="og:url"]', "content", opts.url);
    set('meta[property="og:image"]', "content", opts.image);
    set('link[rel="canonical"]', "href", opts.url);
    if (opts.noindex) {
      var m = PP.el("meta", null, null, { name: "robots", content: "noindex" });
      document.head.appendChild(m);
    }
  };
})();
