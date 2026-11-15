"""Authoring formats -> HTML for the System Design additions.
  scripts/sd-extra/dives-*.txt    '@dive <topic-key>' blocks: NUTSHELL / ANALOGY / STEPS / IDEAS / SAY / AVOID
  scripts/sd-extra/new-*.txt      '@new <part-slug> <h3|h4> <key> | <num> | <title>' blocks: P: H: - 1. TABLE:/ROW: CODE:/END MERMAID:/END NOTE:
  scripts/sd-extra/glossary.txt   'term | alias, alias :: definition'
Inline markup: **bold**  ==highlight==  `code`  *italic*."""
import glob, html, os, re

def inline(s):
    s = html.escape(s.strip(), quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"==(.+?)==", r'<mark class="hl">\1</mark>', s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"(?<![*\w])\*(?!\s)([^*]+?)(?<!\s)\*(?![*\w])", r"<em>\1</em>", s)
    return s

def _files(d, prefix): return sorted(glob.glob(os.path.join(d, prefix + "*.txt")))

LABELS = {"STEPS": "How it works, step by step", "IDEAS": "Key ideas, explained", "SAY": "Say this in the interview", "AVOID": "Common mistakes"}
def render_dive(key, sec, title="In simple words"):
    h = [f'<div class="sd-extra" data-for="{key}"><div class="sd-extra-title">{title}</div>']
    for para in sec.get("NUTSHELL", []): h.append(f"<p>{inline(para)}</p>")
    if sec.get("ANALOGY"): h.append(f'<p class="sd-analogy"><strong>Think of it like this:</strong> {inline(" ".join(sec["ANALOGY"]))}</p>')
    if sec.get("STEPS"): h.append(f"<h5>{LABELS['STEPS']}</h5><ol>" + "".join(f"<li>{inline(x)}</li>" for x in sec["STEPS"]) + "</ol>")
    if sec.get("IDEAS"):
        items = []
        for x in sec["IDEAS"]:
            t, _, d = x.partition(" :: ")
            items.append(f"<dt>{inline(t)}</dt><dd>{inline(d)}</dd>")
        h.append(f"<h5>{LABELS['IDEAS']}</h5><dl>" + "".join(items) + "</dl>")
    if sec.get("SAY"): h.append(f"<h5>{LABELS['SAY']}</h5><ul class=\"sd-say\">" + "".join(f"<li>{inline(x)}</li>" for x in sec["SAY"]) + "</ul>")
    if sec.get("AVOID"): h.append(f"<h5>{LABELS['AVOID']}</h5><ul class=\"sd-avoid\">" + "".join(f"<li>{inline(x)}</li>" for x in sec["AVOID"]) + "</ul>")
    h.append("</div>")
    return "".join(h)

def load_dives(d):
    out = {}
    for f in _files(d, "dives-"):
        key, sec, cur = None, {}, None
        def commit():
            if key: out[key] = render_dive(key, sec)
        for line in open(f, encoding="utf-8").read().split("\n"):
            if line.startswith("@dive "):
                commit(); key, sec, cur = line.split(None, 1)[1].strip(), {}, None
            elif key and line.strip() in ("NUTSHELL", "ANALOGY", "STEPS", "IDEAS", "SAY", "AVOID"):
                cur = line.strip(); sec[cur] = []
            elif key and cur and line.strip():
                sec[cur].append(line.strip()[2:] if line.lstrip().startswith("- ") else line.strip())
        commit()
    return out

def render_new(level, key, num, title, body):
    chk = f'<span aria-checked="false" class="chk chk-inline" data-key="{key}" role="checkbox" tabindex="0"></span>'
    numspan = f'<span class="sec-num">{num}</span>' if num else ""
    h = [f'<h{level} id="{key}" class="sd-added">{chk}{numspan}{inline(title)}</h{level}>']
    i, lines = 0, body
    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip(): i += 1; continue
        if ln.startswith("P:"): h.append(f"<p>{inline(ln[2:])}</p>"); i += 1
        elif ln.startswith("H:"): h.append(f"<p><strong>{inline(ln[2:])}</strong></p>"); i += 1
        elif ln.startswith("NOTE:"): h.append(f"<blockquote><p>{inline(ln[5:])}</p></blockquote>"); i += 1
        elif ln.startswith("- "):
            items = []
            while i < len(lines) and lines[i].startswith("- "): items.append(lines[i][2:]); i += 1
            h.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ul>")
        elif re.match(r"\d+\. ", ln):
            items = []
            while i < len(lines) and re.match(r"\d+\. ", lines[i]): items.append(re.sub(r"^\d+\. ", "", lines[i])); i += 1
            h.append("<ol>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ol>")
        elif ln.startswith("TABLE:"):
            head = ln[6:].split(" | "); rows = []; i += 1
            while i < len(lines) and lines[i].startswith("ROW:"): rows.append(lines[i][4:].split(" | ")); i += 1
            h.append("<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>" + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows) + "</tbody></table>")
        elif ln.startswith("CODE") or ln.startswith("MERMAID:"):
            lang = ln[4:].strip().rstrip(":") if ln.startswith("CODE") else "mermaid"; i += 1; buf = []
            while i < len(lines) and lines[i].strip() != "END": buf.append(lines[i]); i += 1
            i += 1
            txt = html.escape("\n".join(buf), quote=False)
            h.append(f'<pre class="mermaid">\n{txt}\n</pre>' if lang == "mermaid" else f'<pre><code class="language-{lang or "text"}">{txt}</code></pre>')
        else: raise ValueError(f"{key}: cannot parse line: {ln[:80]}")
    return "\n".join(h)

def load_new(d):
    out = {}
    for f in _files(d, "new-"):
        cur, body = None, []
        def commit():
            if cur: out.setdefault(cur[0], []).append((cur[2], int(cur[1][1]), cur[3], cur[4], render_new(int(cur[1][1]), cur[2], cur[3], cur[4], body)))
        for line in open(f, encoding="utf-8").read().split("\n"):
            if line.startswith("@new "):
                commit(); head, num, title = [x.strip() for x in line[5:].split(" | ", 2)]
                part, lvl, key = head.split()
                cur, body = (part, lvl, key, num, title), []
            elif cur: body.append(line)
        commit()
    return out

def load_glossary(path):
    entries = []
    for line in open(path, encoding="utf-8").read().split("\n"):
        if not line.strip() or line.startswith("#"): continue
        names, _, d = line.partition(" :: ")
        term, _, al = names.partition(" | ")
        entries.append((term.strip(), [a.strip() for a in al.split(",") if a.strip()], d.strip()))
    return entries
