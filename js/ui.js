/* ==========================================================================
   ui.js — reusable interface pieces: cards, loading/empty/error states, lightbox.
   Everything is built with DOM methods and textContent, so record text from the
   JSON files can never inject HTML.
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el;
  var UI = PP.ui = {};
  var FALLBACK_IMG = "assets/images/logo-mark.png";

  /* ---------- States ---------- */
  // kind: "loading" | "empty" | "error"
  UI.state = function (container, kind, message, actions) {
    PP.clear(container);
    var box;
    if (kind === "loading") {
      box = el("div", "state state--loading", null, { role: "status" });
      box.appendChild(el("span", "visually-hidden", "Loading…"));
      for (var i = 0; i < 3; i++) box.appendChild(el("span", "skeleton"));
    } else {
      box = el("div", "state state--" + kind, null, kind === "error" ? { role: "alert" } : null);
      box.appendChild(el("p", "state__msg", message));
      (actions || []).forEach(function (a) { box.appendChild(a); });
    }
    container.appendChild(box);
    return box;
  };

  UI.dataError = function (container, err, retry) {
    var actions = [];
    var msg;
    if (err && err.code === "file") {
      msg = "This page loads its content from the data folder, which browsers block when a page is opened directly from your computer. Please view the website through its web address, or run a local web server (see the README).";
    } else {
      msg = "Sorry, we could not load this content. Please check your connection and try again.";
      if (retry) {
        var b = el("button", "btn btn--dark btn--sm", "Try again", { type: "button" });
        b.addEventListener("click", retry);
        actions.push(b);
      }
    }
    UI.state(container, "error", msg, actions);
  };

  UI.link = function (cls, text, href) {
    return el("a", cls, text, { href: href });
  };

  /* ---------- Images ---------- */
  UI.img = function (im, opts) {
    opts = opts || {};
    var node = el("img");
    node.src = im && im.src ? im.src : FALLBACK_IMG;
    node.alt = im && im.alt ? im.alt : (opts.fallbackAlt || "");
    node.width = opts.width || 800; node.height = opts.height || 600;
    if (opts.lazy !== false) node.loading = "lazy";
    node.decoding = "async";
    if (!(im && im.src)) node.className = "is-fallback";
    node.addEventListener("error", function () {
      if (node.src.indexOf(FALLBACK_IMG) === -1) { node.src = FALLBACK_IMG; node.className = "is-fallback"; }
    });
    return node;
  };
  UI.firstImage = function (rec) { return rec.images && rec.images.length ? rec.images[0] : null; };
  // Smaller version of an image for cards and thumbnails: uses "thumb" when the record has one.
  UI.thumb = function (im) { return im && im.src ? { src: im.thumb || im.src, alt: im.alt } : im; };

  /* ---------- Badges and spec chips ---------- */
  UI.statusBadge = function (type, rec) {
    var T = S.taxonomy || {};
    var key = type === "project" ? rec.projectStatus : rec.availability;
    if (!PP.has(key)) return null;
    var list = type === "project" ? T.projectStatuses : T.availability;
    return el("span", "badge badge--" + key, PP.label(list, key));
  };

  UI.categoryLabel = function (type, rec) {
    var T = S.taxonomy || {};
    return PP.label(type === "project" ? T.projectCategories : T.propertyCategories, rec.category);
  };

  // Only specs that exist are returned; nothing is shown for missing values.
  UI.specChips = function (rec) {
    var sp = rec.specs || {}, out = [];
    if (PP.has(sp.bedrooms)) out.push(sp.bedrooms + (Number(sp.bedrooms) === 1 ? " bedroom" : " bedrooms"));
    if (PP.has(sp.bathrooms)) out.push(sp.bathrooms + (Number(sp.bathrooms) === 1 ? " bathroom" : " bathrooms"));
    if (PP.has(sp.floorArea)) out.push("Floor area " + sp.floorArea);
    if (PP.has(sp.landSize)) out.push("Land " + sp.landSize);
    return out;
  };

  /* ---------- Cards ---------- */
  // type: "property" | "project"
  UI.card = function (type, rec, light) {
    var url = PP.detailUrl(type, rec.id);
    var card = el("article", "card" + (light ? " card--light" : ""));

    var media = el("a", "card__media", null, { href: url, tabindex: "-1", "aria-hidden": "true" });
    media.appendChild(UI.img(UI.thumb(UI.firstImage(rec)), { fallbackAlt: "" }));
    var sb = UI.statusBadge(type, rec); if (sb) media.appendChild(sb);
    if (rec.placeholder) media.appendChild(el("span", "badge badge--sample", "Sample"));
    card.appendChild(media);
    if (PP.shortlist) card.appendChild(PP.shortlist.button(type, rec, "save save--card"));

    var body = el("div", "card__body");
    var cat = UI.categoryLabel(type, rec);
    if (cat) body.appendChild(el("p", "card__cat", cat));
    var h = el("h3", "card__title");
    h.appendChild(UI.link("card__titlelink", rec.name, url));
    body.appendChild(h);

    if (PP.has(rec.location)) {
      var loc = el("p", "card__loc");
      var ic = el("span", "icon icon-pin", null, { "aria-hidden": "true" });
      loc.appendChild(ic); loc.appendChild(el("span", "", rec.location));
      body.appendChild(loc);
    }
    if (type === "property" && typeof rec.price === "number") {
      var pr = el("p", "card__price", PP.formatPrice(rec.price));
      if (PP.has(rec.priceNote)) pr.appendChild(el("small", "", " " + rec.priceNote));
      body.appendChild(pr);
    }
    var chips = type === "property" ? UI.specChips(rec) : [];
    if (chips.length) {
      var ul = el("ul", "chips");
      chips.forEach(function (c) { ul.appendChild(el("li", "", c)); });
      body.appendChild(ul);
    }
    if (PP.has(rec.description)) body.appendChild(el("p", "card__desc", rec.description));
    if (type === "project" && rec.progress && typeof rec.progress.percent === "number") {
      body.appendChild(el("p", "card__note", rec.progress.percent + "% complete"));
    }

    var actions = el("div", "card__actions");
    actions.appendChild(UI.link("btn btn--sm " + (light ? "btn--dark" : "btn--gold"), "View details", url));
    var enq = UI.link("btn btn--sm " + (light ? "btn--ghost-dark" : "btn--ghost"), "Enquire", "contact.html?enquiry=" + encodeURIComponent(rec.id) + "#enquiry");
    enq.setAttribute("aria-label", "Enquire about " + rec.name);
    actions.appendChild(enq);
    var wa = UI.link("btn btn--sm " + (light ? "btn--ghost-dark" : "btn--ghost"), "", PP.waLink(PP.enquiryText(type, rec)));
    wa.target = "_blank"; wa.rel = "noopener noreferrer";
    wa.setAttribute("aria-label", "WhatsApp: ask about " + rec.name + " (opens in a new tab)");
    wa.appendChild(el("span", "icon icon-whatsapp", null, { "aria-hidden": "true" }));
    wa.appendChild(document.createTextNode("WhatsApp"));
    actions.appendChild(wa);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  };

  /* ---------- Lightbox (native <dialog>) ---------- */
  var lb = null;
  function buildLightbox() {
    var dlg = el("dialog", "lightbox", null, { "aria-label": "Image viewer" });
    var fig = el("figure", "lightbox__fig");
    var img = el("img", "lightbox__img");
    var cap = el("figcaption", "lightbox__cap");
    fig.appendChild(img); fig.appendChild(cap);
    var close = el("button", "lightbox__btn lightbox__close", "Close", { type: "button", "aria-label": "Close image viewer" });
    var prev = el("button", "lightbox__btn lightbox__prev", "‹", { type: "button", "aria-label": "Previous image" });
    var next = el("button", "lightbox__btn lightbox__next", "›", { type: "button", "aria-label": "Next image" });
    var count = el("p", "lightbox__count", null, { "aria-live": "polite" });
    [fig, prev, next, close, count].forEach(function (n) { dlg.appendChild(n); });
    document.body.appendChild(dlg);

    lb = { dlg: dlg, img: img, cap: cap, prev: prev, next: next, count: count, items: [], i: 0, opener: null };
    close.addEventListener("click", function () { dlg.close(); });
    prev.addEventListener("click", function () { show(lb.i - 1); });
    next.addEventListener("click", function () { show(lb.i + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(lb.i - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(lb.i + 1); }
    });
    dlg.addEventListener("close", function () {
      document.documentElement.classList.remove("lb-open");
      if (lb.opener && document.contains(lb.opener)) lb.opener.focus();
    });
  }
  function show(i) {
    var n = lb.items.length;
    lb.i = (i + n) % n;
    var it = lb.items[lb.i];
    lb.img.src = it.src; lb.img.alt = it.alt || "";
    lb.cap.textContent = it.caption || it.alt || "";
    lb.count.textContent = (lb.i + 1) + " / " + n;
    var multi = n > 1;
    lb.prev.hidden = lb.next.hidden = !multi;
  }
  // items: [{src, alt, caption?}]
  UI.openLightbox = function (items, index, opener) {
    if (!items || !items.length) return;
    if (!lb) buildLightbox();
    lb.items = items; lb.opener = opener || null;
    show(index || 0);
    document.documentElement.classList.add("lb-open");
    if (typeof lb.dlg.showModal === "function") lb.dlg.showModal(); else lb.dlg.setAttribute("open", "");
  };
})();
