"""Non-destructive enrichment of the System Design fragments: wraps (1) 'important line' sentences in <mark class="hl"> and
(2) the first use per topic of each glossary term in <abbr class="gl" data-def="…">. Only text nodes are touched, never tags or
code/pre/links/headings/bold, so the original wording and markup are preserved (checked by a subsequence test in extract_sd.py)."""
import re, html as H

SKIP = {"pre", "code", "a", "h1", "h2", "h3", "h4", "h5", "h6", "script", "style", "svg", "strong", "b", "mark", "abbr", "th", "button", "kbd"}
VOID = {"br", "hr", "img", "input", "meta", "link", "wbr", "col"}
TAG = re.compile(r"(<[^>]+>)")
# sentences that carry a rule, a trade-off, a warning or an interview signal
CUES = re.compile(
    r"(\bthe key (insight|idea|point|trade-?off|difference|reason|property)\b|\bthe trick\b|\bthe catch\b|\bthe (real|actual|hard|hardest|interesting|crucial|critical|important) (problem|part|question|signal|point|difficulty|reason|trade-?off)\b|"
    r"\bthis is (why|the reason|exactly why|what)\b|\bnever\b|\balways\b|\bmust\b|\bcannot\b|\bcan't\b|\bthe single (most|biggest|best)\b|\bred flag\b|\bthe rule\b|\bthe answer is\b|\bin practice\b|"
    r"\b(interviewers?|the interviewer) (want|wants|love|loves|expect|expects|is looking|are looking|will)\b|\ba strong answer\b|\bcommon (mistake|trap|pitfall)\b|\bthe (trade-?off|bottleneck|failure mode) is\b|\bworth (saying|stating|mentioning)\b|\bdon't\b|\bimpossible\b|\bonly (way|safe|correct)\b|\bwithout (this|that|it)\b|"
    r"\btrade-?offs?\b|\bbottleneck\b|\bguarantees?\b|\bprevents?\b|\bcritical(ly)?\b|\bessential(ly)?\b|\bcrucial\b|\bthat's why\b|\bwhich is why\b|\bthe whole point\b|\bnon-negotiable\b|\bsingle point of failure\b|"
    r"\brace condition\b|\bexactly-once\b|\bat-least-once\b|\bidempoten\w+|\bthe (main|biggest|only|real|best) (reason|risk|cost|advantage|difference|drawback|downside)\b|\bmost (important|common|expensive)\b)", re.I)

def sentences(text):
    return re.split(r"(?<=[.!?])\s+(?=[A-Z(\"'`])", text)

def compile_glossary(entries):
    table, pats = {}, []
    for term, aliases, d in entries:
        for t in [term] + aliases:
            table[t.lower()] = (t, d)
            pats.append(t)
    pats.sort(key=len, reverse=True)
    return re.compile(r"(?<![\w-])(" + "|".join(re.escape(p) for p in pats) + r")(?![\w-])", re.I), table

def enrich(html, glossary, max_hl_per_topic=5):
    rx, table = compile_glossary(glossary)
    out, stack, seen, hl_count, para_hl = [], [], set(), 0, False
    for tok in TAG.split(html):
        if tok.startswith("<") and tok.endswith(">"):
            m = re.match(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)", tok)
            if m and not tok.startswith("<!"):
                closing, name = m.group(1) == "/", m.group(2).lower()
                if not closing and name not in VOID and not tok.endswith("/>"):
                    stack.append(name)
                    if name in ("h2", "h3", "h4"): seen.clear(); hl_count = 0
                    if name in ("p", "li", "td"): para_hl = False
                elif closing and name in stack:
                    while stack and stack.pop() != name: pass
            out.append(tok); continue
        if not tok.strip() or any(s in SKIP for s in stack):
            out.append(tok); continue
        text = tok
        if not para_hl and hl_count < max_hl_per_topic and any(s in ("p", "li") for s in stack):
            parts = sentences(text)
            for i, sent in enumerate(parts):
                plain = H.unescape(sent).strip()
                if 60 <= len(plain) <= 240 and plain[0].isupper() and plain[-1] not in "?:" and CUES.search(plain) and "&lt;" not in sent:
                    parts[i] = f'<mark class="hl">{sent}</mark>'
                    para_hl = True; hl_count += 1
                    break
            if para_hl: text = " ".join(parts)
        def term(m):
            raw = m.group(1); k = raw.lower()
            if k in seen or k not in table: return raw
            seen.add(k)
            return f'<abbr class="gl" tabindex="0" data-def="{H.escape(table[k][1], quote=True)}">{raw}</abbr>'
        segs = TAG.split(text)
        text = "".join(s if (s.startswith("<") and s.endswith(">")) else rx.sub(term, s) for s in segs)
        out.append(text)
    return "".join(out)
