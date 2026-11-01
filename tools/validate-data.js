#!/usr/bin/env node
/* ==========================================================================
   tools/validate-data.js — optional checker for the website content.
   Needs Node.js 16+ only on the computer running it (the website itself needs no Node).

     node tools/validate-data.js            check everything, exit 1 if there are errors
     node tools/validate-data.js --sitemap  also (re)write sitemap.xml from the published records

   Checks: JSON syntax, required fields, unique ids, allowed statuses and categories
   (from js/config.js), numeric prices, image files exist, related ids exist,
   and that every local link / script / image in the HTML pages exists.
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const errors = [], warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* ---------- config.js ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/config.js"), "utf8"), sandbox);
const SITE = sandbox.window.SITE;
const T = SITE.taxonomy;
const keys = (list) => list.map((x) => x.key);

/* ---------- helpers ---------- */
function load(name) {
  const file = path.join("data", name + ".json");
  try {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
    if (!Array.isArray(data)) { err(file + ": must be a list [ ... ] of records"); return []; }
    return data;
  } catch (e) { err(file + ": " + e.message); return []; }
}
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

function common(file, rec, idx) {
  const where = file + " #" + (idx + 1) + (rec && rec.id ? " (" + rec.id + ")" : "");
  if (!rec || typeof rec !== "object") { err(where + ": record must be an object"); return where; }
  if (!isStr(rec.id)) err(where + ": missing id");
  else if (!/^[a-z0-9][a-z0-9-]*$/.test(rec.id)) err(where + ": id must be lowercase letters, numbers and hyphens only");
  if (rec.status !== "published" && rec.status !== "draft") err(where + ': status must be "published" or "draft"');
  return where;
}
function uniqueIds(file, list) {
  const seen = {};
  list.forEach((r) => { if (r && r.id) { if (seen[r.id]) err(file + ": duplicate id " + r.id); seen[r.id] = true; } });
  return seen;
}
function checkImages(where, images) {
  if (images === undefined) return;
  if (!Array.isArray(images)) { err(where + ": images must be a list"); return; }
  images.forEach((im, i) => {
    if (!im || !isStr(im.src)) { err(where + ": images[" + i + "] needs a src"); return; }
    if (!exists(im.src)) err(where + ": image file not found: " + im.src);
    if (im.thumb !== undefined && !exists(im.thumb)) err(where + ": thumb file not found: " + im.thumb);
    if (!isStr(im.alt)) warn(where + ": images[" + i + "] has no alt text");
    if (im.type && im.type !== "photo" && im.type !== "render") err(where + ': images[' + i + '].type must be "photo" or "render"');
  });
}
function checkMedia(where, rec) {
  (rec.floorPlans || []).forEach((p, i) => {
    if (!p || !isStr(p.src)) err(where + ": floorPlans[" + i + "] needs a src");
    else if (!exists(p.src)) err(where + ": floor plan file not found: " + p.src);
  });
  (rec.videos || []).forEach((v, i) => {
    const w = where + ": videos[" + i + "]";
    if (!v || typeof v !== "object") { err(w + " must be an object"); return; }
    if (v.type === "youtube") { if (!/^[\w-]{11}$/.test(v.id || "")) err(w + ': youtube "id" must be the 11-character video id'); }
    else if (v.type === "vimeo") { if (!/^\d{5,12}$/.test(v.id || "")) err(w + ': vimeo "id" must be the numeric video id'); }
    else if (v.type === "file" || v.type === undefined) {
      if (!isStr(v.src) || !/^[\w\-./]+\.(mp4|webm|ogv)$/i.test(v.src)) err(w + ": src must be a local .mp4, .webm or .ogv path");
      else if (!exists(v.src)) err(w + ": video file not found: " + v.src);
      if (v.poster && !exists(v.poster)) err(w + ": poster file not found: " + v.poster);
    } else err(w + ': type must be "file", "youtube" or "vimeo"');
  });
}
function checkRelated(file, where, rec, ids) {
  (rec.related || []).forEach((r) => { if (!ids[r]) err(where + ": related id not found: " + r); });
}

/* ---------- properties ---------- */
const props = load("properties");
const propIds = uniqueIds("properties.json", props);
props.forEach((r, i) => {
  const w = common("properties.json", r, i);
  if (!isStr(r.name)) err(w + ": missing name");
  if (!keys(T.propertyCategories).includes(r.category)) err(w + ": category must be one of " + keys(T.propertyCategories).join(", "));
  if (r.availability !== undefined && !keys(T.availability).includes(r.availability)) err(w + ": availability must be one of " + keys(T.availability).join(", "));
  if (r.price !== undefined && (typeof r.price !== "number" || r.price < 0)) err(w + ": price must be a number (no currency symbol or commas), e.g. 450000");
  if (r.added !== undefined && !isDate(r.added)) err(w + ": added must be a date like 2026-10-31");
  checkImages(w, r.images); checkMedia(w, r); checkRelated("properties.json", w, r, propIds);
  if (r.status === "published" && (!r.images || !r.images.length)) warn(w + ": published without any image");
});

/* ---------- projects ---------- */
const projs = load("projects");
const projIds = uniqueIds("projects.json", projs);
projs.forEach((r, i) => {
  const w = common("projects.json", r, i);
  if (!isStr(r.name)) err(w + ": missing name");
  if (!keys(T.projectCategories).includes(r.category)) err(w + ": category must be one of " + keys(T.projectCategories).join(", "));
  if (!keys(T.projectStatuses).includes(r.projectStatus)) err(w + ": projectStatus must be one of " + keys(T.projectStatuses).join(", "));
  if (r.added !== undefined && !isDate(r.added)) err(w + ": added must be a date like 2026-10-31");
  if (r.progress && r.progress.percent !== undefined && (typeof r.progress.percent !== "number" || r.progress.percent < 0 || r.progress.percent > 100)) err(w + ": progress.percent must be a number from 0 to 100");
  (r.milestones || []).forEach((m, k) => {
    if (!m || !isStr(m.title)) err(w + ": milestones[" + k + "] needs a title");
    else if (m.status && !["done", "current", "upcoming"].includes(m.status)) err(w + ": milestones[" + k + '].status must be "done", "current" or "upcoming"');
  });
  checkImages(w, r.images); checkMedia(w, r); checkRelated("projects.json", w, r, projIds);
});

/* ---------- services, faqs, news, gallery ---------- */
const services = load("services"); uniqueIds("services.json", services);
services.forEach((r, i) => { const w = common("services.json", r, i); if (!isStr(r.title)) err(w + ": missing title"); if (!isStr(r.summary) && !isStr(r.description)) err(w + ": needs a summary or description"); });

services.forEach((r, i) => { if (r.image) checkImages("services.json #" + (i + 1) + " (" + r.id + ")", [r.image]); });

const HERO_FX = ["fade", "slide-left", "slide-right", "slide-up", "zoom", "wipe", "cube", "flip"];
const hero = load("hero"); uniqueIds("hero.json", hero);
hero.forEach((r, i) => {
  const w = common("hero.json", r, i);
  if (!isStr(r.title)) err(w + ": missing title");
  if (!r.image || !isStr(r.image.src)) err(w + ": missing image.src"); else checkImages(w, [r.image]);
  if (r.transition !== undefined && !HERO_FX.includes(r.transition)) err(w + ": transition must be one of " + HERO_FX.join(", "));
  [r.cta, r.cta2].forEach((c) => { if (c && !isStr(c.href)) err(w + ": cta needs a href"); });
});

const team = load("team"); uniqueIds("team.json", team);
team.forEach((r, i) => { const w = common("team.json", r, i); if (!isStr(r.name)) err(w + ": missing name"); if (r.photo) checkImages(w, [r.photo]); if (r.linkedin && !/^https:\/\//.test(r.linkedin)) err(w + ": linkedin must start with https://"); });

const careers = load("careers"); uniqueIds("careers.json", careers);
careers.forEach((r, i) => {
  const w = common("careers.json", r, i);
  if (!isStr(r.title)) err(w + ": missing title");
  if (r.closing && !isDate(r.closing)) err(w + ": closing must be a date like 2026-12-31");
});

const faqs = load("faqs"); uniqueIds("faqs.json", faqs);
faqs.forEach((r, i) => { const w = common("faqs.json", r, i); if (!isStr(r.question)) err(w + ": missing question"); if (!isStr(r.answer)) err(w + ": missing answer"); });

const news = load("news"); uniqueIds("news.json", news);
news.forEach((r, i) => {
  const w = common("news.json", r, i);
  if (!isStr(r.title)) err(w + ": missing title");
  if (!isDate(r.date)) err(w + ": date must be like 2026-10-31");
  if (!Array.isArray(r.content) || !r.content.length) err(w + ": content must be a list of paragraphs");
  if (r.cover) checkImages(w, [r.cover]);
});

const gallery = load("gallery"); uniqueIds("gallery.json", gallery);
gallery.forEach((r, i) => {
  const w = common("gallery.json", r, i);
  if (!keys(T.galleryCategories).includes(r.category)) err(w + ": category must be one of " + keys(T.galleryCategories).join(", "));
  if (!isStr(r.src)) err(w + ": missing src"); else if (!exists(r.src)) err(w + ": image file not found: " + r.src);
  if (!isStr(r.alt)) warn(w + ": no alt text");
  if (r.related && !propIds[r.related] && !projIds[r.related]) err(w + ": related id not found: " + r.related);
});

/* ---------- HTML pages ---------- */
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
pages.forEach((f) => {
  const html = fs.readFileSync(path.join(ROOT, f), "utf8");
  const re = /\s(?:href|src)="([^"]+)"/g; let m;
  while ((m = re.exec(html))) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(u) || u.indexOf("'") !== -1) continue;
    const file = u.split("#")[0].split("?")[0];
    if (file && !exists(file)) err(f + ": missing file referenced: " + u);
  }
  const canon = /<link rel="canonical" href="([^"]+)"/.exec(html);
  if (f !== "404.html") {
    if (!canon) warn(f + ": no canonical link");
    else {
      const expect = SITE.siteUrl + (f === "index.html" ? "" : f);
      if (canon[1] !== expect) err(f + ": canonical is " + canon[1] + " but should be " + expect + " (check siteUrl in js/config.js)");
    }
  }
});

/* ---------- sitemap ---------- */
if (process.argv.includes("--sitemap")) {
  const urls = pages.filter((f) => f !== "404.html" && f !== "property-details.html" && f !== "project-details.html" && f !== "news-details.html")
    .map((f) => SITE.siteUrl + (f === "index.html" ? "" : f));
  props.filter((r) => r.status === "published").forEach((r) => urls.push(SITE.siteUrl + "property-details.html?id=" + encodeURIComponent(r.id)));
  projs.filter((r) => r.status === "published").forEach((r) => urls.push(SITE.siteUrl + "project-details.html?id=" + encodeURIComponent(r.id)));
  news.filter((r) => r.status === "published").forEach((r) => urls.push(SITE.siteUrl + "news-details.html?id=" + encodeURIComponent(r.id)));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => "  <url><loc>" + u + "</loc></url>").join("\n") + "\n</urlset>\n";
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
  console.log("sitemap.xml written (" + urls.length + " URLs)");
}

/* ---------- report ---------- */
const count = (l) => l.length;
console.log("Checked: " + count(props) + " properties, " + count(projs) + " projects, " + count(services) + " services, " +
  count(faqs) + " FAQs, " + count(hero) + " hero slides, " + count(team) + " team profiles, " + count(careers) + " vacancies, " + count(news) + " news items, " + count(gallery) + " gallery images, " + pages.length + " HTML pages.");
warnings.forEach((w) => console.log("WARNING: " + w));
errors.forEach((e) => console.log("ERROR:   " + e));
console.log(errors.length ? "\n" + errors.length + " error(s) found." : "\nNo errors found.");
process.exit(errors.length ? 1 : 0);
