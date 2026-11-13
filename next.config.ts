import type { NextConfig } from 'next';

/**
 * Fully static export (no server needed) so the app can be hosted on GitHub Pages.
 * PAGES_BASE_PATH is set by the deploy workflow from actions/configure-pages:
 * "/<repo>" for project sites, "" for <user>.github.io sites and local builds.
 */
const basePath = (process.env.PAGES_BASE_PATH ?? '').replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // exposed to client code for assets fetched at runtime (audio)
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
