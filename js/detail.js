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

  /* ---------- Media: photos (mosaic), slideshow, floor plans, video ---------- */
  var SAFE_FILE = /^[\w\-./]+\.(mp4|webm|ogv)$/i;
  var MIME = { mp4: "video/mp4", webm: "video/webm", ogv: "video/ogg" };

  function lightboxItems(images, rec) {
    return images.map(function (i) {
      var cap = i.caption || i.alt || "";
      if (i.type === "render") cap = (cap ? cap + " — " : "") + "architectural render";
      return { src: i.src, alt: i.alt || rec.name, caption: cap };
    });
  }
  function typeLabel(im) { return im.type === "render" ? "Architectural render" : (im.type === "photo" ? "Photograph" : ""); }

  /* Mosaic: one large picture and up to four smaller ones, like a property portal. */
  function buildMosaic(images, items, rec) {
    var n = images.length;
    var box = el("div", "mosaic mosaic--" + Math.max(1, Math.min(n, 5)));
    if (!n) {
      var empty = el("div", "mosaic__tile mosaic__tile--empty");
      empty.appendChild(UI.img(null, { width: 1200, height: 750, lazy: false, fallbackAlt: "Photograph to be added" }));
      box.appendChild(empty);
      return box;
    }
    var shown = Math.min(n, 5);
    for (var i = 0; i < shown; i++) (function (i) {
      var b = el("button", "mosaic__tile", null, { type: "button", "aria-label": (i === 0 && typeLabel(images[0]) ? typeLabel(images[0]) + ": " : "") + "open photo " + (i + 1) + " of " + n });
      var im = i === 0 ? images[i] : { src: images[i].thumb || images[i].src, alt: images[i].alt };
      b.appendChild(UI.img(im, { width: i === 0 ? 1200 : 640, height: i === 0 ? 800 : 480, lazy: i > 0 }));
      if (i === 0 && typeLabel(images[0])) b.appendChild(el("span", "gallery__type", typeLabel(images[0])));
      b.addEventListener("click", function () { UI.openLightbox(items, i, b); });
      box.appendChild(b);
    })(i);
    if (n > 1) {
      var all = el("button", "mosaic__all", "View all " + n + " photos", { type: "button" });
      all.addEventListener("click", function () { UI.openLightbox(items, 0, all); });
      box.appendChild(all);
    }
    return box;
  }

  /* Slideshow: large picture with arrows and a thumbnail strip. */
  function buildSlideshow(images, items, rec) {
    var wrap = el("div", "gallery");
    var cur = 0;
    var stageBox = el("div", "gallery__stage");
    var mainBtn = el("button", "gallery__main", null, { type: "button", "aria-label": "Open image viewer" });
    var mainImg = UI.img(images[0], { width: 1200, height: 750, lazy: false });
    mainBtn.appendChild(mainImg);
    var tag = el("span", "gallery__type"); mainBtn.appendChild(tag);
    stageBox.appendChild(mainBtn);
    var prev = el("button", "gallery__arrow gallery__arrow--prev", "‹", { type: "button", "aria-label": "Previous image" });
    var next = el("button", "gallery__arrow gallery__arrow--next", "›", { type: "button", "aria-label": "Next image" });
    stageBox.appendChild(prev); stageBox.appendChild(next);
    var count = el("p", "gallery__count", null, { "aria-live": "polite" });
    stageBox.appendChild(count);
    wrap.appendChild(stageBox);

    var thumbs = el("div", "gallery__thumbs");
    images.forEach(function (im, i) {
      var b = el("button", "gallery__thumb", null, { type: "button", "aria-label": "Show image " + (i + 1) + " of " + images.length });
      b.appendChild(UI.img({ src: im.thumb || im.src, alt: "" }, { width: 160, height: 110 }));
      b.addEventListener("click", function () { set(i); });
      thumbs.appendChild(b);
    });
    wrap.appendChild(thumbs);

    function set(i) {
      var n = images.length;
      cur = (i + n) % n;
      var im = images[cur];
      mainImg.src = im.src; mainImg.alt = im.alt || rec.name; mainImg.className = "";
      tag.textContent = typeLabel(im); tag.hidden = !tag.textContent;
      count.textContent = (cur + 1) + " / " + n;
      PP.$$(".gallery__thumb", wrap).forEach(function (b, k) { b.setAttribute("aria-current", k === cur ? "true" : "false"); });
    }
    prev.addEventListener("click", function () { set(cur - 1); });
    next.addEventListener("click", function () { set(cur + 1); });
    mainBtn.addEventListener("click", function () { UI.openLightbox(items, cur, mainBtn); });
    wrap.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); set(cur - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); set(cur + 1); }
    });
    set(0);
    return wrap;
  }

  /* Floor plans: one or several levels; click to enlarge. */
  function buildPlans(plans, rec) {
    var box = el("div", "plans");
    var items = plans.map(function (p) { return { src: p.src, alt: p.alt || p.title || "Floor plan", caption: p.title || "Floor plan" }; });
    var fig = el("figure", "plans__fig");
    var btn = el("button", "plans__zoom", null, { type: "button" });
    var img = UI.img(plans[0], { width: 1000, height: 800, lazy: false });
    btn.appendChild(img);
    var cap = el("figcaption", "plans__cap");
    fig.appendChild(btn); fig.appendChild(cap);
    var cur = 0;
    function set(i) {
      cur = i; img.src = plans[i].src; img.alt = plans[i].alt || plans[i].title || "Floor plan";
      cap.textContent = plans[i].title || "Floor plan";
      btn.setAttribute("aria-label", "Enlarge: " + (plans[i].title || "floor plan"));
      PP.$$(".chip-btn", box).forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
    }
    if (plans.length > 1) {
      var row = el("div", "chip-row", null, { role: "group", "aria-label": "Choose floor plan" });
      plans.forEach(function (p, i) {
        var b = el("button", "chip-btn", p.title || ("Plan " + (i + 1)), { type: "button", "aria-pressed": "false" });
        b.addEventListener("click", function () { set(i); });
        row.appendChild(b);
      });
      box.appendChild(row);
    }
    btn.addEventListener("click", function () { UI.openLightbox(items, cur, btn); });
    box.appendChild(fig);
    set(0);
    return box;
  }

  /* Video: local MP4/WebM (native, accessible controls) or YouTube/Vimeo that only loads after you press play. */
  function validVideo(v) {
    if (!v) return false;
    if (v.type === "youtube") return /^[\w-]{11}$/.test(v.id || "");
    if (v.type === "vimeo") return /^\d{5,12}$/.test(v.id || "");
    return SAFE_FILE.test(v.src || "") && !/^\/\//.test(v.src);
  }
  function videoPlayer(v) {
    var box = el("div", "video");
    var title = v.title || "Video";
    if (v.type === "youtube" || v.type === "vimeo") {
      var f = el("button", "video__facade", null, { type: "button", "aria-label": "Play video: " + title });
      if (PP.has(v.poster)) f.style.backgroundImage = "url('" + String(v.poster).replace(/['"()\\]/g, "") + "')";
      f.appendChild(el("span", "video__play", null, { "aria-hidden": "true" }));
      f.appendChild(el("span", "video__hint", "Plays from " + (v.type === "youtube" ? "YouTube" : "Vimeo") + " once you press play"));
      f.addEventListener("click", function () {
        var src = v.type === "youtube"
          ? "https://www.youtube-nocookie.com/embed/" + v.id + "?autoplay=1&rel=0"
          : "https://player.vimeo.com/video/" + v.id + "?autoplay=1&dnt=1";
        var fr = el("iframe", "", null, { src: src, title: title, allow: "autoplay; fullscreen; picture-in-picture", allowfullscreen: "", referrerpolicy: "strict-origin-when-cross-origin" });
        PP.clear(box); box.appendChild(fr);
      });
      box.appendChild(f);
      return box;
    }
    var vid = el("video", "", null, { controls: "", preload: "none", playsinline: "", "aria-label": title });
    if (PP.has(v.poster)) vid.setAttribute("poster", v.poster);
    var ext = (v.src.split(".").pop() || "mp4").toLowerCase();
    vid.appendChild(el("source", "", null, { src: v.src, type: MIME[ext] || "video/mp4" }));
    if (PP.has(v.captions)) vid.appendChild(el("track", "", null, { kind: "captions", src: v.captions, srclang: "en", label: "English", default: "" }));
    var fb = el("p", "video__fallback", "Your browser cannot play this video. ");
    fb.appendChild(UI.link("", "Download the video", v.src));
    vid.appendChild(fb);
    box.appendChild(vid);
    return box;
  }
  function buildVideos(videos) {
    var box = el("div", "videos");
    var stageBox = el("div", "videos__stage");
    var cap = el("p", "videos__cap");
    function show(i) {
      PP.clear(stageBox); stageBox.appendChild(videoPlayer(videos[i]));
      var vt = videos[i].title || "Video";
      cap.textContent = vt + (videos[i].placeholder && !/sample/i.test(vt) ? " (sample video)" : "");
      PP.$$(".chip-btn", box).forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
    }
    if (videos.length > 1) {
      var row = el("div", "chip-row", null, { role: "group", "aria-label": "Choose video" });
      videos.forEach(function (v, i) {
        var b = el("button", "chip-btn", v.title || ("Video " + (i + 1)), { type: "button", "aria-pressed": "false" });
        b.addEventListener("click", function () { show(i); });
        row.appendChild(b);
      });
      box.appendChild(row);
    }
    box.appendChild(stageBox); box.appendChild(cap);
    show(0);
    return box;
  }

  /* Tabs container. Only the views that have content are offered. */
  function buildMedia(rec) {
    var images = (rec.images || []).filter(function (i) { return i && i.src; });
    var plans = (rec.floorPlans || []).filter(function (p) { return p && p.src; });
    var videos = (rec.videos || []).filter(validVideo);
    var items = lightboxItems(images, rec);
    var views = [{ id: "photos", label: "Photos", build: function () { return buildMosaic(images, items, rec); } }];
    if (images.length > 1) views.push({ id: "slideshow", label: "Slideshow", build: function () { return buildSlideshow(images, items, rec); } });
    if (plans.length) views.push({ id: "plans", label: plans.length > 1 ? "Floor plans" : "Floor plan", build: function () { return buildPlans(plans, rec); } });
    if (videos.length) views.push({ id: "video", label: "Video", build: function () { return buildVideos(videos); } });

    var wrap = el("div", "media");
    if (views.length === 1) { wrap.appendChild(views[0].build()); return wrap; }

    var list = el("div", "tabs", null, { role: "tablist", "aria-label": "Media views" });
    var tabs = [], panels = [];
    views.forEach(function (v, i) {
      var t = el("button", "tabs__tab", v.label, { type: "button", role: "tab", id: "tab-" + v.id, "aria-controls": "panel-" + v.id, "aria-selected": i === 0 ? "true" : "false", tabindex: i === 0 ? "0" : "-1" });
      var p = el("div", "tabs__panel", null, { role: "tabpanel", id: "panel-" + v.id, "aria-labelledby": "tab-" + v.id });
      if (i !== 0) p.hidden = true;
      p.appendChild(v.build());
      t.addEventListener("click", function () { select(i, false); });
      tabs.push(t); panels.push(p); list.appendChild(t);
    });
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        t.setAttribute("aria-selected", k === i ? "true" : "false");
        t.tabIndex = k === i ? 0 : -1;
        panels[k].hidden = k !== i;
      });
      PP.$$("video", wrap).forEach(function (v) { try { v.pause(); } catch (e) { /* ignore */ } });
      if (focus) tabs[i].focus();
    }
    list.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = tabs.length, j = null;
      if (e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      if (j !== null) { e.preventDefault(); select(j, true); }
    });
    wrap.appendChild(list);
    panels.forEach(function (p) { wrap.appendChild(p); });
    return wrap;
  }

  /* Key facts band (only values that exist) */
  function keyFacts(rec) {
    var rows;
    if (isProp) {
      var sp = rec.specs || {};
      rows = [["Bedrooms", sp.bedrooms], ["Bathrooms", sp.bathrooms], ["Floor area", sp.floorArea], ["Land size", sp.landSize]];
    } else {
      rows = [["Status", PP.label(T.projectStatuses, rec.projectStatus)], ["Category", UI.categoryLabel("project", rec)], ["Location", rec.location]];
    }
    rows = rows.filter(function (r) { return PP.has(r[1]); });
    if (!rows.length) return null;
    var dl = el("dl", "keyfacts");
    rows.forEach(function (r) {
      var d = el("div", "keyfacts__item");
      d.appendChild(el("dt", "", r[0])); d.appendChild(el("dd", "", String(r[1])));
      dl.appendChild(d);
    });
    return dl;
  }

  /* Share + print (no accounts or tracking) */
  function shareRow(rec) {
    var row = el("div", "share");
    var status = el("span", "share__status", null, { role: "status" });
    var url = PP.abs(PP.detailUrl(type, rec.id));
    var share = el("button", "share__btn", "Share", { type: "button" });
    share.addEventListener("click", function () {
      if (navigator.share) { navigator.share({ title: rec.name, url: url }).catch(function () { /* cancelled */ }); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { status.textContent = "Link copied"; }, function () { status.textContent = url; });
      } else { status.textContent = url; }
    });
    var print = el("button", "share__btn", "Print", { type: "button" });
    print.addEventListener("click", function () { window.print(); });
    row.appendChild(share); row.appendChild(print); row.appendChild(status);
    return row;
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
    var topRow = el("div", "detail-top");
    topRow.appendChild(crumbs); topRow.appendChild(shareRow(rec));
    rootBox.appendChild(topRow);

    if (rec.placeholder) {
      rootBox.appendChild(el("p", "notice", "Sample record. The name, details and photographs on this page are placeholders and will be replaced with verified company information."));
    }

    var layout = el("div", "detail");
    var left = el("div", "detail__main");
    var aside = el("div", "detail__aside");

    left.appendChild(buildMedia(rec));
    var kf = keyFacts(rec); if (kf) left.appendChild(kf);

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
