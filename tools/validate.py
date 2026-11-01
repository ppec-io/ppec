#!/usr/bin/env python3
"""
Validate the website's data and links before deploying.

    python3 tools/validate.py            # check everything
    python3 tools/validate.py --strict   # treat warnings as failures too

Checks:
  * every file in data/ is valid JSON (reports the line and column of a mistake)
  * every record has a unique id, a valid status and the required fields
  * categories, availability and project statuses exist in data/taxonomy.json
  * image files exist and have alt text
  * "related" ids point at real records
  * links and images in the .html pages point at files that exist

Needs only Python 3 (no packages to install). Exit code 0 = OK, 1 = problems found.
"""
import json, os, re, sys, glob
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors, warnings = [], []
ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)

def load(name):
    path = os.path.join(ROOT, "data", name + ".json")
    if not os.path.exists(path):
        err(f"data/{name}.json is missing"); return None
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        err(f"data/{name}.json is not valid JSON: {e.msg} at line {e.lineno}, column {e.colno}")
    except UnicodeDecodeError:
        err(f"data/{name}.json is not saved as UTF-8")
    return None

def file_exists(rel): return os.path.isfile(os.path.join(ROOT, rel))

def need(rec, where, key, kinds):
    v = rec.get(key)
    if v is None or (isinstance(v, str) and not v.strip()):
        err(f"{where}: '{key}' is required"); return None
    if not isinstance(v, kinds):
        err(f"{where}: '{key}' has the wrong type"); return None
    return v

def check_images(rec, where, key="images", require=False, type_ok=None):
    imgs = rec.get(key)
    if imgs is None:
        if require: err(f"{where}: needs at least one image")
        return
    if not isinstance(imgs, list):
        err(f"{where}: '{key}' must be a list"); return
    if require and not imgs: err(f"{where}: needs at least one image")
    for i, im in enumerate(imgs, 1):
        w = f"{where} image {i}"
        if not isinstance(im, dict): err(f"{w}: must be an object"); continue
        src = im.get("src")
        if not src: err(f"{w}: 'src' is required")
        elif not str(src).startswith("http") and not file_exists(src): err(f"{w}: file not found: {src}")
        th = im.get("thumb")
        if th and not file_exists(th): err(f"{w}: thumbnail not found: {th}")
        if not (im.get("alt") or "").strip(): err(f"{w}: 'alt' text is required (describe the picture for screen-reader users)")
        if type_ok and im.get("type") not in (None, *type_ok): err(f"{w}: 'type' must be one of {sorted(type_ok)}")
        if src and file_exists(src) and os.path.getsize(os.path.join(ROOT, src)) > 600 * 1024:
            warn(f"{w}: {src} is over 600 KB; compress it for faster loading")

def records(name, tax):
    data = load(name)
    if data is None: return []
    if not isinstance(data, list):
        err(f"data/{name}.json must be a list [ ... ] of records"); return []
    seen, out = set(), []
    for n, rec in enumerate(data, 1):
        where = f"data/{name}.json record {n}"
        if not isinstance(rec, dict): err(f"{where}: must be an object {{ ... }}"); continue
        rid = rec.get("id")
        if not isinstance(rid, str) or not ID_RE.match(rid):
            err(f"{where}: 'id' must be lowercase letters, numbers and hyphens (got {rid!r})"); continue
        where = f"data/{name}.json '{rid}'"
        if rid in seen: err(f"{where}: duplicate id"); continue
        seen.add(rid)
        if rec.get("status") not in ("published", "draft"):
            err(f"{where}: 'status' must be \"published\" or \"draft\"")
        for flag in ("featured", "placeholder"):
            if flag in rec and not isinstance(rec[flag], bool): err(f"{where}: '{flag}' must be true or false")
        out.append((where, rec))
    return out

def ids_of(recs): return {r["id"] for _, r in recs}
def tax_ids(tax, key): return {t["id"] for t in (tax or {}).get(key, [])}

def check_related(recs):
    ids = ids_of(recs)
    for where, r in recs:
        for rid in r.get("related") or []:
            if rid not in ids: err(f"{where}: related id '{rid}' does not exist")
            if rid == r["id"]: err(f"{where}: a record cannot be related to itself")

def main():
    strict = "--strict" in sys.argv
    tax = load("taxonomy")
    if tax is not None:
        for key in ("propertyCategories", "availability", "projectCategories", "projectStatuses", "galleryCategories", "newsCategories", "faqCategories"):
            if not isinstance(tax.get(key), list) or not tax.get(key): err(f"data/taxonomy.json: '{key}' list is missing")

    # ---- properties
    props = records("properties", tax)
    cats, avail = tax_ids(tax, "propertyCategories"), tax_ids(tax, "availability")
    for where, r in props:
        need(r, where, "title", str); need(r, where, "category", str); need(r, where, "location", str)
        if r.get("category") and r["category"] not in cats: err(f"{where}: unknown category '{r['category']}' (see data/taxonomy.json)")
        if r.get("availability") and r["availability"] not in avail: err(f"{where}: unknown availability '{r['availability']}'")
        if r.get("dateAdded") and not DATE_RE.match(str(r["dateAdded"])): err(f"{where}: 'dateAdded' must look like 2026-01-31")
        p = r.get("price")
        if p is not None:
            if not isinstance(p, dict): err(f"{where}: 'price' must be an object")
            else:
                a = p.get("amount")
                if a is not None and (isinstance(a, bool) or not isinstance(a, (int, float)) or a < 0): err(f"{where}: price 'amount' must be a number (no quotes, no commas)")
                if isinstance(a, (int, float)) and not isinstance(a, bool) and p.get("verified") is not True:
                    warn(f"{where}: has a price but \"verified\" is not true, so the price will NOT be shown")
        s = r.get("specs") or {}
        for k in ("bedrooms", "bathrooms"):
            if s.get(k) is not None and (isinstance(s[k], bool) or not isinstance(s[k], int)): err(f"{where}: specs.{k} must be a whole number")
        check_images(r, where, require=(r.get("status") == "published"))
        if r.get("status") == "published" and not (r.get("summary") or r.get("description")): warn(f"{where}: has no summary or description")
    check_related(props)

    # ---- projects
    projs = records("projects", tax)
    cats, sts = tax_ids(tax, "projectCategories"), tax_ids(tax, "projectStatuses")
    for where, r in projs:
        need(r, where, "title", str); need(r, where, "category", str); need(r, where, "location", str); need(r, where, "projectStatus", str)
        if r.get("category") and r["category"] not in cats: err(f"{where}: unknown category '{r['category']}'")
        if r.get("projectStatus") and r["projectStatus"] not in sts: err(f"{where}: unknown projectStatus '{r['projectStatus']}'")
        if r.get("dateAdded") and not DATE_RE.match(str(r["dateAdded"])): err(f"{where}: 'dateAdded' must look like 2026-01-31")
        check_images(r, where, require=(r.get("status") == "published"), type_ok={"photo", "render"})
        pr = r.get("progress") or {}
        pc = pr.get("percent")
        if pc is not None and (isinstance(pc, bool) or not isinstance(pc, (int, float)) or not 0 <= pc <= 100): err(f"{where}: progress.percent must be a number from 0 to 100")
        for m in r.get("milestones") or []:
            if not isinstance(m, dict) or not m.get("title"): err(f"{where}: every milestone needs a 'title'"); continue
            if m.get("status") not in (None, "done", "in-progress", "upcoming"): err(f"{where}: milestone status must be done, in-progress or upcoming")
    check_related(projs)

    # ---- services
    for where, r in records("services", tax):
        need(r, where, "title", str); need(r, where, "summary", str)
        if "order" in r and (isinstance(r["order"], bool) or not isinstance(r["order"], int)): err(f"{where}: 'order' must be a whole number")

    # ---- news
    cats = tax_ids(tax, "newsCategories")
    for where, r in records("news", tax):
        need(r, where, "title", str)
        if r.get("category") not in cats: err(f"{where}: unknown category '{r.get('category')}'")
        if not DATE_RE.match(str(r.get("date", ""))): err(f"{where}: 'date' must look like 2026-01-31")
        if not isinstance(r.get("content"), list) or not r.get("content"): err(f"{where}: 'content' must be a list of paragraphs")
        cov = r.get("cover")
        if cov:
            check_images({"c": [cov]}, where + " cover", key="c")

    # ---- faqs
    cats = tax_ids(tax, "faqCategories")
    for where, r in records("faqs", tax):
        need(r, where, "question", str); need(r, where, "answer", str)
        if r.get("category") not in cats: err(f"{where}: unknown category '{r.get('category')}'")

    # ---- gallery
    cats = tax_ids(tax, "galleryCategories")
    for where, r in records("gallery", tax):
        need(r, where, "title", str)
        if r.get("category") not in cats: err(f"{where}: unknown category '{r.get('category')}'")
        check_images({"i": [r]}, where, key="i", require=True)

    check_html()

    for w in warnings: print("WARNING:", w)
    for e in errors: print("ERROR:  ", e)
    sample = 0
    for n in ("properties", "projects", "news", "gallery", "faqs"):
        d = load(n) or []
        sample += sum(1 for r in d if isinstance(r, dict) and r.get("status") == "published" and r.get("placeholder"))
    if sample: print(f"NOTE:    {sample} published record(s) are still marked \"placeholder\": true (sample content).")
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    sys.exit(1 if errors or (strict and warnings) else 0)

# ------------------------------------------------------------------ HTML links
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.refs = []; self.ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"): self.ids.add(a["id"])
        for k in ("href", "src"):
            if a.get(k) and tag in ("a", "link", "img", "script", "iframe", "source"): self.refs.append((tag, a[k]))

def check_html():
    pages = sorted(glob.glob(os.path.join(ROOT, "*.html")))
    parsed = {}
    for p in pages:
        h = Links()
        with open(p, encoding="utf-8") as f: h.feed(f.read())
        parsed[os.path.basename(p)] = h
    services = {r.get("id") for r in (load("services") or []) if isinstance(r, dict)}
    faqs = {r.get("id") for r in (load("faqs") or []) if isinstance(r, dict)}
    for name, h in parsed.items():
        for tag, ref in h.refs:
            if re.match(r"^(https?:|mailto:|tel:|data:|//)", ref): continue
            if ref.startswith("#"):
                if ref[1:] and ref[1:] not in h.ids: err(f"{name}: link to #{ref[1:]} but no element has that id")
                continue
            path, _, frag = re.sub(r"\?.*?(#|$)", r"\1", ref).partition("#")
            if not path: continue
            if not file_exists(path): err(f"{name}: {tag} points to '{path}' which does not exist"); continue
            if frag and path.endswith(".html"):
                target = parsed.get(path)
                dynamic = {"services.html": services, "faq.html": faqs}.get(path, set())
                if target and frag not in target.ids and frag not in dynamic: err(f"{name}: link to {path}#{frag} but that id does not exist")

if __name__ == "__main__":
    main()
