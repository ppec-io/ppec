/* Accessible image viewer built on the native <dialog> element. */
(function () {
  "use strict";
  var P = window.PPEC;
  var dlg, img, cap, count, prevB, nextB;
  var items = [], idx = 0;

  function build() {
    if (dlg) return;
    dlg = P.el("dialog", "lightbox", null, { "aria-label": "Image viewer" });
    var close = P.el("button", "lightbox__btn lightbox__close", "×", { type: "button", "aria-label": "Close image viewer" });
    prevB = P.el("button", "lightbox__btn lightbox__prev", "‹", { type: "button", "aria-label": "Previous image" });
    nextB = P.el("button", "lightbox__btn lightbox__next", "›", { type: "button", "aria-label": "Next image" });
    var fig = P.el("figure", "lightbox__figure");
    img = P.el("img", "lightbox__img");
    cap = P.el("figcaption", "lightbox__cap");
    count = P.el("p", "lightbox__count", null, { "aria-live": "polite" });
    fig.appendChild(img); fig.appendChild(cap);
    [close, prevB, fig, nextB, count].forEach(function (n) { dlg.appendChild(n); });
    document.body.appendChild(dlg);

    close.addEventListener("click", function () { dlg.close(); });
    prevB.addEventListener("click", function () { show(idx - 1); });
    nextB.addEventListener("click", function () { show(idx + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });  // click on backdrop
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
    });
    dlg.addEventListener("close", function () { document.documentElement.classList.remove("lb-open"); });
  }

  function show(i) {
    if (!items.length) return;
    idx = (i + items.length) % items.length;
    var it = items[idx];
    img.src = P.asset(it.src);
    img.alt = it.alt || "";
    cap.textContent = it.caption || it.title || "";
    cap.hidden = !cap.textContent;
    count.textContent = items.length > 1 ? (idx + 1) + " of " + items.length : "";
    prevB.hidden = nextB.hidden = items.length < 2;
    [idx - 1, idx + 1].forEach(function (n) {          // preload neighbours
      var nb = items[(n + items.length) % items.length];
      if (nb && nb !== it) { var pre = new Image(); pre.src = P.asset(nb.src); }
    });
  }

  P.lightbox = {
    open: function (list, index) {
      if (!list || !list.length) return;
      build();
      items = list;
      show(index || 0);
      document.documentElement.classList.add("lb-open");
      if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); }
      else dlg.setAttribute("open", "");
    }
  };
})();
