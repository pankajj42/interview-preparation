import type { Metadata } from 'next';
import RevisionView from '@/components/RevisionView';
import { buildCatalog } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Revision' };
export default function Page() { return <RevisionView items={buildCatalog()} />; }
