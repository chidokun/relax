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

export function ForestIcon() {
  return (
    <svg {...common}>
      <path d="M32 9l-9 13h5l-10 13h6l-10 13h36l-10-13h6L36 22h5z" />
      <path d="M32 48v7" />
      <circle cx="51" cy="17" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="26" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BeachIcon() {
  return (
    <svg {...common}>
      <path d="M20 35a12 12 0 0 1 24 0" />
      <path d="M32 14v4M18.6 20.6l2.8 2.8M45.4 20.6l-2.8 2.8M12 35h3.5M48.5 35h3.5" strokeWidth={2} />
      <path d="M8 43q4-4 8 0t8 0t8 0t8 0t8 0t8 0" />
      <path d="M16 51q4-4 8 0t8 0t8 0t8 0" opacity="0.75" />
    </svg>
  );
}

export function UniverseIcon() {
  return (
    <svg {...common}>
      <g transform="rotate(-20 32 32)">
        <circle cx="32" cy="32" r="10.5" />
        <path d="M10 32a22 7 0 0 0 44 0" />
        <path d="M10 32a22 7 0 0 1 10-5.87" />
        <path d="M44 26.13a22 7 0 0 1 10 5.87" />
      </g>
      <path d="M50 9.5v7M46.5 13h7" strokeWidth={1.8} />
      <path d="M13 47.5v5M10.5 50h5" strokeWidth={1.6} opacity="0.8" />
    </svg>
  );
}

export function DreamIcon() {
  return (
    <svg {...common}>
      <path d="M12 34q18 13 36 0" />
      <path d="M18.5 38.5l-3 4" strokeWidth={1.9} />
      <path d="M26 41.2l-1.4 4.6" strokeWidth={1.9} />
      <path d="M34 41.2l1.4 4.6" strokeWidth={1.9} />
      <path d="M41.5 38.5l3 4" strokeWidth={1.9} />
      <path d="M40 13h7l-7 8h7" strokeWidth={2} />
      <path d="M50.5 24h4.5l-4.5 5.2h4.5" strokeWidth={1.7} opacity="0.8" />
    </svg>
  );
}

export function BirdIcon() {
  return (
    <svg {...common}>
      <path d="M10 52a22 22 0 0 1 44 0" />
      <path d="M17 52a15 15 0 0 1 30 0" opacity="0.8" />
      <path d="M24 52a8 8 0 0 1 16 0" opacity="0.6" />
      <path d="M18 19q7-6 14 2q7-8 14-2" />
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
    case 'forest':
      return <ForestIcon />;
    case 'beach':
      return <BeachIcon />;
    case 'universe':
      return <UniverseIcon />;
    case 'dream':
      return <DreamIcon />;
    case 'bird':
      return <BirdIcon />;
  }
}
