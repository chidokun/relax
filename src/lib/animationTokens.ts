export const EASE_HERO = [0.22, 0.78, 0.17, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_OVERLAY = [0.22, 1, 0.36, 1] as const;

export const MOTION = {
  selectSlide: { duration: 0.7, ease: EASE_HERO },
  revealFX: { duration: 0.95, ease: EASE_OUT_EXPO },
  backgroundTint: { duration: 1.0 },
  button: { duration: 0.18 },
  overlay: { duration: 0.32, ease: EASE_OVERLAY },
} as const;

/** Signed ring offset of item k relative to a continuous carousel position, in [-n/2, n/2). */
export function ringOffset(k: number, pos: number, n = 4): number {
  const half = n / 2;
  return ((((k - pos + half) % n) + n) % n) - half;
}

export function mod(v: number, n: number): number {
  return ((v % n) + n) % n;
}

/** Cubic-bezier easing (same maths as CSS) for the render loop. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const err = sx(t) - x;
      const d = dsx(t);
      if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    t = Math.min(1, Math.max(0, t));
    return sy(t);
  };
}

export const easeOutExpo = cubicBezier(0.16, 1, 0.3, 1);
export const easeOut = cubicBezier(0, 0, 0.58, 1);
export const easeInOut = cubicBezier(0.42, 0, 0.58, 1);
