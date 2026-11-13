'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CloseIcon } from './ControlIcons';
import styles from '@/styles/panels.module.css';

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error';
  action?: { label: string; run: () => void };
}

export function useToasts() {
  const [toast, setToast] = useState<Toast | null>(null);
  const seq = useRef(0);
  const show = useCallback((t: Omit<Toast, 'id'>) => setToast({ ...t, id: ++seq.current }), []);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, show, dismiss };
}

export function ToastLayer({ toast, onDismiss }: { toast: Toast | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onDismiss, toast.tone === 'error' ? 7000 : 4500);
    return () => window.clearTimeout(id);
  }, [toast, onDismiss]);

  return (
    <div className={styles.toastLayer} role={toast?.tone === 'error' ? 'alert' : 'status'} aria-live={toast?.tone === 'error' ? 'assertive' : 'polite'}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={styles.toast}
            data-tone={toast.tone}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.3 } }}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className={styles.toastAction}
                onClick={() => {
                  toast.action?.run();
                  onDismiss();
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className={styles.toastClose} aria-label="Dismiss" onClick={onDismiss}>
              <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
