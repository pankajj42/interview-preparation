import type { Metadata } from 'next';
import { SdPartCards } from '@/components/SdViews';
import { readFragment, sdParts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'System Design' };

export default function Page() {
  return (
    <div data-section="sd" className="flex flex-col gap-6">
      <div className="sd-scope"><div className="content-wrap" dangerouslySetInnerHTML={{ __html: readFragment('sd', 'hero') }} /></div>
      <SdPartCards parts={sdParts} />
    </div>
  );
}
