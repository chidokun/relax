'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OverlayId, SessionMode } from '@/types/scene';
import { MODES, SCENES, sceneById } from '@/lib/sceneConfig';
import { useStageLayout } from '@/hooks/useStageLayout';
import { usePrefs } from '@/hooks/usePrefs';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSceneCarousel } from '@/hooks/useSceneCarousel';
import { useAdaptiveQuality } from '@/hooks/useAdaptiveQuality';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useDockVisibility } from '@/hooks/useDockVisibility';
import { AmbientBackdrop } from './scene/AmbientBackdrop';
import { StaticSceneArt } from './scene/StaticSceneArt';
import { SceneEffectRenderer } from './scene/SceneEffectRenderer';
import { SceneCarousel } from './scene/SceneCarousel';
import { PlayerDock } from './player/PlayerDock';
import { Overlay } from './player/Overlay';
import { ModeList, SessionPanel, SettingsPanel, VolumePanel } from './player/Panels';
import { ToastLayer, useToasts } from './player/ToastLayer';
import { ChevronDown } from './player/ControlIcons';
import stageStyles from '@/styles/stage.module.css';
import dockStyles from '@/styles/player-dock.module.css';

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return !!el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]');
}

export function ImmersiveApp() {
  const layout = useStageLayout();
  const { prefs, update, loaded } = usePrefs();
  const { settings } = prefs;
  const { reduced, system: systemReduced } = useReducedMotion(settings.reducedMotion);
  const carousel = useSceneCarousel(reduced);
  const { tier, degrade, markWebglFailed } = useAdaptiveQuality(settings.lowerQuality);
  const { toast, show: showToast, dismiss: dismissToast } = useToasts();
  const [overlay, setOverlay] = useState<OverlayId>('none');
  const [fxReady, setFxReady] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [coarse, setCoarse] = useState(false);

  const scene = SCENES[carousel.sceneIndex];

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const f = () => setCoarse(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  // restore last scene once prefs are read (stage is still hidden at that point)
  const restored = useRef(false);
  useEffect(() => {
    if (!loaded || restored.current) return;
    restored.current = true;
    // ?scene=bloom deep-links a scene (also used for QA screenshots)
    const param = new URLSearchParams(window.location.search).get('scene');
    const fromUrl = SCENES.find((s) => s.id === param);
    if (fromUrl) carousel.jumpTo(fromUrl.index);
    else if (prefs.settings.rememberScene) carousel.jumpTo(sceneById(prefs.sceneId).index);
  }, [loaded, prefs.settings.rememberScene, prefs.sceneId, carousel]);

  // persist + announce the selected scene once the slide settles
  useEffect(() => {
    if (!restored.current) return;
    if (settings.rememberScene) update({ sceneId: scene.id });
    const id = window.setTimeout(() => setAnnounce(`${scene.title} selected`), reduced ? 200 : 750);
    return () => window.clearTimeout(id);
  }, [scene.id, scene.title, settings.rememberScene, reduced, update]);

  // scene accent for controls
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent', scene.palette.core);
    root.setProperty('--accent-hi', scene.palette.highlight);
  }, [scene]);

  const onAudioError = useCallback((message: string) => showToast({ message, tone: 'error' }), [showToast]);
  const audio = useAudioPlayer({ scene, volume: prefs.volume, muted: prefs.muted, onError: onAudioError });

  const timer = useSessionTimer(prefs.durationSec, audio.status === 'playing', () => {
    void audio.finish();
    showToast({
      message: 'Session complete',
      tone: 'info',
      action: {
        label: 'Restart',
        run: () => {
          timer.reset();
          audio.play();
        },
      },
    });
  });

  const compact = layout.compact;
  const { dockVisible, railVisible, handlers: dockHandlers } = useDockVisibility(compact || coarse, overlay !== 'none' || audio.status === 'loading');

  const audioReactiveRef = useRef(settings.audioReactive);
  audioReactiveRef.current = settings.audioReactive;
  const getAudioLevel = useCallback(() => (audioReactiveRef.current ? audio.getLevel() * 0.22 : 0), [audio]);

  // ---- global keyboard (never hijacks inputs, dialogs or focused buttons for Space) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const onBody = e.target === document.body || e.target === document.documentElement;
      const onPlainButton = e.target instanceof HTMLButtonElement && !e.target.closest('[role="radiogroup"]');
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && (onBody || onPlainButton)) {
        e.preventDefault();
        carousel.step(e.key === 'ArrowRight' ? 1 : -1);
        return;
      }
      if (!settings.keyboardShortcuts || !onBody) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        audio.toggle();
      } else if (e.key === 'm' || e.key === 'M') {
        update((p) => ({ muted: !p.muted }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audio, carousel, settings.keyboardShortcuts, update]);

  const stageVars = useMemo(
    () =>
      ({
        '--cx': `${layout.cx}px`,
        '--cy': `${layout.cy}px`,
        '--cy-pct': `${(layout.cy / layout.height) * 100}%`,
        '--pill-w': `${layout.pillW}px`,
        '--pill-h': `${layout.pillH}px`,
        '--gap': `${layout.gap}px`,
        '--floor-y': `${layout.floorY}px`,
        '--ps': layout.scale,
      }) as React.CSSProperties,
    [layout],
  );

  const modeLabel = MODES.find((m) => m.id === prefs.mode)?.label ?? 'Focus';
  const setMode = (m: SessionMode) => update({ mode: m });
  const tiny = layout.width <= 359;
  const wide = layout.width >= 1024;
  const overlayWidth = overlay === 'settings' ? 300 : overlay === 'volume' ? 280 : 300;

  return (
    <main className={stageStyles.stage} data-ready={loaded} style={stageVars}>
      <h1 className="sr-only">AURA — immersive ambient sound</h1>

      <AmbientBackdrop sceneIndex={carousel.sceneIndex} />
      <StaticSceneArt layout={layout} sceneIndex={carousel.sceneIndex} visible={!fxReady} />
      <SceneEffectRenderer
          ready={fxReady}
          pos={carousel.pos}
          sceneIndex={carousel.sceneIndex}
          layout={layout}
          tier={tier}
          reducedMotion={reduced}
          getAudioLevel={getAudioLevel}
          onReady={() => setFxReady(true)}
          onFail={() => {
            setFxReady(false);
            markWebglFailed();
          }}
          onSlow={degrade}
        />

      <SceneCarousel
        pos={carousel.pos}
        target={carousel.target}
        sceneIndex={carousel.sceneIndex}
        layout={layout}
        onSelect={carousel.select}
        onStep={carousel.step}
        suppressClick={carousel.suppressClick}
        dragHandlers={carousel.dragHandlers}
      />

      <header className={dockStyles.rail} data-visible={railVisible}>
        <span className={dockStyles.wordmark}>
          <span className={dockStyles.dot} aria-hidden="true" />
          AURA
        </span>
        <button
          type="button"
          className={dockStyles.modeTrigger}
          aria-label={`Session mode: ${modeLabel}`}
          aria-haspopup="dialog"
          aria-expanded={overlay === 'mode'}
          data-overlay-trigger=""
          onClick={() => setOverlay((o) => (o === 'mode' ? 'none' : 'mode'))}
        >
          {modeLabel}
          <ChevronDown />
        </button>
      </header>

      <PlayerDock
        status={audio.status}
        sceneTitle={scene.title}
        modeLabel={modeLabel}
        remaining={timer.remaining}
        durationSec={prefs.durationSec}
        volume={prefs.volume}
        muted={prefs.muted}
        overlay={overlay}
        visible={dockVisible}
        tiny={tiny}
        wide={wide}
        onToggle={audio.toggle}
        onPrev={() => carousel.step(-1)}
        onNext={() => carousel.step(1)}
        onOverlay={setOverlay}
        dockHandlers={dockHandlers}
      />

      <Overlay open={overlay === 'mode'} onClose={() => setOverlay('none')} title="Session mode" placement="rail" compact={compact} reduced={reduced} width={280}>
        <ModeList mode={prefs.mode} onChange={setMode} autofocus />
      </Overlay>
      <Overlay open={overlay === 'timer'} onClose={() => setOverlay('none')} title="Session" placement="dock" compact={compact} reduced={reduced} width={overlayWidth}>
        <SessionPanel
          mode={prefs.mode}
          onMode={setMode}
          durationSec={prefs.durationSec}
          onDuration={(sec) => update({ durationSec: sec })}
          remaining={timer.remaining}
          started={timer.started}
          status={audio.status}
          onReset={timer.reset}
        />
      </Overlay>
      <Overlay open={overlay === 'volume'} onClose={() => setOverlay('none')} title="Volume" placement="dock" compact={compact} reduced={reduced} width={overlayWidth}>
        <VolumePanel
          volume={prefs.volume}
          muted={prefs.muted}
          accent={scene.palette.core}
          onVolume={(v) => update({ volume: v, muted: v === 0 })}
          onMute={() =>
            update((p) => (p.muted || p.volume === 0 ? { muted: false, volume: p.volume === 0 ? 0.5 : p.volume } : { muted: true }))
          }
        />
      </Overlay>
      <Overlay open={overlay === 'settings'} onClose={() => setOverlay('none')} title="Settings" placement="dock" compact={compact} reduced={reduced} width={overlayWidth}>
        <SettingsPanel
          settings={settings}
          systemReduced={systemReduced}
          tierLabel={tier}
          onChange={(patch) => update((p) => ({ settings: { ...p.settings, ...patch } }))}
        />
      </Overlay>

      <ToastLayer toast={toast} onDismiss={dismissToast} />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
    </main>
  );
}
