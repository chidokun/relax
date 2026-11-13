'use client';

import type { OverlayId, PlaybackStatus } from '@/types/scene';
import { formatClock } from '@/hooks/useSessionTimer';
import { InfinityIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, SettingsIcon, TimerIcon, VolumeIcon } from './ControlIcons';
import styles from '@/styles/player-dock.module.css';

interface Props {
  status: PlaybackStatus;
  sceneTitle: string;
  modeLabel: string;
  remaining: number | null;
  durationSec: number | null;
  volume: number;
  muted: boolean;
  overlay: OverlayId;
  visible: boolean;
  tiny: boolean;
  wide: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOverlay: (o: OverlayId) => void;
  dockHandlers: {
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    onFocus: () => void;
    onBlur: (e: React.FocusEvent) => void;
  };
}

function IconButton({
  label,
  onClick,
  children,
  expanded,
  overlayTrigger,
  tip = true,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  expanded?: boolean;
  overlayTrigger?: boolean;
  tip?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.iconBtn}
      aria-label={label}
      data-tip={tip ? label : undefined}
      aria-expanded={overlayTrigger ? expanded : undefined}
      aria-haspopup={overlayTrigger ? 'dialog' : undefined}
      data-overlay-trigger={overlayTrigger ? '' : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function PlayerDock(props: Props) {
  const { status, remaining, durationSec, overlay, visible, tiny, wide, volume, muted } = props;
  const playing = status === 'playing';
  const loading = status === 'loading';
  const toggleOverlay = (o: OverlayId) => props.onOverlay(overlay === o ? 'none' : o);
  const nearEnd = remaining !== null && remaining < 60 && remaining > 0;
  const timerLabel =
    durationSec === null ? 'Session length: unlimited' : `Session timer ${formatClock(remaining ?? durationSec)} remaining`;

  return (
    <div className={styles.wrap} data-visible={visible}>
      <div className={styles.dock} role="toolbar" aria-label="Player controls" {...props.dockHandlers}>
        {!tiny && (
          <IconButton label="Previous scene" onClick={props.onPrev}>
            <PrevIcon />
          </IconButton>
        )}
        <button
          type="button"
          className={styles.play}
          data-status={status}
          aria-label={playing || loading ? 'Pause ambient sound' : 'Play ambient sound'}
          aria-busy={loading || undefined}
          onClick={props.onToggle}
        >
          {loading && <span className={styles.spinner} aria-hidden="true" />}
          <span className={styles.playGlyph}>{playing || loading ? <PauseIcon /> : <PlayIcon />}</span>
        </button>
        {!tiny && (
          <IconButton label="Next scene" onClick={props.onNext}>
            <NextIcon />
          </IconButton>
        )}
        {wide && (
          <span className={styles.meta} aria-hidden="true">
            <span className={styles.metaTitle}>{props.sceneTitle}</span>
            <span className={styles.metaSub}>{props.modeLabel}</span>
          </span>
        )}
        <span className={styles.sep} aria-hidden="true" />
        <button
          type="button"
          className={styles.timerBtn}
          data-near-end={nearEnd}
          aria-label={timerLabel}
          data-tip="Session"
          aria-expanded={overlay === 'timer'}
          aria-haspopup="dialog"
          data-overlay-trigger=""
          onClick={() => toggleOverlay('timer')}
        >
          {durationSec === null ? (
            <InfinityIcon />
          ) : (
            <>
              <TimerIcon />
              <span className={styles.clock}>{formatClock(remaining ?? durationSec)}</span>
            </>
          )}
        </button>
        <IconButton label="Volume" onClick={() => toggleOverlay('volume')} expanded={overlay === 'volume'} overlayTrigger>
          <VolumeIcon level={volume} muted={muted} />
        </IconButton>
        <IconButton label="Settings" onClick={() => toggleOverlay('settings')} expanded={overlay === 'settings'} overlayTrigger>
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );
}
