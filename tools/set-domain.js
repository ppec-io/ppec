#!/usr/bin/env node
/* ==========================================================================
   set-domain.js — move the site to a new public address (for example a custom domain).

     node tools/set-domain.js https://www.example.com/            show what would change
     node tools/set-domain.js https://www.example.com/ --apply    make the changes

   It replaces the current SITE.siteUrl with the new address in every .html file,
   js/config.js, robots.txt and sitemap.xml. It does NOT create the CNAME file or DNS
   records (see README, "Custom domain"). Run tools/validate-data.js --sitemap afterwards.
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const target = process.argv[2];
const apply = process.argv.includes("--apply");
if (!target || !/^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w./-]*)?$/i.test(target)) {
  console.error("Give the new address, starting with https:// (for example https://www.example.com/)");
  process.exit(2);
}
const next = target.endsWith("/") ? target : target + "/";

const cfgPath = path.join(ROOT, "js", "config.js");
const cfg = fs.readFileSync(cfgPath, "utf8");
const m = /siteUrl:\s*"([^"]+)"/.exec(cfg);
if (!m) { console.error("Could not find siteUrl in js/config.js"); process.exit(2); }
const prev = m[1].endsWith("/") ? m[1] : m[1] + "/";
if (prev === next) { console.log("siteUrl is already " + next + ". Nothing to do."); process.exit(0); }

const files = fs.readdirSync(ROOT).filter((f) => /\.(html|txt|xml)$/.test(f)).concat(["js/config.js"]);
let total = 0;
files.forEach((f) => {
  const p = path.join(ROOT, f);
  const text = fs.readFileSync(p, "utf8");
  const parts = text.split(prev);
  if (parts.length === 1) return;
  const n = parts.length - 1; total += n;
  console.log((apply ? "updated " : "would update ") + f + " (" + n + ")");
  if (apply) fs.writeFileSync(p, parts.join(next));
});
console.log((apply ? "Done: " : "Dry run: ") + total + " replacement(s) of " + prev + " -> " + next);
if (!apply) console.log("Run again with --apply to make the changes.");
else console.log("Next: node tools/validate-data.js --sitemap");
