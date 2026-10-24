'use client';
import CheckRounded from '@mui/icons-material/CheckRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import StarBorderRounded from '@mui/icons-material/StarBorderRounded';
import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined';
import StickyNote2Rounded from '@mui/icons-material/StickyNote2Rounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import type { LinkT } from '@/lib/types';
import { toggleDone, toggleStar, useDone, useRemark, useStar } from '@/lib/store';

export const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

/* ---------- progress ---------- */
export function ProgressRing({ done, total, size = 44, stroke = 5, label = true }: { done: number; total: number; size?: number; stroke?: number; label?: boolean }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, f = total ? done / total : 0;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${done} of ${total} done`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} style={{ transition: 'stroke-dashoffset .3s ease' }} />
      </svg>
      {label && <span className="tnum absolute text-[11px] font-semibold text-ink">{pct(done, total)}%</span>}
    </span>
  );
}

export function Strip({ fractions, title }: { fractions: number[]; title?: string }) {
  return (
    <div className="strip" title={title} aria-hidden>
      {fractions.map((f, i) => <i key={i}><b style={{ width: `${Math.round(f * 100)}%` }} /></i>)}
    </div>
  );
}

/* ---------- row controls (all state lives in the local-storage store) ---------- */
export function DoneCheck({ id, label, size = 24 }: { id: string; label: string; size?: number }) {
  const done = useDone(id);
  return (
    <button type="button" role="checkbox" aria-checked={done} aria-label={`Mark ${label} as done`} title={done ? 'Done · click to undo' : 'Mark as done'}
      onClick={() => toggleDone(id)} style={{ width: size, height: size }}
      className={`focus-ring grid shrink-0 cursor-pointer place-items-center rounded-full border transition-colors ${done ? 'border-ok bg-ok text-white' : 'border-line-strong bg-transparent text-transparent hover:border-ok hover:text-ok/50'}`}>
      <CheckRounded sx={{ fontSize: size * 0.68 }} />
    </button>
  );
}

export function AutoDone({ done, size = 24, title }: { done: boolean; size?: number; title?: string }) {
  return (
    <span role="img" aria-label={done ? 'All done' : 'Not finished'} title={title ?? (done ? 'Every item is done' : 'Completes automatically when every item is done')} style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-full border ${done ? 'border-ok bg-ok text-white' : 'border-dashed border-line-strong text-transparent'}`}>
      <CheckRounded sx={{ fontSize: size * 0.68 }} />
    </span>
  );
}

export function StarButton({ id, label, size = 22 }: { id: string; label: string; size?: number }) {
  const on = useStar(id);
  const Icon = on ? StarRounded : StarBorderRounded;
  return (
    <button type="button" aria-pressed={on} aria-label={`Mark ${label} for revision`} title={on ? 'Marked for revision · click to remove' : 'Mark for revision'}
      onClick={() => toggleStar(id)}
      className={`focus-ring grid shrink-0 cursor-pointer place-items-center rounded-md p-0.5 transition-colors ${on ? 'text-star' : 'text-faint hover:text-star'}`}>
      <Icon sx={{ fontSize: size }} />
    </button>
  );
}

export function RemarkButton({ id, open, onClick, label, size = 20 }: { id: string; open: boolean; onClick: () => void; label: string; size?: number }) {
  const has = useRemark(id).trim().length > 0;
  const Icon = has ? StickyNote2Rounded : StickyNote2Outlined;
  return (
    <button type="button" aria-expanded={open} aria-label={`${has ? 'Edit' : 'Add'} remarks for ${label}`} title={has ? 'Edit remarks' : 'Add remarks'} onClick={onClick}
      className={`focus-ring grid shrink-0 cursor-pointer place-items-center rounded-md p-0.5 transition-colors ${has || open ? 'text-accent' : 'text-faint hover:text-accent'}`}>
      <Icon sx={{ fontSize: size }} />
    </button>
  );
}

/* ---------- links ---------- */
const HOST: Record<string, string> = { 'leetcode.com': 'LeetCode', 'www.geeksforgeeks.org': 'GFG', 'cses.fi': 'CSES', 'atcoder.jp': 'AtCoder', 'codeforces.com': 'Codeforces' };
export const hostLabel = (url: string) => { try { return HOST[new URL(url).hostname] ?? new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Link'; } };

export function LinkChips({ links }: { links: LinkT[] }) {
  const seen: Record<string, number> = {};
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {links.map((l, i) => {
        const base = hostLabel(l.url);
        seen[base] = (seen[base] ?? 0) + 1;
        const same = links.filter((x) => hostLabel(x.url) === base).length;
        const text = same > 1 ? `${base} ${seen[base]}` : base;
        const tip = [l.label, l.note, l.url].filter(Boolean).join(' · ');
        return (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={tip}
            className={`focus-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium no-underline transition-colors hover:border-accent hover:text-accent ${base === 'LeetCode' ? 'border-line-strong bg-surface-2 text-ink' : base === 'GFG' ? 'border-line-strong bg-surface text-ink' : 'border-line bg-surface text-muted'}`}>
            {text}{l.note && <span className="text-[10.5px] font-normal text-muted">· {l.note.toLowerCase()}</span>}
            <OpenInNewRounded sx={{ fontSize: 12 }} className="opacity-60" />
          </a>
        );
      })}
    </span>
  );
}
