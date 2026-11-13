'use client';

import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import type { QualityTier, StageLayout } from '@/types/scene';
import { FxEngine } from './effects/FxEngine';
import styles from '@/styles/stage.module.css';

interface Props {
  ready: boolean;
  pos: MotionValue<number>;
  sceneIndex: number;
  layout: StageLayout;
  tier: QualityTier;
  reducedMotion: boolean;
  getAudioLevel: () => number;
  onReady: () => void;
  onFail: () => void;
  onSlow: () => void;
}

/**
 * Mounts the WebGL light-field renderer. A fresh <canvas> is created per mount so
 * StrictMode remounts / context loss never reuse a dead context.
 */
export function SceneEffectRenderer({ ready, pos, sceneIndex, layout, tier, reducedMotion, getAudioLevel, onReady, onFail, onSlow }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FxEngine | null>(null);
  const cbRef = useRef({ getAudioLevel, onReady, onFail, onSlow });
  cbRef.current = { getAudioLevel, onReady, onFail, onSlow };
  const initial = useRef({ layout, tier, reducedMotion, sceneIndex });

  useEffect(() => {
    const host = hostRef.current;
    if (!host || tier === 'static') return;
    let cancelled = false;
    const canvas = document.createElement('canvas');
    canvas.className = styles.fxCanvas;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    let engine: FxEngine;
    try {
      engine = new FxEngine(canvas, {
        getPos: () => pos.get(),
        getAudioLevel: () => cbRef.current.getAudioLevel(),
        onFirstFrame: () => cbRef.current.onReady(),
        onSlow: () => cbRef.current.onSlow(),
        onContextLost: () => cbRef.current.onFail(),
      });
      const init = initial.current;
      engine.setTier(init.tier);
      engine.setLayout(init.layout);
      engine.setReducedMotion(init.reducedMotion);
      engine.setScene(init.sceneIndex);
      engine
        .prewarm()
        .then(() => {
          if (!cancelled) engine.start();
        })
        .catch((err) => {
          console.warn('[AURA] shader compilation failed, using static artwork.', err);
          if (!cancelled) cbRef.current.onFail();
        });
    } catch (err) {
      console.warn('[AURA] WebGL unavailable, using static artwork.', err);
      canvas.remove();
      cbRef.current.onFail();
      return;
    }
    engineRef.current = engine;
    return () => {
      cancelled = true;
      engine.dispose();
      engineRef.current = null;
      canvas.remove();
    };
    // the engine lives for the lifetime of the non-static tier
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier === 'static', pos]);

  useEffect(() => {
    initial.current.layout = layout;
    engineRef.current?.setLayout(layout);
  }, [layout]);

  useEffect(() => {
    initial.current.tier = tier;
    engineRef.current?.setTier(tier);
  }, [tier]);

  useEffect(() => {
    initial.current.reducedMotion = reducedMotion;
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    initial.current.sceneIndex = sceneIndex;
    engineRef.current?.setScene(sceneIndex);
  }, [sceneIndex]);


  return <div ref={hostRef} className={styles.fxHost} data-ready={ready} />;
}
