'use client';
import Link from 'next/link';
import { useCount } from '@/lib/store';
import { Strip } from './controls';

export interface CardItem { href: string; title: string; subtitle?: string; ids?: string[]; tids?: string[]; meta?: string }

function ItemCard({ it }: { it: CardItem }) {
  const list = it.ids ?? it.tids ?? [];
  const done = useCount(list, 'done');
  return (
    <Link href={`${it.href}/`} className="card focus-ring flex flex-col gap-3 p-5 no-underline transition-colors hover:border-accent">
      <div>
        <h3 className="text-[18px] font-semibold leading-snug text-ink">{it.title}</h3>
        {it.subtitle && <p className="mt-1 text-[13.5px] text-muted">{it.subtitle}</p>}
      </div>
      {list.length > 0 && (
        <div className="mt-auto flex flex-col gap-1.5">
          <Strip fractions={[done / list.length]} />
          <div className="flex justify-between text-[12.5px] text-muted"><span className="tnum">{done} / {list.length} done</span>{it.meta && <span>{it.meta}</span>}</div>
        </div>
      )}
      {list.length === 0 && it.meta && <div className="mt-auto text-[12.5px] text-muted">{it.meta}</div>}
    </Link>
  );
}
export function ItemCards({ items }: { items: CardItem[] }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((it) => <ItemCard key={it.href} it={it} />)}</div>;
}
