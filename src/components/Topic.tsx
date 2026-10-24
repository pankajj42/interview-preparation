'use client';
import { useState, type ReactNode } from 'react';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import { setDone, useCount } from '@/lib/store';
import { AutoDone, DoneCheck, StarButton } from './controls';
import ResetDialog from './ResetDialog';
import TopicRemarks from './TopicRemarks';

export interface TopicProps {
  tid: string; anchor: string; title: string; num?: string; subtitle?: string; open: boolean; onToggle: () => void;
  pids?: readonly string[]; // topic completes automatically when all of these are done
  manual?: boolean;         // topic has its own done tick (reading topics)
  noRemarks?: boolean; children: ReactNode;
}

export default function Topic({ tid, anchor, title, num, subtitle, open, onToggle, pids, manual, noRemarks, children }: TopicProps) {
  const done = useCount(pids ?? [], 'done');
  const total = pids?.length ?? 0;
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [reset, setReset] = useState(false);
  const finished = total > 0 && done === total;
  return (
    <section id={anchor} className="card scroll-mt-20 overflow-hidden">
      <div className="flex items-center gap-1.5 pr-2 sm:gap-2.5 sm:pr-3">
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${anchor}-body`} className="focus-ring flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[inherit] px-3 py-3 text-left sm:px-4">
          <ExpandMoreRounded sx={{ fontSize: 22, color: 'var(--muted)', transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .18s' }} />
          {num && <span className="tnum grid h-7 min-w-7 shrink-0 place-items-center rounded-lg bg-accent-soft px-1.5 text-[12px] font-semibold text-accent">{num}</span>}
          <span className="min-w-0">
            <span className="block font-display text-[16.5px] font-semibold leading-snug">{title}</span>
            {subtitle && <span className="block text-[12.5px] text-muted">{subtitle}</span>}
          </span>
        </button>
        {total > 0 && (
          <span className="hidden items-center gap-2 sm:flex" title={`${done} of ${total} done`}>
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3"><span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${(done / total) * 100}%` }} /></span>
            <span className={`tnum w-[46px] text-right text-[12.5px] ${finished ? 'font-semibold text-ok' : 'text-muted'}`}>{done}/{total}</span>
          </span>
        )}
        {manual ? <DoneCheck id={tid} label={title} /> : total > 0 ? <AutoDone done={finished} /> : null}
        <StarButton id={tid} label={title} />
        <IconButton size="small" aria-label={`Actions for ${title}`} onClick={(e) => setMenu(e.currentTarget)} sx={{ color: 'var(--muted)' }}><MoreVertRounded fontSize="small" /></IconButton>
        <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} slotProps={{ paper: { sx: { backgroundImage: 'none', minWidth: 190 } } }}>
          {pids && pids.length > 0 && <MenuItem onClick={() => { setDone(pids, true); setMenu(null); }}>Mark all done</MenuItem>}
          {pids && pids.length > 0 && <MenuItem onClick={() => { setDone(pids, false); setMenu(null); }}>Unmark all</MenuItem>}
          <MenuItem onClick={() => { setMenu(null); setReset(true); }} sx={{ color: 'var(--danger)' }}>Reset this topic…</MenuItem>
        </Menu>
      </div>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <div id={`${anchor}-body`} className="border-t border-line">
          {children}
          {!noRemarks && <TopicRemarks id={tid} title={title} />}
        </div>
      </Collapse>
      <ResetDialog open={reset} onClose={() => setReset(false)} scope={{ title: `“${title}”`, ids: [...(pids ?? []), tid] }} />
    </section>
  );
}
