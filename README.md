# Interview preparation

One site for four tracks, with progress, revision marks and remarks stored in your browser:

| Track | What is in it |
|---|---|
| **Striver** | 11 pages: the DSA playlist (18 collapsible topics) and the 10 topic playlists. Every row has its LeetCode / GeeksforGeeks links. |
| **Ultimate DP** | Your guide: 22 patterns with the original diagrams, 239 problems in 22 groups, the cross-reference / interview / CSES / AtCoder tables, quick reference and study loop. |
| **System Design** | Your blueprint: 7 parts, 81 trackable topics, 33 Mermaid diagrams, 60 tables. |
| **Crack the Coding Interview** | All 74 tabs of the workbook (8,221 rows, 1,628 distinct problems). A problem that appears in several tabs is one problem. |

Per problem: done, revision star, remarks (Markdown). Per topic: done (automatic for question lists, a tick for reading topics), revision star and remarks (short ones sit under the list, long ones become a full-width block). Plus progress per track and per list, reset (per topic, page, track or everything; remarks are kept unless you tick them), light / dark / system themes, a Revision page, and JSON export / import.

## Run it

Needs Node.js **22.22.2+** (or 24.15+) and npm 12 (`npm i -g npm@latest`).

```bash
npm install
npm run dev            # http://localhost:3000
# or a static build:
npm run build          # writes ./out (host it anywhere)
npm start              # serves ./out on http://localhost:3000
```

**Your progress lives in `localStorage` for the exact address you use** (`http://localhost:3000` here). `npm run dev` and `npm start` both use port 3000, so they share it; a different port or domain starts empty. Use *Data & backup* in the sidebar to export / import a JSON backup.

## Data notes

* `FIXES.md` and the in-app *Data notes* page list the 23 fixes made to the Striver lists (and what was deliberately left alone).
* `VERIFICATION.md` is the output of `python3 scripts/verify.py`: it compares the original files you supplied (kept in `source-files/`) with the data the app uses and with the built pages.
* `scripts/source/*.txt` are line-by-line transcriptions of your two Striver lists; diff them against your originals.
* Regenerate everything with `npm run data` (needs Python with `beautifulsoup4 lxml openpyxl`); the site itself does not need Python.

## Stack (latest at build time)

Next.js 16.4 (App Router, static export, Turbopack) · React 19.3 · TypeScript 7 · Tailwind CSS 4.3 · MUI 9.5 · Mermaid 12 · npm 12.

## Layout

```
src/app          routes (home, striver, dp, system-design, ctci, revision, settings, notes)
src/components   UI (shell, topics, rows, remarks, reset dialog, views)
src/lib          store (localStorage), catalog (ids, navigation), title derivation
data/            generated JSON (striver, ctci, dp, sd)
content/         exact-markup fragments of the two guides
scripts/         extraction, scoping and verification scripts (+ source transcriptions)
```
