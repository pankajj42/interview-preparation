"""Cut ultimate-dp-guide-v2.html into exact-markup fragments + structured data (patterns, problem groups, rows)."""
import json, re, sys, os
from bs4 import BeautifulSoup
sys.path.insert(0, os.path.dirname(__file__))
from htmlrange import index, find, outer, classes

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source-files', 'ultimate-dp-guide-v2.html')
raw = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
els = index(raw)
norm = lambda t: re.sub(r"\s+", "", t)

def one(**kw):
    r = find(els, **kw)
    assert len(r) == 1, (kw, len(r))
    return r[0]

def text_of(frag):
    return norm(BeautifulSoup(frag, "lxml").get_text())

# ---- id -> destination page (for internal anchors, which become routes)
PAGE = {"engine": "/dp", "start": "/dp", "patterns": "/dp/patterns", "problem-bank": "/dp/problem-bank",
        "cross-reference": "/dp/reference", "interview": "/dp/reference", "quick-reference": "/dp/reference",
        "revision": "/revision"}
for i in range(1, 23):
    PAGE[f"pattern-{i}"] = "/dp/patterns"; PAGE[f"problems-{i}"] = "/dp/problem-bank"
href_fix = []
def fix_hrefs(frag):
    def rep(m):
        target = m.group(1)
        if target in PAGE:
            href_fix.append(target)
            return f'href="{PAGE[target]}#{target}"'
        return m.group(0)
    return re.sub(r'href="#([^"]+)"', rep, frag)

os.makedirs("content/dp", exist_ok=True)
frags = {}
def save(name, el):
    frag = outer(raw, el)
    assert text_of(frag) == norm(soup.select_one(f"#{el['attrs']['id']}").get_text()) if el["attrs"].get("id") else True
    frags[name] = fix_hrefs(frag)

hero = [e for e in find(els, tag="header") if "hero" in classes(e)][0]
frags["hero"] = fix_hrefs(outer(raw, hero))
save("engine", one(tag="section", id="engine"))
sections = {e["attrs"].get("id") or re.sub(r"<[^>]+>", " ", raw[e["open_end"]:e["open_end"] + 300]).split()[0:3].__str__(): e
            for e in find(els, tag="section") if "utility-section" in classes(e)}
def util_by_heading(prefix):
    for e in find(els, tag="section"):
        if "utility-section" in classes(e):
            h = BeautifulSoup(outer(raw, e), "lxml").find("h2")
            if h and h.get_text(" ", strip=True).startswith(prefix): return e
    raise KeyError(prefix)
frags["cross-reference"] = fix_hrefs(outer(raw, one(tag="section", id="cross-reference")))
frags["interview"] = fix_hrefs(outer(raw, one(tag="section", id="interview")))
frags["cses"] = fix_hrefs(outer(raw, util_by_heading("CSES")))
frags["atcoder"] = fix_hrefs(outer(raw, util_by_heading("AtCoder")))
frags["quick-reference"] = fix_hrefs(outer(raw, one(tag="section", id="quick-reference")))
frags["study-loop"] = fix_hrefs(outer(raw, util_by_heading("A repeatable study loop")))
foot = [e for e in find(els, tag="footer") if "footer" in classes(e)][0]
frags["footer"] = fix_hrefs(outer(raw, foot))

# ---- patterns (22): exact markup of the diagram/explanation block and the details block
patterns = []
for card in [e for e in find(els, tag="article") if "pattern-card" in classes(e)]:
    n = int(card["attrs"]["data-pattern"])
    layout = [e for e in find(els, tag="div", within=card) if "pattern-layout" in classes(e)][0]
    details = [e for e in find(els, tag="div", within=card) if "pattern-details" in classes(e)][0]
    sp = soup.select_one(f"#pattern-{n}")
    patterns.append({
        "n": n, "label": sp.select_one(".pattern-index").get_text(strip=True), "eyebrow": sp.select_one(".eyebrow").get_text(strip=True),
        "title": sp.select_one("h2").get_text(strip=True), "search": card["attrs"].get("data-search", ""),
        "layoutHtml": fix_hrefs(outer(raw, layout)), "detailsHtml": fix_hrefs(outer(raw, details)),
    })
    assert text_of(patterns[-1]["layoutHtml"]) == norm(sp.select_one(".pattern-layout").get_text())
    assert text_of(patterns[-1]["detailsHtml"]) == norm(sp.select_one(".pattern-details").get_text())
assert [p["n"] for p in patterns] == list(range(1, 23))

# ---- problem bank (22 groups, 239 rows)
groups, total = [], 0
for g in soup.select("section.problem-group"):
    n = int(g["id"].split("-")[1])
    rows = []
    for r in g.select(".problem-row"):
        links = [{"url": a["href"], "text": a.get_text(" ", strip=True)} for a in r.select("a.problem-link")]
        nolink = r.select_one(".no-link")
        diff = r.select_one(".difficulty")
        rows.append({
            "key": r["data-problem"], "name": r.select_one(".problem-name").get_text(strip=True),
            "tags": r.select_one(".problem-tags").get_text(strip=True), "diff": diff.get_text(strip=True),
            "links": links, "noLink": nolink.get_text(strip=True) if nolink else None,
        })
    total += len(rows)
    groups.append({"n": n, "label": g.select_one(".group-number").get_text(strip=True), "title": g.select_one("h2").get_text(strip=True),
                   "count": g.select_one(".count-badge").get_text(strip=True), "rows": rows})
assert [g["n"] for g in groups] == list(range(1, 23)) and total == 239, total
assert len({r["key"] for g in groups for r in g["rows"]}) == 209

for name, frag in frags.items():
    open(f"content/dp/{name}.html", "w", encoding="utf-8").write(frag)
json.dump({"patterns": patterns, "groups": groups}, open("data/dp.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("fragments:", {k: len(v) for k, v in frags.items()})
print("patterns", len(patterns), "groups", len(groups), "rows", total, "anchors rewritten:", len(href_fix), sorted(set(href_fix))[:6])
rem = re.findall(r'href="(#[^"]*)"', "".join(frags.values()) + "".join(p["layoutHtml"] + p["detailsHtml"] for p in patterns))
print("unmapped in-page anchors left:", sorted(set(rem)))
# the original CSS (non-SVG style blocks) for the scoping step
css = "\n".join(st.get_text() for st in soup.find_all("style") if st.find_parent("svg") is None)
open("scripts/source/dp.css", "w", encoding="utf-8").write(css)
print("css bytes", len(css))
