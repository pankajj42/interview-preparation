'use client';
import { memo, useEffect, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import type { DpGroup, DpPattern, DpRow } from '@/lib/types';
import { dpGroupTid, dpPatternTid, dpPid } from '@/lib/catalog-ids';
import { useCount, useDoneMap, useRemark, useStarMap } from '@/lib/store';
import { DoneCheck, ProgressRing, RemarkButton, StarButton } from './controls';
import HtmlFragment from './HtmlFragment';
import { Chip, PageHeader, SearchBox, StatusFilter, type Filter } from './Page';
import RemarkEditor from './RemarkEditor';
import ResetDialog from './ResetDialog';
import Topic from './Topic';

const DIFF: Record<string, { label: string; cls: string }> = {
  E: { label: 'Easy', cls: 'bg-ok-soft text-ok' },
  M: { label: 'Medium', cls: 'bg-[#fff0d1] text-[#8a5a00] dark:bg-[#3a2b0f] dark:text-[#f2c14e]' },
  H: { label: 'Hard', cls: 'bg-[#fde3e1] text-[#b0281c] dark:bg-[#3a1717] dark:text-[#ff9a8b]' },
  X: { label: 'Extreme', cls: 'bg-[#ebe3ff] text-[#5a3cd0] dark:bg-[#271f4d] dark:text-[#b9abff]' },
};
const snippet = (t: string) => t.replace(/[#>*_`~\-\[\]]/g, '').replace(/\s+/g, ' ').trim();

/* ---------------- pattern atlas ---------------- */
export function DpPatterns({ patterns }: { patterns: DpPattern[] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [reset, setReset] = useState(false);
  const tids = useMemo(() => patterns.map((p) => dpPatternTid(p.n)), [patterns]);
  const done = useCount(tids, 'done');
  const stars = useCount(tids, 'star');
  const needle = q.trim().toLowerCase();
  const shown = patterns.filter((p) => !needle || `${p.title} ${p.search} ${p.eyebrow}`.toLowerCase().includes(needle));
  useEffect(() => {
    const m = window.location.hash.match(/^#pattern-(\d+)$/);
    if (!m) return;
    setOpen((o) => ({ ...o, [Number(m[1])]: true }));
    setTimeout(() => document.getElementById(`pattern-${m[1]}`)?.scrollIntoView({ block: 'start' }), 150);
  }, []);
  return (
    <div data-section="dp">
      <PageHeader eyebrow="Ultimate DP · pattern atlas" title="Pattern atlas" subtitle="Twenty-two DP patterns, each with its state, transition, diagram and pitfalls. Tick a pattern when you can explain and recreate it."
        right={<div className="card flex items-center gap-4 px-5 py-3"><ProgressRing done={done} total={patterns.length} /><div className="text-[13px] leading-tight text-muted"><b className="tnum text-[18px] text-ink">{done}</b> / {patterns.length} studied<br />{stars} marked for revision</div></div>}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search patterns…" />
          <div className="ml-auto flex items-center gap-1">
            <Button size="small" onClick={() => setOpen(Object.fromEntries(patterns.map((p) => [p.n, true])))} sx={{ color: 'var(--muted)' }}>Expand all</Button>
            <Button size="small" onClick={() => setOpen({})} sx={{ color: 'var(--muted)' }}>Collapse all</Button>
            <Button size="small" startIcon={<RestartAltRounded />} onClick={() => setReset(true)} sx={{ color: 'var(--muted)' }}>Reset…</Button>
          </div>
        </div>
      </PageHeader>
      <div className="flex flex-col gap-3">
        {shown.map((p) => (
          <Topic key={p.n} tid={dpPatternTid(p.n)} anchor={`pattern-${p.n}`} num={p.label} title={p.title} subtitle={p.eyebrow} manual open={!!open[p.n] || !!needle} onToggle={() => setOpen((o) => ({ ...o, [p.n]: !o[p.n] }))}>
            <div className="p-3 sm:p-5"><HtmlFragment scope="dp" html={p.layoutHtml + p.detailsHtml} /></div>
          </Topic>
        ))}
        {shown.length === 0 && <div className="card px-5 py-10 text-center text-muted">No patterns match.</div>}
      </div>
      <ResetDialog open={reset} onClose={() => setReset(false)} scope={{ title: 'the pattern atlas', ids: tids }} />
    </div>
  );
}

/* ---------------- problem bank ---------------- */
const DpRowItem = memo(function DpRowItem({ row, gid, also }: { row: DpRow; gid: string; also: string[] }) {
  const [open, setOpen] = useState(false);
  const pid = dpPid(row.key);
  const remark = useRemark(pid);
  const d = DIFF[row.diff] ?? { label: row.diff, cls: 'bg-surface-2 text-muted' };
  return (
    <div id={gid} className="anchor-row scroll-mt-24 border-t border-line first:border-t-0">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 py-2.5 pl-3 pr-3 sm:pl-4 sm:pr-4">
        <div className="pt-px"><DoneCheck id={pid} label={row.name} /></div>
        <div className="min-w-0 flex-1 basis-[230px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14.5px] font-medium leading-snug">{row.name}</span>
            <span title="Difficulty" className={`rounded-md px-1.5 py-px text-[11px] font-semibold ${d.cls}`}>{d.label}</span>
            {row.tags && <Chip>{row.tags}</Chip>}
            {also.length > 0 && <Chip title="The same problem is listed in more than one group. Progress is shared.">also in {also.join(', ')}</Chip>}
          </div>
          {remark.trim() && !open && <button type="button" onClick={() => setOpen(true)} className="focus-ring mt-1 block max-w-full cursor-pointer truncate rounded text-left text-[12.5px] text-muted hover:text-ink"><span className="text-accent">Remark ·</span> {snippet(remark)}</button>}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {row.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" title={l.url} className="focus-ring inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface-2 px-2.5 py-0.5 text-[12px] font-medium text-ink no-underline hover:border-accent hover:text-accent">
              {l.text.replace(/\s*↗\s*$/, '')}<OpenInNewRounded sx={{ fontSize: 12 }} className="opacity-60" />
            </a>
          ))}
          {row.noLink && <span className="text-[12px] italic text-faint">{row.noLink}</span>}
          <StarButton id={pid} label={row.name} />
          <RemarkButton id={pid} open={open} onClick={() => setOpen((o) => !o)} label={row.name} />
        </div>
      </div>
      {open && <div className="pb-3 pl-[min(3.4rem,12vw)] pr-3 sm:pr-4"><RemarkEditor id={pid} label={row.name} autoFocus /><div className="mt-2"><button type="button" onClick={() => setOpen(false)} className="focus-ring cursor-pointer rounded-lg px-2.5 py-1 text-[13px] text-muted hover:bg-surface-2 hover:text-ink">Close</button></div></div>}
    </div>
  );
});

export function DpBank({ groups }: { groups: DpGroup[] }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [diff, setDiff] = useState('all');
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [reset, setReset] = useState(false);
  const doneMap = useDoneMap();
  const starMap = useStarMap();
  const pidsOf = useMemo(() => groups.map((g) => [...new Set(g.rows.map((r) => dpPid(r.key)))]), [groups]);
  const allPids = useMemo(() => [...new Set(pidsOf.flat())], [pidsOf]);
  const alsoOf = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const g of groups) for (const r of g.rows) m.set(r.key, [...(m.get(r.key) ?? []), g.label]);
    return m;
  }, [groups]);
  const done = useCount(allPids, 'done');
  const stars = useCount([...allPids, ...groups.map((g) => dpGroupTid(g.n))], 'star');
  const active = q.trim() !== '' || filter !== 'all' || diff !== 'all';
  const needle = q.trim().toLowerCase();
  const keep = (r: DpRow) => {
    if (needle && !`${r.name} ${r.tags}`.toLowerCase().includes(needle)) return false;
    if (diff !== 'all' && r.diff !== diff) return false;
    const pid = dpPid(r.key);
    if (filter === 'pending') return !doneMap[pid];
    if (filter === 'done') return !!doneMap[pid];
    if (filter === 'starred') return !!starMap[pid];
    return true;
  };
  useEffect(() => {
    const m = window.location.hash.match(/^#(?:problems-(\d+)|dp-(\d+)-\d+)$/);
    if (!m) return;
    const n = Number(m[1] ?? m[2]);
    setOpen((o) => ({ ...o, [n]: true }));
    setTimeout(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'center' }), 150);
  }, []);
  return (
    <div data-section="dp">
      <PageHeader eyebrow="Ultimate DP · problem bank" title="Problem bank" subtitle="239 problems in 22 pattern groups, linked to LeetCode, CSES and AtCoder. A group completes automatically when all of its problems are done."
        right={<div className="card flex items-center gap-4 px-5 py-3"><ProgressRing done={done} total={allPids.length} /><div className="text-[13px] leading-tight text-muted"><b className="tnum text-[18px] text-ink">{done}</b> / {allPids.length} distinct problems<br />{stars} marked for revision</div></div>}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search problems or tags…" />
          <StatusFilter value={filter} onChange={setFilter} />
          <ToggleButtonGroup size="small" exclusive value={diff} onChange={(_, v) => v && setDiff(v)} aria-label="Filter by difficulty"
            sx={{ '& .MuiToggleButton-root': { px: 1.2, py: 0.45, fontSize: 13, border: '1px solid var(--line)', color: 'var(--muted)', textTransform: 'none' }, '& .Mui-selected': { color: 'var(--accent) !important', bgcolor: 'var(--accent-soft) !important', fontWeight: 600 } }}>
            <ToggleButton value="all">Any level</ToggleButton>
            {Object.entries(DIFF).map(([k, v]) => <ToggleButton key={k} value={k}>{v.label}</ToggleButton>)}
          </ToggleButtonGroup>
          <div className="ml-auto flex items-center gap-1">
            <Button size="small" onClick={() => setOpen(Object.fromEntries(groups.map((g) => [g.n, true])))} sx={{ color: 'var(--muted)' }}>Expand all</Button>
            <Button size="small" onClick={() => setOpen({})} sx={{ color: 'var(--muted)' }}>Collapse all</Button>
            <Button size="small" startIcon={<RestartAltRounded />} onClick={() => setReset(true)} sx={{ color: 'var(--muted)' }}>Reset…</Button>
          </div>
        </div>
      </PageHeader>
      <div className="flex flex-col gap-3">
        {groups.map((g, gi) => {
          const idx = g.rows.map((r, i) => [r, i] as const).filter(([r]) => keep(r));
          if (active && idx.length === 0) return null;
          return (
            <Topic key={g.n} tid={dpGroupTid(g.n)} anchor={`problems-${g.n}`} num={g.label} title={g.title} subtitle={g.count} pids={pidsOf[gi]} open={active || !!open[g.n]} onToggle={() => setOpen((o) => ({ ...o, [g.n]: !o[g.n] }))}>
              <div>{idx.map(([r, i]) => <DpRowItem key={`${g.n}-${i}`} row={r} gid={`dp-${g.n}-${i + 1}`} also={(alsoOf.get(r.key) ?? []).filter((l) => l !== g.label)} />)}</div>
            </Topic>
          );
        })}
      </div>
      <ResetDialog open={reset} onClose={() => setReset(false)} scope={{ title: 'the problem bank', ids: [...allPids, ...groups.map((g) => dpGroupTid(g.n))] }} />
    </div>
  );
}
