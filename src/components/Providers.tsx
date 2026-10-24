'use client';
import type { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const font = '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const display = '"Space Grotesk Variable", "Space Grotesk", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif';

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' }, // <html data-mui-color-scheme="light|dark"> ("system" is resolved by MUI)
  colorSchemes: {
    light: { palette: { primary: { main: '#4f46e5' }, background: { default: '#f2f4f8', paper: '#ffffff' }, text: { primary: '#0f1829', secondary: '#556177' }, divider: '#dbe1ea' } },
    dark: { palette: { primary: { main: '#8b83ff' }, background: { default: '#090d13', paper: '#111722' }, text: { primary: '#e8edf5', secondary: '#9ba8bb' }, divider: '#232d3c' } },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: font,
    h1: { fontFamily: display }, h2: { fontFamily: display }, h3: { fontFamily: display }, h4: { fontFamily: display }, h5: { fontFamily: display }, h6: { fontFamily: display },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTooltip: { defaultProps: { arrow: true, enterDelay: 350 } },
    MuiCheckbox: { defaultProps: { disableRipple: false } },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme} defaultMode="system" disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
