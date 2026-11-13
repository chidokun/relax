'use client';

import { useCallback, useRef, useState } from 'react';
import { animate, useMotionValue, type AnimationPlaybackControls } from 'motion/react';
import { EASE_HERO, mod, ringOffset } from '@/lib/animationTokens';
import { SCENE_COUNT } from '@/lib/sceneConfig';

/**
 * Single source of truth for the carousel. `target` is an unbounded integer
 * (…, -1, 0, 1, …) so wrap-around always travels the short way; `pos` is the
 * continuous motion value every pill / FX centre derives from.
 */
export function useSceneCarousel(reducedMotion: boolean) {
  const pos = useMotionValue(0);
  const [target, setTarget] = useState(0);
  const targetRef = useRef(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);

  const goTo = useCallback(
    (next: number, opts?: { spring?: boolean; instant?: boolean }) => {
      anim.current?.stop();
      targetRef.current = next;
      setTarget(next);
      if (opts?.instant) {
        pos.set(next);
        return;
      }
      anim.current = opts?.spring
        ? animate(pos, next, { type: 'spring', stiffness: 260, damping: 30 })
        : animate(pos, next, reducedMotion ? { duration: 0.18, ease: 'easeOut' } : { duration: 0.7, ease: EASE_HERO });
    },
    [pos, reducedMotion],
  );

  const step = useCallback((delta: number) => goTo(targetRef.current + delta), [goTo]);

  /** Select ring index k via the shortest path from the current target. */
  const select = useCallback(
    (k: number) => {
      const delta = Math.round(ringOffset(k, targetRef.current, SCENE_COUNT));
      if (delta !== 0) goTo(targetRef.current + delta);
    },
    [goTo],
  );

  const jumpTo = useCallback((k: number) => goTo(k, { instant: true }), [goTo]);

  // ---- drag / swipe ----
  const drag = useRef<{ id: number; x0: number; pos0: number; moved: boolean; gap: number; pillW: number } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, gap: number, pillW: number) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      drag.current = { id: e.pointerId, x0: e.clientX, pos0: pos.get(), moved: false, gap, pillW };
    },
    [pos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x0;
      if (!d.moved && Math.abs(dx) > 6) {
        d.moved = true;
        anim.current?.stop();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
      if (d.moved) {
        // rubber-band slightly past one card
        const raw = -dx / d.gap;
        const lim = Math.sign(raw) * Math.min(Math.abs(raw), 1.25 + (Math.abs(raw) - 1.25) * 0.3);
        pos.set(d.pos0 + (Math.abs(raw) > 1.25 ? lim : raw));
      }
    },
    [pos],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      drag.current = null;
      if (!d.moved) return;
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      const dx = e.clientX - d.x0;
      const threshold = Math.max(45, d.pillW * 0.18);
      const base = targetRef.current;
      if (Math.abs(dx) >= threshold) {
        const cards = Math.max(1, Math.round(Math.abs(dx) / d.gap));
        goTo(base + (dx < 0 ? cards : -cards));
      } else {
        goTo(base, { spring: true });
      }
    },
    [goTo],
  );

  return {
    pos,
    target,
    sceneIndex: mod(target, SCENE_COUNT),
    step,
    select,
    jumpTo,
    suppressClick,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
