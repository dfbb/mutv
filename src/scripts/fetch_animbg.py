#!/usr/bin/env python3
"""Fetch all fullscreen effects from htmlhub.org /library into src/animbg/.

For each effect detail page, the full self-contained HTML lives in
<pre data-content="all"><code>…escaped…</code></pre>; BeautifulSoup's
get_text() returns it unescaped and runnable.

Outputs:
  src/animbg/<label>/index.html   one per effect
  src/animbg/manifest.json        [{label,name,category,tech,sourceUrl,fetchedAt}]

Idempotent: re-running overwrites. Failures are logged and skipped, not fatal.
"""
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

BASE = "https://htmlhub.org"
LIBRARY = BASE + "/library"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; mtv-animbg-fetch/1.0)"}
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.normpath(os.path.join(HERE, "..", "animbg"))
DELAY = 0.5  # polite spacing between requests (seconds)


def get(url):
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def collect_detail_urls():
    """Return sorted unique list of /library/<cat>/<slug> absolute URLs."""
    html = get(LIBRARY)
    paths = set(re.findall(r"/library/[a-z0-9-]+/[a-z0-9-]+", html))
    # Also crawl each category page to catch effects not linked on /library.
    cats = set(re.findall(r"/library/([a-z0-9-]+)(?:\"|/)", html))
    for cat in sorted(cats):
        try:
            chtml = get(LIBRARY + "/" + cat)
            paths.update(re.findall(r"/library/" + re.escape(cat) + r"/[a-z0-9-]+", chtml))
            time.sleep(DELAY)
        except Exception as e:
            print(f"  ! category {cat} failed: {e}", file=sys.stderr)
    return sorted(BASE + p for p in paths)


def parse_detail(url):
    """Return (label, name, category, tech, html) or None on failure."""
    html = get(url)
    soup = BeautifulSoup(html, "html.parser")
    pre = soup.select_one('pre[data-content="all"]')
    if pre is None:
        return None
    doc = pre.get_text()
    if "<!DOCTYPE" not in doc and "<html" not in doc:
        return None
    m = re.search(r"/library/([a-z0-9-]+)/([a-z0-9-]+)", url)
    category, slug = (m.group(1), m.group(2)) if m else ("misc", url.rsplit("/", 1)[-1])
    label = slug
    h1 = soup.find("h1")
    name = h1.get_text(strip=True) if h1 else slug
    lower = doc.lower()
    tech = "webgl" if ("three" in lower or "webgl" in lower) else ("svg" if "<svg" in lower else "canvas")
    return label, name, category, tech, doc


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    urls = collect_detail_urls()
    print(f"Found {len(urls)} detail URLs")
    manifest = []
    seen_labels = {}
    ok = fail = 0
    for url in urls:
        try:
            parsed = parse_detail(url)
            if parsed is None:
                print(f"  ! no source block: {url}", file=sys.stderr)
                fail += 1
                continue
            label, name, category, tech, doc = parsed
            # de-dup labels across categories
            if label in seen_labels and seen_labels[label] != category:
                label = f"{category}-{label}"
            seen_labels[label] = category
            d = os.path.join(OUT_DIR, label)
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
                f.write(doc)
            manifest.append({
                "label": label, "name": name, "category": category, "tech": tech,
                "sourceUrl": url, "fetchedAt": datetime.now(timezone.utc).isoformat(),
            })
            ok += 1
            print(f"  + {label} ({tech})")
            time.sleep(DELAY)
        except Exception as e:
            print(f"  ! {url} failed: {e}", file=sys.stderr)
            fail += 1
    manifest.sort(key=lambda x: x["label"])
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"\nDone: {ok} ok, {fail} failed. manifest.json has {len(manifest)} entries.")
    if ok == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
