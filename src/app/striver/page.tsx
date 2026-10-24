import type { Metadata } from 'next';
import { ItemCards } from '@/components/Cards';
import { PageHeader } from '@/components/Page';
import { playlistPids, playlists } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Striver' };

export default function StriverIndex() {
  const items = playlists.map((p) => ({
    href: `/striver/${p.slug}`, title: p.short ?? p.title, ids: playlistPids(p),
    subtitle: p.subtitle ?? `${p.topics[0].problems.length} topics in the playlist`,
    meta: p.topics.length > 1 ? `${p.topics.length} topics` : undefined,
  }));
  return (
    <div data-section="striver">
      <PageHeader eyebrow="Striver" title="Striver" subtitle="Eleven pages: the DSA playlist (18 collapsible topics) and ten topic playlists. Every row carries its LeetCode and GeeksforGeeks links, a revision star and remarks." />
      <ItemCards items={items} />
    </div>
  );
}
