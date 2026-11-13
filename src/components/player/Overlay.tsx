'use client';

import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_OVERLAY } from '@/lib/animationTokens';
import { CloseIcon } from './ControlIcons';
import styles from '@/styles/panels.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  placement: 'dock' | 'rail';
  compact: boolean;
  reduced: boolean;
  width?: number;
  children: React.ReactNode;
}

/**
 * Dark-glass popover on desktop, bottom sheet with scrim on compact screens.
 * Escape closes and returns focus to the trigger; outside pointer closes without
 * stealing focus back.
 */
export function Overlay({ open, onClose, title, placement, compact, reduced, width = 260, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current?.querySelector<HTMLElement>('button, input');
      el?.focus({ preventScroll: true });
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        restoreRef.current?.focus?.({ preventScroll: true });
        onCloseRef.current();
      }
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!panelRef.current || !target) return;
      if (panelRef.current.contains(target)) return;
      if (target.closest('[data-overlay-trigger]')) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open]);

  const dur = reduced ? 0.12 : 0.32;
  const closeBtn = (
    <button
      type="button"
      className={styles.close}
      aria-label={`Close ${title}`}
      onClick={() => {
        restoreRef.current?.focus?.({ preventScroll: true });
        onClose();
      }}
    >
      <CloseIcon />
    </button>
  );

  return (
    <AnimatePresence>
      {open && compact && (
        <motion.div
          key="scrim"
          className={styles.scrim}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur }}
          aria-hidden="true"
        />
      )}
      {open && (
        <motion.div
          key="panel"
          ref={panelRef}
          role="dialog"
          aria-modal={compact ? true : undefined}
          aria-labelledby={titleId}
          className={`${styles.panel} ${compact ? styles.sheet : placement === 'rail' ? styles.railPanel : styles.dockPanel}`}
          style={compact ? undefined : { width }}
          initial={compact ? { y: '100%' } : { opacity: 0, y: placement === 'rail' ? -8 : 10, scale: 0.98 }}
          animate={compact ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
          exit={compact ? { y: '100%' } : { opacity: 0, y: placement === 'rail' ? -6 : 8, scale: 0.98 }}
          transition={{ duration: dur, ease: EASE_OVERLAY }}
        >
          {compact && <span className={styles.grabber} aria-hidden="true" />}
          <div className={styles.panelHead}>
            <h2 id={titleId} className={styles.panelTitle}>
              {title}
            </h2>
            {closeBtn}
          </div>
          <div className={styles.panelBody}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
