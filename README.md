# Interview preparation

One site for four tracks, with progress, revision marks and remarks stored in your browser:

| Track | What is in it |
|---|---|
| **Striver** | 11 pages: the DSA playlist (18 collapsible topics) and the 10 topic playlists. Every row has its LeetCode / GeeksforGeeks links. |
| **Ultimate DP** | Your guide: 22 patterns with the original diagrams, 239 problems in 22 groups, the cross-reference / interview / CSES / AtCoder tables, quick reference and study loop. |
| **System Design** | Your blueprint: 7 parts, 81 trackable topics, 33 Mermaid diagrams, 60 tables. |
| **Crack the Coding Interview** | All 74 tabs of the workbook (8,221 rows, 1,628 distinct problems). A problem that appears in several tabs is one problem. |

Per problem: done, revision star, remarks (Markdown). Per topic: done (automatic for question lists, a tick for reading topics), revision star and remarks (short ones sit under the list, long ones become a full-width block). Plus progress per track and per list, reset (per topic, page, track or everything; remarks are kept unless you tick them), light / dark / system themes, a Revision page, JSON export / import, and **Google sign-in with cloud sync across devices**.

## Run it

Needs Node.js **22.22.2+** (or 24.15+) and npm 12 (`npm i -g npm@latest`).

```bash
npm install
npm run dev            # http://localhost:3000
# or a static build:
npm run build          # writes ./out (host it anywhere)
npm start              # serves ./out on http://localhost:3000
```

## Cloud setup (Supabase + Google sign-in, no backend of your own)

Progress (done, revision stars, remarks) is stored in **your own Supabase project** and tied to your Google account, so it follows you across devices. The site stays a static export: the browser talks to Supabase directly, protected by Row Level Security. Until you do this setup the site is fully readable, but ticks and remarks cannot be saved.

1. **Create a Supabase project** (supabase.com, free tier is fine).
2. **Create the table**: Supabase dashboard, SQL Editor, paste and run `supabase/migrations/20261018000000_user_progress.sql` (table, Row Level Security policies, Realtime).
3. **Google sign-in**: in the Google Cloud Console create an OAuth client (type *Web application*) and add this authorised redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`. In Supabase go to *Authentication, Sign In / Providers, Google*, enable it and paste the client ID and secret.
4. **Allowed URLs**: in Supabase, *Authentication, URL Configuration*, set the Site URL to where you run the site (for example `http://localhost:3000`) and add redirect URLs `http://localhost:3000/**` and, if you host it, `https://your-domain/**`.
5. **Keys**: copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings, API Keys; the publishable key is safe to ship, Row Level Security protects the data).
6. Run `npm run dev` (or `npm run build && npm start`) and click **Sign in**. After a rebuild the keys are baked into the static files, so rebuild whenever they change.

How it behaves: changes are saved a moment after you make them and shown in the header (cloud icon). Other devices pick up changes live (Realtime) and whenever you return to the tab. If you are offline, changes wait and are retried. The only thing the browser keeps locally is Supabase's sign-in session. If you used the earlier browser-only version, *Account & backup* offers a one-time upload of its data.

## Data notes

* `FIXES.md` and the in-app *Data notes* page list the 23 fixes made to the Striver lists (and what was deliberately left alone).
* **System Design additions** live in `scripts/sd-extra/` (`dives-*.txt`, `new-*.txt`, `glossary.txt`); `npm run data` merges them into the original text and proves the original is still there, in order. Toggle *Key-term tooltips*, *Highlights* and *Deep dives* at the top of each part.
* `VERIFICATION.md` is the output of `python3 scripts/verify.py`: it compares the original files you supplied (kept in `source-files/`) with the data the app uses and with the built pages.
* `scripts/source/*.txt` are line-by-line transcriptions of your two Striver lists; diff them against your originals.
* Regenerate everything with `npm run data` (needs Python with `beautifulsoup4 lxml openpyxl`); the site itself does not need Python.

## Stack (latest at build time)

Next.js 16.4 (App Router, static export, Turbopack) · Supabase (Auth + Postgres + Realtime) · React 19.3 · TypeScript 7 · Tailwind CSS 4.3 · MUI 9.5 · Mermaid 12 · npm 12.

## Layout

```
src/app          routes (home, striver, dp, system-design, ctci, revision, settings, notes)
src/components   UI (shell, topics, rows, remarks, reset dialog, views)
src/lib          store (localStorage), catalog (ids, navigation), title derivation
data/            generated JSON (striver, ctci, dp, sd)
content/         exact-markup fragments of the two guides
scripts/         extraction, scoping and verification scripts (+ source transcriptions)
```
