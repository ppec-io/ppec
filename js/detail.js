/* ==========================================================================
   detail.js — property-details.html?id=...  and  project-details.html?id=...
   The page opts in with  <main data-detail="property">  or  "project".
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el, UI = PP.ui;
  var main = PP.$("[data-detail]");
  if (!main) return;

  var type = main.getAttribute("data-detail");           // "property" | "project"
  var isProp = type === "property";
  var dataName = isProp ? "properties" : "projects";
  var listPage = isProp ? "properties.html" : "projects.html";
  var listName = isProp ? "Properties" : "Projects";
  var T = S.taxonomy || {};
  var rootBox = PP.$("#detail-root");
  var titleEl = PP.$("#d-title"), eyebrowEl = PP.$("#d-eyebrow"), subEl = PP.$("#d-sub");

  function trimTo(text, n) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    return text.length > n ? text.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : text;
  }

  function section(title, cls) {
    var s = el("section", "dsec" + (cls ? " " + cls : ""));
    s.appendChild(el("h2", "dsec__title", title));
    return s;
  }

  /* ---------- Gallery ---------- */
  function buildGallery(rec) {
    var images = (rec.images || []).filter(function (i) { return i && i.src; });
    var wrap = el("div", "gallery");
    var items = images.map(function (i) {
      var cap = i.caption || i.alt || "";
      if (i.type === "render") cap = (cap ? cap + " — " : "") + "architectural render";
      return { src: i.src, alt: i.alt || rec.name, caption: cap };
    });
    var current = 0;

    var mainBtn = el("button", "gallery__main", null, { type: "button", "aria-label": items.length ? "Open image viewer" : "No photographs yet" });
    var mainImg = UI.img(images[0], { width: 1200, height: 750, lazy: false, fallbackAlt: "Photograph to be added" });
    mainBtn.appendChild(mainImg);
    var tag = el("span", "gallery__type");
    mainBtn.appendChild(tag);
    wrap.appendChild(mainBtn);

    function setCurrent(i) {
      current = i;
      var im = images[i];
      if (!im) return;
      mainImg.src = im.src; mainImg.alt = im.alt || rec.name;
      mainImg.className = "";
      tag.textContent = im.type === "render" ? "Architectural render" : (im.type === "photo" ? "Photograph" : "");
      tag.hidden = !tag.textContent;
      mainBtn.setAttribute("aria-label", (tag.textContent ? tag.textContent + ": " : "") + "open image viewer");
      PP.$$(".gallery__thumb", wrap).forEach(function (b, n) { b.setAttribute("aria-current", n === i ? "true" : "false"); });
    }
    mainBtn.addEventListener("click", function () { if (items.length) UI.openLightbox(items, current, mainBtn); });

    if (images.length > 1) {
      var thumbs = el("div", "gallery__thumbs");
      images.forEach(function (im, i) {
        var b = el("button", "gallery__thumb", null, { type: "button", "aria-label": "Show image " + (i + 1) + " of " + images.length });
        b.appendChild(UI.img(im, { width: 160, height: 110 }));
        b.addEventListener("click", function () { setCurrent(i); });
        thumbs.appendChild(b);
      });
      wrap.appendChild(thumbs);
    }
    setCurrent(0);
    if (!images.length) tag.hidden = true;
    return wrap;
  }

  /* ---------- Facts table ---------- */
  function factsTable(rows) {
    var tbl = el("table", "specs");
    var body = el("tbody");
    rows.forEach(function (r) {
      if (!PP.has(r[1])) return;
      var tr = el("tr");
      tr.appendChild(el("th", "", r[0], { scope: "row" }));
      tr.appendChild(el("td", "", String(r[1])));
      body.appendChild(tr);
    });
    tbl.appendChild(body);
    return body.children.length ? tbl : null;
  }

  function list(items, cls) {
    var ul = el("ul", cls || "ticks");
    items.forEach(function (t) { if (PP.has(t)) ul.appendChild(el("li", "", t)); });
    return ul.children.length ? ul : null;
  }

  /* ---------- Sections ---------- */
  function propertyFacts(rec) {
    var sp = rec.specs || {};
    var rows = [
      ["Category", UI.categoryLabel("property", rec)],
      ["Availability", PP.label(T.availability, rec.availability)],
      ["Location", rec.location],
      ["Land size", sp.landSize],
      ["Floor area", sp.floorArea],
      ["Bedrooms", sp.bedrooms],
      ["Bathrooms", sp.bathrooms]
    ];
    Object.keys(sp.extra || {}).forEach(function (k) { rows.push([k, sp.extra[k]]); });
    rows.push(["Reference", rec.id]);
    return factsTable(rows);
  }
  function projectFacts(rec) {
    return factsTable([
      ["Category", UI.categoryLabel("project", rec)],
      ["Development status", PP.label(T.projectStatuses, rec.projectStatus)],
      ["Location", rec.location],
      ["Reference", rec.id]
    ]);
  }

  function progressSection(rec) {
    var pr = rec.progress;
    if (!pr || (typeof pr.percent !== "number" && !PP.has(pr.note))) return null;
    var s = section("Construction progress");
    if (typeof pr.percent === "number") {
      var pct = Math.max(0, Math.min(100, pr.percent));
      var bar = el("div", "progress", null, { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct), "aria-label": "Construction progress" });
      var fill = el("span", "progress__fill"); fill.style.width = pct + "%";
      bar.appendChild(fill);
      s.appendChild(bar);
      s.appendChild(el("p", "progress__label", pct + "% complete"));
    }
    if (PP.has(pr.note)) s.appendChild(el("p", "", pr.note));
    return s;
  }

  function milestonesSection(rec) {
    var ms = (rec.milestones || []).filter(function (m) { return m && PP.has(m.title); });
    if (!ms.length) return null;
    var s = section("Project milestones");
    var ol = el("ol", "timeline");
    ms.forEach(function (m) {
      var li = el("li", "timeline__item" + (m.status ? " is-" + m.status : ""));
      li.appendChild(el("span", "timeline__dot", null, { "aria-hidden": "true" }));
      var body = el("div");
      body.appendChild(el("p", "timeline__title", m.title));
      var meta = [];
      if (PP.has(m.date)) meta.push(/^\d{4}-\d{2}-\d{2}$/.test(m.date) ? PP.formatDate(m.date) : m.date);
      if (m.status === "done") meta.push("Completed"); else if (m.status === "current") meta.push("In progress"); else if (m.status === "upcoming") meta.push("Upcoming");
      if (meta.length) body.appendChild(el("p", "timeline__meta", meta.join(" · ")));
      li.appendChild(body);
      ol.appendChild(li);
    });
    s.appendChild(ol);
    return s;
  }

  function mapSection(rec) {
    var s = section("Location");
    if (PP.has(rec.mapQuery)) {
      var q = encodeURIComponent(rec.mapQuery);
      var f = el("iframe", "", null, {
        title: "Map showing the location of " + rec.name, loading: "lazy",
        referrerpolicy: "no-referrer-when-downgrade",
        src: "https://maps.google.com/maps?q=" + q + "&output=embed"
      });
      s.appendChild(el("div", "map map--detail")).appendChild(f);
      var p = el("p", "map__link");
      p.appendChild(UI.link("", "Open in Google Maps", "https://www.google.com/maps/search/?api=1&query=" + q)).setAttribute("target", "_blank");
      p.firstChild.setAttribute("rel", "noopener noreferrer");
      s.appendChild(p);
    } else {
      s.appendChild(el("p", "muted", "A map will be shown here once the exact location is confirmed."));
    }
    return s;
  }

  function enquiryCard(rec) {
    var card = el("aside", "enquiry-card", null, { "aria-label": "Enquire about " + rec.name });
    var badge = UI.statusBadge(type, rec);
    if (badge) { badge.className += " badge--inline"; card.appendChild(badge); }
    if (isProp) {
      if (typeof rec.price === "number") {
        var pr = el("p", "enquiry-card__price", PP.formatPrice(rec.price));
        if (PP.has(rec.priceNote)) pr.appendChild(el("small", "", " " + rec.priceNote));
        card.appendChild(pr);
      } else {
        card.appendChild(el("p", "enquiry-card__price enquiry-card__price--none", "Price on enquiry"));
      }
    }
    card.appendChild(el("p", "enquiry-card__lead", "Interested in " + rec.name + "? Get in touch:"));

    var msg = PP.enquiryText(type, rec);
    var wa = UI.link("btn btn--gold btn--block", "", PP.waLink(msg));
    wa.target = "_blank"; wa.rel = "noopener noreferrer";
    wa.appendChild(el("span", "icon icon-whatsapp", null, { "aria-hidden": "true" }));
    wa.appendChild(document.createTextNode("WhatsApp enquiry"));
    card.appendChild(wa);

    if (PP.telLink()) {
      var tel = UI.link("btn btn--ghost-dark btn--block", "", PP.telLink());
      tel.appendChild(el("span", "icon icon-phone", null, { "aria-hidden": "true" }));
      tel.appendChild(document.createTextNode("Call " + (S.phoneDisplay || "us")));
      card.appendChild(tel);
    }
    if (S.email) {
      var mail = UI.link("btn btn--ghost-dark btn--block", "", PP.mailLink("Enquiry: " + rec.name + " (" + rec.id + ")", msg));
      mail.appendChild(el("span", "icon icon-mail", null, { "aria-hidden": "true" }));
      mail.appendChild(document.createTextNode("Email us"));
      card.appendChild(mail);
    }
    card.appendChild(UI.link("enquiry-card__form", "Or use the enquiry form", "contact.html?enquiry=" + encodeURIComponent(rec.id) + "#enquiry"));
    if (rec.placeholder) card.appendChild(el("p", "enquiry-card__note", "Sample record. Details will be replaced with verified company information."));
    return card;
  }

  function related(rec, all) {
    var out = [], seen = {};
    seen[rec.id] = true;
    (rec.related || []).forEach(function (id) {
      var r = PP.findById(all, id);
      if (r && !seen[id]) { out.push(r); seen[id] = true; }
    });
    if (out.length < 3) {
      all.filter(function (r) { return r.category === rec.category && !seen[r.id]; }).forEach(function (r) {
        if (out.length < 3) { out.push(r); seen[r.id] = true; }
      });
    }
    return out.slice(0, 3);
  }

  /* ---------- Page ---------- */
  function notFound(message) {
    if (titleEl) titleEl.textContent = isProp ? "Property not found" : "Project not found";
    if (eyebrowEl) eyebrowEl.textContent = listName;
    if (subEl) subEl.textContent = "";
    PP.setMeta({ title: (isProp ? "Property not found" : "Project not found") + " | " + S.brandName, noindex: true });
    UI.state(rootBox, "empty", message, [
      UI.link("btn btn--dark btn--sm", "Browse all " + listName.toLowerCase(), listPage)
    ]);
  }

  function build(rec, all) {
    if (titleEl) titleEl.textContent = rec.name;
    if (eyebrowEl) eyebrowEl.textContent = UI.categoryLabel(type, rec) || (isProp ? "Property" : "Project");
    if (subEl) subEl.textContent = PP.has(rec.location) ? rec.location : "";

    var img0 = UI.firstImage(rec);
    PP.setMeta({
      title: rec.name + " | " + S.brandName,
      description: trimTo(rec.description || (isProp ? "Property details" : "Project details") + " from " + S.brandName + ".", 155),
      url: PP.abs(PP.detailUrl(type, rec.id)),
      image: img0 ? PP.abs(img0.src) : PP.abs("assets/images/hero.jpg")
    });

    PP.clear(rootBox);

    var crumbs = el("nav", "crumbs", null, { "aria-label": "Breadcrumb" });
    var cl = el("ol");
    [["Home", "index.html"], [listName, listPage]].forEach(function (c) {
      var li = el("li"); li.appendChild(UI.link("", c[0], c[1])); cl.appendChild(li);
    });
    cl.appendChild(el("li", "", rec.name, { "aria-current": "page" }));
    crumbs.appendChild(cl);
    rootBox.appendChild(crumbs);

    if (rec.placeholder) {
      rootBox.appendChild(el("p", "notice", "Sample record. The name, details and photographs on this page are placeholders and will be replaced with verified company information."));
    }

    var layout = el("div", "detail");
    var left = el("div", "detail__main");
    var aside = el("div", "detail__aside");

    left.appendChild(buildGallery(rec));

    if (PP.has(rec.description)) {
      var d = section("About this " + (isProp ? "property" : "project"));
      d.appendChild(el("p", "", rec.description));
      left.appendChild(d);
    }
    var facts = isProp ? propertyFacts(rec) : projectFacts(rec);
    if (facts) { var fs = section(isProp ? "Property details" : "Project details"); fs.appendChild(facts); left.appendChild(fs); }

    if (!isProp) {
      var ps = progressSection(rec); if (ps) left.appendChild(ps);
      var ms = milestonesSection(rec); if (ms) left.appendChild(ms);
      var feat = list(rec.features || []);
      if (feat) { var fsx = section("Development features"); fsx.appendChild(feat); left.appendChild(fsx); }
    } else {
      var am = list(rec.amenities || []);
      if (am) { var as = section("Amenities"); as.appendChild(am); left.appendChild(as); }
    }
    left.appendChild(mapSection(rec));

    aside.appendChild(enquiryCard(rec));
    layout.appendChild(left); layout.appendChild(aside);
    rootBox.appendChild(layout);

    var rel = related(rec, all);
    if (rel.length) {
      var rs = el("section", "related");
      rs.appendChild(el("h2", "section-title", "Related " + listName.toLowerCase()));
      var grid = el("div", "grid grid--3");
      rel.forEach(function (r) { grid.appendChild(UI.card(type, r, true)); });
      rs.appendChild(grid);
      rootBox.appendChild(rs);
    }
  }

  function init() {
    var id = PP.params().get("id");
    if (!PP.has(id)) { notFound("No " + (isProp ? "property" : "project") + " was selected. Please choose one from the list."); return; }
    UI.state(rootBox, "loading");
    PP.loadData(dataName).then(function (all) {
      var rec = PP.findById(all, id);
      if (!rec) { notFound("Sorry, this " + (isProp ? "property" : "project") + " is not available. It may have been removed or the link may be incorrect."); return; }
      build(rec, all);
    }).catch(function (err) { UI.dataError(rootBox, err, init); });
  }

  PP.ready(init);
})();
