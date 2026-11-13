'use client';

import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import type { StageLayout } from '@/types/scene';
import { SCENES, SCENE_COUNT } from '@/lib/sceneConfig';
import { ringOffset } from '@/lib/animationTokens';
import { ScenePill } from './ScenePill';
import styles from '@/styles/stage.module.css';

interface Props {
  pos: MotionValue<number>;
  target: number;
  sceneIndex: number;
  layout: StageLayout;
  onSelect: (k: number) => void;
  onStep: (delta: number) => void;
  suppressClick: React.RefObject<boolean>;
  dragHandlers: {
    onPointerDown: (e: React.PointerEvent, gap: number, pillW: number) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

function writeVars(el: HTMLElement | null, k: number, pos: number) {
  if (!el) return;
  const o = ringOffset(k, pos, SCENE_COUNT);
  const ao = Math.abs(o);
  const s = el.style;
  s.setProperty('--o', o.toFixed(4));
  s.setProperty('--abso', Math.min(1, ao).toFixed(4));
  const a = Math.max(0, 1 - ao);
  s.setProperty('--a', (a * a * (3 - 2 * a)).toFixed(4));
  s.setProperty('--vis', Math.max(0, Math.min(1, 2 - ao)).toFixed(4));
  s.zIndex = String(10 - Math.round(ao * 3));
}

export function SceneCarousel({ pos, target, sceneIndex, layout, onSelect, onStep, suppressClick, dragHandlers }: Props) {
  const pillRefs = useRef<(HTMLElement | null)[]>([]);
  const reflRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const apply = (v: number) => {
      for (let k = 0; k < SCENE_COUNT; k++) {
        writeVars(pillRefs.current[k], k, v);
        writeVars(reflRefs.current[k], k, v);
      }
    };
    apply(pos.get());
    return pos.on('change', apply);
  }, [pos]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onStep(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onStep(-1);
    }
  };

  return (
    <>
      <div className={styles.reflection} aria-hidden="true">
        <div className={styles.reflectionFlip}>
          {SCENES.map((s, k) => (
            <ScenePill key={s.id} ref={(el) => void (reflRefs.current[k] = el)} scene={s} active={k === sceneIndex} focusable={false} reflection />
          ))}
        </div>
      </div>
      <div
        className={styles.carousel}
        role="group"
        aria-roledescription="carousel"
        aria-label="Soundscapes"
        onKeyDown={onKeyDown}
        onPointerDown={(e) => dragHandlers.onPointerDown(e, layout.gap, layout.pillW)}
        onPointerMove={dragHandlers.onPointerMove}
        onPointerUp={dragHandlers.onPointerUp}
        onPointerCancel={dragHandlers.onPointerCancel}
      >
        {SCENES.map((s, k) => {
          // DOM order stays fixed (reordering would steal focus mid-selection)
          const off = Math.round(ringOffset(k, target, SCENE_COUNT));
          return (
            <ScenePill
              key={s.id}
              ref={(el) => void (pillRefs.current[k] = el)}
              scene={s}
              active={k === sceneIndex}
              focusable={Math.abs(off) <= 1}
              onSelect={() => {
                if (suppressClick.current) return;
                onSelect(k);
              }}
            />
          );
        })}
      </div>
    </>
  );
}
