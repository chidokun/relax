import type { NextConfig } from 'next';

/**
 * Fully static export (no server needed) for GitHub Pages.
 *
 * Asset URLs are relative ("./_next/...") instead of tied to one base path, so the same build
 * works wherever index.html is served: a custom domain at "/" (relax.nguyentuan.dev),
 * a project site at "/relax/" (<user>.github.io/relax/), or `npm start` locally.
 * This is safe because the app is a single page served from the export root.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  assetPrefix: './',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
