'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { CatalogItem, SectionId } from '@/lib/types';
import { useStarMap } from '@/lib/store';
import { DoneCheck, StarButton } from './controls';
import { Chip, PageHeader } from './Page';

const TITLES: Record<SectionId, string> = { striver: 'Striver', dp: 'Ultimate DP', sd: 'System Design', ctci: 'Crack the Coding Interview' };
const MANUAL = (id: string) => id.startsWith('t:dp:pattern:') || id.startsWith('t:sd:');

export default function RevisionView({ items }: { items: CatalogItem[] }) {
  const stars = useStarMap();
  const [sec, setSec] = useState<'all' | SectionId>('all');
  const [kind, setKind] = useState<'all' | 'topic' | 'problem'>('all');
  const starred = useMemo(() => items.filter((i) => stars[i.id]), [items, stars]);
  const shown = starred.filter((i) => (sec === 'all' || i.section === sec) && (kind === 'all' || i.kind === kind));
  const counts = (k: (i: CatalogItem) => boolean) => starred.filter(k).length;
  const groups = (['striver', 'dp', 'sd', 'ctci'] as SectionId[]).map((s) => ({ s, rows: shown.filter((i) => i.section === s) })).filter((g) => g.rows.length);
  const tg = { '& .MuiToggleButton-root': { px: 1.4, py: 0.45, fontSize: 13, border: '1px solid var(--line)', color: 'var(--muted)', textTransform: 'none' }, '& .Mui-selected': { color: 'var(--accent) !important', bgcolor: 'var(--accent-soft) !important', fontWeight: 600 } } as const;
  return (
    <div data-section="revision">
      <PageHeader eyebrow="Revision" title="Marked for revision" subtitle="Everything you starred, topics first, across all four tracks. Unstar an item once you are comfortable with it.">
        <div className="flex flex-wrap items-center gap-3">
          <ToggleButtonGroup size="small" exclusive value={kind} onChange={(_, v) => v && setKind(v)} sx={tg} aria-label="Topics or problems">
            <ToggleButton value="all">All ({starred.length})</ToggleButton>
            <ToggleButton value="topic">Topics ({counts((i) => i.kind === 'topic')})</ToggleButton>
            <ToggleButton value="problem">Problems ({counts((i) => i.kind === 'problem')})</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup size="small" exclusive value={sec} onChange={(_, v) => v && setSec(v)} sx={tg} aria-label="Section">
            <ToggleButton value="all">Every section</ToggleButton>
            {(Object.keys(TITLES) as SectionId[]).map((s) => <ToggleButton key={s} value={s}>{TITLES[s]} ({counts((i) => i.section === s)})</ToggleButton>)}
          </ToggleButtonGroup>
        </div>
      </PageHeader>
      {shown.length === 0 && (
        <div className="card px-6 py-14 text-center">
          <div className="mb-1 text-[17px] font-semibold">{starred.length === 0 ? 'Nothing marked for revision yet' : 'Nothing matches these filters'}</div>
          <p className="mx-auto max-w-[46ch] text-[14px] text-muted">{starred.length === 0 ? 'Tap the star next to any topic or problem and it will be collected here.' : 'Try another section or switch back to “All”.'}</p>
        </div>
      )}
      <div className="flex flex-col gap-6">
        {groups.map(({ s, rows }) => (
          <section key={s} data-section={s}>
            <div className="mb-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" /><h2 className="text-[18px] font-semibold">{TITLES[s]}</h2><span className="tnum text-[13px] text-muted">{rows.length}</span></div>
            <div className="card overflow-hidden">
              {[...rows.filter((r) => r.kind === 'topic'), ...rows.filter((r) => r.kind === 'problem')].map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-3 py-2.5 first:border-t-0 sm:px-4">
                  {r.kind === 'problem' || MANUAL(r.id) ? <DoneCheck id={r.id} label={r.title} size={22} /> : <span className="w-[22px]" />}
                  <div className="min-w-0 flex-1 basis-[240px]">
                    <Link href={r.href} className="text-[14.5px] font-medium text-ink no-underline hover:text-accent hover:underline">{r.title}</Link>
                    <div className="truncate text-[12px] text-muted">{r.where}</div>
                  </div>
                  <Chip tone={r.kind === 'topic' ? 'accent' : 'plain'}>{r.kind}</Chip>
                  {r.also ? <Chip title="Shared with another list">shared</Chip> : null}
                  <StarButton id={r.id} label={r.title} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
