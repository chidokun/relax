'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Timestamp-based countdown. Runs only while `running`; pausing freezes it, scene
 * changes don't touch it. `durationSec === null` means unlimited (counts nothing).
 */
export function useSessionTimer(durationSec: number | null, running: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState<number | null>(durationSec);
  const [started, setStarted] = useState(false);
  const remainingRef = useRef<number | null>(durationSec);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const apply = (v: number | null) => {
    remainingRef.current = v;
    setRemaining(v);
  };

  // a new preset restarts the countdown with the new length
  useEffect(() => {
    apply(durationSec);
    setStarted(false);
  }, [durationSec]);

  useEffect(() => {
    if (!running || durationSec === null) return;
    // a finished session restarts from the full length on the next Play
    if (remainingRef.current === null || remainingRef.current <= 0) apply(durationSec);
    setStarted(true);
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - last) / 1000;
      last = now;
      const cur = remainingRef.current;
      if (cur === null) return;
      const next = Math.max(0, cur - elapsed);
      apply(next);
      if (next <= 0) {
        window.clearInterval(id);
        onExpireRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, durationSec]);

  const reset = useCallback(() => {
    apply(durationSec);
    setStarted(false);
  }, [durationSec]);

  return { remaining, started, reset };
}

export function formatClock(sec: number): string {
  const s = Math.ceil(sec);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
