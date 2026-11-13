'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaybackStatus, SceneConfig } from '@/types/scene';
import { AudioEngine, AudioUnavailableError, AutoplayBlockedError } from '@/lib/audioEngine';

interface Options {
  scene: SceneConfig;
  volume: number;
  muted: boolean;
  onError: (message: string) => void;
}

/**
 * React façade over AudioEngine. Selecting a scene never starts or stops playback by
 * itself: while playing it crossfades to the new soundscape, otherwise it waits.
 */
export function useAudioPlayer({ scene, volume, muted, onError }: Options) {
  const engineRef = useRef<AudioEngine | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const statusRef = useRef<PlaybackStatus>('idle');
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const set = useCallback((s: PlaybackStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const engine = useCallback(() => {
    if (!engineRef.current) engineRef.current = new AudioEngine();
    return engineRef.current;
  }, []);

  useEffect(() => () => engineRef.current?.dispose(), []);

  useEffect(() => {
    engineRef.current?.setVolume(volume, muted);
  }, [volume, muted]);

  const fail = useCallback(
    (err: unknown, sceneTitle: string) => {
      if (err instanceof AutoplayBlockedError) {
        onErrorRef.current('Your browser blocked audio. Press Play to start.');
      } else if (err instanceof AudioUnavailableError) {
        onErrorRef.current(`${sceneTitle} audio unavailable. Please try another scene.`);
        console.warn(`[AURA] ${err.message} → ${err.src}`);
      } else {
        onErrorRef.current('Audio unavailable. Please try another scene.');
        console.warn('[AURA] audio error', err);
      }
      engineRef.current?.stopAll();
      engineRef.current?.pause();
      set('error');
    },
    [set],
  );

  const startScene = useCallback(
    async (target: SceneConfig, transportUp: boolean) => {
      if (!target.audioSrc) {
        fail(new AudioUnavailableError('(none)', 'No audio asset configured.'), target.title);
        return;
      }
      const eng = engine();
      eng.setVolume(volume, muted);
      if (!transportUp || !eng.hasVoice) set('loading');
      try {
        const res = await eng.play(target.audioSrc, { transportUp });
        if (res === 'started' && sceneRef.current.id === target.id) set('playing');
      } catch (err) {
        if (sceneRef.current.id === target.id) fail(err, target.title);
      }
    },
    [engine, fail, muted, set, volume],
  );

  const play = useCallback(() => {
    if (statusRef.current === 'playing' || statusRef.current === 'loading') return;
    void startScene(sceneRef.current, false);
  }, [startScene]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing' && statusRef.current !== 'loading') return;
    engineRef.current?.pause();
    set('paused');
  }, [set]);

  const toggle = useCallback(() => {
    if (statusRef.current === 'playing' || statusRef.current === 'loading') pause();
    else play();
  }, [pause, play]);

  /** Session complete: 4s fade then idle. */
  const finish = useCallback(async () => {
    const eng = engineRef.current;
    if (!eng) return;
    set('idle');
    await eng.fadeOutAndStop(4);
  }, [set]);

  // crossfade when the scene changes during playback
  const lastSceneId = useRef(scene.id);
  useEffect(() => {
    if (lastSceneId.current === scene.id) return;
    lastSceneId.current = scene.id;
    const s = statusRef.current;
    if (s === 'playing' || s === 'loading') void startScene(scene, s === 'playing');
    else if (s === 'error') set('idle');
  }, [scene, set, startScene]);

  const getLevel = useCallback(() => (statusRef.current === 'playing' ? engineRef.current?.getLevel() ?? 0 : 0), []);

  return { status, play, pause, toggle, finish, getLevel };
}
