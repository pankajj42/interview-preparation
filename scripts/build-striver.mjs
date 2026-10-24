// Builds data/striver.json from the two verbatim source transcriptions.
// 1) parse  2) sanity-check against the original counts  3) apply reviewed fixes (asserting the "before" value)
// 4) keep both links for the two unsettled slug conflicts  5) assign progress ids  6) write data + fix log
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const LC = 'https://leetcode.com/problems/';
const GFG = 'https://www.geeksforgeeks.org/';
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- 1. parse doc 1 (topic playlists) ---------- */
const playlists1 = [];
for (const raw of read('scripts/source/playlists.txt').split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#') && !line.startsWith('##')) continue;
  if (line.startsWith('## ')) { playlists1.push({ title: line.slice(3).trim(), entries: [] }); continue; }
  const [n, title, lc, gfg] = line.split(' ;; ').map((s) => s.trim());
  if (!gfg && gfg !== '') throw new Error('Bad line: ' + line);
  playlists1.at(-1).entries.push({ n: Number(n), title, lc: lc === '-' ? null : lc, gfg: gfg === '-' ? null : gfg });
}

/* ---------- 1b. parse doc 2 (DSA directory) ---------- */
const sections2 = [];
let curEntry = null, curTarget = null;
for (const raw of read('scripts/source/dsa-directory.txt').split('\n')) {
  const line = raw.trim();
  if (!line || (line.startsWith('#') && !line.startsWith('##'))) continue;
  if (line.startsWith('## ')) {
    const m = line.match(/^## (\d+)\. (.+)$/);
    sections2.push({ num: Number(m[1]), title: m[2], entries: [] });
  } else if (line.startsWith('* ')) {
    curEntry = { title: line.slice(2), links: [], variants: [] };
    sections2.at(-1).entries.push(curEntry); curTarget = curEntry;
  } else if (line.startsWith('> ')) {
    curTarget = { title: line.slice(2), links: [] };
    curEntry.variants.push(curTarget);
  } else if (line.startsWith('LC:') || line.startsWith('GFG:')) {
    const isLc = line.startsWith('LC:');
    const [label, target, note] = line.slice(isLc ? 3 : 4).split(' ;; ').map((s) => s.trim());
    const link = { kind: isLc ? 'leetcode' : 'gfg', url: (isLc ? LC : GFG) + target, label };
    if (note === 'Premium') link.premium = true; else if (note) link.note = note;
    curTarget.links.push(link);
  } else throw new Error('Unparsed line: ' + line);
}

/* ---------- 2. sanity checks vs. the original documents ---------- */
const expect1 = [9, 13, 46, 51, 6, 6, 31, 28, 28, 10];
const counts1 = playlists1.map((p) => p.entries.length);
if (JSON.stringify(counts1) !== JSON.stringify(expect1)) throw new Error('Playlist counts differ: ' + counts1);
if (counts1.reduce((a, b) => a + b, 0) !== 228) throw new Error('Expected 228 playlist entries');
if (sections2.length !== 18) throw new Error('Expected 18 DSA sections');
const leaves2 = sections2.flatMap((s) => s.entries.flatMap((e) => (e.variants.length ? e.variants : [e])));
const rawUrlSet = new Set();
for (const p of playlists1) for (const e of p.entries) { if (e.lc) rawUrlSet.add(LC + e.lc); if (e.gfg) rawUrlSet.add(GFG + e.gfg); }
for (const l of leaves2) for (const k of l.links) rawUrlSet.add(k.url);
console.log(`parsed: ${counts1.reduce((a, b) => a + b, 0)} playlist entries, ${sections2.reduce((a, s) => a + s.entries.length, 0)} DSA entries / ${leaves2.length} leaf rows, ${rawUrlSet.size} distinct URLs`);

/* ---------- 3. reviewed fixes ---------- */
const fixes = [];
const log = (id, where, what, before, after) => fixes.push({ id, where, what, before, after });
const assertEq = (a, b, msg) => { if (a !== b) throw new Error(`Fix precondition failed (${msg}): expected "${b}", found "${a}"`); };
const pl = (title) => playlists1.find((p) => p.title.startsWith(title));
const en = (p, n) => pl(p).entries.find((e) => e.n === n);
const sec = (n) => sections2.find((s) => s.num === n);
const ent = (n, title) => { const e = sec(n).entries.find((x) => x.title === title); if (!e) throw new Error('No entry ' + title); return e; };
const vr = (e, label) => { const v = e.variants.find((x) => x.label === label || x.title === label); if (!v) throw new Error('No variant ' + label); return v; };
const link = (leaf, kind) => leaf.links.find((l) => l.kind === kind);
const dropLink = (leaf, kind, expectSlug) => {
  const i = leaf.links.findIndex((l) => l.kind === kind); assertEq(i >= 0, true, 'link exists');
  assertEq(leaf.links[i].url.replace(LC, '').replace(GFG, ''), expectSlug, 'dropped link');
  const [old] = leaf.links.splice(i, 1); return old;
};

// ---- doc 1
{ const e = en('Bit Manipulation', 5); assertEq(e.gfg, 'find-the-element-that-appears-once-in-sorted-array/', 'bit5');
  e.gfg = 'find-the-number-occurring-odd-number-of-times/';
  log('B1', 'Bit Manipulation › #5 Single Number-I', 'GFG link was the sorted-array version, replaced by the XOR "number occurring odd number of times" article', GFG + 'find-the-element-that-appears-once-in-sorted-array/', GFG + e.gfg); }
{ const e = en('Bit Manipulation', 8); assertEq(e.lc, 'find-the-xor-of-numbers-which-appear-twice/', 'bit8');
  log('B2', 'Bit Manipulation › #8 XOR of Numbers in a Given Range', 'LeetCode link was a different problem (Find the XOR of Numbers Which Appear Twice); LeetCode has no range-XOR problem', LC + e.lc, 'N/A'); e.lc = null; }
{ const e = en('Graph', 24); assertEq(e.lc, 'course-schedule/', 'g24');
  e.variants = [
    { title: 'Course Schedule I', lc: 'course-schedule/', gfg: 'problems/course-schedule/1' },
    { title: 'Course Schedule II', lc: 'course-schedule-ii/', gfg: null },
  ];
  log('G1', 'Graph › #24 Course Schedule I & II', 'Only part I was linked; split into two variants and added the LeetCode link for part II', `LC ${LC}course-schedule/ | GFG ${GFG}problems/course-schedule/1`, `I: same links | II: LC ${LC}course-schedule-ii/`);
  e.lc = null; e.gfg = null; }
{ const e = en('Graph', 25); assertEq(e.title, 'Find First Non-Repeating Character (Alien Dictionary)', 'g25');
  log('G2', 'Graph › #25', 'Title named a different problem; both links already pointed to Alien Dictionary', e.title, 'Alien Dictionary'); e.title = 'Alien Dictionary'; }
{ const e = en('Graph', 46); assertEq(e.lc, 'maximum-number-of-fish-in-a-grid/', 'g46');
  log('G3', "Graph › #46 Kosaraju's Algorithm", 'LeetCode link was Maximum Number of Fish in a Grid (unrelated)', LC + e.lc, 'N/A'); e.lc = null; }
{ const e = en('Dynamic Programming', 3); assertEq(e.gfg, 'minimum-cost-path-left-right-bottom-and-top-moves-allowed/', 'dp3');
  log('D1', 'DP › #3 Frog Jump (DP-3)', 'GFG link was a 4-direction grid shortest-path article; replaced by GFG "Geek Jump" (the Frog Jump problem)', GFG + e.gfg, GFG + 'problems/geek-jump/1'); e.gfg = 'problems/geek-jump/1'; }
{ const e = en('Dynamic Programming', 19); assertEq(e.title, 'Assign Cookies / Target Sum', 'dp19');
  log('D2', 'DP › #19', 'Title had a stray "Assign Cookies /" prefix; links are Target Sum', e.title, 'Target Sum'); e.title = 'Target Sum'; }
{ const e = en('Dynamic Programming', 21); assertEq(e.title, 'Target Sum / Minimum Coins', 'dp21');
  log('D3', 'DP › #21', 'Title mixed two problems; links are Minimum Coins', e.title, 'Minimum Coins'); e.title = 'Minimum Coins'; }
{ const e = en('Dynamic Programming', 35); assertEq(e.lc, 'best-time-to-buy-and-sell-stock-iii/', 'dp35');
  e.variants = [
    { title: 'Best Time to Buy and Sell Stock I', lc: 'best-time-to-buy-and-sell-stock/', gfg: null },
    { title: 'Best Time to Buy and Sell Stock II', lc: 'best-time-to-buy-and-sell-stock-ii/', gfg: null },
    { title: 'Best Time to Buy and Sell Stock III', lc: 'best-time-to-buy-and-sell-stock-iii/', gfg: e.gfg },
    { title: 'Best Time to Buy and Sell Stock IV', lc: 'best-time-to-buy-and-sell-stock-iv/', gfg: null },
  ];
  log('D4', 'DP › #35 Best Time to Buy and Sell Stock I, II, III, IV', 'Only III was linked; split into four variants with the LeetCode link for each part (GFG stays on III)', `LC ${LC}best-time-to-buy-and-sell-stock-iii/ | GFG ${GFG}${e.gfg}`, 'I, II, III, IV variants each with its own LeetCode link');
  e.lc = null; e.gfg = null; }
{ const e = en('Dynamic Programming', 47); assertEq(e.lc, 'parsing-a-boolean-expression/', 'dp47');
  log('D5', 'DP › #47 Evaluate Boolean Expression to True', 'LeetCode link was Parsing a Boolean Expression (a different problem); LeetCode has no Boolean Parenthesization', LC + e.lc, 'N/A'); e.lc = null; }
{ const e = en('Trie', 2); assertEq(e.lc, 'implement-trie-prefix-tree/', 'trie2');
  log('T1', 'Trie › #2 Implement Trie II', 'LeetCode link was Trie I; replaced by Implement Trie II (Prefix Tree)', LC + e.lc, LC + 'implement-trie-ii-prefix-tree/'); e.lc = 'implement-trie-ii-prefix-tree/'; }

// ---- doc 2
const premium = (label, slug) => ({ kind: 'leetcode', url: LC + slug, label, premium: true });
{ const e = ent(4, 'Number of Subarrays with Given XOR K'); const old = dropLink(e, 'leetcode', 'count-the-number-of-good-subarrays/');
  log('S1', 'DSA › 4. Number of Subarrays with Given XOR K', 'LeetCode link was Count the Number of Good Subarrays (unrelated to XOR)', old.url, 'N/A'); }
{ const e = ent(7, 'Max Meetings in One Room'); const old = dropLink(e, 'leetcode', 'meeting-rooms-ii/');
  log('S2', 'DSA › 7. Max Meetings in One Room', 'LeetCode link was Meeting Rooms II, which is the Minimum Platforms problem', old.url, 'N/A'); }
{ const e = ent(7, 'Minimum Platforms Required'); const old = link(e, 'leetcode'); assertEq(old.url, LC + 'meeting-rooms-iii/', 'S3');
  e.links.unshift(premium('Meeting Rooms II', 'meeting-rooms-ii/'));
  log('S3', 'DSA › 7. Minimum Platforms Required', 'Primary LeetCode link should be Meeting Rooms II; Meeting Rooms III kept as the Variant link', old.url, LC + 'meeting-rooms-ii/ (+ Meeting Rooms III kept as Variant)'); }
{ const e = vr(ent(11, 'Implement Stack'), 'Using Array'); const old = dropLink(e, 'leetcode', 'implement-stack-using-queues/');
  log('S4', 'DSA › 11. Implement Stack › Using Array', 'LeetCode link was the queue-based stack problem', old.url, 'N/A'); }
{ const e = vr(ent(11, 'Implement Queue'), 'Using Array'); const old = dropLink(e, 'leetcode', 'implement-queue-using-stacks/');
  log('S5', 'DSA › 11. Implement Queue › Using Array', 'LeetCode link was the stack-based queue problem', old.url, 'N/A'); }
{ const e = ent(11, 'Sort a Stack Using Only Recursion'); const old = dropLink(e, 'leetcode', 'evaluate-reverse-polish-notation/');
  log('S6', 'DSA › 11. Sort a Stack Using Only Recursion', 'LeetCode link was Evaluate Reverse Polish Notation (unrelated)', old.url, 'N/A'); }
{ const e = ent(13, 'Boundary Traversal'); const old = dropLink(e, 'leetcode', 'vertical-order-traversal-of-a-binary-tree/');
  e.links.unshift(premium('Boundary of Binary Tree', 'boundary-of-binary-tree/'));
  log('S7', 'DSA › 13. Boundary Traversal', 'LeetCode link was Vertical Order Traversal; replaced by Boundary of Binary Tree', old.url, LC + 'boundary-of-binary-tree/'); }
{ const e = ent(13, 'Children Sum Property'); const old = dropLink(e, 'leetcode', 'cousins-in-binary-tree/');
  log('S8', 'DSA › 13. Children Sum Property', 'LeetCode link was Cousins in Binary Tree (unrelated)', old.url, 'N/A'); }
{ const e = ent(16, 'Strongly Connected Components'); const old = dropLink(e, 'leetcode', 'critical-connections-in-a-network/');
  log('S9', 'DSA › 16. Strongly Connected Components', 'LeetCode link was Critical Connections (bridges), a different algorithm', old.url, 'N/A'); }
{ const e = ent(18, 'Count Distinct Substrings'); const old = dropLink(e, 'leetcode', 'distinct-subsequences/');
  e.links.unshift(premium('Number of Distinct Substrings in a String', 'number-of-distinct-substrings-in-a-string/'));
  log('S10', 'DSA › 18. Count Distinct Substrings', 'LeetCode link was Distinct Subsequences; replaced by Number of Distinct Substrings in a String', old.url, LC + 'number-of-distinct-substrings-in-a-string/'); }
{ const e = vr(ent(18, 'Implement Trie - I, II'), 'Trie I'); const g = link(e, 'gfg'); assertEq(g.url, GFG + 'problems/trie-insert-and-search0657/1', 'S11');
  g.url = GFG + 'problems/trie-insert-and-search0651/1';
  log('S11', 'DSA › 18. Implement Trie › Trie I', 'GFG slug typo (…0657); the verified GFG page is …0651', GFG + 'problems/trie-insert-and-search0657/1', g.url); }
{ const e = vr(ent(18, 'Implement Trie - I, II'), 'Trie II'); const oldLc = dropLink(e, 'leetcode', 'implement-trie-prefix-tree/'); const oldG = dropLink(e, 'gfg', 'problems/phone-directory4628/1');
  e.links.unshift(premium('Implement Trie II (Prefix Tree)', 'implement-trie-ii-prefix-tree/'));
  log('S12', 'DSA › 18. Implement Trie › Trie II', 'LeetCode link was Trie I (now Implement Trie II); GFG link was Phone Directory, a different problem', `LC ${oldLc.url} | GFG ${oldG.url}`, `LC ${LC}implement-trie-ii-prefix-tree/ | GFG N/A`); }
if (fixes.length !== 23) throw new Error('Expected 23 fixes, got ' + fixes.length);

/* ---------- 4. keep both links for the two unsettled slug conflicts ---------- */
const additions = [];
{ // Number of Islands II
  const a = en('Graph', 43), b = vr(ent(16, 'Number of Islands - I, II'), 'Number of Islands II');
  const bg = link(b, 'gfg');
  a.extraGfg = [{ url: bg.url.replace(GFG, ''), label: bg.label }];
  b.links.push({ kind: 'gfg', url: GFG + a.gfg, label: 'Graph playlist: Number of Islands II' });
  additions.push({ what: 'Number of Islands II: both GFG slugs kept on both pages', links: [GFG + a.gfg, bg.url] });
}
{ // Longest Word With All Prefixes / Longest Complete String
  const a = en('Trie', 3), b = ent(18, 'Longest Complete String');
  const bg = link(b, 'gfg');
  a.extraGfg = [{ url: bg.url.replace(GFG, ''), label: bg.label }];
  b.links.push({ kind: 'gfg', url: GFG + a.gfg, label: 'Trie playlist: Longest Word With All Prefixes' });
  additions.push({ what: 'Longest Word With All Prefixes / Longest Complete String: both GFG slugs kept on both pages', links: [GFG + a.gfg, bg.url] });
}

/* ---------- 5. build output model + progress ids ---------- */
const PL = [
  ['Bit Manipulation', 'bit-manipulation'], ['Maths', 'maths'], ['Graph', 'graph'], ['Dynamic Programming', 'dp'],
  ['Advanced DSA', 'advanced-dsa'], ['Trie', 'trie'], ['Binary Search', 'binary-search'], ['Stack and Queue', 'stack-and-queue'],
  ['Binary Tree', 'binary-tree'], ['Codeforces Essentials', 'codeforces-essentials'],
];
const mkLinks = (lc, gfg, extraGfg) => {
  const links = [];
  if (lc) links.push({ kind: 'leetcode', url: LC + lc });
  if (gfg) links.push({ kind: 'gfg', url: GFG + gfg });
  for (const x of extraGfg ?? []) links.push({ kind: 'gfg', url: GFG + x.url, label: x.label });
  return links;
};
const playlists = [];
playlists.push({
  slug: 'dsa', title: 'DSA Playlist', subtitle: 'Master DSA Problem Directory (LeetCode & GeeksforGeeks)', source: 'dsa-directory',
  topics: sections2.map((s) => ({
    id: `s${s.num}`, num: s.num, title: s.title,
    problems: s.entries.map((e, i) => {
      const id = `dsa-s${s.num}-e${i + 1}`;
      const p = { id, num: i + 1, title: e.title, links: e.links };
      if (e.variants.length) p.variants = e.variants.map((v, k) => ({ id: `${id}-v${k + 1}`, title: v.title, links: v.links }));
      return p;
    }),
  })),
});
for (const [short, slug] of PL) {
  const src = playlists1.find((p) => p.title.startsWith(short));
  playlists.push({
    slug, title: src.title, short, source: 'playlists',
    topics: [{
      id: slug, title: short,
      problems: src.entries.map((e) => {
        const id = `${slug}-${e.n}`;
        const p = { id, num: e.n, title: e.title, links: mkLinks(e.lc, e.gfg, e.extraGfg) };
        if (e.variants) p.variants = e.variants.map((v, k) => ({ id: `${id}-v${k + 1}`, title: v.title, links: mkLinks(v.lc, v.gfg) }));
        return p;
      }),
    }],
  });
}

// progress ids: rows that are the same problem (same primary link AND same normalised title) share one pid
const leavesOf = (p) => (p.variants?.length ? p.variants : [p]);
const all = [];
for (const pl_ of playlists) for (const t of pl_.topics) for (const p of t.problems) for (const leaf of leavesOf(p)) all.push({ pl: pl_, t, p, leaf });
const keyOf = (leaf) => {
  const lc = leaf.links.find((l) => l.kind === 'leetcode' && !l.note);
  const g = leaf.links.find((l) => l.kind === 'gfg');
  const base = lc?.url ?? g?.url;
  return base ? `${base}|${norm(leaf.title)}` : null;
};
const groups = new Map();
for (const r of all) { const k = keyOf(r.leaf); if (k) (groups.get(k) ?? groups.set(k, []).get(k)).push(r); }
let shared = 0;
for (const r of all) {
  const k = keyOf(r.leaf); const g = k ? groups.get(k) : null;
  if (g && g.length > 1) {
    r.leaf.pid = 'p:striver:g:' + slugify(norm(r.leaf.title) + '-' + (k.split('|')[0].split('/').filter(Boolean).slice(-2).join('-')));
    r.leaf.also = g.filter((x) => x !== r).map((x) => ({ page: x.pl.slug, title: x.pl.short ?? x.t.title }));
    shared++;
  } else r.leaf.pid = 'p:striver:' + r.leaf.id;
}
// parents that have variants keep a structural id only
for (const pl_ of playlists) for (const t of pl_.topics) {
  t.tid = `t:striver:${pl_.slug}:${t.id}`;
  for (const p of t.problems) if (p.variants?.length) p.pid = null;
}
const pidCount = new Set(all.map((r) => r.leaf.pid)).size;
console.log(`rows: ${all.length} leaf rows, ${pidCount} distinct progress ids, ${shared} rows share an id with another row`);

fs.writeFileSync(path.join(root, 'data/striver.json'), JSON.stringify({ playlists }));
fs.writeFileSync(path.join(root, 'data/striver-fixes.json'), JSON.stringify({ fixes, additions }, null, 2));
console.log(`wrote data/striver.json (${playlists.length} playlists) and ${fixes.length} logged fixes`);
