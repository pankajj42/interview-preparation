'use client';
import { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import ctciIndex from '../../data/ctci-index.json';
import { ctciPid, ctciTid } from '@/lib/catalog-ids';
import { deriveTitle } from '@/lib/title';
import { useCount, useDoneMap, useRemark, useStarMap } from '@/lib/store';
import { AutoDone, DoneCheck, ProgressRing, RemarkButton, StarButton, Strip } from './controls';
import { Chip, PageHeader, SearchBox, StatusFilter, type Filter } from './Page';
import RemarkEditor from './RemarkEditor';
import ResetDialog from './ResetDialog';
import TopicRemarks from './TopicRemarks';

const DIFF: Record<string, { label: string; cls: string }> = {
  E: { label: 'Easy', cls: 'bg-ok-soft text-ok' },
  M: { label: 'Medium', cls: 'bg-[#fff0d1] text-[#8a5a00] dark:bg-[#3a2b0f] dark:text-[#f2c14e]' },
  H: { label: 'Hard', cls: 'bg-[#fde3e1] text-[#b0281c] dark:bg-[#3a1717] dark:text-[#ff9a8b]' },
};
const snippet = (t: string) => t.replace(/[#>*_`~\-\[\]]/g, '').replace(/\s+/g, ' ').trim();
const idx = ctciIndex as { slugs: string[]; tabs: { slug: string; title: string; group: string; count: number; idx: number[] }[] };
const tabIds = (t: { idx: number[] }) => t.idx.map((i) => ctciPid(idx.slugs[i]));

/* ---------------- index: every tab with its own progress ---------------- */
const GROUPS = [
  { id: 'priority', title: 'By priority', blurb: 'Must do, can do, optional' },
  { id: 'difficulty', title: 'By difficulty', blurb: 'Easy, medium, hard' },
  { id: 'topic', title: 'By topic', blurb: 'One list per LeetCode topic' },
];
function TabCard({ t }: { t: (typeof idx.tabs)[number] }) {
  const ids = useMemo(() => tabIds(t), [t]);
  const done = useCount(ids, 'done');
  return (
    <Link href={`/ctci/${t.slug}/`} className="card focus-ring flex flex-col gap-2 px-4 py-3 no-underline transition-colors hover:border-accent">
      <div className="flex items-center justify-between gap-2"><span className="truncate text-[14.5px] font-semibold text-ink">{t.title}</span><span className="tnum shrink-0 text-[12px] text-muted">{done}/{t.count}</span></div>
      <Strip fractions={[done / t.count]} />
    </Link>
  );
}
export function CtciIndex() {
  const all = useMemo(() => idx.slugs.map(ctciPid), []);
  const done = useCount(all, 'done');
  return (
    <div data-section="ctci">
      <PageHeader eyebrow="Crack the Coding Interview" title="Crack the Coding Interview"
        subtitle={<>{idx.slugs.length.toLocaleString('en')} LeetCode problems, shown in {idx.tabs.length} lists exactly as in the spreadsheet. A problem that appears in several lists is one problem: ticking it, starring it or writing a remark updates every list.</>}
        right={<div className="card flex items-center gap-4 px-5 py-3"><ProgressRing done={done} total={all.length} /><div className="text-[13px] leading-tight text-muted"><b className="tnum text-[18px] text-ink">{done}</b> / {all.length.toLocaleString('en')} problems done</div></div>} />
      <div className="flex flex-col gap-8">
        {GROUPS.map((g) => (
          <section key={g.id}>
            <div className="mb-3 flex items-baseline gap-3"><h2 className="text-[20px] font-semibold">{g.title}</h2><span className="text-[13px] text-muted">{g.blurb}</span></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{idx.tabs.filter((t) => t.group === g.id).map((t) => <TabCard key={t.slug} t={t} />)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ---------------- one tab ---------------- */
type Row = { n: number; topics: string; slug: string; diff: string; title: string };
const CtciRow = memo(function CtciRow({ r }: { r: Row }) {
  const [open, setOpen] = useState(false);
  const pid = ctciPid(r.slug);
  const remark = useRemark(pid);
  const d = DIFF[r.diff];
  return (
    <div id={r.slug} className="anchor-row row-cv scroll-mt-24 border-t border-line first:border-t-0">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 py-2.5 pl-3 pr-3 sm:pl-4 sm:pr-4">
        <div className="pt-px"><DoneCheck id={pid} label={r.title} /></div>
        <span className="tnum mt-[3px] w-9 shrink-0 text-right text-[12px] text-faint">{r.n}</span>
        <div className="min-w-0 flex-1 basis-[240px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <a href={`https://leetcode.com/problems/${r.slug}`} target="_blank" rel="noopener noreferrer" className="text-[14.5px] font-medium leading-snug text-ink no-underline hover:text-accent hover:underline">{r.title}</a>
            <span title="Difficulty" className={`rounded-md px-1.5 py-px text-[11px] font-semibold ${d.cls}`}>{d.label}</span>
            {r.topics.split(', ').map((t) => <Chip key={t}>{t}</Chip>)}
          </div>
          <div className="mono mt-0.5 hidden truncate text-[11.5px] text-faint sm:block" title="Original link from the sheet">leetcode.com/problems/{r.slug}</div>
          {remark.trim() && !open && <button type="button" onClick={() => setOpen(true)} className="focus-ring mt-1 block max-w-full cursor-pointer truncate rounded text-left text-[12.5px] text-muted hover:text-ink"><span className="text-accent">Remark ·</span> {snippet(remark)}</button>}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <a href={`https://leetcode.com/problems/${r.slug}`} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface-2 px-2.5 py-0.5 text-[12px] font-medium text-ink no-underline hover:border-accent hover:text-accent">LeetCode<OpenInNewRounded sx={{ fontSize: 12 }} className="opacity-60" /></a>
          <StarButton id={pid} label={r.title} />
          <RemarkButton id={pid} open={open} onClick={() => setOpen((o) => !o)} label={r.title} />
        </div>
      </div>
      {open && <div className="pb-3 pl-[min(3.4rem,12vw)] pr-3 sm:pr-4"><RemarkEditor id={pid} label={r.title} autoFocus /><div className="mt-2"><button type="button" onClick={() => setOpen(false)} className="focus-ring cursor-pointer rounded-lg px-2.5 py-1 text-[13px] text-muted hover:bg-surface-2 hover:text-ink">Close</button></div></div>}
    </div>
  );
});

export function CtciTab({ tab, rows, credit, creditUrl }: { tab: { slug: string; title: string; group: string }; rows: [number, string, string, string][]; credit: string; creditUrl: string }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [diff, setDiff] = useState('all');
  const [reset, setReset] = useState(false);
  const doneMap = useDoneMap();
  const starMap = useStarMap();
  const items: Row[] = useMemo(() => rows.map((r) => ({ n: r[0], topics: r[1], slug: r[2], diff: r[3], title: deriveTitle(r[2]) })), [rows]);
  const ids = useMemo(() => items.map((r) => ctciPid(r.slug)), [items]);
  const done = useCount(ids, 'done');
  const tid = ctciTid(tab.slug);
  const stars = useCount([...ids, tid], 'star');
  const needle = q.trim().toLowerCase();
  const shown = items.filter((r) => {
    if (needle && !`${r.title} ${r.topics} ${r.slug} ${r.n}`.toLowerCase().includes(needle)) return false;
    if (diff !== 'all' && r.diff !== diff) return false;
    const pid = ctciPid(r.slug);
    if (filter === 'pending') return !doneMap[pid];
    if (filter === 'done') return !!doneMap[pid];
    if (filter === 'starred') return !!starMap[pid];
    return true;
  });
  useEffect(() => { const h = window.location.hash.slice(1); if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: 'center' }), 150); }, []);
  const eyebrow = tab.group === 'priority' ? 'By priority' : tab.group === 'difficulty' ? 'By difficulty' : 'By topic';
  return (
    <div data-section="ctci">
      <PageHeader eyebrow={`Crack the Coding Interview · ${eyebrow}`} title={tab.title} subtitle={<>From the sheet <a href={creditUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">{credit}</a>. {items.length.toLocaleString('en')} problems.</>}
        right={<div className="card flex items-center gap-4 px-5 py-3"><ProgressRing done={done} total={ids.length} /><div className="text-[13px] leading-tight text-muted"><b className="tnum text-[18px] text-ink">{done}</b> / {ids.length} done<br />{stars} marked for revision</div></div>}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search by name, topic or number…" />
          <StatusFilter value={filter} onChange={setFilter} />
          <ToggleButtonGroup size="small" exclusive value={diff} onChange={(_, v) => v && setDiff(v)} aria-label="Filter by difficulty"
            sx={{ '& .MuiToggleButton-root': { px: 1.2, py: 0.45, fontSize: 13, border: '1px solid var(--line)', color: 'var(--muted)', textTransform: 'none' }, '& .Mui-selected': { color: 'var(--accent) !important', bgcolor: 'var(--accent-soft) !important', fontWeight: 600 } }}>
            <ToggleButton value="all">Any level</ToggleButton>
            {Object.entries(DIFF).map(([k, v]) => <ToggleButton key={k} value={k}>{v.label}</ToggleButton>)}
          </ToggleButtonGroup>
          <div className="ml-auto flex items-center gap-2">
            <AutoDone done={done === ids.length} title="This list is complete when every problem in it is done" />
            <StarButton id={tid} label={tab.title} />
            <Button size="small" startIcon={<RestartAltRounded />} onClick={() => setReset(true)} sx={{ color: 'var(--muted)' }}>Reset…</Button>
          </div>
        </div>
      </PageHeader>
      <section className="card overflow-hidden">
        {shown.map((r) => <CtciRow key={r.slug} r={r} />)}
        {shown.length === 0 && <div className="px-5 py-10 text-center text-muted">No problems match this search or filter.</div>}
        <TopicRemarks id={tid} title={tab.title} />
      </section>
      <div className="mt-3 text-[12.5px] text-muted">Showing {shown.length.toLocaleString('en')} of {items.length.toLocaleString('en')}. Titles are derived from each link; the original LeetCode URL is shown under every title.</div>
      <ResetDialog open={reset} onClose={() => setReset(false)} scope={{ title: tab.title, ids: [...ids, tid] }} />
    </div>
  );
}
