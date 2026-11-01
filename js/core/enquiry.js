/* Enquiry links: WhatsApp, telephone and email. No form data is ever sent by this site. */
(function () {
  "use strict";
  var P = window.PPEC;
  var S = window.SITE || {};

  var KIND = {
    property: { noun: "property", page: "property-details.html" },
    project: { noun: "project", page: "project-details.html" },
    service: { noun: "service", page: "services.html" }
  };

  function whatsapp(text) {
    if (!S.whatsappNumber) return "";
    return "https://wa.me/" + encodeURIComponent(S.whatsappNumber) + "?text=" + encodeURIComponent(text || S.whatsappMessage || "");
  }
  function mailto(subject, body) {
    if (!S.email) return "";
    return "mailto:" + S.email + "?subject=" + encodeURIComponent(subject || "") + "&body=" + encodeURIComponent(body || "");
  }
  function tel() { return S.phoneTel ? "tel:" + S.phoneTel : ""; }

  // Enquiry for one property / project / service. The message names it and includes the web address of its page.
  function forRecord(kind, rec) {
    var k = KIND[kind];
    var url = kind === "service"
      ? P.publicUrl(k.page) + "#" + encodeURIComponent(rec.id)
      : P.publicUrl(k.page, { id: rec.id });
    var where = rec.location && kind !== "service" ? " (" + rec.location + ")" : "";
    var text = "Hello, I would like to enquire about the " + k.noun + ' "' + rec.title + '"' + where + ".\n" + url;
    return {
      url: url,
      text: text,
      whatsapp: whatsapp(text),
      mailto: mailto("Enquiry: " + rec.title, "Hello,\n\nI would like to enquire about the " + k.noun + ' "' + rec.title + '"' + where + ".\n" + url + "\n\nMy name:\nMy phone number:\n\nThank you."),
      tel: tel()
    };
  }
  function general() {
    var text = (S.whatsappMessage || "Hello, I would like to make an enquiry.") + "\n" + P.publicUrl("");
    return { text: text, whatsapp: whatsapp(text), mailto: mailto("Website enquiry", "Hello,\n\nI would like to make an enquiry.\n\n" + P.publicUrl("") + "\n\nMy name:\n"), tel: tel() };
  }

  P.enquiry = { whatsapp: whatsapp, mailto: mailto, tel: tel, forRecord: forRecord, general: general };
})();
