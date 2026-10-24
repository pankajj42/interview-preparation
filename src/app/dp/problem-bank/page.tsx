import type { Metadata } from 'next';
import { DpBank } from '@/components/DpViews';
import { dp } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Problem bank · Ultimate DP' };
export default function Page() { return <DpBank groups={dp.groups} />; }
