"""Index every element of a raw HTML string with exact [start, end) offsets so fragments can be cut out
byte-for-byte (BeautifulSoup would re-serialise and e.g. lower-case SVG attributes such as viewBox)."""
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


class Indexer(HTMLParser):
    def __init__(self, raw):
        super().__init__(convert_charrefs=False)
        self.raw = raw
        self.line_starts = [0]
        for i, ch in enumerate(raw):
            if ch == "\n":
                self.line_starts.append(i + 1)
        self.stack, self.elements = [], []

    def _off(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self._off()
        text = self.get_starttag_text()
        el = {"tag": tag, "attrs": dict(attrs), "start": start, "open_end": start + len(text), "end": None,
              "parent": self.stack[-1] if self.stack else None, "depth": len(self.stack)}
        self.elements.append(el)
        if tag in VOID:
            el["end"] = el["open_end"]
        else:
            self.stack.append(len(self.elements) - 1)

    def handle_startendtag(self, tag, attrs):
        start = self._off()
        text = self.get_starttag_text()
        self.elements.append({"tag": tag, "attrs": dict(attrs), "start": start, "open_end": start + len(text),
                              "end": start + len(text), "parent": self.stack[-1] if self.stack else None,
                              "depth": len(self.stack)})

    def handle_endtag(self, tag):
        start = self._off()
        end = self.raw.index(">", start) + 1
        for k in range(len(self.stack) - 1, -1, -1):
            if self.elements[self.stack[k]]["tag"] == tag:
                for j in self.stack[k:]:
                    self.elements[j]["end"] = end if self.elements[j]["tag"] == tag and j == self.stack[k] else start
                    self.elements[j]["close_start"] = start
                del self.stack[k:]
                return


def index(raw):
    ix = Indexer(raw)
    ix.feed(raw)
    ix.close()
    return ix.elements


def classes(el):
    return (el["attrs"].get("class") or "").split()


def find(elements, tag=None, id=None, cls=None, within=None):
    out = []
    lo, hi = (within["start"], within["end"]) if within else (0, 1 << 60)
    for el in elements:
        if el["start"] < lo or el["end"] is None or el["end"] > hi or el is within:
            continue
        if tag and el["tag"] != tag:
            continue
        if id and el["attrs"].get("id") != id:
            continue
        if cls and cls not in classes(el):
            continue
        out.append(el)
    return out


def outer(raw, el):
    return raw[el["start"]:el["end"]]


def inner(raw, el):
    return raw[el["open_end"]:el.get("close_start", el["end"])]
