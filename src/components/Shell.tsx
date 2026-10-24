'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useColorScheme } from '@mui/material/styles';
import MenuRounded from '@mui/icons-material/MenuRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import SettingsBrightnessRounded from '@mui/icons-material/SettingsBrightnessRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import FactCheckRounded from '@mui/icons-material/FactCheckRounded';
import type { NavItem, NavSection, SectionId } from '@/lib/types';
import { useCount, useCountPrefix } from '@/lib/store';
import { ProgressRing } from './controls';

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
export function sectionOf(pathname: string): SectionId | 'revision' | undefined {
  const p = norm(pathname);
  if (p.startsWith('/striver')) return 'striver';
  if (p.startsWith('/dp')) return 'dp';
  if (p.startsWith('/system-design')) return 'sd';
  if (p.startsWith('/ctci')) return 'ctci';
  if (p.startsWith('/revision')) return 'revision';
  return undefined;
}

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  if (!mode) return <span className="inline-block h-8 w-[104px]" aria-hidden />;
  return (
    <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)} aria-label="Colour theme"
      sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.5, border: '1px solid var(--line)', color: 'var(--muted)' }, '& .Mui-selected': { color: 'var(--ink) !important', bgcolor: 'var(--surface-3) !important' } }}>
      <ToggleButton value="light" aria-label="Light theme" title="Light"><LightModeRounded fontSize="small" /></ToggleButton>
      <ToggleButton value="system" aria-label="Match system theme" title="System"><SettingsBrightnessRounded fontSize="small" /></ToggleButton>
      <ToggleButton value="dark" aria-label="Dark theme" title="Dark"><DarkModeRounded fontSize="small" /></ToggleButton>
    </ToggleButtonGroup>
  );
}

function ItemProgress({ item }: { item: NavItem }) {
  const list = item.ids ?? item.tids ?? [];
  const done = useCount(list, 'done');
  if (!list.length) return null;
  return <span className={`tnum text-[11px] ${done === list.length ? 'font-semibold text-ok' : 'text-faint'}`}>{done}/{list.length}</span>;
}

function SectionProgress({ s }: { s: NavSection }) {
  const prob = useCountPrefix(s.problemPrefix ?? '\u0000', 'done');
  const top = useCountPrefix(s.topicPrefix ?? '\u0000', 'done');
  const useProblems = s.problemTotal > 0;
  return <ProgressRing done={useProblems ? prob : top} total={useProblems ? s.problemTotal : s.topicTotal} size={30} stroke={4} label={false} />;
}

function NavTree({ nav, onNavigate }: { nav: NavSection[]; onNavigate?: () => void }) {
  const pathname = norm(usePathname());
  const active = sectionOf(pathname);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => { if (active && active !== 'revision') setOpen((o) => ({ ...o, [active]: true })); }, [active]);
  const isActive = (s: NavSection, it: NavItem) => (norm(it.href) === pathname) || (norm(it.href) !== norm(s.href) && pathname.startsWith(norm(it.href) + '/'));
  const link = 'focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] no-underline transition-colors';
  return (
    <nav aria-label="Sections" className="flex flex-col gap-1 px-3 pb-6 pt-2">
      <Link href="/" onClick={onNavigate} className={`${link} ${pathname === '/' ? 'bg-surface-3 font-semibold text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}><HomeRounded sx={{ fontSize: 19 }} />Home</Link>
      <Link href="/revision/" onClick={onNavigate} data-section="revision" className={`${link} ${pathname === '/revision' ? 'bg-surface-3 font-semibold text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}><StarRounded sx={{ fontSize: 19 }} className="text-accent" />Revision</Link>
      <div className="my-2 h-px bg-line" />
      {nav.map((s) => {
        const isOpen = !!open[s.id];
        return (
          <div key={s.id} data-section={s.id}>
            <div className="flex items-center">
              <Link href={`${s.href}/`} onClick={onNavigate} className={`${link} min-w-0 flex-1 ${active === s.id ? 'font-semibold text-ink' : 'text-ink'} hover:bg-surface-2`}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate">{s.title}</span>
              </Link>
              <SectionProgress s={s} />
              <IconButton size="small" aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${s.title}`} aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))} sx={{ ml: 0.5, color: 'var(--muted)' }}>
                <ExpandMoreRounded fontSize="small" sx={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </IconButton>
            </div>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <div className="ml-[18px] mt-1 flex flex-col gap-0.5 border-l border-line pl-2 pb-2">
                {s.groups.map((g, gi) => (
                  <div key={gi} className="flex flex-col gap-0.5">
                    {g.label && <div className="px-3 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">{g.label}</div>}
                    {g.items.map((it) => (
                      <Link key={it.href} href={`${it.href}/`} onClick={onNavigate} aria-current={isActive(s, it) ? 'page' : undefined}
                        className={`${link} justify-between py-1.5 text-[13.5px] ${isActive(s, it) ? 'bg-accent-soft font-semibold text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}>
                        <span className="truncate">{it.label}</span>
                        <ItemProgress item={it} />
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        );
      })}
      <div className="my-2 h-px bg-line" />
      <Link href="/settings/" onClick={onNavigate} className={`${link} ${pathname === '/settings' ? 'bg-surface-3 font-semibold text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}><StorageRounded sx={{ fontSize: 19 }} />Data &amp; backup</Link>
      <Link href="/notes/" onClick={onNavigate} className={`${link} ${pathname === '/notes' ? 'bg-surface-3 font-semibold text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}><FactCheckRounded sx={{ fontSize: 19 }} />Data notes</Link>
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-lg no-underline">
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-ink text-bg" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="2.6" rx="1.3" fill="currentColor" /><rect x="2" y="7.7" width="9.5" height="2.6" rx="1.3" fill="currentColor" opacity=".75" /><rect x="2" y="12.4" width="12" height="2.6" rx="1.3" fill="currentColor" opacity=".5" /></svg>
      </span>
      <span className="whitespace-nowrap font-display text-[15px] font-semibold tracking-tight text-ink sm:text-[17px]">Interview preparation</span>
    </Link>
  );
}

export default function Shell({ nav, children }: { nav: NavSection[]; children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const stars = useCountPrefix('', 'star');
  const section = sectionOf(pathname);
  useEffect(() => { setMobile(false); }, [pathname]);
  return (
    <div data-section={section} className="min-h-screen">
      <header className="no-print fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/85 px-3 backdrop-blur-md lg:left-[var(--nav-w)] lg:px-6">
        <IconButton className="lg:!hidden" aria-label="Open navigation" onClick={() => setMobile(true)} sx={{ color: 'var(--ink)' }}><MenuRounded /></IconButton>
        <div className="lg:hidden"><Brand /></div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/revision/" title="Items marked for revision" className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[13px] font-medium text-ink no-underline hover:bg-surface-2">
            <StarRounded sx={{ fontSize: 17 }} className="text-star" /><span className="tnum">{stars}</span><span className="hidden sm:inline text-muted">to revise</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-[var(--nav-w)] flex-col overflow-y-auto border-r border-line bg-surface lg:flex">
        <div className="flex h-14 shrink-0 items-center px-4"><Brand /></div>
        <NavTree nav={nav} />
      </aside>
      <Drawer open={mobile} onClose={() => setMobile(false)} sx={{ display: { lg: 'none' }, '& .MuiDrawer-paper': { width: 'min(86vw, 320px)', bgcolor: 'var(--surface)', backgroundImage: 'none' } }}>
        <div className="flex h-14 shrink-0 items-center px-4"><Brand /></div>
        <NavTree nav={nav} onNavigate={() => setMobile(false)} />
      </Drawer>
      <main className="pt-14 lg:pl-[var(--nav-w)]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
