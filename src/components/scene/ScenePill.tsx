'use client';

import { forwardRef } from 'react';
import type { SceneConfig } from '@/types/scene';
import { SceneIcon } from './icons/SceneIcons';
import styles from '@/styles/scene-pill.module.css';

interface Props {
  scene: SceneConfig;
  active: boolean;
  focusable: boolean;
  reflection?: boolean;
  /** Pointer is over this card (mirrored onto its floor reflection by the carousel). */
  hovered?: boolean;
  onHover?: (on: boolean) => void;
  onSelect?: () => void;
}

export function sceneCssVars(scene: SceneConfig): React.CSSProperties {
  const p = scene.palette;
  return {
    ['--top' as string]: p.top,
    ['--bottom' as string]: p.bottom,
    ['--highlight' as string]: p.highlight,
    ['--core' as string]: p.core,
    ['--secondary' as string]: p.secondary,
    ['--tint' as string]: scene.sideTint,
    ['--blob1' as string]: scene.cardBlobs[0],
    ['--blob2' as string]: scene.cardBlobs[1],
    ['--blob3' as string]: scene.cardBlobs[2],
  };
}

/** Cursor position (spotlight) and tilt go straight to CSS variables: no React render per move. */
function trackPointer(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  const s = el.style;
  s.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
  s.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  s.setProperty('--rx', `${((0.5 - y) * 7).toFixed(2)}deg`);
  s.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`);
}

function resetPointer(el: HTMLElement) {
  el.style.setProperty('--rx', '0deg');
  el.style.setProperty('--ry', '0deg');
}

/**
 * Capsule card. Position/activeness come from CSS variables (--o, --abso, --a, --vis)
 * written straight to the DOM by the carousel on every motion frame — no React renders.
 * Hover (mouse/pen only) wakes the scene's colour from the bottom, adds a cursor spotlight
 * and rim light, a slight 3D tilt and a per-scene icon gesture.
 */
export const ScenePill = forwardRef<HTMLElement, Props>(function ScenePill(
  { scene, active, focusable, reflection, hovered, onHover, onSelect },
  ref,
) {
  const body = (
    <>
      <span className={styles.glow} />
      <span className={styles.tilt}>
        <span className={styles.shell}>
          <span className={styles.base} />
          <span className={styles.preview} />
          <span className={styles.color}>
            <span className={`${styles.blob} ${styles.b1}`} />
            <span className={`${styles.blob} ${styles.b2}`} />
            <span className={`${styles.blob} ${styles.b3}`} />
          </span>
          <span className={styles.sheen} />
          <span className={styles.spot} />
          <span className={styles.rimDim} />
          <span className={styles.rimLit} />
          <span className={styles.rimSpot} />
          {!reflection && (
            <span className={styles.content}>
              <span className={styles.index}>{String(scene.index + 1).padStart(2, '0')}</span>
              <span className={styles.icon}>
                <SceneIcon id={scene.id} />
              </span>
              <span className={styles.title}>{scene.title}</span>
              <span className={styles.caption}>{scene.caption}</span>
            </span>
          )}
        </span>
      </span>
    </>
  );

  if (reflection) {
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={styles.pill}
        data-active={active}
        data-hover={hovered || undefined}
        data-scene={scene.id}
        style={sceneCssVars(scene)}
        aria-hidden="true"
      >
        {body}
      </span>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      className={styles.pill}
      data-active={active}
      data-hover={hovered || undefined}
      data-scene={scene.id}
      style={sceneCssVars(scene)}
      aria-label={`Select ${scene.title} scene`}
      aria-current={active ? 'true' : undefined}
      aria-hidden={focusable ? undefined : true}
      tabIndex={focusable ? 0 : -1}
      onClick={onSelect}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return;
        trackPointer(e);
        onHover?.(true);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'touch') trackPointer(e);
      }}
      onPointerLeave={(e) => {
        resetPointer(e.currentTarget);
        onHover?.(false);
      }}
    >
      {body}
    </button>
  );
});
