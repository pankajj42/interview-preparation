'use client';
import type { ReactNode } from 'react';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export type Filter = 'all' | 'pending' | 'done' | 'starred';

export function PageHeader({ eyebrow, title, subtitle, right, children }: { eyebrow?: string; title: string; subtitle?: ReactNode; right?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-accent"><span className="h-px w-5 bg-accent" />{eyebrow}</div>}
          <h1 className="text-[30px] font-semibold leading-tight sm:text-[36px]">{title}</h1>
          {subtitle && <p className="mt-2 max-w-[68ch] text-[15px] text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </header>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-muted focus-within:border-accent focus-within:text-ink sm:max-w-[320px]">
      <SearchRounded sx={{ fontSize: 19 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint" />
    </label>
  );
}

export function StatusFilter({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <ToggleButtonGroup size="small" exclusive value={value} onChange={(_, v) => v && onChange(v)} aria-label="Filter by status"
      sx={{ '& .MuiToggleButton-root': { px: 1.4, py: 0.45, fontSize: 13, border: '1px solid var(--line)', color: 'var(--muted)', textTransform: 'none' }, '& .Mui-selected': { color: 'var(--accent) !important', bgcolor: 'var(--accent-soft) !important', fontWeight: 600 } }}>
      <ToggleButton value="all">All</ToggleButton>
      <ToggleButton value="pending">To do</ToggleButton>
      <ToggleButton value="done">Done</ToggleButton>
      <ToggleButton value="starred">Starred</ToggleButton>
    </ToggleButtonGroup>
  );
}

export function Chip({ children, title, tone = 'plain' }: { children: ReactNode; title?: string; tone?: 'plain' | 'accent' | 'ok' }) {
  const t = tone === 'accent' ? 'border-transparent bg-accent-soft text-accent' : tone === 'ok' ? 'border-transparent bg-ok-soft text-ok' : 'border-line bg-surface-2 text-muted';
  return <span title={title} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-4 ${t}`}>{children}</span>;
}
