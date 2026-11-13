import type { SceneId } from '@/types/scene';

const common = {
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function SolarIcon() {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return <line key={i} x1={32 + c * 16} y1={32 + s * 16} x2={32 + c * 23} y2={32 + s * 23} />;
  });
  return (
    <svg {...common}>
      <circle cx="32" cy="32" r="10" />
      {rays}
    </svg>
  );
}

export function BreezeIcon() {
  return (
    <svg {...common}>
      <path d="M8 24h28a6 6 0 1 0-6-6" />
      <path d="M8 32h40a6.5 6.5 0 1 1-6.5 6.5" />
      <path d="M8 40h20a5 5 0 1 1-5 5" />
      <path d="M44 22c3-1 6 0 7.5 2" opacity="0.8" />
    </svg>
  );
}

export function BloomIcon() {
  const petals = Array.from({ length: 6 }, (_, i) => (
    <path key={i} transform={`rotate(${i * 60} 32 32)`} d="M32 26c-4.5-4-4.5-11 0-15 4.5 4 4.5 11 0 15z" />
  ));
  return (
    <svg {...common}>
      {petals}
      <circle cx="32" cy="32" r="3.6" />
    </svg>
  );
}

export function EmberIcon() {
  return (
    <svg {...common}>
      <path d="M32 40c-6.5 0-10.5-4.4-10.5-10 0-6.4 5-9.8 6.2-16.6 3.6 2.6 5.2 5.6 5.4 8.8 1.6-1.4 2.6-3.4 2.8-5.6 4 3.6 6.6 8 6.6 13.4 0 5.6-4 10-10.5 10z" />
      <path d="M32 40c-2.6 0-4.4-1.8-4.4-4.2 0-2.8 2.2-4.2 3.2-7 2.4 1.8 5.6 3.8 5.6 7 0 2.4-1.8 4.2-4.4 4.2z" opacity="0.85" />
      <path d="M16 52l32-7" />
      <path d="M16 45l32 7" />
    </svg>
  );
}

export function NightIcon() {
  return (
    <svg {...common}>
      <path d="M28.44 19.08A15 15 0 1 0 44.61 37.41 12.5 12.5 0 0 1 28.44 19.08z" />
      <path d="M46 10.5v8M42 14.5h8" strokeWidth={1.8} />
      <path d="M51.5 25.5v4M49.5 27.5h4" strokeWidth={1.6} opacity="0.75" />
    </svg>
  );
}

export function RainIcon() {
  return (
    <svg {...common}>
      <path d="M20 38h25a9 9 0 0 0 1.5-17.9A12 12 0 0 0 23.3 22.6 8 8 0 0 0 20 38z" />
      <path d="M25 45l-2.5 6" strokeWidth={2} />
      <path d="M34 45l-2.5 6" strokeWidth={2} />
      <path d="M43 45l-2.5 6" strokeWidth={2} />
    </svg>
  );
}

export function SceneIcon({ id }: { id: SceneId }) {
  switch (id) {
    case 'solar':
      return <SolarIcon />;
    case 'breeze':
      return <BreezeIcon />;
    case 'bloom':
      return <BloomIcon />;
    case 'ember':
      return <EmberIcon />;
    case 'night':
      return <NightIcon />;
    case 'rain':
      return <RainIcon />;
  }
}
