'use client';

import { useEffect, useState } from 'react';
import type { PlaybackStatus, ReducedMotionPref, SessionMode, UserSettings } from '@/types/scene';
import { DURATION_PRESETS, MODES } from '@/lib/sceneConfig';
import { formatClock } from '@/hooks/useSessionTimer';
import { ModeIcons, VolumeIcon } from './ControlIcons';
import styles from '@/styles/panels.module.css';

/* ---------------- Mode list (rail popover + session panel) ---------------- */

export function ModeList({ mode, onChange, autofocus }: { mode: SessionMode; onChange: (m: SessionMode) => void; autofocus?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Session mode" className={styles.modeList}>
      {MODES.map((m) => {
        const Icon = ModeIcons[m.id];
        const checked = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={checked}
            className={styles.modeItem}
            data-autofocus={autofocus && checked ? '' : undefined}
            onClick={() => onChange(m.id)}
          >
            <span className={styles.modeIcon}>
              <Icon />
            </span>
            <span className={styles.modeText}>
              <span className={styles.modeLabel}>{m.label}</span>
              <span className={styles.modeDesc}>
                {m.description} Suggested {m.suggestedMin} min.
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Session panel: mode + countdown ---------------- */

interface SessionProps {
  mode: SessionMode;
  onMode: (m: SessionMode) => void;
  durationSec: number | null;
  onDuration: (sec: number | null) => void;
  remaining: number | null;
  started: boolean;
  status: PlaybackStatus;
  onReset: () => void;
}

export function SessionPanel({ mode, onMode, durationSec, onDuration, remaining, started, status, onReset }: SessionProps) {
  const [confirming, setConfirming] = useState(false);
  const playing = status === 'playing';
  useEffect(() => setConfirming(false), [durationSec, status]);

  let state: string;
  if (durationSec === null) state = playing ? 'Unlimited session · playing' : 'Unlimited session';
  else if (!started) state = `Starts on Play · ${formatClock(durationSec)}`;
  else if (playing) state = `${formatClock(remaining ?? 0)} left`;
  else state = `Paused · ${formatClock(remaining ?? 0)} left`;

  const resetNeedsConfirm = playing && remaining !== null && remaining > 5 * 60;

  return (
    <div className={styles.stack}>
      <section>
        <h3 className={styles.sectionLabel} id="mode-label">
          Mode
        </h3>
        <div className={styles.chips} role="radiogroup" aria-labelledby="mode-label">
          {MODES.map((m) => {
            const Icon = ModeIcons[m.id];
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={m.id === mode}
                className={styles.chip}
                data-wide=""
                onClick={() => onMode(m.id)}
              >
                <Icon /> {m.label}
              </button>
            );
          })}
        </div>
        <p className={styles.hint}>
          {MODES.find((m) => m.id === mode)?.description} Suggested {MODES.find((m) => m.id === mode)?.suggestedMin} min.
        </p>
      </section>
      <section>
        <h3 className={styles.sectionLabel} id="dur-label">
          Session length (min)
        </h3>
        <div className={styles.chips} role="radiogroup" aria-labelledby="dur-label">
          {DURATION_PRESETS.map((p) => {
            const checked = p.sec === durationSec;
            return (
              <button
                key={p.label}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={p.sec === null ? 'Unlimited' : `${p.label} minutes`}
                className={styles.chip}
                data-autofocus={checked ? '' : undefined}
                onClick={() => onDuration(p.sec)}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>
      <div className={styles.sessionFoot}>
        <span className={styles.sessionState} aria-live="off">
          {state}
        </span>
        {durationSec !== null &&
          (confirming ? (
            <span className={styles.confirm}>
              <span>Reset?</span>
              <button type="button" className={styles.textBtn} onClick={() => (onReset(), setConfirming(false))}>
                Yes
              </button>
              <button type="button" className={styles.textBtn} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              className={styles.textBtn}
              disabled={!started}
              onClick={() => (resetNeedsConfirm ? setConfirming(true) : onReset())}
            >
              Reset session
            </button>
          ))}
      </div>
    </div>
  );
}

/* ---------------- Volume ---------------- */

export function VolumePanel({
  volume,
  muted,
  accent,
  onVolume,
  onMute,
}: {
  volume: number;
  muted: boolean;
  accent: string;
  onVolume: (v: number) => void;
  onMute: () => void;
}) {
  const pct = Math.round(volume * 100);
  const shown = muted ? 0 : pct;
  return (
    <div className={styles.volumeRow}>
      <button type="button" className={styles.muteBtn} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} onClick={onMute}>
        <VolumeIcon level={volume} muted={muted} />
      </button>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={100}
        step={1}
        value={shown}
        aria-label="Volume"
        aria-valuetext={`${shown}%`}
        data-autofocus=""
        style={{ ['--fill' as string]: `${shown}%`, ['--accent' as string]: accent }}
        onChange={(e) => onVolume(Number(e.target.value) / 100)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const dir = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : -1;
            onVolume(Math.min(100, Math.max(0, shown + dir * 5)) / 100);
          }
        }}
      />
      <span className={styles.volumeValue}>{shown}%</span>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className={styles.switchRow}>
      <span className={styles.switchText}>
        <span>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className={styles.switch} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsPanel({
  settings,
  systemReduced,
  onChange,
  tierLabel,
}: {
  settings: UserSettings;
  systemReduced: boolean;
  onChange: (patch: Partial<UserSettings>) => void;
  tierLabel: string;
}) {
  const rmOptions: { id: ReducedMotionPref; label: string }[] = [
    { id: 'system', label: 'System' },
    { id: 'on', label: 'On' },
    { id: 'off', label: 'Off' },
  ];
  return (
    <div className={styles.stack}>
      <section>
        <h3 className={styles.sectionLabel} id="rm-label">
          Reduced motion
        </h3>
        <div className={styles.chips} role="radiogroup" aria-labelledby="rm-label">
          {rmOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={settings.reducedMotion === o.id}
              className={styles.chip}
              data-wide=""
              data-autofocus={settings.reducedMotion === o.id ? '' : undefined}
              onClick={() => onChange({ reducedMotion: o.id })}
            >
              {o.label}
            </button>
          ))}
        </div>
        {settings.reducedMotion === 'off' && systemReduced && (
          <p className={styles.hint}>Your system asks for reduced motion; full animation is on because you chose it here.</p>
        )}
      </section>
      <div className={styles.switches}>
        <Switch label="Lower effects quality" hint={`Renderer: ${tierLabel}`} checked={settings.lowerQuality} onChange={(v) => onChange({ lowerQuality: v })} />
        <Switch label="Audio responsive visuals" checked={settings.audioReactive} onChange={(v) => onChange({ audioReactive: v })} />
        <Switch label="Remember last scene" checked={settings.rememberScene} onChange={(v) => onChange({ rememberScene: v })} />
        <Switch label="Keyboard shortcuts" checked={settings.keyboardShortcuts} onChange={(v) => onChange({ keyboardShortcuts: v })} />
      </div>
      {settings.keyboardShortcuts && (
        <dl className={styles.shortcuts}>
          <div>
            <dt>
              <kbd>←</kbd> <kbd>→</kbd>
            </dt>
            <dd>Previous / next scene</dd>
          </div>
          <div>
            <dt>
              <kbd>Space</kbd>
            </dt>
            <dd>Play / pause</dd>
          </div>
          <div>
            <dt>
              <kbd>M</kbd>
            </dt>
            <dd>Mute</dd>
          </div>
          <div>
            <dt>
              <kbd>Esc</kbd>
            </dt>
            <dd>Close panel</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
