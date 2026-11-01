/* Contact page: enquiry form that opens the visitor's email app or WhatsApp.
   There is no server: nothing is stored or submitted by this website. */
(function () {
  "use strict";
  var P = window.PPEC;
  var S = window.SITE || {};

  document.addEventListener("DOMContentLoaded", function () {
    var form = P.$("#enquiry-form");
    if (!form) return;

    var f = { name: form.elements.name, phone: form.elements.phone, email: form.elements.email, interest: form.elements.interest, message: form.elements.message };
    var status = P.$("#form-status");
    var targets = {};      // option value -> { kind, rec }

    function safe(file) { return P.data.published(file).catch(function () { return []; }); }   // the form still works if a data file fails

    Promise.all([safe("services"), safe("properties"), safe("projects")]).then(function (r) {
      addGroup("Services", "service", r[0].sort(function (a, b) { return (a.order || 0) - (b.order || 0); }));
      addGroup("Properties", "property", r[1]);
      addGroup("Projects", "project", r[2]);
      prefill(r[1], r[2]);
    });

    function addGroup(label, kind, list) {
      if (!list.length) return;
      var g = P.el("optgroup", "", null, { label: label });
      list.forEach(function (rec) {
        var value = kind + ":" + rec.id;
        g.appendChild(P.el("option", "", rec.title, { value: value }));
        targets[value] = { kind: kind, rec: rec };
      });
      f.interest.appendChild(g);
    }

    // Arriving from a property, project or service: contact.html?property=ID  ?project=ID  ?service=ID  (older ?enquiry=ID links still work)
    function prefill(props, projs) {
      var qs = new URLSearchParams(window.location.search);
      var value = "";
      if (qs.get("property")) value = "property:" + qs.get("property");
      else if (qs.get("project")) value = "project:" + qs.get("project");
      else if (qs.get("service")) value = "service:" + qs.get("service");
      else if (qs.get("enquiry")) {
        var id = qs.get("enquiry");
        if (P.data.byId(props, id)) value = "property:" + id;
        else if (P.data.byId(projs, id)) value = "project:" + id;
      }
      var t = targets[value];
      if (!t) return;
      f.interest.value = value;
      if (!f.message.value) {
        var noun = t.kind === "service" ? "your service" : "the " + t.kind;
        f.message.value = "Hello, I would like to know more about " + noun + ' "' + t.rec.title + '".';
      }
    }

    function interest() {
      var v = f.interest.value;
      if (targets[v]) return { label: targets[v].rec.title, t: targets[v] };
      return { label: "General enquiry", t: null };
    }
    function setError(field, msg) {
      var wrap = field.closest(".field");
      var err = P.$(".field__error", wrap);
      wrap.classList.toggle("has-error", !!msg);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
      return !msg;
    }
    function validate() {
      var ok = true;
      var name = f.name.value.trim(), email = f.email.value.trim(), phone = f.phone.value.trim(), msg = f.message.value.trim();
      ok = setError(f.name, name.length < 2 ? "Please enter your name." : "") && ok;
      var emailBad = email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      var phoneBad = phone && phone.replace(/\D/g, "").length < 7;
      ok = setError(f.email, emailBad ? "Please enter a valid email address." : "") && ok;
      ok = setError(f.phone, phoneBad ? "Please enter a valid phone number." : "") && ok;
      if (!email && !phone) ok = setError(f.email, "Please give an email address or a phone number so we can reply.") && ok;
      ok = setError(f.message, msg.length < 10 ? "Please write a short message (at least 10 characters)." : "") && ok;
      if (!ok) {
        var first = P.$(".has-error input, .has-error textarea, .has-error select", form);
        if (first) first.focus();
      }
      return ok;
    }
    function summary() {
      var it = interest();
      var lines = ["Name: " + f.name.value.trim()];
      if (f.phone.value.trim()) lines.push("Phone: " + f.phone.value.trim());
      if (f.email.value.trim()) lines.push("Email: " + f.email.value.trim());
      lines.push("Interested in: " + it.label);
      if (it.t) lines.push("Page: " + P.enquiry.forRecord(it.t.kind, it.t.rec).url);
      lines.push("", f.message.value.trim());
      return lines.join("\n");
    }
    function say(msg, ok) { status.textContent = msg; status.className = "form__status " + (ok ? "is-ok" : "is-err"); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) { say("Please correct the highlighted fields.", false); return; }
      var subject = "Website enquiry: " + interest().label + " — " + f.name.value.trim();
      say("Opening your email app… If nothing opens, please email us directly at " + S.email + ".", true);
      window.location.href = P.enquiry.mailto(subject, summary());
    });
    var wa = P.$("#send-whatsapp");
    if (wa) wa.addEventListener("click", function () {
      if (!validate()) { say("Please correct the highlighted fields.", false); return; }
      say("Opening WhatsApp…", true);
      window.open(P.enquiry.whatsapp(summary()), "_blank", "noopener");
    });
  });
})();
