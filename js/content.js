/* ==========================================================================
   content.js — smaller JSON-driven blocks:
   home featured items, services, news list / article, FAQ.
   Each block opts in with a data attribute on its container.
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el, UI = PP.ui;

  function ph(node, rec) { if (rec.placeholder) node.className += " ph"; return node; }

  /* ---------- Featured properties / projects (home page) ---------- */
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
          if (!items.length) {
            UI.state(box, "empty", "Featured " + kind + " will appear here.");
            return;
          }
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
          var num = el("span", "service__num", (i < 9 ? "0" : "") + (i + 1), { "aria-hidden": "true" });
          if (mode === "full") {
            var row = el("article", "service service--full", null, { id: s.id });
            row.appendChild(num);
            var body = el("div");
            body.appendChild(el("h2", "service__title", s.title));
            body.appendChild(ph(el("p", "", s.description || s.summary), s));
            if (s.cta && s.cta.href) body.appendChild(UI.link("btn btn--dark btn--sm", s.cta.label || "Learn more", s.cta.href));
            row.appendChild(body);
            box.appendChild(row);
          } else {
            var card = el("article", "service");
            card.appendChild(num);
            card.appendChild(el("h3", "", s.title));
            card.appendChild(el("p", "", s.summary || s.description));
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
          media.appendChild(UI.img(n.cover, { fallbackAlt: "" }));
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
        var notice = PP.$("#sample-notice");
        if (notice) notice.hidden = !items.some(function (n) { return n.placeholder; });
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
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
        PP.setMeta({
          title: n.title + " | " + S.brandName, description: summary,
          url: PP.abs("news-details.html?id=" + encodeURIComponent(n.id)),
          image: n.cover && n.cover.src ? PP.abs(n.cover.src) : PP.abs("assets/images/hero.jpg")
        });
        PP.clear(box);
        if (n.placeholder) box.appendChild(el("p", "notice", "Sample article. Replace this content with real company news."));
        if (n.cover && n.cover.src) {
          var fig = el("figure", "article__cover");
          fig.appendChild(UI.img(n.cover, { width: 1200, height: 600, lazy: false }));
          box.appendChild(fig);
        }
        var prose = el("div", "prose");
        (n.content || []).forEach(function (line) {
          if (typeof line !== "string") return;
          if (line.indexOf("## ") === 0) prose.appendChild(el("h2", "", line.slice(3)));
          else prose.appendChild(el("p", "", line));
        });
        box.appendChild(prose);
        var back = el("p", "article__back");
        back.appendChild(UI.link("btn btn--ghost-dark btn--sm", "Back to all articles", "news.html"));
        box.appendChild(back);
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  /* ---------- FAQ ---------- */
  function faq() {
    var box = PP.$("[data-faq]");
    if (!box) return;
    function go() {
      UI.state(box, "loading");
      PP.loadData("faqs").then(function (items) {
        PP.clear(box);
        if (!items.length) { UI.state(box, "empty", "Frequently asked questions will appear here."); return; }
        items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        items.forEach(function (f) {
          var d = el("details", "faq");
          d.appendChild(el("summary", "", f.question));
          d.appendChild(ph(el("p", "faq__a", f.answer), f));
          box.appendChild(d);
        });
      }).catch(function (err) { UI.dataError(box, err, go); });
    }
    go();
  }

  PP.ready(function () { featured(); services(); newsList(); newsArticle(); faq(); });
})();
