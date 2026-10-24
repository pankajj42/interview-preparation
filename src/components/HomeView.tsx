'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import ctciIndex from '../../data/ctci-index.json';
import type { NavSection } from '@/lib/types';
import { ctciPid } from '@/lib/catalog-ids';
import { STORAGE_LIMIT_BYTES, useAll, useCountPrefix, useDoneMap, useStorageBytes } from '@/lib/store';
import { ProgressRing, Strip } from './controls';

const CTCI_SEGMENTS = (ctciIndex as { slugs: string[]; tabs: { idx: number[] }[] }).tabs.map((t) => t.idx.map((i) => ctciPid((ctciIndex as { slugs: string[] }).slugs[i])));

function SectionCard({ s, segments }: { s: NavSection; segments: string[][] }) {
  const doneMap = useDoneMap();
  const prob = useCountPrefix(s.problemPrefix ?? '\u0000', 'done');
  const top = useCountPrefix(s.id === 'dp' ? 't:dp:pattern:' : s.id === 'sd' ? 't:sd:' : '\u0000', 'done');
  const stars = useCountPrefix(`p:${s.id === 'sd' ? 'sd' : s.id}:`, 'star') + useCountPrefix(`t:${s.id}:`, 'star');
  const fractions = useMemo(() => segments.map((ids) => (ids.length ? ids.filter((id) => doneMap[id]).length / ids.length : 0)), [segments, doneMap]);
  const useProblems = s.problemTotal > 0;
  const lines = [
    useProblems ? `${prob.toLocaleString('en')} / ${s.problemTotal.toLocaleString('en')} problems` : null,
    s.id === 'dp' ? `${top} / ${s.topicTotal} patterns studied` : null,
    s.id === 'sd' ? `${top} / ${s.topicTotal} topics` : null,
  ].filter(Boolean);
  return (
    <Link href={`${s.href}/`} data-section={s.id} className="card focus-ring group flex flex-col gap-4 p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-accent sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" /><span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-accent">{s.id === 'sd' ? 'Design' : s.id === 'dp' ? 'Dynamic programming' : s.id === 'ctci' ? 'Problem sheet' : 'Playlists'}</span></div>
          <h2 className="text-[24px] font-semibold leading-tight text-ink">{s.title}</h2>
        </div>
        <ProgressRing done={useProblems ? prob : top} total={useProblems ? s.problemTotal : s.topicTotal} size={54} stroke={6} />
      </div>
      <p className="text-[14px] leading-relaxed text-muted">{s.blurb}</p>
      <Strip fractions={fractions} title={`${segments.length} segments`} />
      <div className="mt-auto flex items-center justify-between text-[13px]">
        <span className="text-ink">{lines.map((l, i) => <span key={i} className="mr-3 inline-block tnum">{l}</span>)}</span>
        <span className="flex items-center gap-3 text-muted">
          {stars > 0 && <span className="inline-flex items-center gap-0.5"><StarRounded sx={{ fontSize: 16 }} className="text-star" />{stars}</span>}
          <ArrowForwardRounded sx={{ fontSize: 18 }} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
        </span>
      </div>
    </Link>
  );
}

export default function HomeView({ nav, segments }: { nav: NavSection[]; segments: { striver: string[][]; dp: string[][]; sd: string[][] } }) {
  const all = useAll();
  const doneN = Object.keys(all.done).length, starN = Object.keys(all.star).length, remN = Object.keys(all.remark).length;
  const bytes = useStorageBytes();
  return (
    <div>
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"><span className="h-px w-6 bg-line-strong" />Four tracks, one place</div>
        <h1 className="text-[40px] font-semibold leading-[1.05] sm:text-[54px]">Interview preparation</h1>
        <p className="mt-4 max-w-[62ch] text-[16px] text-muted">Striver&apos;s playlists, the Ultimate DP guide, the System Design blueprint and the Crack the Coding Interview sheet. Tick things off, star what to revisit and keep remarks; it all stays in this browser.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-[13px]">
          <span className="card tnum px-3 py-1.5"><b>{doneN.toLocaleString('en')}</b> done</span>
          <Link href="/revision/" className="card focus-ring inline-flex items-center gap-1 px-3 py-1.5 no-underline hover:border-accent"><StarRounded sx={{ fontSize: 16 }} className="text-star" /><b className="tnum">{starN}</b> to revise</Link>
          <span className="card tnum px-3 py-1.5"><b>{remN}</b> remarks</span>
          <Link href="/settings/" className="card focus-ring inline-flex items-center gap-1 px-3 py-1.5 no-underline hover:border-accent"><StorageRounded sx={{ fontSize: 16 }} className="text-muted" /><span className="tnum">{(bytes / 1024).toFixed(1)} KB / {(STORAGE_LIMIT_BYTES / 1048576).toFixed(0)} MB used</span></Link>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {nav.map((s) => <SectionCard key={s.id} s={s} segments={s.id === 'ctci' ? CTCI_SEGMENTS : segments[s.id]} />)}
      </div>
    </div>
  );
}
