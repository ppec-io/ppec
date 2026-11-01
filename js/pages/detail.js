/* Property and project detail pages.
   property-details.html?id=property-001   and   project-details.html?id=project-001
   Configured by <main data-detail="property|project">. */
(function () {
  "use strict";
  var P = window.PPEC;

  var CONFIG = {
    property: {
      file: "properties", list: "properties.html", listLabel: "Properties", noun: "property",
      catKey: "propertyCategories", statusKey: "availability", statusField: "availability", statusLabel: "Availability"
    },
    project: {
      file: "projects", list: "projects.html", listLabel: "Projects", noun: "project",
      catKey: "projectCategories", statusKey: "projectStatuses", statusField: "projectStatus", statusLabel: "Status"
    }
  };
  var IMAGE_TYPES = { photo: "Photograph", render: "Architectural render" };
  var MILESTONE_STATUS = { done: "Completed", "in-progress": "In progress", upcoming: "Upcoming" };

  document.addEventListener("DOMContentLoaded", function () {
    var root = P.$("[data-detail]");
    if (root) init(root);
  });

  function init(root) {
    var kind = root.getAttribute("data-detail");
    var C = CONFIG[kind];
    var host = P.$("#detail");
    var titleEl = P.$("#detail-title");
    var subEl = P.$("#detail-sub");
    var crumb = P.$("#crumb-current");
    var id = new URLSearchParams(window.location.search).get("id");

    if (!id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) { notFound(); return; }
    load();

    function load() {
      P.clear(host);
      host.appendChild(P.ui.loading("Loading " + C.noun + " details…"));
      Promise.all([P.data.published(C.file), P.data.taxonomy()])
        .then(function (r) {
          var rec = P.data.byId(r[0], id);       // drafts are never in this list
          if (!rec) { notFound(); return; }
          render(rec, r[0], r[1]);
        })
        .catch(function (err) {
          console.error(err);
          P.clear(host);
          host.appendChild(P.ui.error("We could not load this " + C.noun + " right now. Please try again, or contact us directly.", load));
        });
    }

    function notFound() {
      titleEl.textContent = "This " + C.noun + " could not be found";
      subEl.textContent = "The link may be out of date, or the " + C.noun + " is no longer listed.";
      if (crumb) crumb.textContent = "Not found";
      P.setPageMeta({ title: "Not found", noindex: true });
      P.clear(host);
      var box = P.el("div", "state state--empty");
      box.appendChild(P.el("p", "", "Please browse our current " + C.listLabel.toLowerCase() + " or get in touch and we will be glad to help."));
      var row = P.el("div", "btn-row btn-row--center");
      row.appendChild(P.el("a", "btn btn--dark", "Browse " + C.listLabel.toLowerCase(), { href: P.pageUrl(C.list) }));
      row.appendChild(P.el("a", "btn btn--ghost-dark", "Contact us", { href: P.pageUrl("contact.html") }));
      box.appendChild(row);
      host.appendChild(box);
    }

    function render(rec, list, tax) {
      var enq = P.enquiry.forRecord(kind, rec);
      var cat = P.label(tax[C.catKey], rec.category);
      var status = P.label(tax[C.statusKey], rec[C.statusField]);

      // Header band and page metadata
      titleEl.textContent = rec.title;
      subEl.textContent = rec.location || "";
      subEl.hidden = !rec.location;
      if (crumb) crumb.textContent = rec.title;
      var firstImg = rec.images && rec.images[0];
      P.setPageMeta({
        title: rec.title,
        description: rec.summary || (cat + (rec.location ? " in " + rec.location : "")),
        image: firstImg && firstImg.src,
        url: P.publicUrl(kind === "property" ? "property-details.html" : "project-details.html", { id: rec.id }),
        noindex: !!rec.placeholder       // sample records are kept out of search engines
      });

      P.clear(host);
      host.removeAttribute("aria-busy");
      var grid = P.el("div", "detail__grid");
      var main = P.el("div", "detail__main");
      var aside = P.el("aside", "detail__aside", null, { "aria-label": "Enquiry" });

      main.appendChild(buildGallery(rec));

      // Badges row
      var badges = P.el("div", "detail__badges");
      badges.appendChild(P.el("span", "tag", cat));
      if (rec[C.statusField]) badges.appendChild(P.ui.badge(status, "badge--static badge--" + String(rec[C.statusField]).replace(/[^a-z-]/g, "")));
      if (rec.placeholder) badges.appendChild(P.ui.badge("Sample", "badge--static badge--sample-static"));
      main.insertBefore(badges, main.firstChild);

      // Description
      var desc = Array.isArray(rec.description) ? rec.description : (rec.description ? [rec.description] : []);
      if (!desc.length && rec.summary) desc = [rec.summary];
      if (desc.length) main.appendChild(section("About this " + C.noun, P.richText(P.el("div", "prose"), desc)));

      if (kind === "property") renderPropertyBody(main, rec, cat, status);
      else renderProjectBody(main, rec, cat, status);

      var map = buildMap(rec);
      if (map) main.appendChild(section("Location", map));

      aside.appendChild(buildEnquiry(rec, enq, kind));
      grid.appendChild(main);
      grid.appendChild(aside);
      host.appendChild(grid);

      var rel = related(rec, list);
      if (rel.length) {
        var sec = P.el("section", "detail__related", null, { "aria-labelledby": "related-title" });
        sec.appendChild(P.el("h2", "", "Related " + C.listLabel.toLowerCase(), { id: "related-title" }));
        var g = P.el("div", "grid grid--3");
        rel.forEach(function (r) { g.appendChild(P.ui.card(r, kind, { tax: tax, light: true })); });
        sec.appendChild(g);
        host.appendChild(sec);
      }
      P.reveal(host);
    }

    /* ---------- sections ---------- */
    function section(title, content) {
      var s = P.el("section", "detail__section");
      s.appendChild(P.el("h2", "", title));
      s.appendChild(content);
      return s;
    }
    function specList(rows) {
      var dl = P.el("dl", "specs");
      rows = rows.filter(function (r) { return r[1] != null && String(r[1]).trim() !== ""; });   // never show a label without a value
      rows.forEach(function (r) {
        var row = P.el("div", "specs__row");
        row.appendChild(P.el("dt", "", r[0]));
        row.appendChild(P.el("dd", "", r[1]));
        dl.appendChild(row);
      });
      return dl;
    }

    function renderPropertyBody(main, rec, cat, status) {
      var s = rec.specs || {};
      var rows = [["Category", cat]];
      if (rec.availability) rows.push(["Availability", status]);
      var land = P.formatMeasure(s.landSize); if (land) rows.push(["Land size", land]);
      var floor = P.formatMeasure(s.floorArea); if (floor) rows.push(["Floor area", floor]);
      if (s.bedrooms != null) rows.push(["Bedrooms", String(s.bedrooms)]);
      if (s.bathrooms != null) rows.push(["Bathrooms", String(s.bathrooms)]);
      var specs = specList(rows);
      if (specs.children.length) main.appendChild(section("Specifications", specs));

      var am = (rec.amenities || []).filter(function (a) { return typeof a === "string" && a.trim(); });
      if (am.length) {
        var ul = P.el("ul", "checklist");
        am.forEach(function (a) { ul.appendChild(P.el("li", "", a)); });
        main.appendChild(section("Amenities", ul));
      }
    }

    function renderProjectBody(main, rec, cat, status) {
      var rows = [["Category", cat]];
      if (rec.projectStatus) rows.push(["Development status", status]);
      if (rec.location) rows.push(["Location", rec.location]);
      var details = specList(rows);
      if (details.children.length) main.appendChild(section("Project details", details));

      // Construction progress: shows a percentage only when the company has supplied one
      var pr = rec.progress || {};
      var box = P.el("div", "progress-box");
      if (typeof pr.percent === "number" && pr.percent >= 0 && pr.percent <= 100) {
        var bar = P.el("div", "progress", null, { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pr.percent, "aria-label": "Construction progress" });
        var fill = P.el("span", "progress__fill");
        fill.style.width = pr.percent + "%";
        bar.appendChild(fill);
        box.appendChild(bar);
        box.appendChild(P.el("p", "progress__label", pr.percent + "% complete"));
      }
      if (pr.note) box.appendChild(P.el("p", "", pr.note));
      if (!box.children.length) box.appendChild(P.el("p", "muted", "Progress information will be shared here once it has been confirmed by the company."));
      main.appendChild(section("Construction progress", box));

      // Milestones
      var ms = (rec.milestones || []).filter(function (m) { return m && m.title; });
      if (ms.length) {
        var ol = P.el("ol", "timeline");
        var anyDetail = false;
        ms.forEach(function (m) {
          var li = P.el("li", "timeline__item" + (m.status ? " is-" + String(m.status).replace(/[^a-z-]/g, "") : ""));
          li.appendChild(P.el("span", "timeline__title", m.title));
          var d = P.formatDate(m.date) || (typeof m.date === "string" ? m.date : "");
          if (d) { li.appendChild(P.el("span", "timeline__date", d)); anyDetail = true; }
          if (m.status && MILESTONE_STATUS[m.status]) { li.appendChild(P.ui.badge(MILESTONE_STATUS[m.status], "badge--static")); anyDetail = true; }
          if (m.note) { li.appendChild(P.el("span", "timeline__note", m.note)); anyDetail = true; }
          ol.appendChild(li);
        });
        var wrap = P.el("div");
        wrap.appendChild(ol);
        if (!anyDetail) wrap.appendChild(P.el("p", "muted", "Dates and status for each stage will be added once they have been confirmed."));
        main.appendChild(section("Project milestones", wrap));
      }

      var feats = (rec.features || []).filter(function (f) { return typeof f === "string" && f.trim(); });
      if (feats.length) {
        var ul = P.el("ul", "checklist");
        feats.forEach(function (f) { ul.appendChild(P.el("li", "", f)); });
        main.appendChild(section("Development features", ul));
      }
    }

    /* ---------- gallery with viewer ---------- */
    function buildGallery(rec) {
      var imgs = (rec.images || []).filter(function (i) { return i && i.src; });
      var wrap = P.el("div", "gallery");
      if (!imgs.length) {
        wrap.appendChild(P.el("div", "gallery__empty", "Photographs coming soon"));
        return wrap;
      }
      var idx = 0;
      var viewer = imgs.map(function (i) { return { src: i.src, alt: i.alt, caption: i.caption }; });
      var stage = P.el("div", "gallery__stage");
      var mainBtn = P.el("button", "gallery__main", null, { type: "button" });
      var mainImg = P.el("img", "", null, { width: 1200, height: 800, fetchpriority: "high", decoding: "async" });
      var typeTag = P.el("span", "badge badge--static gallery__type");   // sits beside the button, not inside it, so the button's name stays simple
      var zoom = P.el("span", "gallery__zoom", "View larger", { "aria-hidden": "true" });
      mainBtn.appendChild(mainImg); mainBtn.appendChild(zoom);
      stage.appendChild(mainBtn); stage.appendChild(typeTag);
      var cap = P.el("p", "gallery__cap");
      wrap.appendChild(stage); wrap.appendChild(cap);

      function show(i) {
        idx = i;
        var it = imgs[i];
        mainImg.src = P.asset(it.src);
        mainImg.alt = it.alt || rec.title;
        var t = IMAGE_TYPES[it.type];
        mainBtn.setAttribute("aria-label", "View larger, image " + (i + 1) + " of " + imgs.length);
        typeTag.textContent = t || "";
        typeTag.hidden = !t;
        cap.textContent = it.caption || "";
        cap.hidden = !it.caption;
        P.$$(".gallery__thumb", wrap).forEach(function (b, n) { b.setAttribute("aria-current", n === i ? "true" : "false"); });
      }
      mainBtn.addEventListener("click", function () { P.lightbox.open(viewer, idx); });

      if (imgs.length > 1) {
        var ul = P.el("ul", "gallery__thumbs");
        imgs.forEach(function (it, n) {
          var li = P.el("li");
          var b = P.el("button", "gallery__thumb", null, { type: "button", "aria-label": "Show image " + (n + 1) + ": " + (it.alt || rec.title) });
          b.appendChild(P.el("img", "", null, { src: P.asset(it.thumb || it.src), alt: "", width: 120, height: 90, loading: "lazy", decoding: "async" }));
          b.addEventListener("click", function () { show(n); });
          li.appendChild(b); ul.appendChild(li);
        });
        wrap.appendChild(ul);
      }
      show(0);
      return wrap;
    }

    /* ---------- map: loaded only when the visitor asks (no third-party request before that) ---------- */
    function buildMap(rec) {
      if (!rec.mapQuery || !String(rec.mapQuery).trim()) return null;
      var q = String(rec.mapQuery).trim();
      var box = P.el("div", "map-box");
      var btn = P.el("button", "btn btn--dark btn--sm", "Show map", { type: "button" });
      var link = P.el("a", "map-box__link", "Open in Google Maps", {
        href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q), target: "_blank", rel: "noopener noreferrer"
      });
      btn.addEventListener("click", function () {
        var f = P.el("iframe", "", null, {
          title: "Map of " + rec.title, loading: "lazy", referrerpolicy: "no-referrer-when-downgrade",
          src: "https://maps.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed"
        });
        box.insertBefore(f, btn);
        btn.remove();
      });
      box.appendChild(btn);
      box.appendChild(link);
      return box;
    }

    /* ---------- enquiry panel ---------- */
    function buildEnquiry(rec, enq, kind) {
      var card = P.el("div", "enquiry-card");
      card.appendChild(P.el("h2", "", "Enquire about this " + C.noun));
      if (kind === "property") {
        var price = P.formatPrice(rec);
        var pb = P.el("div", "enquiry-card__price");
        if (price) {
          pb.appendChild(P.el("span", "enquiry-card__label", "Price"));
          pb.appendChild(P.el("strong", "", price));
          if (rec.price && rec.price.note) pb.appendChild(P.el("span", "muted", rec.price.note));
        } else {
          pb.appendChild(P.el("span", "muted", "Price not listed. Please enquire."));
        }
        card.appendChild(pb);
      }
      var stack = P.el("div", "enquiry-card__buttons");
      var wa = P.el("a", "btn btn--gold", null, { href: enq.whatsapp, target: "_blank", rel: "noopener noreferrer", "aria-label": "WhatsApp enquiry (opens in a new tab)" });
      wa.appendChild(P.icon("whatsapp")); wa.appendChild(document.createTextNode("WhatsApp enquiry"));
      var call = P.el("a", "btn btn--ghost-dark", null, { href: enq.tel });
      call.appendChild(P.icon("phone")); call.appendChild(document.createTextNode("Call us"));
      var mail = P.el("a", "btn btn--ghost-dark", null, { href: enq.mailto });
      mail.appendChild(P.icon("mail")); mail.appendChild(document.createTextNode("Email enquiry"));
      var form = P.el("a", "enquiry-card__form", "Or use the enquiry form", {
        href: P.pageUrl("contact.html", kind === "property" ? { property: rec.id } : { project: rec.id }) + "#enquiry"
      });
      stack.appendChild(wa); stack.appendChild(call); stack.appendChild(mail);
      card.appendChild(stack);
      card.appendChild(form);
      return card;
    }

    /* ---------- related records: the ones named in "related", otherwise the same category ---------- */
    function related(rec, list) {
      var out = [];
      (rec.related || []).forEach(function (rid) {
        var r = P.data.byId(list, rid);
        if (r && r.id !== rec.id && out.indexOf(r) === -1) out.push(r);
      });
      if (!out.length) {
        out = list.filter(function (r) { return r.id !== rec.id && r.category === rec.category; });
      }
      return out.slice(0, 3);
    }
  }
})();
