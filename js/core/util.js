/* Shared helpers. Everything lives under window.PPEC so pages need no build step. */
(function () {
  "use strict";
  var P = (window.PPEC = window.PPEC || {});
  var S = window.SITE || {};

  P.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  P.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* Create an element. Text is always set with textContent (never innerHTML). */
  P.el = function (tag, cls, text, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = text;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v != null && v !== false) e.setAttribute(k, v === true ? "" : v);
      });
    }
    return e;
  };
  P.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };
  P.icon = function (name) {
    var s = P.el("span", "icon icon-" + name);
    s.setAttribute("aria-hidden", "true");
    return s;
  };
  P.isHttp = function (u) { return /^https?:\/\//i.test(u || ""); };

  /* ---------- Addresses ---------- */
  // A file inside the website (image, data file) as a complete address, wherever the site is hosted.
  P.asset = function (path) {
    if (!path) return "";
    if (/^(https?:|data:|\/\/)/i.test(path)) return path;
    return (S.root || "") + String(path).replace(/^\/+/, "");
  };
  function query(params) {
    if (!params) return "";
    var parts = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    });
    return parts.length ? "?" + parts.join("&") : "";
  }
  // Link to another page of this site (works from any depth, including the 404 page).
  P.pageUrl = function (file, params) { return (S.root || "") + file + query(params); };
  // The public address of a page (used inside WhatsApp / email enquiries and share tags).
  P.publicUrl = function (file, params) { return (S.siteUrl || S.root || "") + file + query(params); };

  /* ---------- Formatting ---------- */
  P.priceAmount = function (rec) {
    var p = rec && rec.price;
    return p && typeof p.amount === "number" && p.verified === true ? p.amount : null;
  };
  P.formatPrice = function (rec) {
    var a = P.priceAmount(rec);
    if (a == null) return "";
    var cur = (rec.price.currency || S.currencyDefault || "GHS").toUpperCase();
    try {
      return new Intl.NumberFormat("en-GH", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(a);
    } catch (e) {
      return cur + " " + a.toLocaleString("en-GB");
    }
  };
  P.formatDate = function (iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
    var d = new Date(iso + "T00:00:00Z");
    if (isNaN(d.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
    } catch (e) { return iso; }
  };
  // A size such as {value: 450, unit: "m²"} or a plain string; "" when not supplied.
  P.formatMeasure = function (m) {
    if (m == null || m === "") return "";
    if (typeof m === "string") return m;
    if (typeof m === "number") return String(m);
    if (typeof m === "object" && m.value != null && m.value !== "") {
      return Number(m.value).toLocaleString("en-GB") + (m.unit ? " " + m.unit : "");
    }
    return "";
  };
  P.label = function (list, id) {
    var hit = (list || []).filter(function (x) { return x.id === id; })[0];
    if (hit) return hit.label;
    return String(id || "").replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  };

  /* Paragraph lists. A line starting with "## " becomes a sub-heading. */
  P.richText = function (container, content) {
    var items = Array.isArray(content) ? content : (content ? [content] : []);
    items.forEach(function (line) {
      if (typeof line !== "string" || !line.trim()) return;
      if (line.indexOf("## ") === 0) container.appendChild(P.el("h2", "prose__h", line.slice(3)));
      else container.appendChild(P.el("p", "", line));
    });
    return container;
  };

  /* ---------- Session storage that never throws ---------- */
  P.session = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- Page metadata (used by detail pages, which are filled in by JavaScript) ---------- */
  function metaTag(attr, name, content) {
    var m = document.head.querySelector("meta[" + attr + '="' + name + '"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute(attr, name); document.head.appendChild(m); }
    m.setAttribute("content", content);
  }
  P.setPageMeta = function (o) {
    var brand = S.brandName || "";
    var title = o.title ? o.title + (brand ? " | " + brand : "") : brand;
    document.title = title;
    metaTag("property", "og:title", title);
    metaTag("name", "twitter:title", title);
    if (o.description) {
      metaTag("name", "description", o.description);
      metaTag("property", "og:description", o.description);
      metaTag("name", "twitter:description", o.description);
    }
    if (o.image) {
      metaTag("property", "og:image", P.isHttp(o.image) ? o.image : (S.siteUrl || S.root) + String(o.image).replace(/^\/+/, ""));
    }
    if (o.url) {
      metaTag("property", "og:url", o.url);
      var c = document.head.querySelector('link[rel="canonical"]');
      if (!c) { c = document.createElement("link"); c.setAttribute("rel", "canonical"); document.head.appendChild(c); }
      c.setAttribute("href", o.url);
    }
    if (o.noindex) metaTag("name", "robots", "noindex, follow");
  };
})();
