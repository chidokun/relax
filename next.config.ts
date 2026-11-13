import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

/**
 * Fully static export (no server needed) for GitHub Pages.
 *
 * Asset URLs are relative ("./_next/...") instead of tied to one base path, so the same build
 * works wherever index.html is served: a custom domain at "/" (relax.nguyentuan.dev),
 * a project site at "/relax/" (<user>.github.io/relax/), or `npm start` locally.
 * This is safe because the app is a single page served from the export root.
 *
 * `next dev` must not get the relative prefix: the dev server derives its HMR socket path from
 * it ("/./_next/hmr"), the browser normalises the URL to "/_next/hmr", the upgrade is dropped,
 * and the page never hydrates. Dev always serves from "/", so it needs no prefix.
 */
export default function config(phase: string): NextConfig {
  return {
    reactStrictMode: true,
    output: 'export',
    assetPrefix: phase === PHASE_DEVELOPMENT_SERVER ? undefined : './',
    trailingSlash: true,
    images: { unoptimized: true },
  };
}
