export type SceneId = 'solar' | 'breeze' | 'bloom' | 'ember' | 'night' | 'rain';
export type SessionMode = 'focus' | 'relax' | 'sleep';
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type QualityTier = 'high' | 'medium' | 'low' | 'static';
export type OverlayId = 'none' | 'timer' | 'volume' | 'settings' | 'mode';
export type ReducedMotionPref = 'system' | 'on' | 'off';

export interface ScenePalette {
  ambient: string;
  highlight: string;
  core: string;
  secondary: string;
  top: string;
  bottom: string;
}

export interface SceneConfig {
  id: SceneId;
  /** Position in the carousel ring (Solar → Breeze → Bloom → Ember → Night → Rain → Solar). */
  index: number;
  title: string;
  caption: string;
  palette: ScenePalette;
  /** Extra colour blobs that drift inside the active pill body. */
  cardBlobs: [string, string, string];
  /** Hue that the bottom of the dark (inactive) pill fades into. */
  sideTint: string;
  visualEffect: 'rays' | 'wind' | 'lotus' | 'flame' | 'aurora' | 'rain';
  /** Public URL of the looping soundscape. Missing file => honest "unavailable" state. */
  audioSrc?: string;
}

export interface UserSettings {
  reducedMotion: ReducedMotionPref;
  lowerQuality: boolean;
  audioReactive: boolean;
  rememberScene: boolean;
  keyboardShortcuts: boolean;
}

export interface UserPrefs {
  sceneId: SceneId;
  mode: SessionMode;
  volume: number;
  muted: boolean;
  /** Session length in seconds; null = unlimited. */
  durationSec: number | null;
  settings: UserSettings;
}

export interface StageLayout {
  width: number;
  height: number;
  pillW: number;
  pillH: number;
  /** Distance between the active pill centre and a side pill centre. */
  gap: number;
  cx: number;
  cy: number;
  floorY: number;
  /** pillW / 184 — scales scene FX designed at the 1086×804 baseline. */
  scale: number;
  compact: boolean;
}
