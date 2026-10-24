'use client';
import { useState } from 'react';
import EditRounded from '@mui/icons-material/EditRounded';
import NotesRounded from '@mui/icons-material/NotesRounded';
import { useRemark } from '@/lib/store';
import Markdown from './Markdown';
import RemarkEditor from './RemarkEditor';

const isLong = (t: string) => t.length > 320 || t.split('\n').length > 6;

/** Topic remarks. Short notes sit in the footer of the question list; long ones become a full-width block below it. */
export default function TopicRemarks({ id, title }: { id: string; title: string }) {
  const text = useRemark(id);
  const [editing, setEditing] = useState(false);
  const has = text.trim().length > 0;
  if (editing) {
    return (
      <div className="border-t border-line p-3">
        <RemarkEditor id={id} label={title} autoFocus minRows={has && isLong(text) ? 8 : 4} />
        <div className="mt-2 flex justify-end"><button type="button" onClick={() => setEditing(false)} className="focus-ring cursor-pointer rounded-lg bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-bg">Done</button></div>
      </div>
    );
  }
  if (!has) {
    return (
      <div className="border-t border-line px-3 py-2.5">
        <button type="button" onClick={() => setEditing(true)} className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted hover:bg-surface-2 hover:text-ink">
          <NotesRounded sx={{ fontSize: 17 }} /> Add remarks for this topic
        </button>
      </div>
    );
  }
  const long = isLong(text);
  return (
    <div className={long ? 'border-t border-line p-4 sm:p-5' : 'border-t border-line bg-surface-2/60 px-4 py-3'}>
      <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.07em] text-faint">
        <NotesRounded sx={{ fontSize: 16 }} /> Remarks
        <button type="button" onClick={() => setEditing(true)} className="focus-ring ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium normal-case tracking-normal text-muted hover:bg-surface-3 hover:text-ink"><EditRounded sx={{ fontSize: 14 }} /> Edit</button>
      </div>
      <div className={long ? 'rounded-xl border border-line bg-surface px-4 py-3 sm:px-5' : ''}><Markdown text={text} /></div>
    </div>
  );
}
