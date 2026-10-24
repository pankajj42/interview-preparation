import type { Metadata } from 'next';
import { PageHeader } from '@/components/Page';
import { readFragment } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Reference tables · Ultimate DP' };

const PARTS = ['cross-reference', 'interview', 'cses', 'atcoder', 'quick-reference', 'study-loop', 'footer'] as const;
export default function Page() {
  return (
    <div data-section="dp">
      <PageHeader eyebrow="Ultimate DP · reference" title="Reference tables" subtitle="The guide's lookup material, exactly as written: the cross-reference, interview guide, CSES and AtCoder maps, the quick reference and the study loop." />
      <div className="flex flex-col gap-6">
        {PARTS.map((p) => <div key={p} className="dp-scope" dangerouslySetInnerHTML={{ __html: readFragment('dp', p) }} />)}
      </div>
    </div>
  );
}
