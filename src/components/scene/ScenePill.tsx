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

/**
 * Capsule card. Position/activeness come from CSS variables (--o, --abso, --a, --vis)
 * written straight to the DOM by the carousel on every motion frame — no React renders.
 */
export const ScenePill = forwardRef<HTMLElement, Props>(function ScenePill({ scene, active, focusable, reflection, onSelect }, ref) {
  const body = (
    <span className={styles.shell}>
      <span className={styles.base} />
      <span className={styles.color}>
        <span className={`${styles.blob} ${styles.b1}`} />
        <span className={`${styles.blob} ${styles.b2}`} />
        <span className={`${styles.blob} ${styles.b3}`} />
      </span>
      <span className={styles.sheen} />
      <span className={styles.rimDim} />
      <span className={styles.rimLit} />
      {!reflection && (
        <span className={styles.content}>
          <span className={styles.index}>0{scene.index + 1}</span>
          <span className={styles.icon}>
            <SceneIcon id={scene.id} />
          </span>
          <span className={styles.title}>{scene.title}</span>
          <span className={styles.caption}>{scene.caption}</span>
        </span>
      )}
    </span>
  );

  if (reflection) {
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={styles.pill} data-active={active} style={sceneCssVars(scene)} aria-hidden="true">
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
      style={sceneCssVars(scene)}
      aria-label={`Select ${scene.title} scene`}
      aria-current={active ? 'true' : undefined}
      aria-hidden={focusable ? undefined : true}
      tabIndex={focusable ? 0 : -1}
      onClick={onSelect}
    >
      {body}
    </button>
  );
});
