/* Services page: each service from data/services.json with an enquiry link. */
(function () {
  "use strict";
  var P = window.PPEC;

  document.addEventListener("DOMContentLoaded", function () {
    var box = P.$('[data-services="full"]');
    if (!box) return;
    function run() {
      P.clear(box);
      box.appendChild(P.ui.loading("Loading services…"));
      P.data.published("services")
        .then(function (list) {
          list.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
          P.clear(box);
          if (!list.length) { box.appendChild(P.ui.empty("Our services will be listed here shortly.")); return; }
          list.forEach(function (s, i) {
            var art = P.el("article", "svc reveal", null, { id: s.id });
            art.appendChild(P.el("span", "svc__num", String(i + 1).padStart(2, "0"), { "aria-hidden": "true" }));
            var body = P.el("div", "svc__body");
            body.appendChild(P.el("h2", "", s.title));
            if (s.summary) body.appendChild(P.el("p", "svc__summary", s.summary));
            P.richText(body, s.description);
            var enq = P.enquiry.forRecord("service", s);
            var row = P.el("div", "btn-row");
            row.appendChild(P.el("a", "btn btn--dark btn--sm", "Enquire about this service", { href: P.pageUrl("contact.html", { service: s.id }) + "#enquiry" }));
            var wa = P.el("a", "btn btn--ghost-dark btn--sm", null, { href: enq.whatsapp, target: "_blank", rel: "noopener noreferrer", "aria-label": "Ask about " + s.title + " on WhatsApp (opens in a new tab)" });
            wa.appendChild(P.icon("whatsapp")); wa.appendChild(document.createTextNode("WhatsApp"));
            row.appendChild(wa);
            body.appendChild(row);
            art.appendChild(body);
            box.appendChild(art);
          });
          P.reveal(box);
          // Scroll to a service named in the address, e.g. services.html#land-and-property-sales
          if (window.location.hash) {
            var t = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
            if (t) t.scrollIntoView();
          }
        })
        .catch(function (err) {
          console.error(err);
          P.clear(box);
          box.appendChild(P.ui.error("We could not load our services right now.", run));
        });
    }
    run();
  });
})();
