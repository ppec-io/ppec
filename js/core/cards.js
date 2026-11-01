/* Reusable UI pieces: property / project / news / service cards and loading, empty and error states. */
(function () {
  "use strict";
  var P = window.PPEC;
  var ui = (P.ui = {});

  ui.badge = function (text, extra) { return P.el("span", "badge" + (extra ? " " + extra : ""), text); };

  /* ---------- States ---------- */
  ui.loading = function (text) {
    var d = P.el("div", "state state--loading", null, { role: "status" });
    d.appendChild(P.el("span", "spinner", null, { "aria-hidden": "true" }));
    d.appendChild(P.el("span", "", text || "Loading…"));
    return d;
  };
  ui.empty = function (text, action) {
    var d = P.el("div", "state state--empty");
    d.appendChild(P.el("p", "", text));
    if (action) {
      var b = P.el("button", "btn btn--dark btn--sm", action.label, { type: "button" });
      b.addEventListener("click", action.onClick);
      d.appendChild(b);
    }
    return d;
  };
  ui.error = function (text, retry) {
    var d = P.el("div", "state state--error", null, { role: "alert" });
    d.appendChild(P.el("p", "", text));
    var row = P.el("div", "btn-row btn-row--center");
    if (retry) {
      var b = P.el("button", "btn btn--dark btn--sm", "Try again", { type: "button" });
      b.addEventListener("click", retry);
      row.appendChild(b);
    }
    var c = P.el("a", "btn btn--ghost-dark btn--sm", "Contact us", { href: P.pageUrl("contact.html") });
    row.appendChild(c);
    d.appendChild(row);
    return d;
  };
  ui.skeletons = function (container, n) {
    P.clear(container);
    container.setAttribute("aria-busy", "true");
    for (var i = 0; i < (n || 3); i++) {
      var s = P.el("div", "card card--skeleton card--light", null, { "aria-hidden": "true" });
      s.appendChild(P.el("div", "card__media"));
      var b = P.el("div", "card__body");
      b.appendChild(P.el("span", "sk sk--line"));
      b.appendChild(P.el("span", "sk sk--line sk--short"));
      s.appendChild(b);
      container.appendChild(s);
    }
  };

  function statusLabel(kind, rec, tax) {
    if (kind === "property") return P.label(tax.availability, rec.availability);
    return P.label(tax.projectStatuses, rec.projectStatus);
  }
  ui.statusLabel = statusLabel;

  /* ---------- Property / project card ---------- */
  ui.card = function (rec, kind, o) {
    o = o || {};
    var tax = o.tax || {};
    var detail = P.pageUrl(kind === "property" ? "property-details.html" : "project-details.html", { id: rec.id });
    var card = P.el("article", "card" + (o.light ? " card--light" : ""));
    card.setAttribute("data-id", rec.id);

    var media = P.el("div", "card__media");
    var im = rec.images && rec.images[0];
    if (im && (im.thumb || im.src)) {
      var img = P.el("img", "", null, { width: 480, height: 360, decoding: "async", loading: o.eager ? "eager" : "lazy" });
      img.src = P.asset(im.thumb || im.src);
      img.alt = im.alt || rec.title || "";
      media.appendChild(img);
    } else {
      media.appendChild(P.el("div", "card__nophoto", "Photograph coming soon"));
    }
    var st = kind === "property" ? rec.availability : rec.projectStatus;
    if (st) media.appendChild(ui.badge(statusLabel(kind, rec, tax), "badge--" + String(st).replace(/[^a-z-]/g, "")));
    if (rec.placeholder) media.appendChild(ui.badge("Sample", "badge--sample"));
    card.appendChild(media);

    var body = P.el("div", "card__body");
    var cat = kind === "property" ? P.label(tax.propertyCategories, rec.category) : P.label(tax.projectCategories, rec.category);
    if (cat) body.appendChild(P.el("p", "card__cat", cat));
    var h = P.el("h3", "card__title");
    h.appendChild(P.el("a", "", rec.title, { href: detail }));
    body.appendChild(h);
    if (rec.location) {
      var loc = P.el("p", "card__loc");
      loc.appendChild(P.icon("pin"));
      loc.appendChild(P.el("span", "", rec.location));
      body.appendChild(loc);
    }
    if (rec.summary) body.appendChild(P.el("p", "card__desc", rec.summary));

    if (kind === "property") {
      var price = P.formatPrice(rec);
      if (price) body.appendChild(P.el("p", "card__price", price));
      var s = rec.specs || {};
      var facts = [];
      if (s.bedrooms != null) facts.push(s.bedrooms + (s.bedrooms === 1 ? " bedroom" : " bedrooms"));
      if (s.bathrooms != null) facts.push(s.bathrooms + (s.bathrooms === 1 ? " bathroom" : " bathrooms"));
      var land = P.formatMeasure(s.landSize); if (land) facts.push("Land: " + land);
      var floor = P.formatMeasure(s.floorArea); if (floor) facts.push("Floor area: " + floor);
      if (facts.length) {
        var ul = P.el("ul", "card__facts");
        facts.forEach(function (f) { ul.appendChild(P.el("li", "", f)); });
        body.appendChild(ul);
      }
    } else if (rec.progress && typeof rec.progress.percent === "number") {
      body.appendChild(P.el("p", "card__note", rec.progress.percent + "% complete"));
    }

    var actions = P.el("div", "card__actions");
    var view = P.el("a", "btn btn--sm " + (o.light ? "btn--dark" : "btn--gold"), "View details", { href: detail });
    view.setAttribute("aria-label", "View details of " + rec.title);
    var enq = P.enquiry.forRecord(kind, rec);
    var wa = P.el("a", "btn btn--sm " + (o.light ? "btn--ghost-dark" : "btn--ghost"), null, {
      href: enq.whatsapp, target: "_blank", rel: "noopener noreferrer",
      "aria-label": "Enquire about " + rec.title + " on WhatsApp (opens in a new tab)"
    });
    wa.appendChild(P.icon("whatsapp"));
    wa.appendChild(document.createTextNode("Enquire"));
    actions.appendChild(view);
    actions.appendChild(wa);
    body.appendChild(actions);
    card.appendChild(body);
    return card;
  };

  /* ---------- News card ---------- */
  ui.newsCard = function (rec, tax, light) {
    var detail = P.pageUrl("news-details.html", { id: rec.id });
    var card = P.el("article", "card card--news" + (light ? " card--light" : ""));
    var media = P.el("div", "card__media");
    if (rec.cover && (rec.cover.thumb || rec.cover.src)) {
      var img = P.el("img", "", null, { width: 480, height: 360, loading: "lazy", decoding: "async" });
      img.src = P.asset(rec.cover.thumb || rec.cover.src);
      img.alt = rec.cover.alt || "";
      media.appendChild(img);
    }
    if (rec.placeholder) media.appendChild(ui.badge("Sample", "badge--sample"));
    card.appendChild(media);
    var body = P.el("div", "card__body");
    var meta = [P.label(tax.newsCategories, rec.category)];
    var d = rec.placeholder ? "" : P.formatDate(rec.date);
    if (d) meta.push(d);
    body.appendChild(P.el("p", "card__cat", meta.join(" · ")));
    var h = P.el("h3", "card__title");
    h.appendChild(P.el("a", "", rec.title, { href: detail }));
    body.appendChild(h);
    if (rec.summary) body.appendChild(P.el("p", "card__desc", rec.summary));
    var actions = P.el("div", "card__actions");
    actions.appendChild(P.el("span", "card__more", "Read article"));
    body.appendChild(actions);
    card.appendChild(body);
    return card;
  };

  /* ---------- Service card ---------- */
  ui.serviceCard = function (svc, index) {
    var a = P.el("article", "service");
    a.appendChild(P.el("span", "service__num", String(index + 1).padStart(2, "0"), { "aria-hidden": "true" }));
    a.appendChild(P.el("h3", "", svc.title));
    a.appendChild(P.el("p", "", svc.summary));
    return a;
  };
})();
