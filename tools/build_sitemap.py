#!/usr/bin/env python3
"""
Regenerate sitemap.xml and robots.txt from the site address in js/config.js and the
published, non-sample records in data/.

    python3 tools/build_sitemap.py

Run it after adding real properties, projects or news articles, then upload the
updated sitemap.xml. Sample records (placeholder: true) are left out on purpose.
Needs only Python 3.
"""
import json, os, re
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = open(os.path.join(ROOT, "js", "config.js"), encoding="utf-8").read()
m = re.search(r'siteUrl:\s*"([^"]+)"', cfg)
if not m: raise SystemExit("Could not find siteUrl in js/config.js")
base = m.group(1)
if not base.endswith("/"): base += "/"

pages = ["", "about.html", "services.html", "properties.html", "projects.html", "gallery.html", "news.html", "faq.html", "contact.html", "privacy.html"]
urls = [base + p for p in pages]

def add(name, page):
    path = os.path.join(ROOT, "data", name + ".json")
    if not os.path.exists(path): return
    for r in json.load(open(path, encoding="utf-8")):
        if r.get("status") == "published" and not r.get("placeholder"):
            urls.append(f"{base}{page}?id={quote(r['id'])}")
add("properties", "property-details.html")
add("projects", "project-details.html")
add("news", "news-details.html")

with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in urls:
        f.write(f"  <url><loc>{u.replace('&', '&amp;')}</loc></url>\n")
    f.write("</urlset>\n")
with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\n\nSitemap: {base}sitemap.xml\n")
print(f"Wrote sitemap.xml ({len(urls)} addresses) and robots.txt for {base}")
