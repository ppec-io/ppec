# Platinum Properties Estates & Constructions — Website

A lightweight, responsive static website (HTML, CSS and vanilla JavaScript). No backend, database, build step or paid services. Ready for GitHub Pages.

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | About Us |
| `properties.html` | Properties & Projects |
| `contact.html` | Contact Us |

## Project structure

```
platinum-properties-website/
├── index.html  about.html  properties.html  contact.html
├── assets/
│   ├── images/        logo.png, hero.jpg, about.jpg
│   │   └── projects/  property / project photographs
│   └── icons/         favicon.png, apple-touch-icon.png
├── css/style.css      all styling and brand colours (see :root)
├── js/
│   ├── config.js            ← company phone, email, address, WhatsApp, map, socials
│   ├── properties-data.js   ← all properties and projects
│   └── main.js              site behaviour (menu, forms, rendering)
└── README.md
```

## Where to update things

### Contact details — `js/config.js`
Edit phone, WhatsApp number (digits only, country code first, no `+`), email, address, opening hours and social links. These update every page automatically: header button, footer, contact page, WhatsApp buttons and the floating WhatsApp icon. Social links left as `""` are hidden.

Provided details currently in the file: telephone `+233 59 976 2750`, email `info@platinumestatesconstructions.com`, address `EX72 Bissau St, Ofinso, Ashanti, Ghana`. Please confirm them before launch.

**Google Map:** by default the map searches the address text. For an exact pin, open the location in Google Maps → Share → Embed a map → copy the `src="…"` URL into `mapEmbedUrl` in `config.js`.

### Properties and projects — `js/properties-data.js`
Each entry is one block. Change `name`, `location`, `status`, `description` and `image`, and set `placeholder: false` to remove the "Placeholder" tag. Set `category` to `available`, `ongoing` or `completed`. Set `featured: true` to show it on the Home page (first three are used). Copy a block to add a property, delete a block to remove one.

**Every current entry is a placeholder.** No names, prices, locations or statuses are real.

### Photographs
Put new images in `assets/images/projects/` and reference them in `properties-data.js`. Recommended: JPG, about 1200 px wide, under 200 KB. The hero is `assets/images/hero.jpg` and the About/Home side image is `assets/images/about.jpg`.

The current photographs are **illustrative placeholder images** and are not company projects. Replace them with the company's own photography.

### Company text
Short text lives in the HTML files. Passages shown with a yellow dashed highlight (`class="edit-me"`) are placeholders awaiting company information: the company profile, history, and the official vision and mission (the vision and mission shown are draft wording).

### Colours and fonts — `css/style.css`
Brand colours are variables at the top of the file (`:root`). Fonts are Cormorant Garamond (headings) and Inter (body), loaded from Google Fonts; the site falls back to system serif/sans fonts if offline.

## Enquiry form
There is no backend, so the form does not store anything. **Send by Email** opens the visitor's email app with a prefilled message to the company address. **Send by WhatsApp** opens WhatsApp with the message prefilled. Property "Enquire" buttons open the contact page with the property pre-selected.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or open `index.html` directly in a browser.

## Deploy to GitHub Pages

1. Create a new GitHub repository (for example `platinum-properties-website`).
2. Upload the contents of this folder so `index.html` is at the repository root.
   ```bash
   git init
   git add .
   git commit -m "Initial website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. In the repository go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
5. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

All paths are relative, so the site works both at a project URL like the one above and on a custom domain (add it under Settings → Pages).

## Before going live — checklist

- [ ] Confirm phone, WhatsApp, email and address in `js/config.js`
- [ ] Add the exact Google Maps embed URL
- [ ] Replace placeholder photographs and property entries
- [ ] Replace highlighted placeholder text and the draft vision/mission
- [ ] Add social media links when accounts exist
- [ ] Update `<title>` / description tags in each HTML file if wording changes
- [ ] Optionally add `sitemap.xml` and `robots.txt` once the live URL is known
