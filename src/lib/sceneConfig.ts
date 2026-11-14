import type { SceneConfig, SceneId, SessionMode, UserPrefs } from '@/types/scene';

/**
 * Relative to the page, so audio resolves under whatever path the site is served from
 * ("/" on a custom domain, "/<repo>/" on <user>.github.io).
 */
const audio = (file: string) => `./audio/${file}`;

/**
 * Carousel ring order: right of Solar is Breeze, then Bloom, then Ember, then Night, then Rain,
 * then Forest, then Beach, then Universe, then Dream, then Bird, then Morning, then back to Solar
 * (dusk → night → pre-dawn rain → misty forest → sunrise over the sea → deep space → dreams →
 * a rainbow at waking → a pastel dawn → full sun).
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
  {
    id: 'night',
    index: 4,
    title: 'Night',
    caption: 'MOON · STILLNESS',
    visualEffect: 'aurora',
    palette: {
      ambient: '#0D0820',
      highlight: '#EDE6FF',
      core: '#9C7CFF',
      secondary: '#5B3FD6',
      top: '#8E9CF2',
      bottom: '#7442D0',
    },
    cardBlobs: ['#7F8EF2', '#C6A2FF', '#4E35B8'],
    sideTint: '#2B1462',
    audioSrc: audio('night.mp3'),
  },
  {
    id: 'rain',
    index: 5,
    title: 'Rain',
    caption: 'WATER · RENEWAL',
    visualEffect: 'rain',
    palette: {
      ambient: '#020A1C',
      highlight: '#D6E8FF',
      core: '#3B7BFF',
      secondary: '#1640C8',
      top: '#4A78E0',
      bottom: '#0D2A8C',
    },
    cardBlobs: ['#2F5BD6', '#6FA8FF', '#0A2478'],
    sideTint: '#06194F',
    audioSrc: audio('rain.mp3'),
  },
  {
    id: 'forest',
    index: 6,
    title: 'Forest',
    caption: 'WOOD · GROUNDING',
    visualEffect: 'canopy',
    palette: {
      ambient: '#04140A',
      highlight: '#D9FFC8',
      core: '#3DBE5C',
      secondary: '#14713A',
      top: '#3E8F55',
      bottom: '#0B4421',
    },
    cardBlobs: ['#6FBF5E', '#1E7A44', '#B8E07A'],
    sideTint: '#0B3A1C',
    audioSrc: audio('forest.mp3'),
  },
  {
    id: 'beach',
    index: 7,
    title: 'Beach',
    caption: 'SEA · FREEDOM',
    visualEffect: 'shore',
    palette: {
      ambient: '#04121F',
      highlight: '#FFF4D2',
      core: '#2E9BEA',
      secondary: '#135FB0',
      top: '#2F8FE0',
      bottom: '#E4A94A',
    },
    cardBlobs: ['#7FD3FF', '#F6D27A', '#1B6FC8'],
    sideTint: '#6B4410',
    audioSrc: audio('beach.mp3'),
  },
  {
    id: 'universe',
    index: 8,
    title: 'Universe',
    caption: 'COSMOS · WONDER',
    visualEffect: 'galaxy',
    palette: {
      ambient: '#060318',
      highlight: '#E6F4FF',
      core: '#45C8FF',
      secondary: '#5A22C8',
      top: '#38D6F5',
      bottom: '#7A2BD9',
    },
    cardBlobs: ['#FF6FD8', '#3AE0FF', '#6B3CFF'],
    sideTint: '#2A0E5C',
    audioSrc: audio('universe.mp3'),
  },
  {
    id: 'dream',
    index: 9,
    title: 'Dream',
    caption: 'SLEEP · REST',
    visualEffect: 'breath',
    palette: {
      ambient: '#070A16',
      highlight: '#F3EAFF',
      core: '#8FA8E8',
      secondary: '#3E4C8C',
      top: '#7D8FD6',
      bottom: '#E3A99A',
    },
    cardBlobs: ['#B9A6F0', '#F5C2B0', '#5D6FC2'],
    sideTint: '#2A2350',
    audioSrc: audio('dream.mp3'),
  },
  {
    id: 'bird',
    index: 10,
    title: 'Bird',
    caption: 'WINGS · JOY',
    visualEffect: 'flock',
    palette: {
      ambient: '#0B0716',
      highlight: '#FFF8F0',
      core: '#FFB547',
      secondary: '#7C4DFF',
      top: '#8B5CF6',
      bottom: '#FF6B3D',
    },
    cardBlobs: ['#FFD93B', '#38D97A', '#3B9BFF'],
    sideTint: '#4A1D5E',
    audioSrc: audio('bird.mp3'),
  },
  {
    id: 'morning',
    index: 11,
    title: 'Morning',
    caption: 'DAWN · HOPE',
    visualEffect: 'dawn',
    palette: {
      ambient: '#140C12',
      highlight: '#FFF6E8',
      core: '#FFB38A',
      secondary: '#F07FA0',
      top: '#A9D4F5',
      bottom: '#FFB27F',
    },
    cardBlobs: ['#F6A6C1', '#FFE0A8', '#B9DDF7'],
    sideTint: '#5C2A3C',
    audioSrc: audio('morning.mp3'),
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
