'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CloudDoneRounded from '@mui/icons-material/CloudDoneRounded';
import CloudOffRounded from '@mui/icons-material/CloudOffRounded';
import CloudSyncRounded from '@mui/icons-material/CloudSyncRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import LoginRounded from '@mui/icons-material/LoginRounded';
import Link from 'next/link';
import { CloudSync } from '@/lib/cloud';
import { cloudConfigured, getSupabase } from '@/lib/supabase';
import { disconnectCloud, setBlockedHandler, useSyncStatus } from '@/lib/store';

export interface AuthUser { id: string; email: string; name: string; avatar?: string }
export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'signed-in';
interface Ctx { status: AuthStatus; user: AuthUser | null; error: string | null; signIn: () => Promise<void>; signOut: () => Promise<void>; promptSignIn: () => void; syncNow: () => Promise<void> }

const AuthCtx = createContext<Ctx>({ status: 'loading', user: null, error: null, signIn: async () => {}, signOut: async () => {}, promptSignIn: () => {}, syncNow: async () => {} });
export const useAuth = () => useContext(AuthCtx);

const toUser = (u: User): AuthUser => {
  const m = (u.user_metadata ?? {}) as Record<string, unknown>;
  const email = u.email ?? '';
  return { id: u.id, email, name: String(m.full_name ?? m.name ?? email.split('@')[0] ?? 'You'), avatar: (m.avatar_url ?? m.picture) as string | undefined };
};

export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(cloudConfigured ? 'loading' : 'unconfigured');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | 'out' | 'loading'>(null);
  const sync = useRef<CloudSync | null>(null);

  useEffect(() => {
    setBlockedHandler((why) => setDialog(why));
    const sb = getSupabase();
    if (!sb) return () => setBlockedHandler(null);
    let alive = true;
    const attach = (session: Session | null) => {
      if (!alive) return;
      const u = session?.user;
      if (u) {
        if (sync.current?.userId === u.id) { setUser(toUser(u)); return; }
        sync.current?.stop();
        sync.current = new CloudSync(sb, u.id);
        setUser(toUser(u)); setStatus('signed-in'); setDialog(null);
        void sync.current.start();
      } else {
        sync.current?.stop(); sync.current = null;
        disconnectCloud(); setUser(null); setStatus('signed-out');
      }
    };
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      setTimeout(() => attach(session), 0); // never call Supabase from inside this callback
    });
    return () => { alive = false; data.subscription.unsubscribe(); sync.current?.stop(); sync.current = null; disconnectCloud(); setBlockedHandler(null); };
  }, []);

  const signIn = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) { setDialog('out'); return; }
    setError(null);
    const { error: e } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href.split('#')[0] } });
    if (e) setError(e.message);
  }, []);
  const signOut = useCallback(async () => {
    const sb = getSupabase();
    await sync.current?.flushNow();
    await sb?.auth.signOut();
  }, []);
  const syncNow = useCallback(async () => { await sync.current?.syncNow(); }, []);
  const promptSignIn = useCallback(() => setDialog('out'), []);
  const value = useMemo(() => ({ status, user, error, signIn, signOut, promptSignIn, syncNow }), [status, user, error, signIn, signOut, promptSignIn, syncNow]);

  return (
    <AuthCtx.Provider value={value}>
      {children}
      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { backgroundImage: 'none', borderRadius: '16px' } } }}>
        {status === 'unconfigured' ? <>
          <DialogTitle sx={{ fontWeight: 600 }}>Cloud sync is not set up yet</DialogTitle>
          <DialogContent><p className="text-[14px] text-muted">Progress is saved to your own Supabase project. Add its URL and publishable key to <code className="mono">.env.local</code>, run the SQL in <code className="mono">supabase/migrations</code>, and rebuild. The README has the walkthrough.</p></DialogContent>
        </> : dialog === 'loading' ? <>
          <DialogTitle sx={{ fontWeight: 600 }}>Loading your progress…</DialogTitle>
          <DialogContent><p className="text-[14px] text-muted">Your saved progress is still being fetched. Try again in a moment.</p></DialogContent>
        </> : <>
          <DialogTitle sx={{ fontWeight: 600 }}>Sign in to save your progress</DialogTitle>
          <DialogContent>
            <p className="mb-4 text-[14px] text-muted">Ticks, revision stars and remarks are stored in your account, so they follow you across phone, laptop and tablet. You can read everything without signing in.</p>
            <Button fullWidth variant="outlined" onClick={signIn} startIcon={<GoogleMark />} sx={{ py: 1.1, color: 'var(--ink)', borderColor: 'var(--line-strong)' }}>Continue with Google</Button>
            {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
          </DialogContent>
        </>}
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDialog(null)} sx={{ color: 'var(--muted)' }}>Close</Button></DialogActions>
      </Dialog>
    </AuthCtx.Provider>
  );
}

/* ---------- small UI pieces ---------- */
export function SyncIcon({ size = 18 }: { size?: number }) {
  const s = useSyncStatus();
  const { status } = useAuth();
  if (status !== 'signed-in') return null;
  const sx = { fontSize: size };
  if (s.phase === 'loading') return <CircularProgress size={size - 2} thickness={5} aria-label="Loading your progress" />;
  if (s.activity === 'error') return <ErrorOutlineRounded sx={{ ...sx, color: 'var(--danger)' }} titleAccess={`Could not save: ${s.error ?? ''}. Retrying…`} />;
  if (s.activity === 'offline') return <CloudOffRounded sx={{ ...sx, color: 'var(--star)' }} titleAccess="Offline: changes will sync when you reconnect" />;
  if (s.activity === 'saving') return <CloudSyncRounded sx={{ ...sx, color: 'var(--accent)' }} titleAccess="Saving…" />;
  return <CloudDoneRounded sx={{ ...sx, color: 'var(--ok)' }} titleAccess="All changes saved" />;
}

export function SyncLabel() {
  const s = useSyncStatus();
  const { status } = useAuth();
  if (status === 'unconfigured') return <>Cloud sync not set up</>;
  if (status !== 'signed-in') return <>Not signed in: progress is not being saved</>;
  if (s.phase === 'loading') return <>{s.error ? 'Could not load your progress, retrying…' : 'Loading your progress…'}</>;
  if (s.activity === 'error') return <>Could not save, retrying ({s.pending} waiting)</>;
  if (s.activity === 'offline') return <>Offline, {s.pending} change{s.pending === 1 ? '' : 's'} waiting</>;
  if (s.activity === 'saving') return <>Saving {s.pending} change{s.pending === 1 ? '' : 's'}…</>;
  return <>Everything saved{s.lastSyncedAt ? ` · ${new Date(s.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</>;
}

export function AccountButton() {
  const { status, user, signOut, promptSignIn } = useAuth();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (status === 'loading') return <CircularProgress size={20} thickness={5} aria-label="Checking sign-in" />;
  if (status === 'unconfigured') return <Button size="small" variant="outlined" onClick={promptSignIn} sx={{ color: 'var(--muted)', borderColor: 'var(--line-strong)' }}>Set up sync</Button>;
  if (status === 'signed-out') return <Button size="small" variant="contained" onClick={promptSignIn} startIcon={<LoginRounded />}>Sign in</Button>;
  return (
    <>
      <span className="hidden items-center sm:inline-flex"><SyncIcon /></span>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account" sx={{ p: 0.25 }}>
        {user?.avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={user.avatar} alt="" width={30} height={30} referrerPolicy="no-referrer" className="h-[30px] w-[30px] rounded-full object-cover" />
          : <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-accent text-[13px] font-semibold text-white">{(user?.name ?? '?').slice(0, 1).toUpperCase()}</span>}
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { backgroundImage: 'none', minWidth: 250, mt: 1 } } }}>
        <div className="px-4 py-2"><div className="text-[14px] font-semibold">{user?.name}</div><div className="text-[12.5px] text-muted">{user?.email}</div><div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted"><SyncIcon size={16} /><SyncLabel /></div></div>
        <MenuItem component={Link} href="/settings/" onClick={() => setAnchor(null)}>Account &amp; backup</MenuItem>
        <MenuItem onClick={() => { setAnchor(null); void signOut(); }}>Sign out</MenuItem>
      </Menu>
    </>
  );
}

export function AuthBanner() {
  const { status, promptSignIn } = useAuth();
  if (status !== 'signed-out' && status !== 'unconfigured') return null;
  return (
    <div className="no-print mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-accent-soft px-4 py-2.5 text-[13.5px]" role="status">
      <span className="text-ink">{status === 'unconfigured' ? 'Cloud sync is not set up yet, so ticks and remarks cannot be saved.' : 'You are reading without an account, so ticks, stars and remarks are not saved.'}</span>
      <Button size="small" variant="contained" onClick={promptSignIn} sx={{ ml: 'auto' }}>{status === 'unconfigured' ? 'How to set it up' : 'Sign in with Google'}</Button>
    </div>
  );
}
