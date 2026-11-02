/* ==========================================================================
   calculator.js — calculator.html: monthly repayment and "what can I afford".
   Everything runs in the browser; nothing is stored or sent. Example figures
   come from SITE.calculator in js/config.js (they are NOT lender rates).
   ========================================================================== */
(function () {
  "use strict";

  var PP = window.PP, S = PP.S, el = PP.el;
  var root = PP.$("[data-calculator]");
  if (!root) return;

  var C = S.calculator || {};
  var MAX_TERM = Number(C.maxTermYears) || 30;
  var f = {};
  ["price", "deposit", "rate", "term", "income", "debts", "saved"].forEach(function (k) { f[k] = PP.$("#c-" + k); });
  var out = {};
  ["monthly", "loan", "depamt", "interest", "total", "bar", "barp", "bari", "sched", "schedbody", "main", "note", "amax", "aloan", "aprice", "anote", "using"].forEach(function (k) { out[k] = PP.$("#o-" + k); });

  function num(input) {
    var raw = String(input.value || "").replace(/[,\s]/g, "");
    if (raw === "") return NaN;
    if (!/^\d*\.?\d+$/.test(raw)) return NaN;
    return parseFloat(raw);
  }
  function money(n) { return PP.formatPrice(Math.round(n)); }
  function setErr(input, msg) {
    var wrap = input.closest(".field"), err = PP.$(".field__error", wrap);
    wrap.classList.toggle("has-error", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg || "";
    return !msg;
  }

  /* Monthly payment for a loan (standard amortisation). r = monthly rate (decimal), n = months */
  function payment(L, r, n) { return r === 0 ? L / n : L * r / (1 - Math.pow(1 + r, -n)); }
  function presentValue(P, r, n) { return r === 0 ? P * n : P * (1 - Math.pow(1 + r, -n)) / r; }

  function terms() {
    var okR = true, okT = true;
    var rate = num(f.rate), term = num(f.term);
    okR = setErr(f.rate, isNaN(rate) ? "Enter a rate, for example 20." : (rate < 0 || rate > 100 ? "Enter a rate between 0 and 100." : ""));
    okT = setErr(f.term, isNaN(term) ? "Enter the number of years." : (term < 1 || term > MAX_TERM || Math.round(term) !== term ? "Enter whole years from 1 to " + MAX_TERM + "." : ""));
    return okR && okT ? { r: rate / 100 / 12, n: term * 12, years: term } : null;
  }

  function showRepayment() {
    var t = terms();
    var price = num(f.price), dep = num(f.deposit);
    var okP = setErr(f.price, f.price.value.trim() === "" ? "" : (isNaN(price) || price <= 0 || price > 1e11 ? "Enter the price as a number, for example 850000." : ""));
    var okD = setErr(f.deposit, isNaN(dep) || dep < 0 || dep >= 100 ? "Enter a deposit from 0 to 99.9%." : "");
    out.main.hidden = true; out.note.hidden = false;
    if (!t || !okP || !okD) { out.note.textContent = "Check the highlighted fields."; return; }
    if (isNaN(price)) { out.note.textContent = "Enter a property price to see the monthly repayment."; return; }
    var deposit = price * dep / 100, loan = price - deposit;
    var m = payment(loan, t.r, t.n), total = m * t.n, interest = total - loan;
    out.note.hidden = true; out.main.hidden = false;
    out.monthly.textContent = money(m);
    out.loan.textContent = money(loan);
    out.depamt.textContent = money(deposit);
    out.interest.textContent = money(interest);
    out.total.textContent = money(total);
    var ip = total > 0 ? Math.round(interest / total * 100) : 0;
    out.barp.style.width = (100 - ip) + "%"; out.bari.style.width = ip + "%";
    out.bar.setAttribute("aria-label", "About " + (100 - ip) + "% of what you repay is the loan itself and " + ip + "% is interest");
    // yearly summary
    PP.clear(out.schedbody);
    var bal = loan;
    for (var y = 1; y <= t.years; y++) {
      var iY = 0, pY = 0;
      for (var k = 0; k < 12; k++) { var i = bal * t.r; var p = m - i; iY += i; pY += p; bal -= p; }
      var tr = el("tr");
      [String(y), money(pY), money(iY), money(Math.max(bal, 0))].forEach(function (v, c) { tr.appendChild(el(c === 0 ? "th" : "td", "", v, c === 0 ? { scope: "row" } : null)); });
      out.schedbody.appendChild(tr);
    }
  }

  function showAfford() {
    var t = terms();
    var inc = num(f.income), debts = f.debts.value.trim() === "" ? 0 : num(f.debts), saved = f.saved.value.trim() === "" ? 0 : num(f.saved);
    var share = Number(C.maxPaymentSharePct) || 35;
    var okI = setErr(f.income, f.income.value.trim() === "" ? "" : (isNaN(inc) || inc <= 0 ? "Enter your monthly income as a number." : ""));
    var okB = setErr(f.debts, isNaN(debts) || debts < 0 ? "Enter a number, or leave empty." : "");
    var okS = setErr(f.saved, isNaN(saved) || saved < 0 ? "Enter a number, or leave empty." : "");
    out.amax.hidden = true; out.anote.hidden = false;
    if (!t || !okI || !okB || !okS) { out.anote.textContent = "Check the highlighted fields."; return; }
    if (isNaN(inc)) { out.anote.textContent = "Enter your monthly income to see an estimate."; return; }
    var maxPay = inc * share / 100 - debts;
    if (maxPay <= 0) { out.amax.hidden = true; out.anote.hidden = false; out.anote.textContent = "With these figures there is no room for a new repayment at the example limit of " + share + "% of income."; return; }
    var loan = presentValue(maxPay, t.r, t.n);
    out.anote.hidden = true; out.amax.hidden = false;
    out.aloan.textContent = money(loan);
    out.aprice.textContent = money(loan + saved);
    PP.$("#o-apay").textContent = money(maxPay);
    PP.$("#o-ashare").textContent = String(share) + "%";
  }

  function all() { showRepayment(); showAfford(); }

  function init() {
    f.rate.value = C.defaultRate != null ? C.defaultRate : "";
    f.term.value = C.defaultTermYears != null ? C.defaultTermYears : "";
    f.deposit.value = C.defaultDepositPct != null ? C.defaultDepositPct : "";
    var ex = PP.$("#calc-example");
    if (ex) ex.hidden = C.rateIsExample === false;
    var q = PP.params(), p0 = q.get("price");
    if (PP.has(p0) && /^\d{1,12}(\.\d+)?$/.test(p0)) f.price.value = p0;
    PP.$$("input", root).forEach(function (i) { i.addEventListener("input", all); });
    PP.$("#calc-form", root).addEventListener("submit", function (e) { e.preventDefault(); all(); });
    all();
    var id = q.get("id");
    if (PP.has(id) && /^[\w-]{1,60}$/.test(id)) {
      PP.loadData("properties").then(function (list) {
        var r = PP.findById(list, id);
        if (!r) return;
        out.using.hidden = false;
        out.using.textContent = "";
        out.using.appendChild(document.createTextNode("Property: "));
        out.using.appendChild(el("a", "", r.name, { href: PP.detailUrl("property", r.id) }));
        if (typeof r.price === "number") { f.price.value = String(r.price); all(); }
        else out.using.appendChild(document.createTextNode(". The price is on enquiry, so please enter an amount to test."));
      }).catch(function () { /* page still works without the property */ });
    }
  }

  PP.ready(init);
})();
