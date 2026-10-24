import type { Metadata } from 'next';
import { ItemCards } from '@/components/Cards';
import { dp, dpGroupTid, dpPatternTid, dpPids, readFragment } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Ultimate DP' };

export default function DpHome() {
  const items = [
    { href: '/dp/patterns', title: 'Pattern atlas', subtitle: `${dp.patterns.length} patterns with diagrams, state, transition and pitfalls. Tick a pattern once you can recreate it.`, tids: dp.patterns.map((p) => dpPatternTid(p.n)) },
    { href: '/dp/problem-bank', title: 'Problem bank', subtitle: `${dp.groups.reduce((a, g) => a + g.rows.length, 0)} problems in ${dp.groups.length} groups, linked to LeetCode, CSES and AtCoder.`, ids: dpPids(), meta: `${dp.groups.length} groups · ${dp.groups.map((g) => dpGroupTid(g.n)).length} topics` },
    { href: '/dp/reference', title: 'Reference tables', subtitle: 'Cross-reference, interview guide, CSES and AtCoder maps, quick reference and the study loop.' },
  ];
  return (
    <div data-section="dp" className="flex flex-col gap-6">
      <div className="dp-scope" dangerouslySetInnerHTML={{ __html: readFragment('dp', 'hero') }} />
      <ItemCards items={items} />
      <div className="dp-scope" dangerouslySetInnerHTML={{ __html: readFragment('dp', 'engine') }} />
    </div>
  );
}
