'use client';
import { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import { exportData, importData, importState, parseState, useAll } from '@/lib/store';
import { GoogleMark, SyncIcon, SyncLabel, useAuth } from './Auth';
import { PageHeader } from './Page';
import ResetDialog, { type ResetScope } from './ResetDialog';

const OLD_KEY = 'interview-preparation:v1'; // where the earlier, browser-only version kept its data
const RESETS: { label: string; scope: ResetScope }[] = [
  { label: 'Striver', scope: { title: 'Striver', prefixes: ['p:striver:', 't:striver:'] } },
  { label: 'Ultimate DP', scope: { title: 'Ultimate DP', prefixes: ['p:dp:', 't:dp:'] } },
  { label: 'System Design', scope: { title: 'System Design', prefixes: ['t:sd:'] } },
  { label: 'Crack the Coding Interview', scope: { title: 'Crack the Coding Interview', prefixes: ['p:ctci:', 't:ctci:'] } },
  { label: 'Everything', scope: { title: 'everything', prefixes: ['p:', 't:'] } },
];

export default function SettingsView() {
  const { status, user, signIn, signOut, syncNow, promptSignIn } = useAuth();
  const all = useAll();
  const file = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scope, setScope] = useState<ResetScope | null>(null);
  const [legacy, setLegacy] = useState<{ done: number; star: number; remark: number } | null>(null);
  const signedIn = status === 'signed-in';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OLD_KEY);
      if (!raw) return;
      const s = parseState(JSON.parse(raw));
      const c = { done: Object.keys(s.done).length, star: Object.keys(s.star).length, remark: Object.keys(s.remark).length };
      if (c.done + c.star + c.remark > 0) setLegacy(c);
    } catch { /* ignore */ }
  }, []);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `interview-preparation-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const onFile = async (f?: File) => { if (!f) return; const r = importData(await f.text(), mode); setMsg({ ok: r.ok, text: r.message }); if (file.current) file.current.value = ''; };
  const uploadOld = () => {
    try { const r = importState(parseState(JSON.parse(localStorage.getItem(OLD_KEY) ?? '{}')), 'merge'); setMsg({ ok: r.ok, text: r.message }); } catch { setMsg({ ok: false, text: 'Could not read the old local data.' }); }
  };
  const removeOld = () => { localStorage.removeItem(OLD_KEY); setLegacy(null); setMsg({ ok: true, text: 'Removed the old browser-only copy.' }); };

  return (
    <div>
      <PageHeader eyebrow="Account" title="Account & backup" subtitle="Your progress is stored in your own Supabase project and tied to your Google account, so every device you sign in on shows the same ticks, stars and remarks." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-[18px] font-semibold">Account</h2>
          {signedIn && user && (
            <div className="flex items-center gap-3">
              {user.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.avatar} alt="" width={44} height={44} referrerPolicy="no-referrer" className="h-11 w-11 rounded-full object-cover" />
                : <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-[16px] font-semibold text-white">{user.name.slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0 flex-1"><div className="truncate font-semibold">{user.name}</div><div className="truncate text-[13px] text-muted">{user.email}</div></div>
              <Button variant="outlined" color="inherit" onClick={() => void signOut()}>Sign out</Button>
            </div>
          )}
          {status === 'signed-out' && (<><p className="mb-3 text-[14px] text-muted">You are not signed in, so nothing you tick is saved.</p><Button variant="outlined" onClick={() => void signIn()} startIcon={<GoogleMark />} sx={{ color: 'var(--ink)', borderColor: 'var(--line-strong)' }}>Continue with Google</Button></>)}
          {status === 'loading' && <p className="text-[14px] text-muted">Checking your sign-in…</p>}
          {status === 'unconfigured' && (<><p className="mb-3 text-[14px] text-muted">Cloud sync needs your Supabase project URL and publishable key (see the README, “Cloud setup”).</p><Button variant="outlined" onClick={promptSignIn}>What do I need to do?</Button></>)}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-[18px] font-semibold">Sync</h2>
          <div className="flex items-center gap-2 text-[14px]"><SyncIcon /><span><SyncLabel /></span></div>
          <p className="tnum mt-2 text-[13.5px] text-muted">{Object.keys(all.done).length} done · {Object.keys(all.star).length} marked for revision · {Object.keys(all.remark).length} remarks in your account</p>
          <div className="mt-3"><Button size="small" variant="outlined" color="inherit" startIcon={<SyncRounded />} disabled={!signedIn} onClick={() => void syncNow()}>Sync now</Button></div>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-[18px] font-semibold">Backup</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="contained" startIcon={<DownloadRounded />} onClick={download} disabled={!signedIn}>Export JSON</Button>
            <Button variant="outlined" startIcon={<UploadFileRounded />} onClick={() => file.current?.click()} disabled={!signedIn}>Import…</Button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            When importing:
            <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)} aria-label="Import mode">
              <ToggleButton value="merge" sx={{ textTransform: 'none', px: 1.4, py: 0.3 }}>Merge</ToggleButton>
              <ToggleButton value="replace" sx={{ textTransform: 'none', px: 1.4, py: 0.3 }}>Replace everything</ToggleButton>
            </ToggleButtonGroup>
          </div>
          {msg && <p className={`mt-3 text-[13.5px] ${msg.ok ? 'text-ok' : 'text-danger'}`} role="status">{msg.text}</p>}
        </section>
        {legacy && (
          <section className="card p-5">
            <h2 className="mb-1 text-[18px] font-semibold">Found data from the earlier version</h2>
            <p className="mb-3 text-[13.5px] text-muted">This browser still holds progress saved by the browser-only version: <span className="tnum">{legacy.done} done · {legacy.star} starred · {legacy.remark} remarks</span>. Upload it to your account once, then remove the local copy.</p>
            <div className="flex flex-wrap gap-2"><Button variant="contained" onClick={uploadOld} disabled={!signedIn}>Upload to my account</Button><Button variant="outlined" color="inherit" onClick={removeOld}>Remove local copy</Button></div>
            {!signedIn && <p className="mt-2 text-[12.5px] text-faint">Sign in first.</p>}
          </section>
        )}
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-1 text-[18px] font-semibold">Reset</h2>
          <p className="mb-3 text-[13.5px] text-muted">Pick a track to clear. You choose what to clear next, and remarks are kept unless you tick them. This changes your account on every device.</p>
          <div className="flex flex-wrap gap-2">
            {RESETS.map((r) => <Button key={r.label} size="small" variant="outlined" disabled={!signedIn} color={r.label === 'Everything' ? 'error' : 'inherit'} onClick={() => setScope(r.scope)}>{r.label}</Button>)}
          </div>
        </section>
      </div>
      {scope && <ResetDialog open onClose={() => setScope(null)} scope={scope} />}
    </div>
  );
}
