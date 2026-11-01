/* ==========================================================================
   content.js — smaller JSON-driven blocks. Each block opts in with a data attribute:
   home featured projects, services, news list / article, FAQ, team, careers.
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el, UI = PP.ui;

  function ph(node, rec) { if (rec.placeholder) node.className += " ph"; return node; }
  function isHttp(u) { return /^https:\/\//i.test(u || ""); }
  function showNotice(items) {
    var n = PP.$("#sample-notice");
    if (n) n.hidden = !items.some(function (r) { return r.placeholder; });
  }

  /* ---------- Featured properties / projects (home page card grids) ---------- */
  function featured() {
    PP.$$("[data-featured]").forEach(function (box) {
      var kind = box.getAttribute("data-featured");              // "properties" | "projects"
      var type = kind === "projects" ? "project" : "property";
      var light = box.getAttribute("data-card-style") === "light";
      function go() {
        UI.state(box, "loading");
        PP.loadData(kind).then(function (all) {
          var items = all.filter(function (r) { return r.featured; }).sort(function (a, b) { return PP.byNewest(a, b) || PP.byText(a.name, b.name); }).slice(0, 3);
          PP.clear(box);
          if (!items.length) { UI.state(box, "empty", "Featured " + kind + " will appear here."); return; }
          items.forEach(function (r) { box.appendChild(UI.card(type, r, light)); });
        }).catch(function (err) { UI.dataError(box, err, go); });
      }
      go();
    });
  }

  /* ---------- Services ---------- */
  function services() {
    PP.$$("[data-services]").forEach(function (box) {
      var mode = box.getAttribute("data-services");              // "overview" | "full"
      PP.loadData("services").then(function (items) {
        if (!items.length) return;                               // keep static fallback text
        items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        PP.clear(box);
        items.forEach(function (s, i) {
          var numText = (i < 9 ? "0" : "") + (i + 1);
          var hasImg = s.image && s.image.src;
          if (mode === "full") {
            var row = el("article", "service service--full" + (hasImg ? " service--split" : ""), null, { id: s.id });
            var body = el("div", "service__body");
            body.appendChild(el("span", "service__num", numText, { "aria-hidden": "true" }));
            body.appendChild(el("h2", "service__title", s.title));
            body.appendChild(ph(el("p", "", s.description || s.summary), s));
            if (s.cta && s.cta.href) body.appendChild(UI.link("btn btn--dark btn--sm", s.cta.label || "Learn more", s.cta.href));
            row.appendChild(body);
            if (hasImg) {
              var fig = el("div", "service__img");
              fig.appendChild(UI.img(s.image, { width: 800, height: 600 }));
              if (s.placeholder) fig.appendChild(el("span", "sample-tag", "Sample image"));
              row.appendChild(fig);
            }
            box.appendChild(row);
          } else {
            var card = el("article", "service service--card" + (hasImg ? "" : " service--plain"));
            if (hasImg) {
              var im = el("div", "service__img");
              im.appendChild(UI.img(UI.thumb(s.image), { width: 640, height: 480 }));
              card.appendChild(im);
            }
            var cb = el("div", "service__cardbody");
            cb.appendChild(el("span", "service__num", numText, { "aria-hidden": "true" }));
            var h = el("h3", "service__h"); h.appendChild(UI.link("service__link", s.title, "services.html#" + encodeURIComponent(s.id)));
            cb.appendChild(h);
            cb.appendChild(el("p", "", s.summary || s.description));
            var more = el("span", "service__more", "Discover more", { "aria-hidden": "true" });
            more.appendChild(el("span", "icon icon-arrow"));
            cb.appendChild(more);
            card.appendChild(cb);
            box.appendChild(card);
          }
        });
      }).catch(function () { /* the static fallback already in the page stays */ });
    });
  }

  /* ---------- News ---------- */
  function newsList() {
    var box = PP.$("[data-news-list]");
    if (!box) return;
    function go() {
      UI.state(box, "loading");
      PP.loadData("news").then(function (items) {
        PP.clear(box);
        if (!items.length) { UI.state(box, "empty", "No news articles have been published yet. Please check back soon."); return; }
        items.sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
        var grid = el("div", "grid grid--3");
        items.forEach(function (n) {
          var url = "news-details.html?id=" + encodeURIComponent(n.id);
          var card = el("article", "card card--light news-card");
          var media = el("a", "card__media", null, { href: url, tabindex: "-1", "aria-hidden": "true" });
          media.appendChild(UI.img(UI.thumb(n.cover), { fallbackAlt: "" }));
          if (n.placeholder) media.appendChild(el("span", "badge badge--sample", "Sample"));
          card.appendChild(media);
          var body = el("div", "card__body");
          var meta = [];
          if (PP.has(n.date)) meta.push(PP.formatDate(n.date));
          if (PP.has(n.category)) meta.push(n.category);
          if (meta.length) body.appendChild(el("p", "card__cat", meta.join(" · ")));
          var h = el("h3", "card__title"); h.appendChild(UI.link("card__titlelink", n.title, url)); body.appendChild(h);
          if (PP.has(n.summary)) body.appendChild(el("p", "card__desc", n.summary));
          var a = el("div", "card__actions"); a.appendChild(UI.link("btn btn--sm btn--dark", "Read article", url)); body.appendChild(a);
          card.appendChild(body);
          grid.appendChild(card);
        });
        box.appendChild(grid);
        showNotice(items);
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  function shareLinks(title, url) {
    var row = el("div", "share share--article");
    row.appendChild(el("span", "share__label", "Share"));
    var wa = UI.link("share__btn", "WhatsApp", "https://wa.me/?text=" + encodeURIComponent(title + " " + url));
    wa.target = "_blank"; wa.rel = "noopener noreferrer";
    wa.setAttribute("aria-label", "Share on WhatsApp (opens in a new tab)");
    var mail = UI.link("share__btn", "Email", "mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(url));
    var status = el("span", "share__status", null, { role: "status" });
    var copy = el("button", "share__btn", "Copy link", { type: "button" });
    copy.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { status.textContent = "Link copied"; }, function () { status.textContent = url; });
      } else { status.textContent = url; }
    });
    [wa, mail, copy, status].forEach(function (n) { row.appendChild(n); });
    return row;
  }

  function newsArticle() {
    var box = PP.$("[data-news-article]");
    if (!box) return;
    var titleEl = PP.$("#d-title"), eyebrowEl = PP.$("#d-eyebrow"), subEl = PP.$("#d-sub");
    function missing(msg) {
      if (titleEl) titleEl.textContent = "Article not found";
      PP.setMeta({ title: "Article not found | " + S.brandName, noindex: true });
      UI.state(box, "empty", msg, [UI.link("btn btn--dark btn--sm", "All news and insights", "news.html")]);
    }
    function go() {
      var id = PP.params().get("id");
      if (!PP.has(id)) { missing("No article was selected."); return; }
      UI.state(box, "loading");
      PP.loadData("news").then(function (items) {
        var n = PP.findById(items, id);
        if (!n) { missing("Sorry, this article is not available. It may have been removed or the link may be incorrect."); return; }
        if (titleEl) titleEl.textContent = n.title;
        if (eyebrowEl) eyebrowEl.textContent = n.category || "News";
        if (subEl) subEl.textContent = PP.has(n.date) ? PP.formatDate(n.date) : "";
        var summary = PP.has(n.summary) ? n.summary : "News and insights from " + S.brandName + ".";
        var pageUrl = PP.abs("news-details.html?id=" + encodeURIComponent(n.id));
        PP.setMeta({
          title: n.title + " | " + S.brandName, description: summary, url: pageUrl,
          image: n.cover && n.cover.src ? PP.abs(n.cover.src) : PP.abs("assets/images/hero.jpg")
        });
        PP.clear(box);
        if (n.placeholder) box.appendChild(el("p", "notice", "Sample article. Replace this content with real company news."));

        var layout = el("div", "article-layout");
        var main = el("article", "article");
        if (n.cover && n.cover.src) {
          var fig = el("figure", "article__cover");
          fig.appendChild(UI.img(n.cover, { width: 1200, height: 600, lazy: false }));
          main.appendChild(fig);
        }
        var prose = el("div", "prose");
        (n.content || []).forEach(function (line) {
          if (typeof line !== "string") return;
          if (line.indexOf("## ") === 0) prose.appendChild(el("h2", "", line.slice(3)));
          else prose.appendChild(el("p", "", line));
        });
        main.appendChild(prose);
        main.appendChild(shareLinks(n.title, pageUrl));
        var back = el("p", "article__back");
        back.appendChild(UI.link("btn btn--ghost-dark btn--sm", "Back to all articles", "news.html"));
        main.appendChild(back);
        layout.appendChild(main);

        var others = items.filter(function (x) { return x.id !== n.id; })
          .sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); }).slice(0, 4);
        var side = el("aside", "article-side", null, { "aria-labelledby": "latest-title" });
        side.appendChild(el("h2", "article-side__title", "Latest articles", { id: "latest-title" }));
        if (others.length) {
          var ul = el("ul", "article-side__list");
          others.forEach(function (o) {
            var li = el("li");
            var meta = [];
            if (PP.has(o.date)) meta.push(PP.formatDate(o.date));
            if (PP.has(o.category)) meta.push(o.category);
            if (meta.length) li.appendChild(el("span", "article-side__meta", meta.join(" · ")));
            li.appendChild(UI.link("article-side__link", o.title, "news-details.html?id=" + encodeURIComponent(o.id)));
            ul.appendChild(li);
          });
          side.appendChild(ul);
        } else {
          side.appendChild(el("p", "muted", "No other articles yet."));
        }
        side.appendChild(UI.link("btn btn--dark btn--block", "All news", "news.html"));
        layout.appendChild(side);
        box.appendChild(layout);
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  /* ---------- FAQ (search + topic filter) ---------- */
  function faq() {
    var box = PP.$("[data-faq]");
    if (!box) return;
    function go() {
      UI.state(box, "loading");
      PP.loadData("faqs").then(function (items) {
        PP.clear(box);
        if (!items.length) { UI.state(box, "empty", "Frequently asked questions will appear here."); return; }
        items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        var cats = [];
        items.forEach(function (f) { if (PP.has(f.category) && cats.indexOf(f.category) < 0) cats.push(f.category); });
        var state = { q: "", cat: "" };

        var tools = el("div", "faq-tools");
        var field = el("div", "field faq-search");
        field.appendChild(el("label", "", "Search the questions", { for: "faq-q" }));
        var input = el("input", "", null, { type: "search", id: "faq-q", autocomplete: "off", placeholder: "Type a word, e.g. price, visit, enquiry" });
        field.appendChild(input);
        tools.appendChild(field);
        var chips = el("div", "chip-row", null, { role: "group", "aria-label": "Filter by topic" });
        function chip(label, value) {
          var b = el("button", "chip-btn", label, { type: "button", "aria-pressed": value === "" ? "true" : "false" });
          b.addEventListener("click", function () { state.cat = value; PP.$$(".chip-btn", chips).forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); }); render(); });
          chips.appendChild(b);
        }
        if (cats.length > 1) { chip("All", ""); cats.forEach(function (c) { chip(c, c); }); tools.appendChild(chips); }
        var count = el("p", "faq-count", null, { role: "status", "aria-live": "polite" });
        tools.appendChild(count);
        box.appendChild(tools);

        var list = el("div", "faq-list");
        box.appendChild(list);

        function render() {
          var q = state.q.trim().toLowerCase();
          PP.clear(list);
          var shown = items.filter(function (f) {
            if (state.cat && f.category !== state.cat) return false;
            return !q || (f.question + " " + f.answer).toLowerCase().indexOf(q) > -1;
          });
          shown.forEach(function (f) {
            var d = el("details", "faq");
            d.appendChild(el("summary", "", f.question));
            d.appendChild(ph(el("p", "faq__a", f.answer), f));
            list.appendChild(d);
          });
          count.textContent = shown.length
            ? shown.length + (shown.length === 1 ? " question" : " questions")
            : "No questions match your search. Try another word, or contact us and we will help.";
        }
        input.addEventListener("input", function () { state.q = input.value; render(); });
        render();
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  /* ---------- Team ---------- */
  function team() {
    var box = PP.$("[data-team]");
    if (!box) return;
    function person(m) {
      var card = el("article", "person");
      var photo = el("div", "person__photo" + (m.photo && m.photo.src ? "" : " is-empty"));
      if (m.photo && m.photo.src) photo.appendChild(UI.img(m.photo, { width: 480, height: 600 }));
      else photo.appendChild(el("img", "", null, { src: "assets/images/logo-mark.png", alt: "", width: "120", height: "120", loading: "lazy" }));
      card.appendChild(photo);
      var body = el("div", "person__body");
      body.appendChild(ph(el("h3", "person__name", m.name), m));
      if (PP.has(m.role)) body.appendChild(ph(el("p", "person__role", m.role), m));
      if (PP.has(m.bio)) body.appendChild(ph(el("p", "person__bio", m.bio), m));
      var links = el("p", "person__links");
      if (PP.has(m.email) && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.email)) links.appendChild(UI.link("", "Email", "mailto:" + m.email)).setAttribute("aria-label", "Email " + m.name);
      if (isHttp(m.linkedin)) {
        var li = UI.link("", "LinkedIn", m.linkedin); li.target = "_blank"; li.rel = "noopener noreferrer";
        li.setAttribute("aria-label", "LinkedIn profile of " + m.name + " (opens in a new tab)");
        links.appendChild(li);
      }
      if (links.children.length) body.appendChild(links);
      card.appendChild(body);
      return card;
    }
    function go() {
      UI.state(box, "loading");
      PP.loadData("team").then(function (items) {
        PP.clear(box);
        if (!items.length) { UI.state(box, "empty", "Our team profiles will appear here soon."); return; }
        items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        var groups = [], map = {};
        items.forEach(function (m) {
          var d = PP.has(m.department) ? m.department : "Team";
          if (!map[d]) { map[d] = []; groups.push(d); }
          map[d].push(m);
        });
        groups.forEach(function (g) {
          var sec = el("section", "team-group");
          sec.appendChild(el("h3", "team-group__title", g));
          var grid = el("div", "team-grid");
          map[g].forEach(function (m) { grid.appendChild(person(m)); });
          sec.appendChild(grid); box.appendChild(sec);
        });
        showNotice(items);
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  /* ---------- Careers ---------- */
  function careers() {
    var box = PP.$("[data-careers]");
    if (!box) return;
    function chipList(j) {
      var ul = el("ul", "chips job__chips");
      [j.department, j.location, j.type].forEach(function (v) { if (PP.has(v)) ul.appendChild(el("li", "", v)); });
      if (PP.has(j.closing)) ul.appendChild(el("li", "", "Closes " + (/^\d{4}-\d{2}-\d{2}$/.test(j.closing) ? PP.formatDate(j.closing) : j.closing)));
      return ul;
    }
    function listBlock(title, arr) {
      var items = (arr || []).filter(PP.has);
      if (!items.length) return null;
      var d = el("div", "job__col");
      d.appendChild(el("h4", "job__h", title));
      var ul = el("ul", "ticks");
      items.forEach(function (t) { ul.appendChild(el("li", "", t)); });
      d.appendChild(ul);
      return d;
    }
    function job(j) {
      var d = el("details", "job", null, { id: j.id });
      var sum = el("summary", "job__summary");
      var head = el("span", "job__head");
      head.appendChild(ph(el("span", "job__title", j.title), j));
      head.appendChild(chipList(j));
      sum.appendChild(head);
      d.appendChild(sum);
      var body = el("div", "job__body");
      if (PP.has(j.summary)) body.appendChild(ph(el("p", "", j.summary), j));
      var cols = el("div", "job__cols");
      var a = listBlock("Responsibilities", j.responsibilities), b = listBlock("Requirements", j.requirements);
      if (a) cols.appendChild(a); if (b) cols.appendChild(b);
      if (cols.children.length) body.appendChild(cols);
      var row = el("div", "btn-row");
      var subject = "Application: " + j.title + " (" + j.id + ")";
      var msg = "Hello,\n\nI would like to apply for the position \"" + j.title + "\" (ref. " + j.id + ").\n\nName:\nPhone:\n\n(Please attach your CV to this email.)";
      var mail = UI.link("btn btn--dark btn--sm", "Apply by email", PP.mailLink(subject, msg));
      mail.setAttribute("aria-label", "Apply by email for " + j.title);
      row.appendChild(mail);
      var wa = UI.link("btn btn--ghost-dark btn--sm", "", PP.waLink("Hello, I would like to apply for the position \"" + j.title + "\" (ref. " + j.id + "). " + PP.abs("careers.html#" + j.id)));
      wa.target = "_blank"; wa.rel = "noopener noreferrer";
      wa.setAttribute("aria-label", "Apply on WhatsApp for " + j.title + " (opens in a new tab)");
      wa.appendChild(el("span", "icon icon-whatsapp", null, { "aria-hidden": "true" }));
      wa.appendChild(document.createTextNode("WhatsApp"));
      row.appendChild(wa);
      body.appendChild(row);
      body.appendChild(el("p", "job__note", "Email applications should include your CV as an attachment. This website does not receive or store applications."));
      d.appendChild(body);
      return d;
    }
    function go() {
      UI.state(box, "loading");
      PP.loadData("careers").then(function (items) {
        PP.clear(box);
        if (!items.length) {
          UI.state(box, "empty", "There are no open positions at the moment. You are welcome to send us your CV for future opportunities.", [
            UI.link("btn btn--dark btn--sm", "Email your CV", PP.mailLink("General application", "Hello,\n\nPlease find my CV attached.\n"))
          ]);
          return;
        }
        items.sort(function (a, b) { return String(b.posted || "").localeCompare(String(a.posted || "")); });
        var list = el("div", "jobs");
        items.forEach(function (j) { list.appendChild(job(j)); });
        box.appendChild(list);
        showNotice(items);
        var h = (window.location.hash || "").replace("#", "");
        var target = h && PP.$("[id='" + h.replace(/[^\w-]/g, "") + "']", list);
        if (target && target.tagName === "DETAILS") { target.open = true; target.scrollIntoView(); }
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  PP.ready(function () { featured(); services(); newsList(); newsArticle(); faq(); team(); careers(); });
})();
