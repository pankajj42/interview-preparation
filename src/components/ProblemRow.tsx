'use client';
import { memo, useState } from 'react';
import type { ProblemT } from '@/lib/types';
import { useRemark } from '@/lib/store';
import { DoneCheck, LinkChips, RemarkButton, StarButton } from './controls';
import { Chip } from './Page';
import RemarkEditor from './RemarkEditor';

const snippet = (t: string) => t.replace(/[#>*_`~\-\[\]]/g, '').replace(/\s+/g, ' ').trim();

const Leaf = memo(function Leaf({ leaf, title, num, indent }: { leaf: ProblemT; title: string; num?: number; indent?: boolean }) {
  const [open, setOpen] = useState(false);
  const pid = leaf.pid as string;
  const remark = useRemark(pid);
  return (
    <div id={leaf.id} className={`anchor-row scroll-mt-24 border-t border-line first:border-t-0 ${indent ? 'bg-surface-2/50' : ''}`}>
      <div className={`flex flex-wrap items-start gap-x-3 gap-y-2 py-2.5 pr-3 sm:pr-4 ${indent ? 'pl-7 sm:pl-12' : 'pl-3 sm:pl-4'}`}>
        <div className="pt-px"><DoneCheck id={pid} label={title} /></div>
        <div className="min-w-0 flex-1 basis-[230px]">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {num != null && <span className="tnum min-w-[1.6em] text-right text-[12px] text-faint">{num}</span>}
            <span className="text-[14.5px] font-medium leading-snug">{title}</span>
            {leaf.also && leaf.also.length > 0 && <Chip title={`The same problem also appears in: ${leaf.also.map((a) => a.title).join(', ')}. Progress is shared.`}>also in {leaf.also.map((a) => a.title).join(', ')}</Chip>}
          </div>
          {remark.trim() && !open && (
            <button type="button" onClick={() => setOpen(true)} className="focus-ring mt-1 block max-w-full cursor-pointer truncate rounded text-left text-[12.5px] text-muted hover:text-ink" title="Open remarks">
              <span className="text-accent">Remark ·</span> {snippet(remark)}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {leaf.links.length ? <LinkChips links={leaf.links} /> : <span className="text-[12px] text-faint">no link</span>}
          <StarButton id={pid} label={title} />
          <RemarkButton id={pid} open={open} onClick={() => setOpen((o) => !o)} label={title} />
        </div>
      </div>
      {open && (
        <div className="pb-3 pr-3 sm:pr-4" style={{ paddingLeft: indent ? 'min(3rem, 12vw)' : 'min(3.4rem, 12vw)' }}>
          <RemarkEditor id={pid} label={title} autoFocus />
          <div className="mt-2"><button type="button" onClick={() => setOpen(false)} className="focus-ring cursor-pointer rounded-lg px-2.5 py-1 text-[13px] text-muted hover:bg-surface-2 hover:text-ink">Close</button></div>
        </div>
      )}
    </div>
  );
});

/** One row; entries that have variants render a label row followed by one row per variant. */
export const ProblemItem = memo(function ProblemItem({ p, index }: { p: ProblemT; index?: number }) {
  if (p.variants?.length) {
    return (
      <div id={p.id} className="scroll-mt-24 border-t border-line first:border-t-0">
        <div className="flex flex-wrap items-center gap-2 bg-surface-2/70 px-3 py-2 sm:px-4">
          {(p.num ?? index) != null && <span className="tnum min-w-[1.6em] pl-[34px] text-right text-[12px] text-faint sm:pl-[36px]">{p.num ?? index}</span>}
          <span className="text-[14.5px] font-semibold leading-snug">{p.title}</span>
          <Chip>{p.variants.length} variants</Chip>
        </div>
        {p.variants.map((v) => <Leaf key={v.id} leaf={v} title={v.title} indent />)}
      </div>
    );
  }
  return <Leaf leaf={p} title={p.title} num={p.num ?? index} />;
});
