import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PlaylistView from '@/components/PlaylistView';
import { playlists } from '@/lib/catalog';

export const dynamicParams = false;
export const generateStaticParams = () => playlists.map((p) => ({ slug: p.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = playlists.find((x) => x.slug === slug);
  return { title: p ? `${p.short ?? p.title} · Striver` : 'Striver' };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const playlist = playlists.find((p) => p.slug === slug);
  if (!playlist) notFound();
  return <PlaylistView playlist={playlist} />;
}
