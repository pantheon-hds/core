import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastSeverity = 'success' | 'error' | 'info';

export interface Toast {
  message: string;
  severity: ToastSeverity;
}

export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info') => {
    setToast({ message, severity });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, [durationMs]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { toast, showToast };
}
