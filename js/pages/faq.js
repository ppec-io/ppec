/* FAQ: grouped by category, using native <details> so it works with the keyboard and screen readers. */
(function () {
  "use strict";
  var P = window.PPEC;

  document.addEventListener("DOMContentLoaded", function () {
    var host = P.$("#faq-list");
    if (!host) return;
    function run() {
      P.clear(host);
      host.appendChild(P.ui.loading("Loading questions…"));
      Promise.all([P.data.published("faqs"), P.data.taxonomy()])
        .then(function (r) {
          var list = r[0], tax = r[1];
          P.clear(host);
          if (!list.length) { host.appendChild(P.ui.empty("Frequently asked questions will be added here soon. In the meantime, please contact us.")); return; }
          var order = (tax.faqCategories || []).map(function (c) { return c.id; });
          var cats = [];
          list.forEach(function (f) { if (cats.indexOf(f.category) === -1) cats.push(f.category); });
          cats.sort(function (a, b) {
            var x = order.indexOf(a), y = order.indexOf(b);
            return (x < 0 ? 99 : x) - (y < 0 ? 99 : y);
          });
          cats.forEach(function (c) {
            var sec = P.el("section", "faq-group");
            sec.appendChild(P.el("h2", "", P.label(tax.faqCategories, c)));
            list.filter(function (f) { return f.category === c; }).forEach(function (f) {
              var d = P.el("details", "faq" + (f.placeholder ? " ph" : ""), null, { id: f.id });
              d.appendChild(P.el("summary", "", f.question));
              var ans = P.el("div", "faq__a");
              P.richText(ans, f.answer);
              d.appendChild(ans);
              sec.appendChild(d);
            });
            host.appendChild(sec);
          });
          if (window.location.hash) {            // open a question named in the address
            var t = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
            if (t && t.tagName === "DETAILS") { t.open = true; t.scrollIntoView(); }
          }
        })
        .catch(function (err) {
          console.error(err);
          P.clear(host);
          host.appendChild(P.ui.error("We could not load the questions right now.", run));
        });
    }
    run();
  });
})();
