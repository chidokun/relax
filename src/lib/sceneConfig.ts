import type { SceneConfig, SceneId, SessionMode, UserPrefs } from '@/types/scene';

/** Prefix for runtime-fetched public assets (GitHub Pages serves the app under /<repo>). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const audio = (file: string) => `${BASE_PATH}/audio/${file}`;

/**
 * Carousel ring order: right of Solar is Breeze, then Bloom, then Ember, then back to Solar.
 * Audio paths are a convention — drop licensed loops into /public/audio (see README).
 */
export const SCENES: readonly SceneConfig[] = [
  {
    id: 'solar',
    index: 0,
    title: 'Solar',
    caption: 'SUN · VITALITY',
    visualEffect: 'rays',
    palette: {
      ambient: '#170D04',
      highlight: '#FFF3B6',
      core: '#FFCC43',
      secondary: '#E99C2B',
      top: '#C6E4BC',
      bottom: '#DD855B',
    },
    cardBlobs: ['#F2A189', '#C9E88C', '#F4B24E'],
    sideTint: '#6E1B0F',
    audioSrc: audio('solar.mp3'),
  },
  {
    id: 'breeze',
    index: 1,
    title: 'Breeze',
    caption: 'AIR · CLARITY',
    visualEffect: 'wind',
    palette: {
      ambient: '#031A16',
      highlight: '#B5FFF1',
      core: '#22D9B9',
      secondary: '#0E998D',
      top: '#ACE8E8',
      bottom: '#24BC90',
    },
    cardBlobs: ['#9FD8F0', '#4FD9A8', '#C8F5D8'],
    sideTint: '#0E4A2A',
    audioSrc: audio('breeze.mp3'),
  },
  {
    id: 'bloom',
    index: 2,
    title: 'Bloom',
    caption: 'HEART · WARMTH',
    visualEffect: 'lotus',
    palette: {
      ambient: '#1C0617',
      highlight: '#FFE1EE',
      core: '#FF58A6',
      secondary: '#DC269C',
      top: '#DA79B7',
      bottom: '#C51D77',
    },
    cardBlobs: ['#B784E6', '#FF8DC4', '#E04F9E'],
    sideTint: '#5E0E24',
    audioSrc: audio('bloom.mp3'),
  },
  {
    id: 'ember',
    index: 3,
    title: 'Ember',
    caption: 'FIRE · COURAGE',
    visualEffect: 'flame',
    palette: {
      ambient: '#1B0506',
      highlight: '#FFF0B7',
      core: '#FF6B28',
      secondary: '#D31C22',
      top: '#A65AB0',
      bottom: '#DF395B',
    },
    cardBlobs: ['#B65FD6', '#F2A03A', '#FF5A4A'],
    sideTint: '#640B10',
    audioSrc: audio('ember.mp3'),
  },
] as const;

export const SCENE_COUNT = SCENES.length;

export function sceneById(id: SceneId): SceneConfig {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

export const MODES: readonly { id: SessionMode; label: string; description: string; suggestedMin: number }[] = [
  { id: 'focus', label: 'Focus', description: 'Steady background for deep work.', suggestedMin: 25 },
  { id: 'relax', label: 'Relax', description: 'Unhurried listening to unwind.', suggestedMin: 45 },
  { id: 'sleep', label: 'Sleep', description: 'Low-key session to wind down.', suggestedMin: 60 },
];

export const DURATION_PRESETS: readonly { label: string; sec: number | null }[] = [
  { label: '15', sec: 15 * 60 },
  { label: '25', sec: 25 * 60 },
  { label: '45', sec: 45 * 60 },
  { label: '60', sec: 60 * 60 },
  { label: '∞', sec: null },
];

export const DEFAULT_PREFS: UserPrefs = {
  sceneId: 'solar',
  mode: 'focus',
  volume: 0.65,
  muted: false,
  durationSec: 25 * 60,
  settings: {
    reducedMotion: 'system',
    lowerQuality: false,
    audioReactive: true,
    rememberScene: true,
    keyboardShortcuts: true,
  },
};
