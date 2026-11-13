'use client';

import { memo, useMemo } from 'react';
import type { StageLayout } from '@/types/scene';
import { SCENES } from '@/lib/sceneConfig';
import { seededRandom } from '@/lib/seededRandom';
import styles from '@/styles/stage.module.css';

/**
 * Minimal SVG rendition of each scene. Shown while WebGL boots, when WebGL is
 * unavailable, and for the "static" quality tier. Geometry is deterministic.
 */
function pillRadius(dx: number, dy: number) {
  return 1 / Math.sqrt((dx / 92) ** 2 + (dy / 142) ** 2);
}

function SolarArt() {
  const rays = useMemo(() => {
    const rnd = seededRandom(7);
    return Array.from({ length: 72 }, (_, i) => {
      const a = (i / 72) * Math.PI * 2 + (rnd() - 0.5) * 0.05;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const r0 = pillRadius(dx, dy) + 2;
      const len = 50 + rnd() ** 2 * 190;
      const r2 = (v: number) => Math.round(v * 100) / 100;
      return {
        x1: r2(dx * r0),
        y1: r2(dy * r0),
        x2: r2(dx * (r0 + len)),
        y2: r2(dy * (r0 + len)),
        w: r2(0.8 + rnd() * 1.6),
        o: r2(0.35 + rnd() * 0.5),
      };
    });
  }, []);
  return (
    <g>
      <ellipse rx="260" ry="290" fill="url(#solarHalo)" />
      <g filter="url(#softBlur)" stroke="#FFD25A" strokeLinecap="round">
        {rays.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} strokeWidth={r.w * 2} opacity={r.o} />
        ))}
      </g>
      <rect x="-96" y="-146" width="192" height="292" rx="96" fill="none" stroke="#FFF3B6" strokeWidth="6" filter="url(#softBlur)" />
    </g>
  );
}

function EmberArt() {
  return (
    <g>
      <ellipse cy="40" rx="230" ry="260" fill="url(#emberHalo)" />
      <g filter="url(#midBlur)">
        <path d="M-96 40 C-120 -60 -90 -150 -40 -230 C-30 -170 -10 -170 0 -250 C20 -170 40 -190 50 -235 C95 -160 125 -60 96 40 Z" fill="url(#flameGrad)" opacity="0.9" />
      </g>
      <rect x="-94" y="-144" width="188" height="288" rx="94" fill="none" stroke="#FF8A3A" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

function BloomArt() {
  const petals = [
    { a: 0, l: 300, w: 60 },
    { a: -12, l: 290, w: 58 },
    { a: 12, l: 290, w: 58 },
    { a: -32, l: 270, w: 56 },
    { a: 32, l: 270, w: 56 },
    { a: -53, l: 246, w: 52 },
    { a: 53, l: 246, w: 52 },
    { a: -70, l: 226, w: 47 },
    { a: 70, l: 226, w: 47 },
    { a: -86, l: 216, w: 42 },
    { a: 86, l: 216, w: 42 },
    { a: -98, l: 190, w: 36 },
    { a: 98, l: 190, w: 36 },
  ];
  return (
    <g>
      <ellipse cy="60" rx="300" ry="230" fill="url(#bloomHalo)" />
      <g transform="translate(0 96)">
        {petals.map((p, i) => (
          <path
            key={i}
            transform={`rotate(${p.a})`}
            d={`M0 0 C ${p.w * 1.2} ${-p.l * 0.3} ${p.w * 0.9} ${-p.l * 0.75} 0 ${-p.l} C ${-p.w * 0.9} ${-p.l * 0.75} ${-p.w * 1.2} ${-p.l * 0.3} 0 0 Z`}
            fill="url(#petalGrad)"
            fillOpacity="0.55"
            stroke="#FFE1EE"
            strokeWidth="2"
            strokeOpacity="0.9"
          />
        ))}
      </g>
    </g>
  );
}

function BreezeArt() {
  const lines = useMemo(() => {
    const out: { d: string; w: number; o: number }[] = [];
    const rnd = seededRandom(11);
    for (let i = 0; i < 26; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const off = 100 + rnd() * 70;
      const flare = 40 + rnd() * 90;
      out.push({
        d: `M ${(side * (off * 0.4 + flare)).toFixed(1)} 260 C ${(side * off).toFixed(1)} 150 ${(side * off).toFixed(1)} -150 ${(side * (off * 0.4 + flare)).toFixed(1)} -260`,
        w: Math.round((0.6 + rnd() * 1.6) * 100) / 100,
        o: Math.round((0.35 + rnd() * 0.5) * 100) / 100,
      });
    }
    return out;
  }, []);
  return (
    <g>
      <ellipse rx="240" ry="290" fill="url(#breezeHalo)" />
      <g fill="none" stroke="#7FF5DC" strokeLinecap="round">
        {lines.map((l, i) => (
          <path key={i} d={l.d} strokeWidth={l.w} opacity={l.o} />
        ))}
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#B5FFF1" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

const ART = [SolarArt, BreezeArt, BloomArt, EmberArt];

export const StaticSceneArt = memo(function StaticSceneArt({ layout, sceneIndex, visible }: { layout: StageLayout; sceneIndex: number; visible: boolean }) {
  const { width, height, cx, cy, scale, floorY } = layout;
  return (
    <svg className={styles.staticArt} data-visible={visible} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter id="midBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <radialGradient id="solarHalo">
          <stop offset="0" stopColor="#FFCC43" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#E99C2B" stopOpacity="0.18" />
          <stop offset="1" stopColor="#170D04" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="emberHalo">
          <stop offset="0" stopColor="#FF6B28" stopOpacity="0.4" />
          <stop offset="0.55" stopColor="#D31C22" stopOpacity="0.15" />
          <stop offset="1" stopColor="#1B0506" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bloomHalo">
          <stop offset="0" stopColor="#FF58A6" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#DC269C" stopOpacity="0.14" />
          <stop offset="1" stopColor="#1C0617" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="breezeHalo">
          <stop offset="0" stopColor="#22D9B9" stopOpacity="0.35" />
          <stop offset="0.6" stopColor="#0E998D" stopOpacity="0.12" />
          <stop offset="1" stopColor="#031A16" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFF0B7" />
          <stop offset="0.35" stopColor="#FF6B28" />
          <stop offset="0.75" stopColor="#D31C22" />
          <stop offset="1" stopColor="#D31C22" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="petalGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#DC269C" />
          <stop offset="0.6" stopColor="#FF58A6" />
          <stop offset="1" stopColor="#FFE1EE" />
        </linearGradient>
      </defs>
      {SCENES.map((s, i) => {
        const Art = ART[i];
        return (
          <g key={s.id} className={styles.staticScene} data-active={i === sceneIndex} transform={`translate(${cx} ${cy}) scale(${scale})`}>
            <Art />
          </g>
        );
      })}
      <rect x={cx - 340 * scale} y={floorY - 1} width={680 * scale} height="2" fill="url(#solarHalo)" opacity="0.4" />
    </svg>
  );
});
