import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export', // fully static site: `npm run build` produces ./out which any static host (or `npm start`) can serve
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default config;
