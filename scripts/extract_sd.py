"""Cut system-design-blueprint.html into one exact-markup fragment per part, then ADD (never remove):
 - deep-dive blocks ("In simple words") after the end of existing topics     (scripts/sd-extra/dives-*.txt)
 - new concept sections / case studies appended to Part II / Part III         (scripts/sd-extra/new-*.txt)
 - important-line highlights and glossary tooltips inside existing text        (scripts/sd_enrich.py + glossary.txt)
and prove nothing was removed: the original text must remain, in order, inside the new text."""
import json, re, sys, os
from bs4 import BeautifulSoup
sys.path.insert(0, os.path.dirname(__file__))
from htmlrange import index, find, outer, classes
from sd_enrich import enrich
from sd_extra_render import load_dives, load_glossary, load_new

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'source-files', 'system-design-blueprint.html')
EX = os.path.join(HERE, 'sd-extra')
raw = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
els = index(raw)
norm = lambda t: re.sub(r"\s+", "", t)

dives, new_sections, glossary = load_dives(EX), load_new(EX), load_glossary(os.path.join(EX, 'glossary.txt'))
content = [e for e in find(els, tag="div", id="content")][0]
ci = els.index(content)
kids = [e for e in els if e["parent"] == ci]
H = {"h2": 2, "h3": 3, "h4": 4}
CHK = re.compile(r'<span aria-checked="false" class="chk chk-inline" data-key="([^"]+)" role="checkbox" tabindex="0"></span>')
EXTRA = ["51-an-8-week-plan", "52-where-this-guides-structure-came-from", "53-practicing-beyond-this-guide"]  # keyed in the original sidebar only

def route_slug(title, i):
    if i == 0: return "welcome"
    roman = re.match(r"Part ([0IVX]+)", title).group(1)
    return "part-" + ("0" if roman == "0" else str({"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}[roman]))

h2s = [k for k in kids if k["tag"] == "h2"]
bounds = [(h["start"], (h2s[i + 1]["start"] if i + 1 < len(h2s) else kids[-1]["end"])) for i, h in enumerate(h2s)]
parts = []
for i, (a, b) in enumerate(bounds):
    title = BeautifulSoup(outer(raw, h2s[i]), "lxml").get_text(" ", strip=True)
    parts.append({"slug": route_slug(title, i), "id": h2s[i]["attrs"]["id"], "title": title, "raw": raw[a:b]})
assert len(parts) == 7

def heading_info(frag):
    h = BeautifulSoup(frag, "lxml").find(["h2", "h3", "h4"])
    for t in h.select(".chk"): t.decompose()
    sn = h.select_one(".sec-num")
    num = sn.get_text(strip=True) if sn else ""
    if sn: sn.decompose()
    return num, h.get_text(" ", strip=True)

toc_parts, keys_seen, used_dives, n_new = [], [], set(), 0
for p in parts:
    base = enrich(p["raw"], glossary)                     # highlights + glossary inside the ORIGINAL text only
    added = new_sections.get(p["slug"], [])
    addraw = "\n\n".join(enrich(h, glossary, max_hl_per_topic=0) for (_, _, _, _, h) in added)  # new sections carry their own highlights
    full = base + ("\n\n" + addraw if added else "")
    pel = index(full)
    pk = [e for e in pel if e["parent"] is None]
    out, cursor, stack, topics = [], pk[0]["start"], [], []
    def close_topic():
        lvl, key = stack.pop()
        if key in dives: out.append(dives[key] + "\n"); used_dives.add(key)
        out.append(f'<div class="sd-remarks-slot" data-key="{key}"></div>\n')
    for k in pk:
        out.append(full[cursor:k["start"]])
        if k["tag"] in H:
            lvl = H[k["tag"]]
            while stack and stack[-1][0] >= lvl: close_topic()
            frag = outer(full, k)
            m = CHK.search(frag)
            hid = k["attrs"].get("id")
            key = m.group(1) if m else (hid if hid in EXTRA else None)
            if m: frag = CHK.sub(lambda mm: f'<span class="sd-slot" data-key="{mm.group(1)}"></span>', frag, count=1)
            elif key: frag = re.sub(r"^(<h[34][^>]*>)", lambda mm: mm.group(1) + f'<span class="sd-slot" data-key="{key}"></span>', frag, count=1)
            if key:
                num, ttl = heading_info(outer(full, k))
                is_new = "sd-added" in classes(k)
                topics.append({"key": key, "level": lvl, "num": num, "title": ttl, **({"added": True} if is_new else {})})
                n_new += is_new; keys_seen.append(key); stack.append((lvl, key))
            out.append(frag)
        else:
            out.append(outer(full, k))
        cursor = k["end"]
    while stack: close_topic()
    p["html"] = "".join(out)
    toc_parts.append({"slug": p["slug"], "id": p["id"], "title": p["title"], "topics": topics})

assert len(keys_seen) == len(set(keys_seen)), "duplicate topic keys"
assert set(dives) == used_dives, f"deep dives for unknown topics: {sorted(set(dives) - used_dives)}"
assert len(keys_seen) - n_new == 81, (len(keys_seen), n_new)

id_to_slug = {}
for p in parts:
    for m in re.finditer(r'\sid="([^"]+)"', p["html"]): id_to_slug[m.group(1)] = p["slug"]
fix = lambda s: re.sub(r'href="#([^"]+)"', lambda m: f'href="/system-design/{id_to_slug[m.group(1)]}#{m.group(1)}"' if m.group(1) in id_to_slug else m.group(0), s)
os.makedirs(os.path.join(HERE, "..", "content", "sd"), exist_ok=True)
for p in parts: open(os.path.join(HERE, "..", "content", "sd", f"{p['slug']}.html"), "w", encoding="utf-8").write(fix(p["html"]))
hero = [e for e in find(els, tag="div") if "hero" in classes(e)][0]
open(os.path.join(HERE, "..", "content", "sd", "hero.html"), "w", encoding="utf-8").write(fix(outer(raw, hero)))

# fidelity: the original text survives, in order, inside the new text (additions only)
orig = BeautifulSoup(outer(raw, content), "lxml")
for t in orig.select(".chk"): t.decompose()
o = norm(orig.get_text())
n = norm(BeautifulSoup("".join(p["html"] for p in parts), "lxml").get_text())
j = 0
for ch in n:
    if j < len(o) and ch == o[j]: j += 1
assert j == len(o), f"original text not preserved (matched {j}/{len(o)})"
allhtml = "".join(p["html"] for p in parts)
cnt = lambda sel: len(BeautifulSoup(allhtml, "lxml").select(sel))
stats = {"parts": len(parts), "topics": len(keys_seen), "new_topics": n_new, "dives": len(dives), "mermaid": cnt("pre.mermaid"), "tables": cnt("table"), "pre_code": cnt("pre code"),
         "highlights": allhtml.count('<mark class="hl">'), "glossary_terms": allhtml.count('class="gl"'), "original_chars": len(o), "new_chars": len(n)}
print(stats)
json.dump({"parts": toc_parts}, open(os.path.join(HERE, "..", "data", "sd.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
css = "\n".join(st.get_text() for st in soup.find_all("style") if st.find_parent("svg") is None)
open(os.path.join(HERE, "source", "sd.css"), "w", encoding="utf-8").write(css)
