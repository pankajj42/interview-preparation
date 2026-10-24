import type { Metadata, Viewport } from 'next';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import '@fontsource-variable/space-grotesk/index.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import Providers from '@/components/Providers';
import Shell from '@/components/Shell';
import { buildNav } from '@/lib/catalog';

export const metadata: Metadata = {
  title: { default: 'Interview preparation', template: '%s · Interview preparation' },
  description: 'Striver playlists, the Ultimate DP guide, the System Design blueprint and Crack the Coding Interview, with local progress, revision marks and remarks.',
};
export const viewport: Viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f2f4f8' }, { media: '(prefers-color-scheme: dark)', color: '#090d13' }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nav = buildNav();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data-mui-color-scheme" defaultMode="system" />
        <Providers>
          <Shell nav={nav}>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
