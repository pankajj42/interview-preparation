'use client';
import { useRef, useState } from 'react';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import { exportData, importData, STORAGE_LIMIT_BYTES, useAll, useStorageBytes, useStorageError } from '@/lib/store';
import { PageHeader } from './Page';
import ResetDialog, { type ResetScope } from './ResetDialog';

const RESETS: { label: string; scope: ResetScope }[] = [
  { label: 'Striver', scope: { title: 'Striver', prefixes: ['p:striver:', 't:striver:'] } },
  { label: 'Ultimate DP', scope: { title: 'Ultimate DP', prefixes: ['p:dp:', 't:dp:'] } },
  { label: 'System Design', scope: { title: 'System Design', prefixes: ['t:sd:'] } },
  { label: 'Crack the Coding Interview', scope: { title: 'Crack the Coding Interview', prefixes: ['p:ctci:', 't:ctci:'] } },
  { label: 'Everything', scope: { title: 'everything', prefixes: ['p:', 't:'] } },
];

export default function SettingsView() {
  const all = useAll();
  const err = useStorageError();
  const file = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scope, setScope] = useState<ResetScope | null>(null);
  const bytes = useStorageBytes();
  const pct = Math.min(100, (bytes / STORAGE_LIMIT_BYTES) * 100);
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `interview-preparation-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const onFile = async (f?: File) => { if (!f) return; const r = importData(await f.text(), mode); setMsg({ ok: r.ok, text: r.message }); if (file.current) file.current.value = ''; };
  return (
    <div>
      <PageHeader eyebrow="Data" title="Data & backup" subtitle="Everything (done, revision marks and remarks) is stored in this browser's local storage, for this exact address. Opening the site from a different port or domain starts empty, so keep a backup." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-[18px] font-semibold">Storage</h2>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: 'var(--surface-3)', '& .MuiLinearProgress-bar': { bgcolor: pct > 80 ? 'var(--danger)' : 'var(--ok)' } }} />
          <p className="tnum mt-2 text-[13.5px] text-muted">{(bytes / 1024).toFixed(1)} KB used of roughly {(STORAGE_LIMIT_BYTES / 1048576).toFixed(0)} MB (the limit varies by browser).</p>
          <p className="tnum mt-1 text-[13.5px] text-muted">{Object.keys(all.done).length} done · {Object.keys(all.star).length} marked for revision · {Object.keys(all.remark).length} remarks</p>
          {err && <p className="mt-2 rounded-lg bg-[#fde3e1] px-3 py-2 text-[13px] text-[#b0281c] dark:bg-[#3a1717] dark:text-[#ff9a8b]">The browser refused the last save ({err}). Export a backup now.</p>}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-[18px] font-semibold">Backup</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="contained" startIcon={<DownloadRounded />} onClick={download}>Export JSON</Button>
            <Button variant="outlined" startIcon={<UploadFileRounded />} onClick={() => file.current?.click()}>Import…</Button>
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
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-1 text-[18px] font-semibold">Reset</h2>
          <p className="mb-3 text-[13.5px] text-muted">Pick a track to clear. You choose what to clear next, and remarks are kept unless you tick them.</p>
          <div className="flex flex-wrap gap-2">
            {RESETS.map((r) => <Button key={r.label} size="small" variant="outlined" color={r.label === 'Everything' ? 'error' : 'inherit'} onClick={() => setScope(r.scope)}>{r.label}</Button>)}
          </div>
        </section>
      </div>
      {scope && <ResetDialog open onClose={() => setScope(null)} scope={scope} />}
    </div>
  );
}
