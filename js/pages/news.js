/* News and Insights: list (news.html) and single article (news-details.html). */
(function () {
  "use strict";
  var P = window.PPEC;
  var PAGE = 9;

  document.addEventListener("DOMContentLoaded", function () {
    var root = P.$("[data-news]");
    if (!root) return;
    if (root.getAttribute("data-news") === "detail") detail(); else list();
  });

  function byDate(a, b) { return (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title); }

  function list() {
    var grid = P.$("#news-grid"), chips = P.$("#news-filters"), moreWrap = P.$("#news-more-wrap"), more = P.$("#news-more");
    var all = [], tax = {}, cat = "", shown = PAGE;

    function run() {
      P.ui.skeletons(grid, 3);
      Promise.all([P.data.published("news"), P.data.taxonomy()])
        .then(function (r) { all = r[0].sort(byDate); tax = r[1]; buildChips(); render(); })
        .catch(function (err) {
          console.error(err);
          P.clear(grid); grid.removeAttribute("aria-busy");
          grid.appendChild(P.ui.error("We could not load the news right now.", run));
        });
    }
    function buildChips() {
      P.clear(chips);
      var used = {};
      all.forEach(function (a) { used[a.category] = true; });
      var opts = [{ id: "", label: "All" }];
      (tax.newsCategories || []).forEach(function (c) { if (used[c.id]) opts.push(c); });
      chips.hidden = opts.length < 3;
      opts.forEach(function (o) {
        var b = P.el("button", "chip", o.label, { type: "button", "aria-pressed": String(o.id === cat) });
        b.addEventListener("click", function () {
          cat = o.id; shown = PAGE;
          P.$$(".chip", chips).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          render();
        });
        chips.appendChild(b);
      });
    }
    function render() {
      var items = all.filter(function (a) { return !cat || a.category === cat; });
      P.clear(grid); grid.removeAttribute("aria-busy");
      if (!items.length) { grid.appendChild(P.ui.empty(all.length ? "No articles in this category yet." : "No articles have been published yet. Please check back soon.")); }
      items.slice(0, shown).forEach(function (a) { grid.appendChild(P.ui.newsCard(a, tax, true)); });
      var left = Math.max(0, items.length - shown);
      moreWrap.hidden = left === 0;
      more.textContent = "Show more (" + left + " more)";
    }
    more.addEventListener("click", function () { shown += PAGE; render(); });
    run();
  }

  function detail() {
    var host = P.$("#article");
    var titleEl = P.$("#article-title"), subEl = P.$("#article-sub"), crumb = P.$("#crumb-current");
    var id = new URLSearchParams(window.location.search).get("id");
    if (!id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) { missing(); return; }

    function run() {
      P.clear(host);
      host.appendChild(P.ui.loading("Loading article…"));
      Promise.all([P.data.published("news"), P.data.taxonomy()])
        .then(function (r) {
          var a = P.data.byId(r[0], id);
          if (!a) { missing(); return; }
          render(a, r[0], r[1]);
        })
        .catch(function (err) {
          console.error(err);
          P.clear(host);
          host.appendChild(P.ui.error("We could not load this article right now.", run));
        });
    }
    function missing() {
      titleEl.textContent = "This article could not be found";
      subEl.textContent = "The link may be out of date, or the article is no longer published.";
      if (crumb) crumb.textContent = "Not found";
      P.setPageMeta({ title: "Article not found", noindex: true });
      P.clear(host);
      var box = P.el("div", "state state--empty");
      box.appendChild(P.el("p", "", "You can read our latest news and insights on the news page."));
      box.appendChild(P.el("a", "btn btn--dark", "Go to News and Insights", { href: P.pageUrl("news.html") }));
      host.appendChild(box);
    }
    function render(a, list, tax) {
      var cat = P.label(tax.newsCategories, a.category);
      var date = a.placeholder ? "" : P.formatDate(a.date);
      titleEl.textContent = a.title;
      subEl.textContent = [cat, date].filter(Boolean).join(" · ");
      if (crumb) crumb.textContent = a.title;
      P.setPageMeta({
        title: a.title, description: a.summary, image: a.cover && a.cover.src,
        url: P.publicUrl("news-details.html", { id: a.id }), noindex: !!a.placeholder
      });
      P.clear(host);
      var art = P.el("article", "article");
      if (a.cover && a.cover.src) {
        var fig = P.el("figure", "article__cover");
        fig.appendChild(P.el("img", "", null, { src: P.asset(a.cover.src), alt: a.cover.alt || "", width: 1200, height: 675, decoding: "async", fetchpriority: "high" }));
        if (a.cover.caption) fig.appendChild(P.el("figcaption", "", a.cover.caption));
        art.appendChild(fig);
      }
      var body = P.richText(P.el("div", "prose"), a.content);
      if (a.placeholder) art.appendChild(P.el("p", "notice", "This is a sample article. Its text will be replaced with the company's own news."));
      art.appendChild(body);
      host.appendChild(art);

      var others = list.filter(function (x) { return x.id !== a.id; }).sort(byDate).slice(0, 3);
      if (others.length) {
        var sec = P.el("section", "detail__related", null, { "aria-labelledby": "more-title" });
        sec.appendChild(P.el("h2", "", "More from News and Insights", { id: "more-title" }));
        var g = P.el("div", "grid grid--3");
        others.forEach(function (o) { g.appendChild(P.ui.newsCard(o, tax, true)); });
        sec.appendChild(g);
        host.appendChild(sec);
      }
    }
    run();
  }
})();
