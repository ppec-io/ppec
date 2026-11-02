# Platinum Properties Estates & Constructions: Website

A fast, elegant, fully responsive static website for a Ghanaian real estate and construction company, with a searchable property catalogue, a separate project portfolio, detail pages, gallery, news and FAQ.

**Pure HTML, CSS and vanilla JavaScript. No framework, no backend, no database, no build step.** Fonts and icons are self-hosted. Content lives in plain JSON files. Hosted on GitHub Pages at <https://ppec-io.github.io/ppec/>.

| Page | File | Content comes from |
|---|---|---|
| Home | `index.html` | `data/properties.json`, `projects.json`, `services.json` |
| About Us | `about.html` | the HTML file |
| Properties (catalogue) | `properties.html` | `data/properties.json` |
| Property detail | `property-details.html?id=property-001` | `data/properties.json` |
| Projects (catalogue) | `projects.html` | `data/projects.json` |
| Project detail | `project-details.html?id=project-001` | `data/projects.json` |
| Services | `services.html` | `data/services.json` |
| Gallery | `gallery.html` | `data/gallery.json` |
| News and Insights | `news.html`, `news-details.html?id=news-001` | `data/news.json` |
| FAQ | `faq.html` | `data/faqs.json` |
| Contact Us | `contact.html` | `js/config.js` |
| Privacy Policy (draft) | `privacy.html` | the HTML file |
| Not found | `404.html` | the HTML file |

---

## 1. Before you publish: checklist

The site contains **sample content** wherever real company information was not supplied. Do not present it as real.

- [ ] **Replace every sample record** in `data/properties.json`, `projects.json`, `news.json`, `gallery.json`, `faqs.json`, `hero.json`, `team.json` and `careers.json`. Every sample has `"placeholder": true`; remove that line (or set it to `false`) when a record is real. Samples show a "Sample" badge and a notice on the page.
- [ ] **Replace the sample photographs.** `assets/images/projects/placeholder-*.jpg`, `hero.jpg` and `about-placeholder.jpg` were cropped from design reference images and **may be subject to third-party copyright**. `assets/images/samples/*.jpg` are illustrative renders supplied for layout purposes; they are **not company projects**. Use the company's own photographs and renders.
- [ ] **Review all draft wording.** Add `?placeholders=1` to any page address (for example `about.html?placeholders=1`) and every draft passage is highlighted in yellow so it can be approved or rewritten. This includes the company profile, vision, mission, philosophy, values, service descriptions, FAQ answers and the **Privacy Policy** (which has not been legally reviewed).
- [ ] **Check the company name** is shown as you want it (section 9).
- [ ] **Verify contact details and the map pin** (section 3).
- [ ] **Add social links** once real accounts exist (section 3). Until then none are shown.
- [ ] **Decide the online form** (section 14) and the **calculator figures** (section 15).
- [ ] **Have a lawyer review** `privacy.html` and `terms.html` (both are drafts).
- [ ] **Run the checker:** `node tools/validate-data.js --sitemap` (section 8).

---

## 2. Project structure

```
ppec/
├── index.html  about.html  services.html  gallery.html  news.html  news-details.html
├── properties.html  property-details.html  projects.html  project-details.html
├── contact.html  faq.html  team.html  careers.html  privacy.html  terms.html  404.html
├── calculator.html  shortlist.html
├── sitemap.xml  robots.txt
├── data/                     ★ all catalogue content (JSON)
│   ├── properties.json  projects.json  services.json
│   └── news.json  faqs.json  gallery.json  hero.json  team.json  careers.json  testimonials.json
├── js/
│   ├── config.js             ★ contact details, site address, categories, page size
│   ├── core.js               shared helpers + JSON loading (no edits needed)
│   ├── ui.js                 cards, loading/empty/error states, lightbox
│   ├── main.js               menu, contact details, enquiry form
│   ├── catalogue.js          search/filter/sort/grid-list for properties and projects
│   ├── detail.js             property and project detail pages
│   ├── hero.js               home hero slider (8 transitions) + 3D showcase
│   ├── shortlist.js  shortlist-page.js   saved items (this browser only), compare table
│   ├── calculator.js         mortgage / affordability calculator
│   ├── gallery.js  content.js   gallery, home featured, services, news, FAQ, team, careers
├── css/style.css             all styling; colours are variables at the top
├── assets/
│   ├── images/               logos, hero, about image
│   │   ├── projects/         original sample photos
│   │   ├── samples/          sample photos/renders (…-sm.jpg = small versions for cards)
│   │   └── banners/          page-header pictures
│   ├── video/                sample walkthrough video + poster
│   ├── icons/  fonts/
├── tools/validate-data.js    optional content checker + sitemap generator
└── tools/set-domain.js       moves the site to a new web address (custom domain)
```

Data (`data/`), presentation (`css/`, HTML) and logic (`js/`) are kept separate. Property and project information is **not** repeated in any HTML file; the JSON files are the single source of truth.

---

## 3. Contact details, one place for the whole site

Edit **`js/config.js`**: telephone, WhatsApp number, email, address, map query, brand and legal names, social links.

> The same values are also written in the HTML as a fallback for visitors with JavaScript disabled. If you change a number or email, also search the `.html` files for the old value and replace it.

- **Map:** the embedded map and "Open in Google Maps" link search for `mapQuery`. The address `EX72 Bissau St, Ofinso, Ashanti, Ghana` was typed from the details supplied and **has not been verified**. Open the Contact page and check the pin; if it is wrong, use the place name or Ghana Post GPS code Google Maps recognises.
- **Social links:** put full `https://` addresses under `social`. Empty entries are hidden.
- **`siteUrl`:** the public address of the website **with a trailing slash**. It is the single place that defines the base path (`/ppec/`). It is used inside WhatsApp and email messages, canonical addresses and the sitemap.
- **Categories and statuses** (`taxonomy`) and **`pageSize`** (items shown before "Show more") are also set here.

---

## 4. Adding, editing and removing properties

Edit **`data/properties.json`**. It is a list of records; each record is one `{ ... }` block. Copy a block to add a property. **Keep a comma between blocks, no comma after the last one**, and keep every quote. If you break the syntax the page shows an error message, and `node tools/validate-data.js` will tell you which line.

```json
{
  "id": "property-008",
  "status": "published",
  "featured": false,
  "name": "Four-bedroom house, East Legon",
  "category": "residential",
  "location": "East Legon, Accra",
  "availability": "available",
  "price": 950000,
  "priceNote": "negotiable",
  "description": "One or two sentences.",
  "specs": { "bedrooms": 4, "bathrooms": 3, "landSize": "600 m²", "floorArea": "320 m²",
             "extra": { "Parking": "2 cars" } },
  "amenities": ["Borehole", "Gated compound"],
  "images": [
    { "src": "assets/images/properties/property-008-front.jpg", "alt": "Front of the house" },
    { "src": "assets/images/properties/property-008-garden.jpg", "alt": "Garden and pool", "type": "render" }
  ],
  "mapQuery": "East Legon, Accra, Ghana",
  "related": ["property-002"],
  "added": "2026-11-05"
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique. Lowercase letters, numbers, hyphens. It becomes the page address (`property-details.html?id=property-008`). **Do not change an id once published**; links to it would break. |
| `status` | yes | `"published"` shows it; `"draft"` hides it everywhere (including search and related lists). |
| `name`, `category` | yes | `category` is one of: `residential`, `apartments`, `land`, `commercial`, `luxury`, `estate`. |
| `featured` | no | `true` shows it in "Featured" on the Home and Properties pages (the newest 3 are used). |
| `location` | no | Used for the location filter (which appears once there are two or more locations). |
| `availability` | no | `available`, `reserved`, `sold` or `tbc`. |
| `price` | no | A plain number in the currency set in `config.js` (default GHS): `950000`, **not** `"950,000"`. **Leave it out unless the company has confirmed the price**; the page then says "Price on enquiry". The price filter and price sorting only appear once at least one property has a price. |
| `specs`, `amenities` | no | Anything you leave out is simply not shown; there are no empty labels. |
| `images` | no | The first image is the main photo. Always write an `alt` description. `"type": "render"` labels an architectural render. |
| `mapQuery` | no | The map on the detail page appears only when this is set. Otherwise a note says it will be added. |
| `related` | no | Ids of related properties. If fewer than 3, same-category properties fill the gap. |
| `added` | no | `YYYY-MM-DD`; used by "Newest" sorting. |
| `placeholder` | no | `true` marks a sample record. |

**To remove a property** either delete its block or set `"status": "draft"` (safer; you can bring it back).

## 5. Adding, editing and removing projects

Edit **`data/projects.json`**. Projects are completely separate from properties.

```json
{
  "id": "project-006",
  "status": "published",
  "featured": true,
  "name": "Estate name",
  "category": "estate",
  "location": "Ofinso, Ashanti",
  "projectStatus": "ongoing",
  "description": "One or two sentences.",
  "features": ["Paved roads", "Gated entrance"],
  "progress": { "percent": 40, "note": "Foundations complete." },
  "milestones": [
    { "title": "Site clearing", "date": "2026-03-01", "status": "done" },
    { "title": "Roofing", "date": "Q1 2027", "status": "current" },
    { "title": "Handover", "status": "upcoming" }
  ],
  "images": [ { "src": "assets/images/projects/estate-aerial.jpg", "alt": "Aerial view of the site", "type": "photo" } ],
  "related": ["project-002"],
  "added": "2026-11-05"
}
```

- `category`: `residential`, `estate`, `commercial`, `construction`, `infrastructure`, `land-development`.
- `projectStatus` (required): `planning`, `upcoming`, `ongoing`, `completed`, `on-hold`.
- `progress.percent` is optional: **only enter it when the company has confirmed it.** Without it the page shows only the note. Milestone `date` can be `YYYY-MM-DD` or free text such as `"Q1 2027"`; `status` is `done`, `current` or `upcoming`.
- `images[].type` is `"photo"` or `"render"`, shown as a label on the detail page.

## 6. Other content files

| File | What it controls |
|---|---|
| `services.json` | Service titles, short summary (home page), longer `description` and an optional `cta` button (Services page). `order` sets the sequence. |
| `news.json` | Articles: `title`, `date`, `category`, `cover` image, `summary`, and `content`, a list of paragraphs (start a line with `## ` for a heading). |
| `faqs.json` | `question`, `answer`, `order`. |
| `gallery.json` | `src`, `alt`, `title`, `category` (`property`, `construction`, `estate`, `render`, `completed`), optional `thumb`. |
| `hero.json` | Home hero slides, in `order`. Each: `image {src, alt, position}`, `eyebrow`, `title`, `titleEm` (italic gold part), `text`, `cta` / `cta2` `{label, href}`, and `transition`: `fade`, `slide-left`, `slide-right`, `slide-up`, `zoom`, `wipe`, `cube` (3D) or `flip` (3D). Use `"status": "draft"` to hide a slide. |
| `team.json` | People shown on `team.html`, grouped by `department`: `name`, `role`, `bio`, `photo {src, alt}`, optional `email`, `linkedin`. Leave `photo` out to show a neutral tile. |
| `careers.json` | Vacancies on `careers.html`: `title`, `type`, `location`, `summary`, `responsibilities[]`, `requirements[]`, `closing`. Applying opens the visitor's email app or WhatsApp; **the site does not receive or store applications.** |

All of them support `"status": "draft"` to hide a record.

## 7. Managing images

1. Put photos in `assets/images/` (for example `assets/images/properties/`). Use lowercase names without spaces.
2. Use **JPG**, about **1200 px wide**, ideally **under 200 KB** (compress with squoosh.app or similar). Cards are shown at roughly 400 px, detail pages up to about 900 px.
3. Reference the file in the JSON using a path **from the website root**, with no leading slash: `assets/images/properties/house.jpg`.
4. Always give each image a short `alt` description (used by screen readers and search engines).
5. Below-the-fold images load lazily by themselves. If an image is missing, the site shows the logo mark instead of a broken picture.
6. Home hero pictures are listed in `data/hero.json` (aim for **at least 1920 px wide**, under 350 KB each). The About image is `about-placeholder.jpg`.
7. **Small versions for cards:** give an image an optional `"thumb": "assets/.../name-sm.jpg"` (about 640 px wide). Cards and grids use it; the big picture loads only in the viewer.
8. **Multiple pictures, floor plans and video on detail pages.** In a property or project record:

```json
"images":     [ { "src": "assets/images/a.jpg", "alt": "…", "thumb": "assets/images/a-sm.jpg" }, { "src": "…", "alt": "…" } ],
"floorPlans": [ { "title": "Ground floor", "src": "assets/images/plan-1.jpg", "alt": "…" } ],
"videos": [
  { "title": "Walkthrough", "type": "file",    "src": "assets/video/house.mp4", "poster": "assets/video/house.jpg" },
  { "title": "Tour",        "type": "youtube", "id": "VIDEO_ID_11_CHARS" },
  { "title": "Tour",        "type": "vimeo",   "id": "123456789" }
]
```

   Tabs (Photos / Slideshow / Floor plan / Video) appear only for the views that have content. Local videos should be **MP4 (H.264), under about 15 MB**; use GitHub's 100 MB file limit as the hard ceiling. YouTube and Vimeo load **only after the visitor presses play** (privacy-friendly embeds). Add `"placeholder": true` to a sample video to label it.

Note: the header logo `assets/images/logo-horizontal.png` is about 130 KB. Re-exporting it at roughly twice its display size would make every page lighter.

---

## 8. Checking your changes

**Viewing the site on your own computer.** The catalogue pages read their JSON files with `fetch`, which browsers block for pages opened straight from a folder (`file://`). They then show a message explaining this. Static pages (About, Contact, Privacy) work either way. To preview everything:

```bash
python3 -m http.server 8000      # run inside this folder, then open http://localhost:8000
```

**Content checker (optional).** With Node.js 16+ installed:

```bash
node tools/validate-data.js            # checks JSON, required fields, categories, images, links
node tools/validate-data.js --sitemap  # also rewrites sitemap.xml from the published records
```

It reports exactly which record has a problem and exits with an error if anything is wrong. Run it before every upload. There is no Node dependency in the website itself.

---

## 9. Company name

The confirmed company name is **Platinum Properties Estates & Constructions Company Limited**. The short public brand is **Platinum Properties Estates & Constructions** (header, titles, headings); the full name is the legal name (footer, Privacy Policy). Both live in `js/config.js` (`brandName`, `legalName`). Page titles and headings also contain the brand name in the HTML; if it ever changes, search the `.html` files for "Platinum".

---

## 10. Publishing on GitHub Pages

The site is already published from the `main` branch, root folder, at <https://ppec-io.github.io/ppec/>. To update it:

1. Edit or replace files (on GitHub: **Add file → Upload files**, or with Git: `git add`, `git commit`, `git push`).
2. In **Settings → Pages** the source should remain **Deploy from a branch → `main` → `/ (root)`**.
3. The site refreshes within a couple of minutes (hard-refresh the browser to see changes).

**Base path.** The site is served under `/ppec/`, not at the domain root. Every page uses **relative links** (`properties.html`, `assets/...`, `data/...`), so it works under any base path. The only places that need the full address are `siteUrl` in `js/config.js` and the `<link rel="canonical">` / `og:url` tags in each page's `<head>`. The checker reports a mismatch.

**404 page.** GitHub Pages serves `404.html` for unknown addresses. Because the missing address can be several folders deep, `404.html` sets a `<base>` tag (a small inline script) so its stylesheet and logo still load. On `*.github.io` it uses the first path segment (`/ppec/`); on a custom domain it uses `/`.

**Custom domain.** Settings → Pages → Custom domain, then add the DNS records GitHub shows and tick **Enforce HTTPS**. Afterwards change `siteUrl` in `js/config.js`, the canonical/`og:url` tags, and `robots.txt`, then run `node tools/validate-data.js --sitemap`.

---

## 11. How enquiries work

There is no server, so **the site never stores or "submits" an enquiry itself**.

- **WhatsApp** buttons open a chat to the company number with a message that names the property or project, its reference and its web address.
- **Telephone** and **Email** buttons use `tel:` and `mailto:` links; email links include the same details.
- The **enquiry form** checks the fields, then opens the visitor's email app or WhatsApp with the message ready to send. It says so plainly and never reports "sent".
- Property and project cards and pages link to the form with the item pre-selected (`contact.html?enquiry=property-003`).

No credentials, keys or tokens exist in the code. If a real form service is wanted later, it must be chosen and configured by the company.

---

## 12. SEO and accessibility

- Unique `<title>` and meta description per page; canonical and Open Graph tags; `sitemap.xml` and `robots.txt`; a custom 404. Detail pages update their title, description and canonical address from the record they show, and "not found" pages are marked `noindex`.
- Organisation structured data (JSON-LD) is generated on the Home and Contact pages **only from the details in `config.js`**. No ratings, awards, certifications or property data are published as structured data.
- Semantic HTML, skip link, keyboard-operable menu, filters, gallery and lightbox (arrow keys, Escape, focus returns to the opener), labelled form fields with error messages, `aria-live` result counts, reduced-motion support.
- `?placeholders=1` highlights draft wording (see section 1).

## 13. Home hero, 3D showcase and design notes

- **Hero slider** (`js/hero.js`, `data/hero.json`): several slides, each with its own picture, words and transition (fade, slide, zoom, wipe, 3D cube, 3D flip). Autoplay 7 s, pause button, arrows, dots, swipe, keyboard. With the visitor's "reduce motion" setting on, autoplay and animations are off. If `hero.json` cannot load, the first slide written in `index.html` stays.
- **3D showcase** (home page): a coverflow of featured properties, built with CSS 3D only (no library). It reads `"featured": true` records.
- Off-screen slides are inert (not reachable by keyboard or screen reader).
- The **About Us** menu has a drop-down (Our Story, Our Team, Careers, FAQ); on phones it is expanded inside the menu.
- Page-header pictures are in `assets/images/banners/`; they are referenced from the HTML as `../assets/images/banners/…` because CSS resolves paths relative to the stylesheet. Keep the `../`.

## 14. Online enquiry form (optional, no server of your own)

By default the contact form opens the visitor's email app or WhatsApp (nothing is stored). To send enquiries straight to the company's inbox instead:

1. Create a free account at a form service such as **Formspree** (formspree.io), create a form, and copy its address (for example `https://formspree.io/f/abcdwxyz`). Set it to deliver to the company email.
2. Put it in `js/config.js`: `forms: { endpoint: "https://formspree.io/f/abcdwxyz", providerName: "Formspree" }`.
3. Open the contact page: the button now says **Send enquiry**, with "Send by Email" as a fallback. A hidden trap field catches simple spam bots.

Notes: **Netlify Forms does not work on GitHub Pages** (it needs Netlify hosting). The endpoint must start with `https://`. The page says "sent" only when the service answers with success; otherwise it says it could not be sent and keeps the visitor's text. Free plans have monthly limits and **cannot take file attachments**, so job applications still use email or WhatsApp. The form service stores the messages, so update `privacy.html` with its name, and confirm it fits the company's data-protection duties. Once the ERP is ready, point `endpoint` at the ERP's form address instead.

## 15. Mortgage and affordability calculator

`calculator.html` runs in the browser only. Its starting figures are in `js/config.js` under `calculator`: interest rate, repayment period, deposit %, the share of income a lender may allow for repayments, and the longest period. **They are examples, not lender rates.** Replace them with figures the company has confirmed (for example from a partner bank), then set `rateIsExample: false` to remove the "example figures" notice. Property pages link to the calculator; if a record has a numeric `price`, it is pre-filled.

## 16. Shortlist and compare

Visitors tap the heart on any card or detail page. The list is kept in that browser's local storage (reference numbers only), never sent anywhere, and shown at `shortlist.html` (not listed in the sitemap, marked `noindex`). Up to 3 saved properties can be compared side by side. The page offers "Ask us about these" (WhatsApp / email) with the list pasted in. Items that are unpublished or removed from the data are dropped automatically.

## 17. Virtual tours and testimonials

- **Virtual tour tab.** Add to a property or project: `"tours": [ { "title": "3D walkthrough", "provider": "matterport", "id": "XXXXXXXXXXX" } ]`. Providers: `matterport` (the 11 characters after `?m=` in the share link) and `kuula` (the code at the end of the share link). Nothing from the provider loads until the visitor presses the button. Other providers need a small code change (they are allow-listed on purpose).
- **Testimonials** (`data/testimonials.json`, shown on the home page). The section is **hidden until a real testimonial is published**. A published record needs `quote`, `name` and a `permission` note (where the written permission is kept, e.g. `"Email 2026-11-20"`); the checker rejects it otherwise. Never write testimonials yourselves. No star ratings are shown or put in search data.

## 18. Search-engine data, Google Business Profile

- Detail pages add **breadcrumb** data, and **RealEstateListing** data (name, address of the page, images, date, price) **only for records that are not samples** (`placeholder` not true). Prices appear only if the record has a numeric `price`.
- **Google Business Profile** (free, the biggest local-search win): create or claim the profile at business.google.com, verify the office address, add the website address, phone, opening hours and photos, then keep the name, address and phone **identical** to the website footer.
- Submit `sitemap.xml` in Google Search Console after launch (and after a domain change).

## 19. Custom domain

1. Buy the domain. In GitHub: **Settings → Pages → Custom domain**, enter it, add the DNS records GitHub shows, tick **Enforce HTTPS** when offered. GitHub then creates a `CNAME` file in the repo.
2. Update every address in the site in one step: `node tools/set-domain.js https://www.example.com/` (preview) then `node tools/set-domain.js https://www.example.com/ --apply`, then `node tools/validate-data.js --sitemap`.
3. Commit and push. Check the 404 page, a property page and the sitemap on the new address. Keep the old `github.io` address working for a while; GitHub redirects it automatically once a custom domain is set.

## 20. What changed from the previous version

- **Round 2:** shortlist and compare, calculator, optional online form, virtual-tour tab, testimonials component (hidden until real ones exist), Terms page, privacy update, breadcrumb and listing data, `tools/set-domain.js`. Heading order on the contact page's option cards was corrected (h3 → h2, same look).
- **Previous update:** luxury visual layer; hero slider and 3D showcase; multi-view property/project pages (mosaic, slideshow, floor plan, video, share buttons, key facts); **new pages** `team.html` and `careers.html`; FAQ search and topic filter; news article side-bar; new data files `hero.json`, `team.json`, `careers.json`; new sample photographs, banners and a sample video; `tools/validate-data.js` extended to check them.

- `properties.html` is now the property catalogue; **projects have their own page** and data. The old combined "Properties & Projects" page and `js/projects-data.js` were replaced by the JSON files (the old six sample entries were migrated into `properties.json` and `projects.json`). The old `?enquiry=available-1` style addresses no longer exist.
- The menu moved to the button layout below 1100 px wide to fit eight links.
- Existing branding, fonts, logos, icons, colours, the placeholder highlighter, the contact details file and the contact form behaviour are unchanged.
- Small accessibility fixes were made to existing markup (social-links group role, gold text contrast on dark backgrounds).

See `TESTING.md` for what was tested, how, and what was not.
