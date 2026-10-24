'use client';
import { useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { resetIds, resetPrefixes, useAll } from '@/lib/store';

export interface ResetScope { title: string; ids?: readonly string[]; prefixes?: readonly string[] }

export default function ResetDialog({ open, onClose, scope }: { open: boolean; onClose: () => void; scope: ResetScope }) {
  const [opts, setOpts] = useState({ done: true, star: true, remark: false }); // remarks are kept unless you tick them
  const all = useAll();
  const match = useMemo(() => {
    const set = scope.ids ? new Set(scope.ids) : null;
    return (id: string) => (set ? set.has(id) : (scope.prefixes ?? []).some((p) => id.startsWith(p)));
  }, [scope]);
  const count = (m: Record<string, unknown>) => Object.keys(m).filter(match).length;
  const n = { done: count(all.done), star: count(all.star), remark: count(all.remark) };
  const nothing = !opts.done && !opts.star && !opts.remark;
  const go = () => { if (scope.ids) resetIds(scope.ids, opts); else resetPrefixes(scope.prefixes ?? [], opts); onClose(); };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { backgroundImage: 'none', borderRadius: '16px' } } }}>
      <DialogTitle sx={{ fontWeight: 600 }}>Reset {scope.title}?</DialogTitle>
      <DialogContent>
        <p className="mb-2 text-[14px] text-muted">Choose what to clear. This only affects this browser and cannot be undone (export a backup first if unsure).</p>
        <div className="flex flex-col">
          <FormControlLabel control={<Checkbox checked={opts.done} onChange={(e) => setOpts({ ...opts, done: e.target.checked })} />} label={`Completion (${n.done} done)`} />
          <FormControlLabel control={<Checkbox checked={opts.star} onChange={(e) => setOpts({ ...opts, star: e.target.checked })} />} label={`Revision marks (${n.star} starred)`} />
          <FormControlLabel control={<Checkbox checked={opts.remark} onChange={(e) => setOpts({ ...opts, remark: e.target.checked })} />} label={`Remarks (${n.remark} written) — kept unless ticked`} />
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: 'var(--muted)' }}>Cancel</Button>
        <Button onClick={go} disabled={nothing} variant="contained" color="error">Reset</Button>
      </DialogActions>
    </Dialog>
  );
}
