import type { StageLayout } from '@/types/scene';

export const BASE_W = 1086;
export const BASE_H = 804;
export const BASE_PILL_W = 184;
export const BASE_PILL_H = 284;
const RATIO = BASE_PILL_H / BASE_PILL_W;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Adaptive stage geometry. Only the hero art follows the 1086×804 baseline;
 * controls and text size themselves independently.
 */
export function computeStageLayout(width: number, height: number): StageLayout {
  const W = Math.max(280, width);
  const H = Math.max(320, height);
  const compact = W < 768;

  let pillW: number;
  let gap: number;
  let cyRatio: number;

  if (compact) {
    const small = W <= 359;
    pillW = clamp(W * 0.42, small ? 142 : 150, small ? 155 : 180);
    // keep room for the dock under the hero on short phones
    pillW = Math.min(pillW, (H * 0.36) / RATIO);
    gap = clamp(W * 0.62, 195, 260);
    cyRatio = 0.44;
  } else {
    const s = Math.min(W / BASE_W, H / BASE_H);
    pillW = clamp(BASE_PILL_W * s, 160, 220);
    gap = clamp(W * 0.315, 260, 410);
    gap = Math.max(gap, pillW * 1.5);
    cyRatio = 0.485;
  }

  let pillH = pillW * RATIO;
  if (H < 550) {
    pillH = Math.min(pillH, 240, H * 0.56);
    pillW = pillH / RATIO;
    cyRatio = 0.45;
  }

  const scale = pillW / BASE_PILL_W;
  const cx = W / 2;
  const cy = Math.round(H * cyRatio);
  const floorY = Math.round(cy + pillH / 2 + 100 * scale);

  return { width: W, height: H, pillW, pillH, gap, cx, cy, floorY, scale, compact };
}
