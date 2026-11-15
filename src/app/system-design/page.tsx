import type { Metadata } from 'next';
import { SdPartCards } from '@/components/SdViews';
import { readFragment, sdParts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'System Design' };

export default function Page() {
  return (
    <div data-section="sd" className="flex flex-col gap-6">
      <div className="sd-scope"><div className="content-wrap" dangerouslySetInnerHTML={{ __html: readFragment('sd', 'hero') }} /></div>
      <div className="card p-5 sm:p-6">
        <h2 className="mb-2 text-[18px] font-semibold">What this edition adds</h2>
        <p className="mb-3 text-[14px] text-muted">The original text is untouched. Around it you will find:</p>
        <ul className="m-0 grid list-none gap-2 p-0 text-[14px] sm:grid-cols-2">
          <li><b>Deep dives.</b> After every topic and case study, an <i>In simple words</i> box with an analogy, step-by-step flow, key ideas, what to say and common mistakes.</li>
          <li><b>12 new case studies</b> (typeahead, Dropbox, Zoom, search, distributed lock, food delivery, ad clicks, Pastebin, wallet, live streaming, CDN, game matchmaking).</li>
          <li><b>8 new concept sections</b> (search, real-time protocols, multi-region and disaster recovery, overload protection, data modelling, probabilistic structures, safe deployments, capacity and cost).</li>
          <li><b>Highlights and key-term tooltips</b> inside the original text; switch them on or off at the top of each part.</li>
        </ul>
      </div>
      <SdPartCards parts={sdParts} />
    </div>
  );
}
