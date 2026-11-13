'use client';

import { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { SceneConfig } from '@/types/scene';
import { createLiquidCard, type LiquidCard } from '@/lib/liquidCard';
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
  /** Floor reflection of this card: receives the same liquid variables and click flashes. */
  getMirror?: () => HTMLElement | null;
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

/**
 * Capsule card. Position/activeness come from CSS variables (--o, --abso, --a, --vis)
 * written straight to the DOM by the carousel on every motion frame — no React renders.
 * Hover (mouse/pen only) wakes the scene's colour from the bottom, adds a cursor spotlight
 * and rim light, and a per-scene icon gesture; tilt, magnetic pull, squash/stretch, the
 * sloshing liquid highlight, the press and the click flash are spring-driven (lib/liquidCard).
 */
export const ScenePill = forwardRef<HTMLElement, Props>(function ScenePill(
  { scene, active, focusable, reflection, hovered, onHover, onSelect, getMirror },
  ref,
) {
  const liquid = useRef<LiquidCard | null>(null);
  const mirrorRef = useRef(getMirror);
  const outerRef = useRef(ref);
  useEffect(() => {
    mirrorRef.current = getMirror;
    outerRef.current = ref;
  });

  // stable: the parent's inline ref callback changes every render, the driver must not
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      const r = outerRef.current;
      if (typeof r === 'function') r(el);
      else if (r) r.current = el;
      liquid.current?.destroy();
      liquid.current =
        el && !reflection
          ? createLiquidCard(el, () => mirrorRef.current?.() ?? null, {
              shell: styles.shell,
              flash: styles.flash,
              ring: styles.ring,
              bloom: styles.bloom,
            })
          : null;
    },
    [reflection],
  );

  useEffect(() => () => liquid.current?.destroy(), []);

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
          <span className={styles.liquid} />
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
      ref={setRef}
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
      onClick={(e) => {
        liquid.current?.flash(e);
        onSelect?.();
      }}
      onPointerDown={(e) => liquid.current?.press(e)}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return;
        liquid.current?.enter(e);
        onHover?.(true);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'touch') liquid.current?.move(e);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'touch') return;
        liquid.current?.leave();
        onHover?.(false);
      }}
    >
      {body}
    </button>
  );
});
