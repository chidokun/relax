'use client';

import { useCallback, useEffect, useState } from 'react';
import type { QualityTier } from '@/types/scene';

const ORDER: QualityTier[] = ['high', 'medium', 'low', 'static'];

function detectTier(): QualityTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 500;
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (mem <= 2 || cores <= 2) return 'low';
  if (coarse || small || mem <= 4) return 'medium';
  return 'high';
}

/**
 * Picks an initial tier from device hints and steps it down when the renderer reports
 * sustained slow frames. `lowerQuality` (user setting) caps the tier at "low".
 */
export function useAdaptiveQuality(lowerQuality: boolean) {
  const [auto, setAuto] = useState<QualityTier>('high');
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    // ?quality=static|low|medium|high forces a tier (QA / screenshots)
    const forced = new URLSearchParams(window.location.search).get('quality') as QualityTier | null;
    if (forced && ORDER.includes(forced)) {
      setAuto(forced);
      if (forced === 'static') setWebglFailed(true);
      return;
    }
    setAuto(detectTier());
  }, []);

  const degrade = useCallback(() => {
    setAuto((t) => {
      const i = ORDER.indexOf(t);
      // never auto-drop to static: the low tier is still cheap and alive
      return ORDER[Math.min(i + 1, ORDER.indexOf('low'))];
    });
  }, []);

  let tier: QualityTier = auto;
  if (lowerQuality && ORDER.indexOf(tier) < ORDER.indexOf('low')) tier = 'low';
  if (webglFailed) tier = 'static';

  return { tier, degrade, markWebglFailed: useCallback(() => setWebglFailed(true), []) };
}
