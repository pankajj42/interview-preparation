'use client';
import type { ProblemT } from '@/lib/types';
import Topic from './Topic';
import { ProblemItem } from './ProblemRow';

export default function ProblemListTopic({ tid, anchor, title, num, pids, open, onToggle, problems }: {
  tid: string; anchor: string; title: string; num?: string; pids: readonly string[]; open: boolean; onToggle: () => void; problems: ProblemT[];
}) {
  return (
    <Topic tid={tid} anchor={anchor} title={title} num={num} open={open} onToggle={onToggle} pids={pids}>
      <div>{problems.map((p, i) => <ProblemItem key={p.id} p={p} index={p.num ?? i + 1} />)}</div>
    </Topic>
  );
}
