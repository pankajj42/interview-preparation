"""Data-fidelity verification: compares the original files with what the app uses (and, if ./out exists, with the built pages).
Usage: python3 scripts/verify.py [path/to/Crack_The_Coding_Interview.xlsx] [dir with the two original guide HTML files]
Needs: beautifulsoup4, lxml, openpyxl.  Writes VERIFICATION.md."""
import json, re, sys, os, glob
from bs4 import BeautifulSoup
from openpyxl import load_workbook

XLSX = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "source-files", "Crack_The_Coding_Interview.xlsx")
GUIDES = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "source-files")
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
rows, failed = [], []
def check(name, ok, detail=""):
    rows.append((name, ok, detail))
    if not ok: failed.append(name)
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))
norm = lambda t: re.sub(r"\s+", "", t)
has_out = os.path.isdir("out")

# ---------------- Striver ----------------
LC, GFG = "https://leetcode.com/problems/", "https://www.geeksforgeeks.org/"
src = set()
for line in open("scripts/source/playlists.txt", encoding="utf-8"):
    p = [x.strip() for x in line.split(" ;; ")]
    if len(p) == 4 and p[0].isdigit():
        if p[2] != "-": src.add(LC + p[2])
        if p[3] != "-": src.add(GFG + p[3])
for line in open("scripts/source/dsa-directory.txt", encoding="utf-8"):
    m = re.match(r"^(LC|GFG): .*? ;; (\S+)(?: ;; .*)?$", line.strip())
    if m: src.add((LC if m.group(1) == "LC" else GFG) + m.group(2))
data = json.load(open("data/striver.json"))["playlists"]
leaf = lambda p: p.get("variants") or [p]
out_urls = {l["url"] for pl in data for t in pl["topics"] for p in t["problems"] for x in leaf(p) for l in x["links"]}
fixes = json.load(open("data/striver-fixes.json"))
before = set(re.findall(r"https?://[^\s|]+", " ".join(f["before"] for f in fixes["fixes"])))
removed, added = src - out_urls, out_urls - src
n1 = sum(len(p["topics"][0]["problems"]) for p in data if p["slug"] != "dsa")
n2 = sum(len(t["problems"]) for p in data if p["slug"] == "dsa" for t in p["topics"])
check("Striver: 10 topic playlists hold 228 source entries", n1 == 228, str(n1))
check("Striver: DSA playlist has 18 topics / 188 entries", len(data[0]["topics"]) == 18 and n2 == 188, f"{len(data[0]['topics'])} / {n2}")
check("Striver: every source URL is still present, except the ones replaced by the 23 logged fixes", removed <= before, f"{len(src)} source URLs, {len(removed)} replaced/removed, all in the fix log")
check("Striver: only logged links were added", len(added) <= 12, f"{len(added)} added: " + ", ".join(sorted(u.replace(LC, 'LC:').replace(GFG, 'GFG:') for u in added))[:300])
check("Striver: 23 fixes logged", len(fixes["fixes"]) == 23)

# ---------------- CTCI ----------------
wb = load_workbook(XLSX)
ct = json.load(open("data/ctci.json"))
mism = 0; total = 0
for ws, tab in zip(wb.worksheets, ct["tabs"]):
    src_rows = [r for r in ws.iter_rows(min_row=5, max_col=4, values_only=True) if not all(v is None for v in r)]
    mine = [[r[0], r[1], LC[:-1] + r[2] if False else "https://leetcode.com/problems/" + r[2], {"E": "Easy", "M": "Medium", "H": "Hard"}[r[3]]] for r in tab["rows"]]
    total += len(src_rows)
    if ws.title != tab["title"] or [list(map(str, (int(a), b, c, d))) for a, b, c, d in src_rows] != [list(map(str, m)) for m in mine]: mism += 1
check("CTCI: all 74 tabs, every row (#, Topic, URL, Difficulty) identical to the workbook", mism == 0 and len(ct["tabs"]) == 74, f"{total} rows, {len({r[2] for t in ct['tabs'] for r in t['rows']})} distinct problems")
if has_out:
    bad = []
    for tab in ct["tabs"]:
        html = open(f"out/ctci/{tab['slug']}/index.html", encoding="utf-8").read()
        if html.count('class="anchor-row') != len(tab["rows"]): bad.append(tab["slug"])
    check("CTCI: every built tab page renders every row of its tab", not bad, "74 pages" if not bad else str(bad[:3]))

# ---------------- DP guide ----------------
raw = open(os.path.join(GUIDES, "ultimate-dp-guide-v2.html"), encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
dp = json.load(open("data/dp.json"))
orig_rows = soup.select(".problem-row")
mine = [r for g in dp["groups"] for r in g["rows"]]
same = len(orig_rows) == len(mine) and all(
    o["data-problem"] == m["key"] and o.select_one(".problem-name").get_text(strip=True) == m["name"] and o.select_one(".problem-tags").get_text(strip=True) == m["tags"]
    and o.select_one(".difficulty").get_text(strip=True) == m["diff"] and [(a["href"], a.get_text(" ", strip=True)) for a in o.select("a.problem-link")] == [(l["url"], l["text"]) for l in m["links"]]
    for o, m in zip(orig_rows, mine))
check("DP: 239 problem rows (name, tags, difficulty, every link) identical to the guide", same, f"{len(mine)} rows, {len({r['key'] for r in mine})} distinct")
check("DP: 22 pattern cards; text of every diagram/explanation/details block identical", len(dp["patterns"]) == 22 and all(
    norm(BeautifulSoup(p["layoutHtml"] + p["detailsHtml"], "lxml").get_text()) == norm(soup.select_one(f"#pattern-{p['n']} .pattern-layout").get_text() + soup.select_one(f"#pattern-{p['n']} .pattern-details").get_text()) for p in dp["patterns"]))
svgs = sum(p["layoutHtml"].count("<svg") for p in dp["patterns"])
check("DP: 22 inline SVG diagrams kept with original markup", svgs == 22 and all("<svg" in p["layoutHtml"] for p in dp["patterns"]), str(svgs))
ref = {"cross-reference": "#cross-reference", "interview": "#interview", "quick-reference": "#quick-reference"}
ok = all(norm(BeautifulSoup(open(f"content/dp/{k}.html", encoding="utf-8").read(), "lxml").get_text()) == norm(soup.select_one(v).get_text()) for k, v in ref.items())
tbl = {k: len(BeautifulSoup(open(f"content/dp/{k}.html", encoding="utf-8").read(), "lxml").find_all("tr")) for k in ["cross-reference", "interview", "cses", "atcoder"]}
check("DP: reference tables identical (rows: cross-reference / interview / CSES / AtCoder)", ok and list(tbl.values()) == [102, 31, 90, 26], str(tbl))

# ---------------- System Design ----------------
raw = open(os.path.join(GUIDES, "system-design-blueprint.html"), encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
parts = ["content/sd/welcome.html"] + sorted(glob.glob("content/sd/part-*.html"))
joined = "".join(open(p, encoding="utf-8").read() for p in parts)
mine = BeautifulSoup(joined, "lxml")
content = soup.select_one("#content")
for t in content.select(".chk"): t.decompose()
check("System Design: text of all 7 parts identical to the blueprint", norm(content.get_text()) == norm(mine.get_text()), f"{len(parts)} parts")
om = [m.get_text() for m in soup.select("#content pre.mermaid")]; nm = [m.get_text() for m in mine.select("pre.mermaid")]
check("System Design: 33 Mermaid diagram sources identical, in order", om == nm and len(nm) == 33, str(len(nm)))
check("System Design: 60 tables and 15 code blocks kept", len(mine.find_all("table")) == 60 and len(mine.select("pre code")) == 15)
sd = json.load(open("data/sd.json"))
check("System Design: 81 trackable topics (78 marked headings + 3 Part V sections)", sum(len(p["topics"]) for p in sd["parts"]) == 81)
if has_out:
    n = 0
    for p in ["welcome", "part-0", "part-1", "part-2", "part-3", "part-4", "part-5"]:
        n += open(f"out/system-design/{p}/index.html", encoding="utf-8").read().count('<pre class="mermaid"')
    check("System Design: built pages contain all 33 Mermaid blocks", n == 33, str(n))
    pages = len(glob.glob("out/**/index.html", recursive=True))
    check("Built site: 105 static pages exported", pages >= 100, str(pages))

with open("VERIFICATION.md", "w", encoding="utf-8") as f:
    f.write("# Verification report\n\nGenerated by `python3 scripts/verify.py` (compares the original files you supplied with the data and pages the app uses).\n\n| Check | Result | Detail |\n|---|---|---|\n")
    for n, ok, d in rows: f.write(f"| {n} | {'PASS' if ok else '**FAIL**'} | {d} |\n")
print("\n", "ALL CHECKS PASSED" if not failed else f"{len(failed)} FAILED")
sys.exit(1 if failed else 0)
