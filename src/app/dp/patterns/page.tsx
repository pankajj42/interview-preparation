import type { Metadata } from 'next';
import { DpPatterns } from '@/components/DpViews';
import { dp } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Pattern atlas · Ultimate DP' };
export default function Page() { return <DpPatterns patterns={dp.patterns} />; }
