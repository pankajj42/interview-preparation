'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColorScheme } from '@mui/material/styles';
import { sdTid } from '@/lib/catalog-ids';
import { DoneCheck, StarButton } from './controls';
import TopicRemarks from './TopicRemarks';

interface Slot { el: HTMLElement; key: string }

/** Renders the original guide markup untouched. For System Design it adds, via portals, a done tick + revision star
 *  to every trackable heading, a remarks box at the end of every topic, and renders the Mermaid diagrams (re-rendered on theme change). */
export default function HtmlFragment({ html, scope }: { html: string; scope: 'dp' | 'sd' }) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { colorScheme } = useColorScheme();
  const [ctl, setCtl] = useState<Slot[]>([]);
  const [rem, setRem] = useState<Slot[]>([]);

  useEffect(() => {
    const root = ref.current;
    if (!root || scope !== 'sd') return;
    const pick = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)].map((el) => ({ el, key: el.dataset.key as string }));
    setCtl(pick('.sd-slot'));
    setRem(pick('.sd-remarks-slot'));
  }, [html, scope]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>('pre.mermaid')];
    if (!nodes.length) return;
    let cancelled = false;
    (async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: colorScheme === 'dark' ? 'dark' : 'default', securityLevel: 'loose', fontFamily: 'IBM Plex Mono, monospace' });
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        const src = el.dataset.src ?? (el.dataset.src = el.textContent ?? '');
        try {
          const { svg } = await mermaid.render(`mmd${uid}x${i}`, src);
          if (cancelled) return;
          el.innerHTML = svg;
        } catch { el.textContent = src; }
      }
    })();
    return () => { cancelled = true; };
  }, [html, colorScheme, uid]);

  return (
    <div className={`${scope}-scope`}>
      <div ref={ref} className={scope === 'sd' ? 'content-wrap' : undefined} dangerouslySetInnerHTML={{ __html: html }} />
      {ctl.map((s) => createPortal(
        <span className="mr-2 inline-flex translate-y-[3px] items-center gap-1 align-baseline"><DoneCheck id={sdTid(s.key)} label="this topic" size={22} /><StarButton id={sdTid(s.key)} label="this topic" size={20} /></span>, s.el, s.key))}
      {rem.map((s) => createPortal(
        <div className="not-prose my-6 overflow-hidden rounded-xl border border-line bg-surface text-ink" style={{ fontFamily: 'var(--font-sans)', fontSize: 15 }}><TopicRemarks id={sdTid(s.key)} title="this topic" /></div>, s.el, s.key))}
    </div>
  );
}
