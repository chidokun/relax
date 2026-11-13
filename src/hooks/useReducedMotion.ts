'use client';

import { useEffect, useState } from 'react';
import type { ReducedMotionPref } from '@/types/scene';

export function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** OS preference wins unless the user explicitly overrode it in Settings. */
export function useReducedMotion(pref: ReducedMotionPref): { reduced: boolean; system: boolean } {
  const system = useSystemReducedMotion();
  const reduced = pref === 'system' ? system : pref === 'on';
  useEffect(() => {
    document.documentElement.classList.toggle('relax-reduced', reduced);
  }, [reduced]);
  return { reduced, system };
}
