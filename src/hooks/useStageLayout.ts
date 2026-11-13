'use client';

import { useEffect, useState } from 'react';
import type { StageLayout } from '@/types/scene';
import { BASE_H, BASE_W, computeStageLayout } from '@/lib/layout';

export function useStageLayout(): StageLayout {
  const [layout, setLayout] = useState<StageLayout>(() => computeStageLayout(BASE_W, BASE_H));

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const w = window.innerWidth;
        const h = vv ? Math.round(vv.height) : window.innerHeight;
        setLayout((prev) => (prev.width === w && prev.height === h ? prev : computeStageLayout(w, h)));
      });
    };
    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, []);

  return layout;
}
