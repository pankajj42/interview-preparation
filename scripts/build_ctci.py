"""Extract every tab of Crack_The_Coding_Interview.xlsx into data/ctci.json (no row is dropped or altered)."""
import json, re, sys
from openpyxl import load_workbook

import os
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source-files', 'Crack_The_Coding_Interview.xlsx')
wb = load_workbook(SRC)
BASE = "https://leetcode.com/problems/"
slugify = lambda s: re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))

PRIORITY = ["Must Do Questions (1 - 500)", "Can Do Questions (501 - 1000)", "Optional"]
DIFFICULTY = ["Easy Questions", "Medium Questions", "Hard Questions"]
credit = wb.worksheets[0]["A1"].value
credit_url = wb.worksheets[0]["A2"].hyperlink.target if wb.worksheets[0]["A2"].hyperlink else wb.worksheets[0]["A2"].value

tabs = []
for ws in wb.worksheets:
    assert ws["A1"].value == credit
    rows = []
    for r in ws.iter_rows(min_row=5, max_col=4, values_only=True):
        if all(v is None for v in r):
            continue
        n, topic, url, diff = r
        url = str(url).strip()
        assert url.startswith(BASE) and "/" not in url[len(BASE):], url
        rows.append([int(n), str(topic), url[len(BASE):], str(diff)[0]])  # difficulty -> E / M / H
        assert str(diff) in ("Easy", "Medium", "Hard"), diff
    group = "priority" if ws.title in PRIORITY else "difficulty" if ws.title in DIFFICULTY else "topic"
    tabs.append({"slug": slugify(ws.title), "title": ws.title, "group": group, "rows": rows})

assert len(tabs) == 74 and sum(len(t["rows"]) for t in tabs) == 8221
assert len({t["slug"] for t in tabs}) == 74
json.dump({"credit": credit, "creditUrl": credit_url, "tabs": tabs}, open("data/ctci.json", "w"), separators=(",", ":"))
uniq = {r[2] for t in tabs for r in t["rows"]}
print(f"tabs={len(tabs)} rows={sum(len(t['rows']) for t in tabs)} unique problems={len(uniq)} credit={credit!r} url={credit_url}")
