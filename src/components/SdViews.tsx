'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import type { SdPart } from '@/lib/types';
import { sdTid } from '@/lib/catalog-ids';
import { useCount, useDoneMap } from '@/lib/store';
import { DoneCheck, ProgressRing, StarButton, Strip } from './controls';
import HtmlFragment from './HtmlFragment';
import { PageHeader } from './Page';
import ResetDialog from './ResetDialog';

export function SdPartView({ part, html, prev, next }: { part: SdPart; html: string; prev?: { slug: string; title: string }; next?: { slug: string; title: string } }) {
  const tids = useMemo(() => part.topics.map((t) => sdTid(t.key)), [part]);
  const done = useCount(tids, 'done');
  const stars = useCount(tids, 'star');
  const [toc, setToc] = useState(false);
  const [reset, setReset] = useState(false);
  const navLink = 'card focus-ring flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-[14px] no-underline hover:border-accent';
  return (
    <div data-section="sd">
      <PageHeader eyebrow="System Design" title={part.title}
        right={tids.length > 0 ? <div className="card flex items-center gap-4 px-5 py-3"><ProgressRing done={done} total={tids.length} /><div className="text-[13px] leading-tight text-muted"><b className="tnum text-[18px] text-ink">{done}</b> / {tids.length} topics done<br />{stars} marked for revision</div></div> : undefined}>
        {tids.length > 0 && (
          <div className="card overflow-hidden">
            <div className="flex items-center">
              <button type="button" aria-expanded={toc} onClick={() => setToc((o) => !o)} className="focus-ring flex flex-1 cursor-pointer items-center gap-2 px-4 py-3 text-left text-[14px] font-semibold">
                <ExpandMoreRounded sx={{ transform: toc ? 'none' : 'rotate(-90deg)', transition: 'transform .18s', color: 'var(--muted)' }} /> Topics in this part ({tids.length})
              </button>
              <Button size="small" startIcon={<RestartAltRounded />} onClick={() => setReset(true)} sx={{ mr: 1, color: 'var(--muted)' }}>Reset…</Button>
            </div>
            <Collapse in={toc} unmountOnExit>
              <ul className="m-0 grid list-none gap-x-6 border-t border-line p-3 sm:grid-cols-2">
                {part.topics.map((t) => (
                  <li key={t.key} className={`flex items-center gap-2 py-1 ${t.level === 4 ? 'pl-6' : ''}`}>
                    <DoneCheck id={sdTid(t.key)} label={t.title} size={20} />
                    <a href={`#${t.key}`} className="min-w-0 flex-1 truncate text-[13.5px] text-ink no-underline hover:text-accent"><span className="tnum mr-1.5 text-faint">{t.num}</span>{t.title}</a>
                    <StarButton id={sdTid(t.key)} label={t.title} size={18} />
                  </li>
                ))}
              </ul>
            </Collapse>
          </div>
        )}
      </PageHeader>
      <HtmlFragment scope="sd" html={html} />
      <div className="mt-6 flex flex-wrap gap-3">
        {prev ? <Link href={`/system-design/${prev.slug}/`} className={navLink}><ArrowBackRounded fontSize="small" /><span className="truncate"><span className="block text-[11px] uppercase tracking-wider text-faint">Previous</span>{prev.title}</span></Link> : <span className="flex-1" />}
        {next ? <Link href={`/system-design/${next.slug}/`} className={`${navLink} justify-end text-right`}><span className="truncate"><span className="block text-[11px] uppercase tracking-wider text-faint">Next</span>{next.title}</span><ArrowForwardRounded fontSize="small" /></Link> : <span className="flex-1" />}
      </div>
      <ResetDialog open={reset} onClose={() => setReset(false)} scope={{ title: part.title, ids: tids }} />
    </div>
  );
}

export function SdPartCards({ parts }: { parts: SdPart[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {parts.map((p) => <PartCard key={p.slug} part={p} />)}
    </div>
  );
}
function PartCard({ part }: { part: SdPart }) {
  const tids = useMemo(() => part.topics.map((t) => sdTid(t.key)), [part]);
  const done = useCount(tids, 'done');
  const doneMap = useDoneMap();
  return (
    <Link href={`/system-design/${part.slug}/`} className="card focus-ring flex flex-col gap-3 p-5 no-underline transition-colors hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-semibold leading-snug text-ink">{part.title}</h3>
        {tids.length > 0 && <ProgressRing done={done} total={tids.length} size={38} stroke={4} label={false} />}
      </div>
      <div className="text-[13px] text-muted">{tids.length > 0 ? `${done} / ${tids.length} topics done` : 'Reference material'}</div>
      {tids.length > 0 && <Strip fractions={tids.map((id) => (doneMap[id] ? 1 : 0))} />}
    </Link>
  );
}
