'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Desktop: dock shows for ~3s on load, then dims; pointer within 120px of the bottom
 * (or over the dock / keyboard focus inside / an open overlay) reveals it; it dims again
 * 1.8s after the pointer leaves. The rail mirrors this for the top 90px.
 * Touch / compact: always visible.
 */
export function useDockVisibility(alwaysOn: boolean, hold: boolean) {
  const [dockNear, setDockNear] = useState(true);
  const [railNear, setRailNear] = useState(false);
  const hovering = useRef(false);
  const focused = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!hovering.current && !focused.current) setDockNear(false);
    }, 1800);
  }, []);

  useEffect(() => {
    const intro = setTimeout(() => {
      if (!hovering.current && !focused.current) setDockNear(false);
    }, 3000);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const nearBottom = window.innerHeight - e.clientY < 120;
      if (nearBottom) {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setDockNear(true);
      } else {
        scheduleHide();
      }
      setRailNear(e.clientY < 90);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      clearTimeout(intro);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      window.removeEventListener('pointermove', onMove);
    };
  }, [scheduleHide]);

  const handlers = {
    onPointerEnter: () => {
      hovering.current = true;
      setDockNear(true);
    },
    onPointerLeave: () => {
      hovering.current = false;
      scheduleHide();
    },
    onFocus: () => {
      focused.current = true;
      setDockNear(true);
    },
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        focused.current = false;
        scheduleHide();
      }
    },
  };

  return { dockVisible: alwaysOn || hold || dockNear, railVisible: alwaysOn || railNear, handlers };
}
