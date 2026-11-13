import { memo } from 'react';
import { SCENES } from '@/lib/sceneConfig';
import styles from '@/styles/stage.module.css';

/** CSS ambient haze per scene, crossfaded on change. Sits under the WebGL canvas (and is the fallback). */
export const AmbientBackdrop = memo(function AmbientBackdrop({ sceneIndex }: { sceneIndex: number }) {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      {SCENES.map((s, i) => (
        <div
          key={s.id}
          className={styles.backdropLayer}
          data-active={i === sceneIndex}
          style={{
            ['--amb' as string]: `color-mix(in oklab, ${s.palette.ambient} 100%, ${s.palette.secondary} 18%)`,
            ['--amb-core' as string]: `color-mix(in oklab, ${s.palette.secondary} 28%, transparent)`,
          }}
        />
      ))}
    </div>
  );
});
