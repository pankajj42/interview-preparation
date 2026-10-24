'use client';
import { useEffect, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import { setRemark, useRemark } from '@/lib/store';
import Markdown from './Markdown';

/** Markdown remarks with write / preview. Every keystroke is saved to local storage (debounced inside the store). */
export default function RemarkEditor({ id, label, autoFocus = false, minRows = 3 }: { id: string; label: string; autoFocus?: boolean; minRows?: number }) {
  const saved = useRemark(id);
  const [text, setText] = useState(saved);
  const [preview, setPreview] = useState(false);
  const touched = useRef(false);
  useEffect(() => { if (!touched.current) setText(saved); }, [saved]); // pick up values loaded from storage after hydration
  const change = (v: string) => { touched.current = true; setText(v); setRemark(id, v); };
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center gap-1 text-[12px]">
        {(['Write', 'Preview'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setPreview(t === 'Preview')} aria-pressed={preview === (t === 'Preview')}
            className={`focus-ring cursor-pointer rounded-md px-2.5 py-1 font-medium ${preview === (t === 'Preview') ? 'bg-surface-3 text-ink' : 'text-muted hover:text-ink'}`}>{t}</button>
        ))}
        <span className="ml-auto text-faint">Markdown · saved in this browser · {text.length.toLocaleString('en')} chars</span>
      </div>
      {preview ? (
        <div className="min-h-[72px] rounded-lg bg-surface-2 px-3 py-2">{text.trim() ? <Markdown text={text} /> : <span className="text-muted">Nothing to preview yet.</span>}</div>
      ) : (
        <TextField multiline fullWidth minRows={minRows} maxRows={40} value={text} autoFocus={autoFocus} onChange={(e) => change(e.target.value)}
          placeholder="Approach, complexity, mistakes to avoid, links…  (Markdown: **bold**, lists, `code`, ```fenced blocks```)"
          slotProps={{ htmlInput: { 'aria-label': `Remarks for ${label}`, spellCheck: true } }}
          sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'var(--font-mono)', fontSize: 13.5, lineHeight: 1.55, bgcolor: 'var(--surface-2)' }, '& fieldset': { borderColor: 'var(--line)' } }} />
      )}
    </div>
  );
}
