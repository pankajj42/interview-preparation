import type { Metadata } from 'next';
import { PageHeader } from '@/components/Page';
import { fixes } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Data notes' };

const LEFT = [
  'Loose stand-ins kept as given: Max Sum Increasing Subsequence → Maximum Subarray; K-th Element of Two Sorted Arrays → K-th Smallest Prime Fraction; Kth Smallest → the BST problem.',
  'Links to a neighbouring problem kept as given: Root to Node Path → the root-to-leaf versions; Nodes at Distance K → distance-from-root article; Coin Change GFG → the count-ways article; Max XOR of Two Numbers GFG → max subarray XOR; Count and Say GFG → Decode the String; K-th Permutation GFG → all permutations.',
  'Label oddities kept as given: Subset Sum II GFG label; “Mirror of Itself or Not” links the tree-inversion problems; Pascal’s “Element at (r, c)” carries the Nth-row links.',
  'Both GFG slugs are kept (on both pages) for Number of Islands II and for Longest Word With All Prefixes / Longest Complete String, because the two source lists disagree and neither could be verified.',
  'GFG practice-page links were not re-checked individually; apart from the changes above, link validity is as in the source lists.',
];

export default function Page() {
  const th = 'px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wider text-faint';
  const td = 'px-3 py-2.5 align-top text-[13.5px]';
  return (
    <div>
      <PageHeader eyebrow="Transparency" title="Data notes" subtitle="Everything that was changed in the source data, and everything that deliberately was not." />
      <section className="mb-8">
        <h2 className="mb-3 text-[20px] font-semibold">Fixes applied to the Striver lists ({fixes.fixes.length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead><tr className="border-b border-line"><th className={th}>#</th><th className={th}>Where</th><th className={th}>What</th><th className={th}>Before</th><th className={th}>After</th></tr></thead>
            <tbody>
              {fixes.fixes.map((f) => (
                <tr key={f.id} className="border-t border-line first:border-t-0">
                  <td className={`${td} mono text-faint`}>{f.id}</td><td className={`${td} font-medium`}>{f.where}</td><td className={td}>{f.what}</td>
                  <td className={`${td} mono break-all text-[12px] text-muted`}>{f.before}</td><td className={`${td} mono break-all text-[12px]`}>{f.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="mb-3 text-[20px] font-semibold">Kept as given</h2>
        <ul className="card m-0 flex list-none flex-col gap-2.5 p-5 text-[14px] text-muted">{LEFT.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>
      <section>
        <h2 className="mb-3 text-[20px] font-semibold">How the rest was handled</h2>
        <ul className="card m-0 flex list-none flex-col gap-2.5 p-5 text-[14px] text-muted">
          <li>The “Premium” marker in the DSA directory is not shown as a category; those LeetCode links are kept as ordinary links.</li>
          <li>Variant entries stay variants, and notes such as “Variant” or “Related/Extension” are shown beside the link they belong to.</li>
          <li>The spreadsheet has only LeetCode links, so each problem there has a single LeetCode link. Titles are derived from the link; the original URL is shown under each title.</li>
          <li>A problem that appears in several lists of the same track shares one progress record (done, star and remark), so it only has to be ticked once.</li>
        </ul>
      </section>
    </div>
  );
}
