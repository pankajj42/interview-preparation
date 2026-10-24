import fs from 'node:fs';
import path from 'node:path';
import striverData from '../../data/striver.json';
import dpData from '../../data/dp.json';
import sdData from '../../data/sd.json';
import ctciData from '../../data/ctci.json';
import fixesData from '../../data/striver-fixes.json';
import { deriveTitle } from './title';
import type { CatalogItem, CtciTab, DpGroup, DpPattern, NavSection, PlaylistT, ProblemT, SdPart } from './types';

/* ---------- raw data ---------- */
export const playlists = (striverData as unknown as { playlists: PlaylistT[] }).playlists;
export const dp = dpData as unknown as { patterns: DpPattern[]; groups: DpGroup[] };
export const sdParts = (sdData as unknown as { parts: SdPart[] }).parts;
export const ctci = ctciData as unknown as { credit: string; creditUrl: string; tabs: CtciTab[] };
export const fixes = fixesData as unknown as { fixes: { id: string; where: string; what: string; before: string; after: string }[]; additions: { what: string; links: string[] }[] };

export function readFragment(dir: 'dp' | 'sd', name: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'content', dir, `${name}.html`), 'utf8');
}

/* ---------- ids ---------- */
export { dpPid, dpPatternTid, dpGroupTid, sdTid, ctciPid, ctciTid } from './catalog-ids';
import { dpPid, dpPatternTid, dpGroupTid, sdTid, ctciPid, ctciTid } from './catalog-ids';

export const leaves = (p: ProblemT): ProblemT[] => (p.variants?.length ? p.variants : [p]);
export const uniq = <T,>(xs: T[]) => [...new Set(xs)];
export const playlistPids = (pl: PlaylistT) => uniq(pl.topics.flatMap((t) => t.problems.flatMap(leaves).map((l) => l.pid as string)));
export const dpPids = () => uniq(dp.groups.flatMap((g) => g.rows.map((r) => dpPid(r.key))));
export const ctciUniqueSlugs = () => uniq(ctci.tabs.flatMap((t) => t.rows.map((r) => r[2])));

export const sectionTitle = { striver: 'Striver', dp: 'Ultimate DP', sd: 'System Design', ctci: 'Crack the Coding Interview' } as const;

/* ---------- navigation + section metrics ---------- */
export function buildNav(): NavSection[] {
  const striverTotal = uniq(playlists.flatMap(playlistPids)).length;
  const groupLabel = { priority: 'By priority', difficulty: 'By difficulty', topic: 'By topic' } as const;
  return [
    {
      id: 'striver', title: 'Striver', href: '/striver',
      blurb: `The DSA playlist and ten topic playlists, each topic a collapsible list with LeetCode and GeeksforGeeks links.`,
      problemPrefix: 'p:striver:', topicPrefix: 't:striver:', problemTotal: striverTotal, topicTotal: playlists.reduce((a, p) => a + p.topics.length, 0),
      groups: [{ items: playlists.map((p) => ({ label: p.short ?? p.title, href: `/striver/${p.slug}`, ids: playlistPids(p), tids: p.topics.map((t) => t.tid) })) }],
    },
    {
      id: 'dp', title: 'Ultimate DP', href: '/dp',
      blurb: `${dp.patterns.length} patterns with diagrams, ${dp.groups.reduce((a, g) => a + g.rows.length, 0)} problems, and the CSES and AtCoder maps.`,
      problemPrefix: 'p:dp:', topicPrefix: 't:dp:pattern:', problemTotal: dpPids().length, topicTotal: dp.patterns.length,
      groups: [{ items: [
        { label: 'Start here', href: '/dp' },
        { label: 'Pattern atlas', href: '/dp/patterns', tids: dp.patterns.map((p) => dpPatternTid(p.n)) },
        { label: 'Problem bank', href: '/dp/problem-bank', ids: dpPids(), tids: dp.groups.map((g) => dpGroupTid(g.n)) },
        { label: 'Reference tables', href: '/dp/reference' },
      ] }],
    },
    {
      id: 'sd', title: 'System Design', href: '/system-design',
      blurb: 'The interview blueprint: LLD, HLD, case studies, cheat sheets and a study plan.',
      topicPrefix: 't:sd:', problemTotal: 0, topicTotal: sdParts.reduce((a, p) => a + p.topics.length, 0),
      groups: [{ items: [{ label: 'Overview', href: '/system-design' }, ...sdParts.map((p) => ({ label: p.title, href: `/system-design/${p.slug}`, tids: p.topics.map((t) => sdTid(t.key)) }))] }],
    },
    {
      id: 'ctci', title: 'Crack the Coding Interview', href: '/ctci',
      blurb: `${ctciUniqueSlugs().length.toLocaleString('en')} LeetCode problems across ${ctci.tabs.length} views: priority, difficulty and topic.`,
      problemPrefix: 'p:ctci:', topicPrefix: 't:ctci:', problemTotal: ctciUniqueSlugs().length, topicTotal: ctci.tabs.length,
      groups: (['priority', 'difficulty', 'topic'] as const).map((g) => ({ label: groupLabel[g], items: ctci.tabs.filter((t) => t.group === g).map((t) => ({ label: t.title, href: `/ctci/${t.slug}` })) })),
    },
  ];
}

/* ---------- catalog of everything that can be starred (for the Revision page) ---------- */
export function buildCatalog(): CatalogItem[] {
  const items: CatalogItem[] = [];
  const seen = new Set<string>();
  const add = (it: CatalogItem) => { if (!seen.has(it.id)) { seen.add(it.id); items.push(it); } };
  for (const pl of playlists) {
    for (const t of pl.topics) {
      add({ id: t.tid, kind: 'topic', section: 'striver', title: t.title, where: `Striver › ${pl.short ?? pl.title}`, href: `/striver/${pl.slug}#${t.id}` });
      for (const p of t.problems) for (const l of leaves(p))
        add({ id: l.pid as string, kind: 'problem', section: 'striver', title: p.variants?.length ? `${p.title} › ${l.title}` : l.title, where: `Striver › ${pl.short ?? pl.title} › ${t.title}`, href: `/striver/${pl.slug}#${l.id}`, also: l.also?.length });
    }
  }
  for (const p of dp.patterns) add({ id: dpPatternTid(p.n), kind: 'topic', section: 'dp', title: `${p.label} ${p.title}`, where: 'Ultimate DP › Pattern atlas', href: `/dp/patterns#pattern-${p.n}` });
  for (const g of dp.groups) {
    add({ id: dpGroupTid(g.n), kind: 'topic', section: 'dp', title: `${g.label} ${g.title}`, where: 'Ultimate DP › Problem bank', href: `/dp/problem-bank#problems-${g.n}` });
    g.rows.forEach((r, i) => add({ id: dpPid(r.key), kind: 'problem', section: 'dp', title: r.name, where: `Ultimate DP › ${g.label} ${g.title}`, href: `/dp/problem-bank#dp-${g.n}-${i + 1}` }));
  }
  for (const part of sdParts) for (const t of part.topics)
    add({ id: sdTid(t.key), kind: 'topic', section: 'sd', title: `${t.num ? t.num + ' ' : ''}${t.title}`, where: `System Design › ${part.title}`, href: `/system-design/${part.slug}#${t.key}` });
  for (const tab of ctci.tabs) {
    add({ id: ctciTid(tab.slug), kind: 'topic', section: 'ctci', title: tab.title, where: 'Crack the Coding Interview', href: `/ctci/${tab.slug}` });
    for (const r of tab.rows) add({ id: ctciPid(r[2]), kind: 'problem', section: 'ctci', title: deriveTitle(r[2]), where: `Crack the Coding Interview › ${tab.title}`, href: `/ctci/${tab.slug}#${r[2]}` });
  }
  return items;
}
