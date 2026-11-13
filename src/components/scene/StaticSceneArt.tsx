'use client';

import { memo, useMemo, type ComponentType } from 'react';
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

function NightArt() {
  const stars = useMemo(() => {
    const rnd = seededRandom(23);
    const out: { x: number; y: number; r: number; o: number }[] = [];
    while (out.length < 46) {
      const x = (rnd() - 0.5) * 760;
      const y = (rnd() - 0.5) * 640 - 40;
      if ((x / 120) ** 2 + (y / 170) ** 2 < 1) continue; // keep clear of the pill
      const r2 = (v: number) => Math.round(v * 100) / 100;
      out.push({ x: r2(x), y: r2(y), r: r2(0.8 + rnd() ** 2 * 1.6), o: r2(0.35 + rnd() * 0.6) });
    }
    return out;
  }, []);
  return (
    <g>
      <ellipse rx="260" ry="300" fill="url(#nightHalo)" />
      <g filter="url(#midBlur)" opacity="0.7" mask="url(#auroraSides)">
        <path d="M-320 -150 C-210 -185 -120 -140 -20 -178 C80 -215 190 -160 320 -196 L320 -400 L-320 -400 Z" fill="url(#auroraGrad)" />
      </g>
      <rect x="-154" y="-204" width="308" height="408" rx="154" fill="none" stroke="#C9B8FF" strokeWidth="1.5" opacity="0.35" />
      <g fill="#F2EEFF">
        {stars.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.r} opacity={st.o} />
        ))}
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#EDE6FF" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

function RainArt({ floor }: { floor: number }) {
  const drops = useMemo(() => {
    const rnd = seededRandom(31);
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const out: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
    while (out.length < 70) {
      const x = (rnd() - 0.5) * 720;
      const y = -360 + rnd() * 600;
      const len = 14 + rnd() * 24;
      if ((x / 110) ** 2 + ((y + len / 2) / 160) ** 2 < 1) continue; // behind the glass
      out.push({ x1: r2(x), y1: r2(y), x2: r2(x - len * 0.13), y2: r2(y + len), o: r2(0.25 + rnd() * 0.5) });
    }
    return out;
  }, []);
  const ripples = [
    { x: -150, y: 10, r: 22 },
    { x: 60, y: 22, r: 30 },
    { x: 190, y: 8, r: 16 },
  ];
  return (
    <g>
      <ellipse rx="260" ry="300" fill="url(#rainHalo)" />
      <g stroke="#9CC2FF" strokeWidth="1.2" strokeLinecap="round">
        {drops.map((d, i) =>
          d.y1 > floor - 4 ? null : (
            <line key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={Math.min(d.y2, floor)} opacity={d.o} />
          ),
        )}
      </g>
      <g fill="none" stroke="#D6E8FF" strokeWidth="1.2">
        {ripples.map((rp, i) => (
          <g key={i} opacity="0.4">
            <ellipse cx={rp.x} cy={floor + rp.y} rx={rp.r} ry={rp.r * 0.2} />
            <ellipse cx={rp.x} cy={floor + rp.y} rx={rp.r * 0.55} ry={rp.r * 0.11} opacity="0.6" />
          </g>
        ))}
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#D6E8FF" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

function ForestArt({ floor }: { floor: number }) {
  const { trunks, flies } = useMemo(() => {
    const rnd = seededRandom(43);
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const trunks: { x: number; w: number; o: number }[] = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const near = i % 2 === 0;
        trunks.push({
          x: r2(side * (135 + i * 46 + rnd() * 18)),
          w: r2(near ? 12 + rnd() * 8 : 5 + rnd() * 4),
          o: near ? 0.92 : 0.55,
        });
      }
    }
    const flies: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      flies.push({ x: r2(side * (118 + rnd() * 240)), y: r2(floor - 16 - rnd() ** 2 * 230), r: r2(1.2 + rnd() * 1.4), o: r2(0.4 + rnd() * 0.6) });
    }
    return { trunks, flies };
  }, [floor]);
  return (
    <g>
      <ellipse rx="270" ry="310" fill="url(#forestHalo)" />
      <g filter="url(#midBlur)" fill="url(#shaftGrad)" opacity="0.5">
        <path d="M-210 -330 L-150 -330 L40 170 L-20 170 Z" />
        <path d="M-60 -330 L-30 -330 L150 150 L120 150 Z" />
        <path d="M60 -330 L110 -330 L280 120 L230 120 Z" />
      </g>
      <g fill="#020A05">
        {trunks.map((tr, i) => (
          <rect key={i} x={tr.x - tr.w / 2} y={-380} width={tr.w} height={380 + floor} opacity={tr.o} />
        ))}
      </g>
      <g fill="#D8FF8A" filter="url(#softBlur)">
        {flies.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} opacity={f.o} />
        ))}
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#D9FFC8" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

function BeachArt({ floor }: { floor: number }) {
  const hz = floor * 0.2;
  const glints = useMemo(() => {
    const rnd = seededRandom(57);
    const r2 = (v: number) => Math.round(v * 100) / 100;
    return Array.from({ length: 26 }, () => {
      const y = hz + 4 + rnd() ** 1.5 * (floor - 44 - hz);
      const spread = 10 + (y - hz) * 0.5;
      return { x: r2(168 + (rnd() - 0.5) * 2 * spread), y: r2(y), w: r2(2 + (y - hz) * 0.04), o: r2(0.35 + rnd() * 0.6) };
    });
  }, [floor, hz]);
  const sunRays = useMemo(() => {
    const rnd = seededRandom(61);
    const r2 = (v: number) => Math.round(v * 100) / 100;
    return Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2 + (rnd() - 0.5) * 0.12;
      const len = 40 + rnd() ** 2 * 110;
      return { x1: r2(Math.cos(a) * 32), y1: r2(Math.sin(a) * 32), x2: r2(Math.cos(a) * (32 + len)), y2: r2(Math.sin(a) * (32 + len)), w: r2(1 + rnd() * 2), o: r2(0.25 + rnd() * 0.45) };
    });
  }, []);
  return (
    <g>
      <ellipse cy={hz} rx="320" ry="150" fill="url(#beachSkyHalo)" />
      <circle cx="168" cy={hz - 132} r="150" fill="url(#beachSunHalo)" />
      <g transform={`translate(168 ${hz - 132})`} stroke="#FFC861" strokeLinecap="round" filter="url(#softBlur)">
        {sunRays.map((ray, i) => (
          <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} strokeWidth={ray.w} opacity={ray.o} />
        ))}
      </g>
      <circle cx="168" cy={hz - 132} r="26" fill="#FFE9A8" />
      <g mask="url(#beachSides)">
        <rect x="-360" y={hz} width="720" height={floor - 40 - hz} fill="url(#beachSea)" />
        <rect x="-360" y={floor - 40} width="720" height="40" fill="#F2B544" opacity="0.2" />
        <path d={`M-360 ${floor - 38} q30 -5 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0`} fill="none" stroke="#FFF4D2" strokeWidth="1.5" opacity="0.5" />
        <line x1="-360" y1={hz} x2="360" y2={hz} stroke="#FFE2A0" strokeWidth="1" opacity="0.5" />
      </g>
      <g fill="#FFE7A0">
        {glints.map((g, i) => (
          <rect key={i} x={g.x - g.w / 2} y={g.y} width={g.w} height="1.2" opacity={g.o} />
        ))}
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#FFF4D2" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

function UniverseArt({ floor }: { floor: number }) {
  const { arms, stars } = useMemo(() => {
    const r2 = (v: number) => Math.round(v * 100) / 100;
    // same geometry as the shader: θ = θ0 + 2.2·ln(ρ/40), disc squashed 0.36, tilted 0.32 rad
    const ca = Math.cos(-0.32);
    const sa = Math.sin(-0.32);
    const toSvg = (rho: number, th: number) => {
      const gx = rho * Math.cos(th);
      const gy = rho * Math.sin(th) * 0.36;
      return `${r2(ca * gx - sa * gy)} ${r2(-(sa * gx + ca * gy))}`;
    };
    const arms = [0, Math.PI].map((th0) => {
      const pts: string[] = [];
      for (let rho = 55; rho <= 420; rho += 8) pts.push(toSvg(rho, th0 + 2.2 * Math.log(rho / 40)));
      return `M ${pts.join(' L ')}`;
    });
    const rnd = seededRandom(73);
    const stars: { x: number; y: number; r: number; o: number }[] = [];
    while (stars.length < 60) {
      const x = (rnd() - 0.5) * 780;
      const y = (rnd() - 0.5) * 660 - 30;
      if ((x / 110) ** 2 + (y / 160) ** 2 < 1 || y > floor - 4) continue;
      stars.push({ x: r2(x), y: r2(y), r: r2(0.6 + rnd() ** 2 * 1.4), o: r2(0.3 + rnd() * 0.6) });
    }
    return { arms, stars };
  }, [floor]);
  return (
    <g>
      <ellipse rx="300" ry="260" fill="url(#universeHalo)" />
      <g transform="rotate(-18.3)">
        <ellipse rx="300" ry="108" fill="url(#galaxyDisc)" />
      </g>
      <g fill="none" stroke="url(#armGrad)" strokeLinecap="round" filter="url(#midBlur)">
        {arms.map((d, i) => (
          <path key={i} d={d} strokeWidth="14" opacity="0.55" />
        ))}
      </g>
      <g fill="none" stroke="#9FE4FF" strokeLinecap="round">
        {arms.map((d, i) => (
          <path key={i} d={d} strokeWidth="1.4" opacity="0.6" />
        ))}
      </g>
      <g fill="#EAF6FF">
        {stars.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.r} opacity={st.o} />
        ))}
      </g>
      <g transform="translate(-250 -40)">
        <circle r="7" fill="#FFE1B3" />
        <ellipse rx="13" ry="4" fill="none" stroke="#E6F4FF" strokeWidth="1" opacity="0.6" transform="rotate(-26)" />
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#E6F4FF" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

function DreamArt({ floor }: { floor: number }) {
  const { motes, stars } = useMemo(() => {
    const rnd = seededRandom(89);
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const colors = ['#F2B8A0', '#8FA8E8', '#F3EAFF'];
    const motes = Array.from({ length: 12 }, (_, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      return {
        x: r2(side * (120 + rnd() * 240)),
        y: r2(floor - 30 - rnd() * 300),
        r: r2(6 + rnd() * 9),
        o: r2(0.08 + rnd() * 0.1),
        c: colors[i % 3],
      };
    });
    const stars: { x: number; y: number; o: number }[] = [];
    while (stars.length < 18) {
      const x = (rnd() - 0.5) * 760;
      const y = -360 + rnd() * 300;
      if (Math.abs(x) < 110) continue;
      stars.push({ x: r2(x), y: r2(y), o: r2(0.3 + rnd() * 0.5) });
    }
    return { motes, stars };
  }, [floor]);
  return (
    <g>
      <ellipse rx="230" ry="280" fill="url(#dreamHalo)" />
      <rect x="-113" y="-163" width="226" height="326" rx="113" fill="none" stroke="#C9C2F2" strokeWidth="6" opacity="0.18" filter="url(#midBlur)" />
      <g fill="#F3EAFF">
        {stars.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r="1" opacity={st.o} />
        ))}
      </g>
      <mask id="moonCut" maskContentUnits="userSpaceOnUse">
        <rect x="-230" y="-240" width="50" height="50" fill="#fff" />
        <circle cx="-197" cy="-220" r="16" fill="#000" />
      </mask>
      <circle cx="-205" cy="-215" r="18" fill="#F6E6E8" opacity="0.85" mask="url(#moonCut)" />
      <g filter="url(#midBlur)" fill="#3E4C8C" opacity="0.55">
        <ellipse cx="-230" cy={floor - 20} rx="140" ry="30" />
        <ellipse cx="-60" cy={floor - 12} rx="160" ry="24" />
        <ellipse cx="190" cy={floor - 22} rx="150" ry="32" />
        <ellipse cx="120" cy="-250" rx="170" ry="18" opacity="0.6" />
      </g>
      <g>
        {motes.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={m.r} fill={m.c} opacity={m.o} />
        ))}
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#F3EAFF" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

const RAINBOW = ['#FF3D42', '#FF8C24', '#FFDB33', '#42DB6B', '#339EFF', '#5252EB', '#A352F5'];

function BirdArt({ floor }: { floor: number }) {
  const birds = useMemo(() => {
    const rnd = seededRandom(97);
    const r2 = (v: number) => Math.round(v * 100) / 100;
    return Array.from({ length: 21 }, (_, i) => {
      const ph = 0.95 - i * 0.075;
      const x = Math.cos(ph) * 270 + (rnd() - 0.5) * 22;
      const y = -(40 + Math.sin(ph) * 150 + Math.sin(ph * 2) * 28) + (rnd() - 0.5) * 26;
      return {
        d: `M${r2(x - 8)} ${r2(y - 2)}q4 -4 8 2q4 -6 8 -2`,
        c: RAINBOW[Math.min(6, Math.floor((i / 20) * 7))],
        hidden: (x / 104) ** 2 + (y / 154) ** 2 < 1, // behind the card
      };
    }).filter((b) => !b.hidden);
  }, []);
  return (
    <g>
      <ellipse rx="280" ry="280" fill="url(#birdHalo)" />
      <g fill="none" strokeWidth="9.4" opacity="0.32" filter="url(#softBlur)">
        {RAINBOW.map((c, i) => {
          const R = 304 - 9.43 * (i + 0.5);
          return <path key={c} d={`M${-R} 70A${R} ${R} 0 0 1 ${R} 70`} stroke={c} />;
        })}
      </g>
      <g fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {birds.map((b, i) => (
          <path key={i} d={b.d} stroke={b.c} />
        ))}
      </g>
      <rect x="-95" y="-145" width="190" height="290" rx="95" fill="none" stroke="#FFF8F0" strokeWidth="4" filter="url(#softBlur)" />
    </g>
  );
}

// ring order, same as SCENES
const ART: ComponentType<{ floor: number }>[] = [SolarArt, BreezeArt, BloomArt, EmberArt, NightArt, RainArt, ForestArt, BeachArt, UniverseArt, DreamArt, BirdArt];

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
        <radialGradient id="nightHalo">
          <stop offset="0" stopColor="#9C7CFF" stopOpacity="0.38" />
          <stop offset="0.6" stopColor="#5B3FD6" stopOpacity="0.14" />
          <stop offset="1" stopColor="#0D0820" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rainHalo">
          <stop offset="0" stopColor="#3B7BFF" stopOpacity="0.36" />
          <stop offset="0.6" stopColor="#1640C8" stopOpacity="0.14" />
          <stop offset="1" stopColor="#020A1C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="forestHalo">
          <stop offset="0" stopColor="#3DBE5C" stopOpacity="0.34" />
          <stop offset="0.6" stopColor="#14713A" stopOpacity="0.16" />
          <stop offset="1" stopColor="#04140A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="beachSkyHalo">
          <stop offset="0" stopColor="#FFD36B" stopOpacity="0.3" />
          <stop offset="0.6" stopColor="#2E9BEA" stopOpacity="0.1" />
          <stop offset="1" stopColor="#04121F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="beachSunHalo">
          <stop offset="0" stopColor="#FFD36B" stopOpacity="0.7" />
          <stop offset="0.35" stopColor="#FF9A2E" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FF9A2E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="birdHalo">
          <stop offset="0" stopColor="#FFB547" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#7C4DFF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#0B0716" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dreamHalo">
          <stop offset="0" stopColor="#F2B8A0" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#8FA8E8" stopOpacity="0.14" />
          <stop offset="1" stopColor="#070A16" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="universeHalo">
          <stop offset="0" stopColor="#FFE1B3" stopOpacity="0.32" />
          <stop offset="0.35" stopColor="#45C8FF" stopOpacity="0.14" />
          <stop offset="0.75" stopColor="#5A22C8" stopOpacity="0.1" />
          <stop offset="1" stopColor="#060318" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="galaxyDisc">
          <stop offset="0" stopColor="#FFE1B3" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#45C8FF" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FF5CD9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF5CD9" />
          <stop offset="0.5" stopColor="#45C8FF" />
          <stop offset="1" stopColor="#FF5CD9" />
        </linearGradient>
        <mask id="beachSides" maskContentUnits="userSpaceOnUse">
          <rect x="-360" y="-400" width="720" height="800" fill="url(#auroraSidesGrad)" />
        </mask>
        <linearGradient id="beachSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E9BEA" stopOpacity="0.35" />
          <stop offset="1" stopColor="#135FB0" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9FFC8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3DBE5C" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="auroraGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#EDE6FF" stopOpacity="0.55" />
          <stop offset="0.2" stopColor="#9C7CFF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#4A54D1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="auroraSidesGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#fff" />
          <stop offset="0.7" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="auroraSides" maskContentUnits="userSpaceOnUse">
          <rect x="-340" y="-420" width="680" height="300" fill="url(#auroraSidesGrad)" />
        </mask>
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
            <Art floor={(floorY - cy) / scale} />
          </g>
        );
      })}
      <rect x={cx - 340 * scale} y={floorY - 1} width={680 * scale} height="2" fill="url(#solarHalo)" opacity="0.4" />
    </svg>
  );
});
