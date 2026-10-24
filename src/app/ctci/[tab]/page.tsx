import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CtciTab } from '@/components/CtciViews';
import { ctci } from '@/lib/catalog';

export const dynamicParams = false;
export const generateStaticParams = () => ctci.tabs.map((t) => ({ tab: t.slug }));
export async function generateMetadata({ params }: { params: Promise<{ tab: string }> }): Promise<Metadata> {
  const { tab } = await params;
  return { title: `${ctci.tabs.find((t) => t.slug === tab)?.title ?? 'List'} · Crack the Coding Interview` };
}
export default async function Page({ params }: { params: Promise<{ tab: string }> }) {
  const { tab: slug } = await params;
  const tab = ctci.tabs.find((t) => t.slug === slug);
  if (!tab) notFound();
  return <CtciTab tab={{ slug: tab.slug, title: tab.title, group: tab.group }} rows={tab.rows} credit={ctci.credit} creditUrl={ctci.creditUrl} />;
}
