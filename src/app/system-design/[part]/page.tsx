import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SdPartView } from '@/components/SdViews';
import { readFragment, sdParts } from '@/lib/catalog';

export const dynamicParams = false;
export const generateStaticParams = () => sdParts.map((p) => ({ part: p.slug }));
export async function generateMetadata({ params }: { params: Promise<{ part: string }> }): Promise<Metadata> {
  const { part } = await params;
  return { title: `${sdParts.find((p) => p.slug === part)?.title ?? 'System Design'} · System Design` };
}
export default async function Page({ params }: { params: Promise<{ part: string }> }) {
  const { part: slug } = await params;
  const i = sdParts.findIndex((p) => p.slug === slug);
  if (i < 0) notFound();
  const pick = (p?: (typeof sdParts)[number]) => (p ? { slug: p.slug, title: p.title } : undefined);
  return <SdPartView part={sdParts[i]} html={readFragment('sd', slug)} prev={pick(sdParts[i - 1])} next={pick(sdParts[i + 1])} />;
}
