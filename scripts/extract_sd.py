"""Cut system-design-blueprint.html into one exact-markup fragment per part + a topic index (TOC)."""
import json, re, sys, os
from bs4 import BeautifulSoup
sys.path.insert(0, os.path.dirname(__file__))
from htmlrange import index, find, outer, inner, classes

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source-files', 'system-design-blueprint.html')
raw = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
els = index(raw)
norm = lambda t: re.sub(r"\s+", "", t)

content = [e for e in find(els, tag="div", id="content")][0]
ci = els.index(content)
kids = [e for e in els if e["parent"] == ci]

H = {"h2": 2, "h3": 3, "h4": 4}
CHK = re.compile(r'<span aria-checked="false" class="chk chk-inline" data-key="([^"]+)" role="checkbox" tabindex="0"></span>')
EXTRA = ["51-an-8-week-plan", "52-where-this-guides-structure-came-from", "53-practicing-beyond-this-guide"]  # keyed in the original sidebar only

# ---- split into parts at every <h2>
parts, cur = [], None
for k in kids:
    if k["tag"] == "h2":
        cur = {"id": k["attrs"]["id"], "kids": []}
        parts.append(cur)
    cur["kids"].append(k)
assert len(parts) == 7, len(parts)

def route_slug(title, i):
    if i == 0: return "welcome"
    m = re.match(r"Part ([0IVX]+)", title)
    roman = m.group(1)
    return "part-" + ("0" if roman == "0" else str({"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}[roman]))

id_to_slug, out_parts, toc_parts, keys_seen = {}, [], [], []
for i, p in enumerate(parts):
    title = BeautifulSoup(outer(raw, p["kids"][0]), "lxml").get_text(" ", strip=True)
    p["slug"] = route_slug(title, i); p["title"] = title
    for k in p["kids"]:
        if k["attrs"].get("id"): id_to_slug[k["attrs"]["id"]] = p["slug"]

def heading_info(frag):
    h = BeautifulSoup(frag, "lxml").find(["h2", "h3", "h4"])
    for t in h.select(".chk"): t.decompose()
    sn = h.select_one(".sec-num")
    num = sn.get_text(strip=True) if sn else ""
    if sn: sn.decompose()
    return num, h.get_text(" ", strip=True)

for p in parts:
    out, cursor, stack, topics = [], p["kids"][0]["start"], [], []
    for k in p["kids"]:
        out.append(raw[cursor:k["start"]])
        if k["tag"] in H:
            lvl = H[k["tag"]]
            while stack and stack[-1][0] >= lvl:
                out.append(f'<div class="sd-remarks-slot" data-key="{stack.pop()[1]}"></div>\n')
            frag = outer(raw, k)
            m = CHK.search(frag)
            key = m.group(1) if m else (k["attrs"]["id"] if k["attrs"].get("id") in EXTRA else None)
            if m:
                frag = CHK.sub(lambda mm: f'<span class="sd-slot" data-key="{mm.group(1)}"></span>', frag, count=1)
            elif key:
                frag = re.sub(r"^(<h[34][^>]*>)", lambda mm: mm.group(1) + f'<span class="sd-slot" data-key="{key}"></span>', frag, count=1)
            if key:
                num, ttl = heading_info(outer(raw, k))
                topics.append({"key": key, "level": lvl, "num": num, "title": ttl}); keys_seen.append(key)
                stack.append((lvl, key))
            out.append(frag)
        else:
            out.append(outer(raw, k))
        cursor = k["end"]
    while stack:
        out.append(f'\n<div class="sd-remarks-slot" data-key="{stack.pop()[1]}"></div>')
    html = "".join(out)
    # anchors -> routes
    def rep(m):
        t = m.group(1)
        return f'href="/system-design/{id_to_slug[t]}#{t}"' if t in id_to_slug else m.group(0)
    html = re.sub(r'href="#([^"]+)"', rep, html)
    p["html"] = html
    toc_parts.append({"slug": p["slug"], "id": p["id"], "title": p["title"], "topics": topics})

assert len(keys_seen) == 81 and len(set(keys_seen)) == 81, (len(keys_seen), len(set(keys_seen)))
os.makedirs("content/sd", exist_ok=True)
for p in parts:
    open(f"content/sd/{p['slug']}.html", "w", encoding="utf-8").write(p["html"])
hero = [e for e in find(els, tag="div") if "hero" in classes(e)][0]
hero_html = re.sub(r'href="#([^"]+)"', lambda m: f'href="/system-design/{id_to_slug[m.group(1)]}#{m.group(1)}"' if m.group(1) in id_to_slug else m.group(0), outer(raw, hero))
open("content/sd/hero.html", "w", encoding="utf-8").write(hero_html)

# ---- fidelity: text of all fragments == text of the original #content (minus the checkbox glyph spans)
orig = BeautifulSoup(outer(raw, content), "lxml")
for t in orig.select(".chk"): t.decompose()
joined = BeautifulSoup("".join(p["html"] for p in parts), "lxml")
assert norm(orig.get_text()) == norm(joined.get_text()), "text mismatch"
cnt = lambda s, sel: len(BeautifulSoup(s, "lxml").select(sel))
allhtml = "".join(p["html"] for p in parts)
stats = {"parts": len(parts), "mermaid": cnt(allhtml, "pre.mermaid"), "tables": cnt(allhtml, "table"), "pre_code": cnt(allhtml, "pre code"),
         "svg": cnt(allhtml, "svg"), "topics": len(keys_seen), "remarks_slots": allhtml.count("sd-remarks-slot"), "slots": allhtml.count('class="sd-slot"')}
print(stats)
assert stats["mermaid"] == 33 and stats["tables"] == 60 and stats["pre_code"] == 15
dangling = sorted(set(re.findall(r'href="#([^"]+)"', allhtml + hero_html)))
print("dangling anchors:", dangling)
json.dump({"parts": toc_parts}, open("data/sd.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
css = "\n".join(st.get_text() for st in soup.find_all("style") if st.find_parent("svg") is None)
open("scripts/source/sd.css", "w", encoding="utf-8").write(css)
print([(p["slug"], len(p["html"]), len(t["topics"])) for p, t in zip(parts, toc_parts)])
