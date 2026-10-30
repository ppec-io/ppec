# Platinum Properties, Estates & Constructions: Website

A fast, elegant, fully responsive 4-page corporate website for a Ghanaian real estate and construction company.
Pure HTML, CSS and vanilla JavaScript. **No build step, no backend, no database, no dependencies, no external requests** (fonts and icons are self-hosted). Ready for GitHub Pages.

| Page | File |
|---|---|
| Home | `index.html` |
| About Us | `about.html` |
| Properties & Projects | `properties.html` |
| Contact Us | `contact.html` |

---

## 1. Before you publish: checklist

The site is built with **sample content** wherever real company information was not supplied. Do not publish until you have worked through this list.

- [ ] **Replace the sample photographs.** Every image under `assets/images/projects/`, plus `hero.jpg` and `about-placeholder.jpg`, is a temporary stand-in cropped from design reference images. They are **not** the company's projects and may be subject to third-party copyright. Replace them all with your own photographs.
- [ ] **Replace the sample properties/projects** in `js/projects-data.js` (see section 3).
- [ ] **Review all draft wording.** The company profile, vision, mission, core values, commitments, approach and "Why choose us" text are generic drafts written without company input. Add `?placeholders=1` to any page address (e.g. `about.html?placeholders=1`) and every draft passage is highlighted in yellow so you can find and approve or rewrite it.
- [ ] **Confirm the company name** (see section 6).
- [ ] **Verify the office location** on the Contact page map (see section 4).
- [ ] **Add social media links** once real accounts exist (section 4). Until then none are shown.

---

## 2. Project structure

```
classic-properties-website/
├── index.html
├── about.html
├── properties.html
├── contact.html
├── assets/
│   ├── images/
│   │   ├── logo-horizontal.png   header and footer logo (transparent)
│   │   ├── logo-vertical.png     stacked logo (spare)
│   │   ├── logo-mark.png         icon-only mark (spare)
│   │   ├── hero.jpg              home page hero (SAMPLE)
│   │   ├── about-placeholder.jpg (SAMPLE)
│   │   └── projects/             property photos (SAMPLE)
│   ├── icons/                    favicons and UI icons
│   └── fonts/                    self-hosted Cormorant Garamond + Inter
├── css/style.css                 all styling; colours are variables at the top
├── js/
│   ├── config.js                 ★ contact details and settings
│   ├── projects-data.js          ★ properties and projects
│   └── main.js                   behaviour (menu, forms, rendering); normally no edits
└── README.md
```

---

## 3. How to update things

### Contact details, one place for the whole site
Edit **`js/config.js`**: telephone, WhatsApp number, email, address, map location, legal/brand name and social links. The change appears on every page automatically.

> The same values are also written in the HTML as a fallback for visitors with JavaScript disabled. If you change a number or email, also search the four `.html` files for the old value and replace it.

### Properties & projects
Edit **`js/projects-data.js`**. Each property is one block; copy a block to add another.

1. Put the photo in `assets/images/projects/` (JPG, about 1200px wide, under 300 KB).
2. Set `category` to `"available"`, `"ongoing"` or `"completed"`; the property then appears in that section automatically.
3. Set `featured: true` on up to three entries to show them on the Home page.
4. Set `placeholder: false` once an entry is real. This removes its "Sample" badge, and when no placeholders remain the "Sample content" notice disappears too.

The **Enquire** button on each card opens the Contact page with that property pre-selected; the **WhatsApp** button opens a chat with a message naming the property.

### Photographs
Replace `assets/images/hero.jpg` (wide, ideally 1920px, under 400 KB) and `about-placeholder.jpg`. Keep the same file names, or update the `src` in the HTML. Compress images before uploading (e.g. squoosh.app).

### Text
Edit the `.html` files directly. Headings and paragraphs are plain HTML.

### Colours & fonts
`css/style.css`, `:root` block at the top. Palette: matte `#111317`, gold `#CFB269` / `#E0CD91` / `#AF9252`, cream `#FBFBF3`. Gold **text on light backgrounds** uses a deeper `#7A6529` because the lighter gold fails accessibility contrast.

---

## 4. Contact page notes

- **Enquiry form:** there is no server, so the form does not store or send anything itself. **Send by Email** opens the visitor's email app with the message ready, addressed to your official email. **Send via WhatsApp** opens a WhatsApp chat with the message. Both check the fields first.
- **Map:** the embed and "Open in Google Maps" link search for `mapQuery` in `js/config.js`. `EX72 Bissau St, Ofinso, Ashanti, Ghana` was typed from the details supplied and **has not been verified**. Open the live page and check the pin. If it is wrong, use a more precise query such as the Ghana Post GPS digital address or the place name Google Maps recognises.
- **Social links:** in `js/config.js`, put full `https://` addresses under `social`. Empty entries are hidden.

---

## 5. Publish on GitHub Pages

1. Create a GitHub account and a **new repository**, e.g. `platinum-properties-website` (public).
2. Upload the **contents** of this folder so `index.html` sits at the repository root (on GitHub: **Add file → Upload files**, drag everything in, **Commit changes**). Or with Git:
   ```bash
   git init
   git add .
   git commit -m "Initial website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. In the repository go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, then **Save**.
5. After 1–2 minutes the site is live at `https://<your-username>.github.io/<repo-name>/`.

All links and assets use **relative paths**, so the site works whether it lives at the root of a domain or in a repository sub-folder.

### Custom domain (optional)
**Settings → Pages → Custom domain**, enter your domain, and add the DNS records GitHub shows. Tick **Enforce HTTPS**.

### Updating later
Edit or re-upload the changed file(s) on GitHub. The site refreshes within a couple of minutes (hard-refresh your browser to see changes).

---

## 6. Company name

The brief names the company **Classic Properties and Constructions Company Limited**, but the supplied logo and email domain read **Platinum Properties, Estates & Constructions**. The site currently uses the **logo name** as the public brand (header, titles, headings) and shows the **Classic Properties and Constructions Company Limited** name in the footer copyright line. Both names live in `js/config.js` (`brandName`, `legalName`); the page titles and some headings also contain the brand name, so if the public name changes, search the `.html` files for "Platinum" and update them.

---

## 7. SEO extras (optional, after you know your final web address)

- Add `<link rel="canonical" href="https://your-address/">` and Open Graph image tags (`og:image`, `og:url`) to each page `<head>`. These need your final absolute URL, so they are not preset.
- Add a `sitemap.xml` and register the site with Google Search Console.
- Only add structured data (Schema.org `LocalBusiness`) with verified details.

---

## 8. Accessibility & performance

- Semantic HTML, skip link, keyboard-operable collapsible menu (`aria-expanded`, Escape to close), visible focus states, labelled form fields with error messages, reduced-motion support.
- The site works with JavaScript disabled for navigation and content (properties lists, contact autofill and the form need JavaScript).
- No frameworks or third-party scripts; the only external request is the Google Maps embed on the Contact page (loaded lazily).
