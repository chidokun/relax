'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserPrefs } from '@/types/scene';
import { DEFAULT_PREFS, SCENES } from '@/lib/sceneConfig';

const KEY = 'relax:prefs:v1';
/** Key used before the app was renamed from AURA; read once so saved prefs carry over. */
const LEGACY_KEY = 'aura:prefs:v1';

function sanitize(raw: unknown): UserPrefs {
  const p = { ...DEFAULT_PREFS, settings: { ...DEFAULT_PREFS.settings } };
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Partial<UserPrefs>;
  if (r.sceneId && SCENES.some((s) => s.id === r.sceneId)) p.sceneId = r.sceneId;
  if (r.mode === 'focus' || r.mode === 'relax' || r.mode === 'sleep') p.mode = r.mode;
  if (typeof r.volume === 'number' && r.volume >= 0 && r.volume <= 1) p.volume = r.volume;
  if (typeof r.muted === 'boolean') p.muted = r.muted;
  if (r.durationSec === null || (typeof r.durationSec === 'number' && r.durationSec > 0)) p.durationSec = r.durationSec;
  if (r.settings && typeof r.settings === 'object') {
    const s = r.settings;
    if (s.reducedMotion === 'system' || s.reducedMotion === 'on' || s.reducedMotion === 'off') p.settings.reducedMotion = s.reducedMotion;
    for (const k of ['lowerQuality', 'audioReactive', 'rememberScene', 'keyboardShortcuts'] as const) {
      if (typeof s[k] === 'boolean') p.settings[k] = s[k];
    }
  }
  return p;
}

/** localStorage-backed preferences; loaded after mount to keep SSR markup deterministic. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (raw) setPrefs(sanitize(JSON.parse(raw)));
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* private mode / corrupted value: keep defaults */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(prefs));
      } catch {
        /* storage full / disabled */
      }
    }, 250);
  }, [prefs, loaded]);

  const update = useCallback((patch: Partial<UserPrefs> | ((p: UserPrefs) => Partial<UserPrefs>)) => {
    setPrefs((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }));
  }, []);

  return { prefs, update, loaded };
}
