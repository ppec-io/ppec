/* ==========================================================================
   SITE SETTINGS — edit this file to update details across ALL pages.
   Every phone number, email, address, WhatsApp link, map, web address and
   social link on the website is filled in from the values below.
   ========================================================================== */
window.SITE = {
  // Names
  brandName: "Platinum Properties, Estates & Constructions", // name shown in the logo / page titles
  legalName: "Platinum Properties Estates and Constructions Company Limited", // company name used in the footer, privacy policy, etc.

  // Public web address of the website, WITH a trailing slash.
  // Used for links that must be complete web addresses (WhatsApp/email enquiries, share previews).
  // If the site moves (for example to a custom domain), change it here and see README, "Changing the web address".
  siteUrl: "https://ppec-io.github.io/ppec/",

  // Phone
  phoneDisplay: "+233 59 976 2750", // how the number is shown on screen
  phoneTel: "+233599762750",        // used for tap-to-call links (digits with country code)

  // WhatsApp: country code + number, digits only (no + or spaces)
  whatsappNumber: "233599762750",
  whatsappMessage: "Hello, I would like to make an enquiry.",

  // Email (the enquiry form opens the visitor's email app addressed to this)
  email: "info@platinumestatesconstructions.com",

  // Office address (one array item per line)
  addressLines: ["EX72 Bissau St", "Ofinso, Ashanti", "Ghana"],

  // Text used to find the office on Google Maps.
  // Tip: replace with a more precise query, the Ghana Post GPS code, or exact place name once verified.
  mapQuery: "EX72 Bissau St, Ofinso, Ashanti, Ghana",

  // Catalogue settings
  pageSize: 6,        // how many properties/projects to show before "Show more"
  currencyDefault: "GHS",

  // Social media — leave "" until real accounts exist. Only non-empty links are shown.
  social: {
    Facebook: "",
    Instagram: "",
    LinkedIn: "",
    X: "",
    TikTok: ""
  }
};

/* ---- Automatic: do not edit below this line ---------------------------------
   SITE.root = the folder this website is actually being served from (for example
   https://ppec-io.github.io/ppec/ or http://localhost:8000/). All data, image and
   page links are built from it, so the site works under the /ppec/ sub-path and
   from any nested address (such as the custom 404 page). */
(function () {
  var src = document.currentScript && document.currentScript.src;
  window.SITE.root = src
    ? src.replace(/js\/config\.js(\?.*)?$/, "")
    : new URL("./", window.location.href).href;
})();
