import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'AURA — Immersive Ambient Sound',
  description: 'Ambient soundscapes for focus, rest and sleep, inside a living light scene.',
  // Relative URLs so the icons resolve under any base path (custom domain or github.io/<repo>/).
  icons: {
    icon: [
      { url: './favicon.ico', sizes: '32x32' },
      { url: './favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: './apple-touch-icon.png', sizes: '180x180' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050507',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
