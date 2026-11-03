/* ==========================================================================
   SITE SETTINGS — edit this file to update contact details across ALL pages.
   Every phone number, email, address, WhatsApp link, map and social link
   on the website is filled in from the values below.
   ========================================================================== */
window.SITE = {
  // Names
  brandName: "Platinum Properties Estates & Constructions", // name shown in the logo / page titles
  legalName: "Platinum Properties Estates & Constructions Company Limited", // registered company name (footer & About page)

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

  // ------------------------------------------------------------------
  // Website settings (added for the property / project catalogue)
  // ------------------------------------------------------------------

  // Public address of the website, WITH a trailing slash. This is the single place that
  // defines the base path (GitHub Pages serves this site under /ppec/). It is used for
  // links inside WhatsApp / email messages, canonical URLs and the sitemap.
  // If you move to a custom domain, change this one value (and run tools/validate-data.js --sitemap).
  siteUrl: "https://ppec-io.github.io/ppec/",

  // Folder holding the JSON content files, relative to each page.
  dataPath: "data/",

  // Currency for all prices in data/properties.json (ISO code). Prices are plain numbers.
  currency: "GHS",

  // Number of items shown before "Show more" on the catalogue pages.
  pageSize: 9,

  // Categories and statuses. Keys must match the values used in the JSON files.
  taxonomy: {
    propertyCategories: [
      { key: "residential", label: "Residential Houses" },
      { key: "apartments",  label: "Apartments" },
      { key: "land",        label: "Land and Plots" },
      { key: "commercial",  label: "Commercial Properties" },
      { key: "luxury",      label: "Luxury Properties" },
      { key: "estate",      label: "Estate Properties" }
    ],
    availability: [
      { key: "available", label: "Available" },
      { key: "reserved",  label: "Reserved" },
      { key: "sold",      label: "Sold" },
      { key: "tbc",       label: "To be confirmed" }
    ],
    projectCategories: [
      { key: "residential",       label: "Residential Developments" },
      { key: "estate",            label: "Estate Developments" },
      { key: "commercial",        label: "Commercial Developments" },
      { key: "construction",      label: "Construction Projects" },
      { key: "infrastructure",    label: "Infrastructure Projects" },
      { key: "land-development",  label: "Land Development" }
    ],
    projectStatuses: [
      { key: "planning",  label: "Planning" },
      { key: "upcoming",  label: "Upcoming" },
      { key: "ongoing",   label: "Ongoing" },
      { key: "completed", label: "Completed" },
      { key: "on-hold",   label: "On Hold" }
    ],
    galleryCategories: [
      { key: "property",     label: "Properties" },
      { key: "construction", label: "Construction" },
      { key: "estate",       label: "Estates" },
      { key: "render",       label: "Architectural Renders" },
      { key: "completed",    label: "Completed Projects" }
    ]
  },

  // ------------------------------------------------------------------
  // Online enquiry form (optional, no server of your own needed)
  // ------------------------------------------------------------------
  // Paste the HTTPS address given by a form service such as Formspree
  // (looks like https://formspree.io/f/xxxxxxxx). While this is "", the enquiry form
  // opens the visitor's email app / WhatsApp instead, exactly as before.
  // Do NOT use Netlify Forms here: it only works when the site is hosted on Netlify.
  forms: {
    endpoint: "https://formspree.io/f/mpppogdp",
    providerName: "Formspree"   // shown to visitors, e.g. "Formspree"
  },

  // ------------------------------------------------------------------
  // Mortgage / affordability calculator (calculator.html)
  // ------------------------------------------------------------------
  // These numbers are EXAMPLES chosen by the website team, not lender rates.
  // Replace them with figures the company has confirmed, then set rateIsExample to false.
  calculator: {
    defaultRate: 20,            // example interest rate, % per year
    defaultTermYears: 15,
    defaultDepositPct: 20,
    maxPaymentSharePct: 35,     // example share of monthly income a lender may allow for repayments
    maxTermYears: 30,
    rateIsExample: true
  },

  // Social media — leave "" until real accounts exist. Only non-empty links are shown.
  social: {
    Facebook: "",
    Instagram: "",
    LinkedIn: "",
    X: "",
    TikTok: ""
  }
};
