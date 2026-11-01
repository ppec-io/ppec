# Testing and Verification Report

Date of testing: 31 October – 1 November 2026.
Scope: the enhanced 14-page site in this repository, tested **locally** against a small test server that imitates
GitHub Pages (files served under `/ppec/`, a missing path returns `404.html` with HTTP status 404).

**Read section 6 first.** It lists what was *not* verified. Several things that matter for launch (the live GitHub
Pages deployment, real WhatsApp and email apps, browsers other than Chromium, screen readers) were never exercised.

Everything marked PASS below was actually executed and the numbers are the real output. The test scripts were run
from a working folder outside this repository and are **not included** in it (they need Node and Playwright, which
the site itself does not). They can be added as a `tests/` folder if you want to re-run them.

---

## 1. Summary

| Check | Tool | Result |
|---|---|---|
| Whole-site browser checks (14 pages × 3 screen widths, detail pages, 404, menu, no-JavaScript) | Playwright, Chromium | **412 passed, 0 failed** |
| Functional checks with fabricated test data (filters, sorting, paging, view toggle, errors, detail pages, gallery viewer, contact form) | Playwright, Chromium | **94 passed, 0 failed** |
| Navigation bar fit at 1101–1920 px (single line, no collisions) | Playwright | **12 passed** (index) + **56 passed** (every page × 4 widths) |
| Automated accessibility audit (WCAG 2.0/2.1/2.2 A and AA + best practice), 14 pages × desktop and mobile | axe-core 4.14.0 | **0 violations** (after fixes in section 4) |
| Data and link validator, including 15 deliberate-failure tests | `tools/validate.py` | **0 errors, 0 warnings** on shipped data; **15 of 15** failure tests behaved correctly |
| Sitemap generator (real record included, sample and draft records excluded) | `tools/build_sitemap.py` | **Passed** |
| Page weight and external requests | Playwright | measured, see section 5 |

"Passed" means only that the automated check held. It is not a substitute for people trying the site.

---

## 2. What the browser suite checked

**All 14 pages at 1440 px (desktop), 820 px (tablet) and 390 px (phone):** HTTP 200 (404 page returns 404); no
console or page errors; no failed or 4xx local requests; exactly one `<h1>`; no horizontal scrolling; every image
loads and has an `alt` attribute; `lang="en"` and one `<main>`; (desktop) meta description present and canonical
address under `https://ppec-io.github.io/ppec/`.

**Base-path safety:** the 404 page loads its CSS, fonts and logo correctly when reached from a deep invalid path
(e.g. `/ppec/a/b/c/missing`), and its links resolve under `/ppec/`.

**Detail pages (real sample data):** property and project pages render title, status, category, gallery, thumbnails,
viewer (open, Escape closes), WhatsApp message containing the record's name and its page address; a missing id, an
unknown id, a draft id and a script-like id (`?id=<script>`) all show the friendly "not found" state; projects show
no invented percentage and no invented milestone dates.

**Navigation:** full menu fits on one line at 1101 / 1180 / 1440 px; hamburger at 1100 / 1024 / 390 px; the menu is
closed and hidden from keyboard by default; opens with `aria-expanded`; marks the current page; closes with Escape
(focus returns to the toggle) and on outside click.

**Without JavaScript:** navigation and content are visible on five pages, and the listing page explains that
JavaScript is needed and offers phone/contact.

## 3. What the fixture suite checked

The test data was made up inside the test and fed to the site in place of `data/*.json`; it is not in the repo.
It included 14 published properties, a draft, a record with no id, a record with a numeric id, a record with only a
title, a verified price, an unverified price, and records with and without specifications.

- **Listing behaviour:** 6 cards on first load; "Show more" to 12 then 14 and the button disappears; draft,
  id-less and numeric-id records never appear; sorting by newest, price low–high, price high–low (records without a
  verified price go last) and location; search (single and multi-word); category, location and availability
  filters; min/max price (an **unverified price is neither shown nor matched**); empty-result message with a reset
  button; `?category=` pre-selects the filter and an invalid value is ignored; featured block hides while filtering.
- **Grid/list:** toggles without reloading the page; kept while filtering; kept on another listing page and after
  reload in the same session; a brand-new session starts in grid.
- **Projects:** same engine; status and category filters; no price controls; draft excluded; "40% complete" appears
  only where a number exists.
- **Failure handling:** HTTP 500 and invalid JSON each give an error message with "Try again" and "Contact us";
  "Try again" recovers once data is available; an empty list gives a friendly message; a failing `taxonomy.json`
  degrades to readable labels with no errors.
- **Detail pages:** verified price formatted (GH₵500,000); unverified price not shown; specs listed only when
  supplied; amenities; related items (unknown ids skipped); no `undefined`/`null`/`NaN` text; WhatsApp message
  includes the title and the full page address; map not loaded until clicked; draft id is "not found"; project
  progress and milestones from data; no percentage when none is supplied.
- **News:** a `## ` line becomes a sub-heading; a real article shows its date.
- **Gallery:** category chips with counts; filtering; viewer opens at the clicked image with alt text and
  "1 of 3"; arrow key, Next and Previous work, **wrap around** at both ends; Escape and the close button close it;
  focus returns to the tile that opened it.
- **Contact form:** `?property=`, `?project=`, `?service=` and the older `?enquiry=` pre-select the right item and
  pre-fill a message naming it; an unknown id is ignored; empty submit shows errors and moves focus to the first
  one; a bad email and a too-short message are rejected; a valid submit says "Opening your email app…" and does
  **not** say the message was sent; the WhatsApp button requests `wa.me/233599762750` with the visitor's name, the
  item and the full page address; submitting makes **no non-GET network request** (no fake submission).

## 4. Problems found by testing, and fixed

| # | Problem | How it was found | Fix |
|---|---|---|---|
| 1 | Menu wrapped onto two lines at 1440 px | looking at screenshots (the first automated test only measured header height) | no-wrap links, wider header container, tighter spacing; stricter test over 1101–1920 px |
| 2 | Breadcrumbs showed list numbers | screenshot review | `ol` styles reset |
| 3 | An empty gold badge showed on gallery images | screenshot review | `[hidden]` now always wins over component display rules |
| 4 | A record with no category showed a "Category" row with no value | fixture test | rows with no value are skipped; the section is omitted if nothing remains; empty category line on cards is skipped |
| 5 | Section label (eyebrow) in dark gold on a dark section: contrast 3.3:1 (needs 4.5:1) | axe | uses the light gold on dark sections |
| 6 | Large decorative numerals and the "404" in `#AF9252` on light backgrounds: 2.9:1 (needs 3:1) | axe | new darker `--gold-numeral: #8F762F` |
| 7 | News list jumped from `h1` to `h3` | axe | visually hidden `h2` added |
| 8 | Two buttons' accessible names did not contain their visible text ("Label in name") | axe | names rewritten; the photograph/render tag moved out of the image button |
| 9 | Page introductions and the floating WhatsApp button were outside any landmark | axe | introductions are named regions; the button sits in a labelled `aside` |

Also disclosed: the first full browser run reported 1 failure that was a **faulty test** (the sample article has no
`## ` line, so the check could not succeed); that check was rewritten and the behaviour is verified by the fixture
suite. Five expectations in my own new fixture tests were also wrong (for example, it looked for the page title inside
`<main>` when it sits in the page header) and were corrected, and two expectations in the validator tests were
mis-worded; in each case the site or validator behaved correctly and only the test was changed.

**One unexplained observation.** In one run, a full-page screenshot of the property detail page showed the menu
squeezed (about 19 px narrower, "CONTACT US" touching the button). It did **not** recur: the same page was reloaded
about 50 times afterwards (including 30 fresh loads measured alternately early and late, and a second full run),
and measured pixel positions were identical every time. I do not know the cause. If you ever see the menu touching
the button, please send a screenshot with the browser, window width and zoom level.

## 5. Performance (measured locally, phone width, no scrolling)

| Page group | Requests | Transferred (uncompressed) |
|---|---|---|
| Text-only pages (About, Privacy, 404) | 13–14 | 264–326 KB (fonts 70 KB plus 130–190 KB of logos and images) |
| Listing and detail pages | 21–22 | 366–410 KB |
| Home | 27 | 512 KB (the heaviest page) |
| Gallery | 28 | 510 KB |

- CSS: 40 KB in one file (about 9 KB gzipped, estimated by compressing the file myself). JavaScript: 15–42 KB loaded
  per page (74 KB for all files together).
- **No external requests** on any page except the Contact page, which asks `maps.google.com` for the map (the Privacy
  Policy says so). Detail pages load a map only after the visitor clicks "Show map".
- Fonts are local. Listing, gallery and detail images use lazy loading (I did not audit every image on every page).
- Sample photographs are 58–93 KB each. Real photographs will be larger and will dominate page weight, so follow
  the image guidance in the README.
- **Not measured:** real-network load time, Lighthouse scores, Core Web Vitals, and real GitHub Pages compression.
  The figures above are file sizes on a local server without compression.

---

## 6. NOT verified — please read

1. **Live GitHub Pages deployment.** Nothing has been committed or pushed, and I could not read the repository's
   Pages settings. I assumed "Deploy from a branch: `main` / root" because no workflow files exist. Confirm
   under Settings → Pages. The `/ppec/` path behaviour was tested only against my imitation of Pages.
2. **Real Google Maps.** External requests were blocked in my tests, so the map embed was never actually displayed.
   Check that the pin lands on your office (and fix `mapQuery` in `js/config.js` if not).
3. **Real WhatsApp, email and phone apps.** I verified the *addresses* the buttons open (`wa.me/233599762750?text=…`,
   `mailto:` with subject and body, `tel:`). I did not open them on a phone or in a mail program.
4. **Browsers and devices.** Only Chromium (desktop-sized emulation, including a 390 px phone viewport) was used.
   **Not tested:** Safari, iPhone, Firefox, Edge, Samsung Internet, real touch behaviour, or older phones.
   The image viewer uses the standard `<dialog>` element, which current browsers support, but that is unconfirmed here.
5. **Screen readers and manual accessibility.** axe finds only part of the possible problems. I did not test with
   NVDA, JAWS, VoiceOver or TalkBack, did not do a complete keyboard-only walkthrough (menu and viewer were
   scripted), and did not check zoom to 200–400%.
   axe also marked a few items "needs review" because text sits on photographs (the home hero heading and eyebrow,
   and the "Sample" badges on photos). **Their contrast has not been checked.** Check it with your real photos.
6. **Real content.** All content tested is sample or made-up test data. Real photographs, long descriptions,
   special characters in names and large numbers of records have not been tried. With hundreds of records, the
   listing would still work but has not been timed.
7. **Search and sharing.** I did not verify indexing, Google Search Console, social share previews, or whether the
   JSON-LD passes Google's tester. Detail pages are filled by JavaScript, so link previews for individual
   properties will show the generic template text.
8. **GitHub Pages' `robots.txt`.** It has no effect on a `github.io/ppec/` address (it must be at the domain root).
9. **Printing, dark-mode browsers, right-to-left languages, very small phones (under 360 px).** Not tested.
10. **Legal.** The Privacy Policy is a draft. No lawyer has reviewed it. The site also states no registration number,
    licence or certification, because none were supplied.
11. **Not run:** HTML validation by the W3C validator, link checking of external sites, or load testing.

---

## 7. How to repeat the checks that are in this repository

```
python3 tools/validate.py            # data, images, alt text, related ids, links, anchors
python3 tools/validate.py --strict   # warnings also fail
python3 tools/build_sitemap.py       # regenerate sitemap.xml and robots.txt
python3 -m http.server 8000          # then browse http://localhost:8000/ and try each page
```

Quick manual check before each release: open Home, Properties (search, filter, grid/list, Show more), a property,
Projects, a project, Gallery (open the viewer, press the arrow keys and Escape), News, an article, FAQ, Contact
(try an empty submit, then a valid one), Privacy, and a made-up address to see the 404 page, at both phone and
desktop width.
