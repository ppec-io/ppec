/* Home page: featured properties, featured projects and the services overview.
   Services cards are also used on services.html (data-services="full") by services.js. */
(function () {
  "use strict";
  var P = window.PPEC;

  document.addEventListener("DOMContentLoaded", function () {
    featured('[data-home="properties"]', "properties", "property");
    featured('[data-home="projects"]', "projects", "project");
    services();
  });

  function featured(sel, file, kind) {
    var box = P.$(sel);
    if (!box) return;
    var section = box.closest("section");
    var light = box.getAttribute("data-card-style") === "light";
    function run() {
      P.ui.skeletons(box, 3);
      Promise.all([P.data.published(file), P.data.taxonomy()])
        .then(function (r) {
          var list = r[0].filter(function (x) { return x.featured; })
            .sort(function (a, b) { return (b.dateAdded || "").localeCompare(a.dateAdded || ""); })
            .slice(0, 3);
          P.clear(box);
          box.removeAttribute("aria-busy");
          if (!list.length) { section.hidden = true; return; }       // nothing featured: hide the whole section
          list.forEach(function (x) { box.appendChild(P.ui.card(x, kind, { tax: r[1], light: light })); });
        })
        .catch(function (err) {
          console.error(err);
          P.clear(box);
          box.removeAttribute("aria-busy");
          box.appendChild(P.ui.error("We could not load this section right now.", run));
        });
    }
    run();
  }

  function services() {
    var box = P.$('[data-services="cards"]');
    if (!box) return;
    P.data.published("services")
      .then(function (list) {
        list.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        list.forEach(function (s, i) { box.appendChild(P.ui.serviceCard(s, i)); });
        if (!list.length) box.closest("section").hidden = true;
      })
      .catch(function (err) { console.error(err); box.appendChild(P.ui.error("We could not load our services right now.")); });
  }
})();
