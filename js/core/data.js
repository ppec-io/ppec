/* Data loader: reads the JSON files in /data. Only PUBLISHED records are ever returned. */
(function () {
  "use strict";
  var P = window.PPEC;
  var cache = {};

  function load(name) {
    if (!cache[name]) {
      cache[name] = fetch(P.asset("data/" + name + ".json"))
        .then(function (r) {
          if (!r.ok) throw new Error("Could not load data/" + name + ".json (HTTP " + r.status + ")");
          return r.json();
        })
        .catch(function (err) {
          delete cache[name];            // allow a retry
          if (window.location.protocol === "file:") {
            console.warn("Data files cannot be loaded from file://. Serve the folder with a local web server, e.g. `python3 -m http.server`.");
          }
          throw err;
        });
    }
    return cache[name];
  }

  P.data = {
    load: load,
    // Published records only; a record without status "published" is treated as a draft.
    published: function (name) {
      return load(name).then(function (list) {
        if (!Array.isArray(list)) throw new Error("data/" + name + ".json must be a list of records");
        return list.filter(function (r) {
          return r && typeof r === "object" && typeof r.id === "string" && r.status === "published";
        });
      });
    },
    taxonomy: function () {
      return load("taxonomy").catch(function () { return {}; });   // labels fall back to prettified ids
    },
    byId: function (list, id) {
      return list.filter(function (r) { return r.id === id; })[0] || null;
    }
  };
})();
