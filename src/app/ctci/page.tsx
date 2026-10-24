import type { Metadata } from 'next';
import { CtciIndex } from '@/components/CtciViews';

export const metadata: Metadata = { title: 'Crack the Coding Interview' };
export default function Page() { return <CtciIndex />; }
