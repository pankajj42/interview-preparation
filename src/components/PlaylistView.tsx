'use client';
import { useEffect, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import type { PlaylistT, ProblemT } from '@/lib/types';
import { useCount, useDoneMap, useStarMap } from '@/lib/store';
import { ProgressRing } from './controls';
import { PageHeader, SearchBox, StatusFilter, type Filter } from './Page';
import ProblemListTopic from './ProblemListTopic';
import ResetDialog from './ResetDialog';

const leavesOf = (p: ProblemT) => (p.variants?.length ? p.variants : [p]);
const uniq = <T,>(a: T[]) => [...new Set(a)];

export default function PlaylistView({ playlist }: { playlist: PlaylistT }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Record<string, boolean>>(() => (playlist.topics.length === 1 ? { [playlist.topics[0].tid]: true } : {}));
  const [reset, setReset] = useState(false);
  const doneMap = useDoneMap();
  const starMap = useStarMap();
  const topicPids = useMemo(() => playlist.topics.map((t) => uniq(t.problems.flatMap(leavesOf).map((l) => l.pid as string))), [playlist]);
  const allPids = useMemo(() => uniq(topicPids.flat()), [topicPids]);
  const done = useCount(allPids, 'done');
  const stars = useCount([...allPids, ...playlist.topics.map((t) => t.tid)], 'star');
  const total = allPids.length;
  const active = q.trim() !== '' || filter !== 'all';

  const keep = (l: ProblemT, parent?: ProblemT) => {
    const needle = q.trim().toLowerCase();
    if (needle && !`${parent?.title ?? ''} ${l.title}`.toLowerCase().includes(needle)) return false;
    const pid = l.pid as string;
    if (filter === 'pending') return !doneMap[pid];
    if (filter === 'done') return !!doneMap[pid];
    if (filter === 'starred') return !!starMap[pid];
    return true;
  };
  const shown = useMemo(() => playlist.topics.map((t) => {
    if (!active) return t.problems;
    const out: ProblemT[] = [];
    for (const p of t.problems) {
      if (p.variants?.length) {
        const vs = p.variants.filter((v) => keep(v, p));
        if (vs.length === p.variants.length) out.push(p); else if (vs.length) out.push({ ...p, variants: vs });
      } else if (keep(p)) out.push(p);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [playlist, active, q, filter, doneMap, starMap]);

  // deep links (#problem-id or #topic-id) open the right topic and scroll to it
  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.slice(1));
    if (!h) return;
    const t = playlist.topics.find((x) => x.id === h || x.problems.some((p) => p.id === h || p.variants?.some((v) => v.id === h)));
    if (!t) return;
    setOpen((o) => ({ ...o, [t.tid]: true }));
    setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: 'center' }), 120);
  }, [playlist]);

  const nothing = shown.every((s) => s.length === 0);
  return (
    <div data-section="striver">
      <PageHeader eyebrow={`Striver · ${playlist.topics.length > 1 ? `${playlist.topics.length} topics` : 'topic playlist'}`} title={playlist.short ?? playlist.title} subtitle={playlist.subtitle ?? playlist.title}
        right={
          <div className="card flex items-center gap-4 px-5 py-3">
            <ProgressRing done={done} total={total} />
            <div className="text-[13px] leading-tight text-muted"><b className="tnum text-[18px] text-ink">{done}</b> / {total} done<br />{stars} marked for revision</div>
          </div>
        }>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search problems…" />
          <StatusFilter value={filter} onChange={setFilter} />
          <div className="ml-auto flex items-center gap-1">
            {playlist.topics.length > 1 && <>
              <Button size="small" onClick={() => setOpen(Object.fromEntries(playlist.topics.map((t) => [t.tid, true])))} sx={{ color: 'var(--muted)' }}>Expand all</Button>
              <Button size="small" onClick={() => setOpen({})} sx={{ color: 'var(--muted)' }}>Collapse all</Button>
            </>}
            <Button size="small" startIcon={<RestartAltRounded />} onClick={() => setReset(true)} sx={{ color: 'var(--muted)' }}>Reset…</Button>
          </div>
        </div>
      </PageHeader>
      <div className="flex flex-col gap-3">
        {playlist.topics.map((t, i) => {
          const rows = shown[i];
          if (active && rows.length === 0) return null;
          return (
            <ProblemListTopic key={t.tid} tid={t.tid} anchor={t.id} title={t.title} num={t.num ? String(t.num) : undefined} pids={topicPids[i]}
              open={active || !!open[t.tid]} onToggle={() => setOpen((o) => ({ ...o, [t.tid]: !o[t.tid] }))} problems={rows} />
          );
        })}
        {active && nothing && <div className="card px-5 py-10 text-center text-muted">No problems match this search or filter.</div>}
      </div>
      <ResetDialog open={reset} onClose={() => setReset(false)} scope={{ title: playlist.short ?? playlist.title, ids: [...allPids, ...playlist.topics.map((t) => t.tid)] }} />
    </div>
  );
}
