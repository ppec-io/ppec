# Testing and Verification Report

Date: 1 November 2026. Only checks that were actually run are listed as passed. Section 5 lists what was **not** tested.

## 1. How the site was tested

- **Environment:** Chromium (headless, via Playwright) against a local web server that imitates GitHub Pages: the site was served under the sub-folder `/ppec/`, and unknown addresses returned `404.html` with status 404. The 404 page was also tested under a `*.github.io` host name.
- **Viewports:** desktop 1440 × 900, tablet 820 × 1100, mobile 390 × 844. Navigation was also tested at exactly 1101, 1280 and 1440 px (full menu) and 1100 px (button menu).
- **Data:** the real sample data in `data/`, plus a temporary **30-property / 14-project fixture** (not part of the repository) so that pagination, price filters, location filters and price sorting, which the sample data cannot exercise, could be tested.
- **Test scripts** were written for this review and are **not included in the repository**.

## 2. Results

| Check | Result |
|---|---|
| Automated browser suite (566 assertions) | **566 passed, 0 failed** (final run; the only edit after it was a one-line caption wording change, whose test was updated but not re-run in full) |
| Accessibility scan, axe-core (WCAG 2.0/2.1 A + AA, best-practice rules, "region" rule excluded), 16 pages × desktop and mobile | **0 violations** after fixes (see section 4) |
| `node tools/validate-data.js` on the delivered data and HTML | **No errors** |
| Validator on deliberately broken data (bad price, unknown category, duplicate id, missing image, unknown related id, bad status, invalid JSON) | **Every fault reported; exit code 1** |
| Syntax check of every file in `js/` | OK |

### Added for the latest update

- **Hero slider:** 7 slides from data, one active slide at a time, at least 6 different transitions, autoplay advances, pause works, every slide stepped through (all 8 effect types incl. cube and flip settle cleanly), previous button, dots, reduced-motion disables autoplay but manual use still works, no overflow on mobile, off-screen slides not keyboard-reachable.
- **3D showcase:** 4 featured properties, next arrow changes the centred item, items link to detail pages.
- **About Us drop-down:** opens on hover and keyboard, Escape closes and keeps focus, links visible inside the mobile menu.
- **Detail pages:** photo mosaic, four tabs with arrow-key navigation, slideshow thumbnails and arrows, floor plan and its viewer, video tab (native controls, poster, labelled sample), lightbox from every view.
- **Team, Careers, FAQ:** 6 people in 4 groups; one published vacancy (draft hidden); apply-by-email and WhatsApp messages carry the job reference; `#job-001` opens the vacancy; FAQ search, empty state and topic filter.
- **Brand:** the word "Classic" appears on no page.
- **Link crawl** now also requests every linked image and video file.

### What the original 467 assertions cover

- **All 14 pages × 3 viewports:** loads (HTTP 200), no horizontal overflow, every image loads, every image has an `alt` attribute, exactly one `<h1>`, no stuck loading or error state, no console errors or failed requests (Google Maps requests excepted, since the test sandbox has no internet), unique titles, meta description, canonical address.
- **Properties:** published-only rendering (draft hidden), featured block, category filter, free-text search, availability filter, empty state with reset, sort by name, grid/list toggle without reload, list view kept while filtering and across pages in the session, `?category=` deep link, card buttons (WhatsApp message contains the name, reference and full `https://ppec-io.github.io/ppec/...` address).
- **Projects:** published-only, status filter (5 statuses), category filter, no price controls.
- **Fixture data:** 9 per page with "Show more" up to 30, focus moves to the first new card, location filter, price range filter (unpriced records excluded), price sorting both ways with unpriced records last, newest, location A–Z, featured-first, free-text search of descriptions, map shown only when `mapQuery` is set, price formatting, specs row only when present, amenities, project progress bar value, milestones with ISO and free-text dates.
- **Detail pages:** title, document title, canonical updated from the record, thumbnail switching, lightbox (opens, arrow keys, buttons, Escape, focus returns), no empty spec rows, no invented price, WhatsApp / `tel:` / `mailto:` contents, related items (never itself), no bogus map for placeholder locations; missing id, unknown id, draft id, odd id and draft news id each show a friendly message, a way back and `noindex`; no invented progress percentage.
- **Gallery / news / FAQ / services / home / about:** category filters with `aria-pressed`, lightbox navigation, news list hides drafts, article rendering (`## ` headings), FAQ expand, services from JSON with anchors, home featured blocks, organisation JSON-LD built only from `config.js`, `?placeholders=1` highlighter still works.
- **Contact:** `?enquiry=` pre-selects properties and projects (and ignores unknown ids), validation messages, bad email rejected, WhatsApp message content and property address, `tel:` / `mailto:` links and map source from `config.js`, social links hidden when none are configured.
- **Navigation:** desktop menu fits on one row at 1101/1280/1440 px, button menu at 1100 px and on mobile, `aria-expanded`, Escape closes and returns focus, links navigate, `aria-current` on the active page.
- **Base path / deployment behaviour:** a crawl of every internal link starting from the home page under `/ppec/` found no broken or unexpected links; `404.html` loads its stylesheet, logo and fonts from a nested missing address and "Back to home" returns to `/ppec/index.html`; opened as `file://`, static pages work and data pages explain why the catalogue cannot load.
- **Failure handling:** a 500 response shows an error with a working "Try again" button that recovers; a JSON file that is not a list shows an error; a record containing only `id`, `status`, `name` and `category` renders cards and a detail page with no errors; an empty data file shows a friendly empty state.

### Page weight (mobile viewport, first screen, no scrolling, local measurement)

Measured again after the update: Home about 1.3 MB (mostly the first hero picture and logos), Properties 560 KB, a property detail page 820 KB. JavaScript is about 69 KB on the home page; CSS is 65 KB. Later hero pictures and the video load only when needed. GitHub Pages compresses text files, so transferred sizes will be smaller. The largest asset is the existing header logo PNG (about 130 KB).

## 3. Verification of specific requirements

| Requirement | How verified |
|---|---|
| Only published records shown | Draft records exist in every data file; checked absent from lists, search, related lists and by direct address |
| Missing optional fields do not break rendering | Minimal-record test above |
| Grid/List without reload and consistent for the session | Tested, including across the Properties and Projects pages |
| WhatsApp messages include the item name and website address | Message text decoded and compared |
| No fabricated data | Sample records are labelled; no prices, percentages, dates, awards or certifications were added; progress, price and map sections are hidden or say "to be confirmed" when data is absent |
| No credentials in front-end code | Code review of all files: none exist; no third-party scripts |
| No framework, backend or database | None used |
| Local fonts | Fonts are self-hosted; no requests to font services |

## 4. Problems found and fixed during testing

1. axe-core initially reported 48 violations. Fixed: the social-links container had an `aria-label` without a role (existing markup); button accessible names did not contain their visible text ("Enquire", "WhatsApp", gallery captions, the image viewer button); gold text on dark backgrounds and the gold service numbers on white were below AA contrast (existing styles); list pages jumped from `<h1>` to `<h3>`.
2. `404.html` loaded no styles when opened directly on a host that is not `*.github.io`; its base-path script now also handles a direct visit.
3. Latest update: the first suite run against the new build showed 12 failures plus a crash, all from out-of-date test expectations (record counts, hidden or lazy images, replaced gallery markup). One real fault was found by the new tests: off-screen hero slides kept keyboard-focusable links (fixed with `inert`). axe also flagged a `role=group` on an `<article>` and a mosaic button name that did not contain its visible label (both fixed).
4. Several early test failures were mistakes in the tests themselves (timing of lazy-loaded images, selectors matching extra text) and were corrected; none hid a site fault.

## 5. Not tested: please do not assume these work

- **The real deployment.** Nothing was committed, pushed or published. Behaviour on `https://ppec-io.github.io/ppec/` itself (including GitHub's own 404 handling) is inferred from the local imitation and must be checked after upload.
- **Browsers other than Chromium** (Safari, Firefox, Edge) and **real phones or tablets**. Layouts were checked only at emulated widths.
- **Live Google Maps and WhatsApp.** The embedded map could not load in the test sandbox; only that the correct address is supplied was checked. WhatsApp and email links were checked for their addresses and message text, not for opening the apps. The `mailto:` link opening an email program was not observed.
- **Screen readers and manual keyboard walkthroughs.** Automated scanning and keyboard-event tests were run; assistive technology was not.
- **Performance tooling** (Lighthouse / WebPageTest) and slow-network behaviour.
- **The Privacy Policy** is a draft describing how the site technically works; it has had no legal review.
- Whether **sample photographs** are free of third-party copyright (the README flags this for the company to resolve).
- **Video playback.** The sample MP4 is H.264. The test Chromium reported it can play it and the player renders with poster and controls, but playback itself was not watched; other browsers were not tried.
- **Visual quality on real devices:** screenshots were reviewed at emulated sizes only. On a phone the home hero text sits over a bright part of the first picture; check legibility on a real phone.
- **Image licence of the new sample photographs** (see README, section 1).
- **Data accuracy.** The telephone number, email, address and map pin were supplied by the company and have not been verified.
