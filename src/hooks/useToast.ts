import { useState, useCallback } from 'react';

export type ToastSeverity = 'success' | 'error' | 'info';

export interface Toast {
  message: string;
  severity: ToastSeverity;
}

export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info') => {
    setToast({ message, severity });
    setTimeout(() => setToast(null), durationMs);
  }, [durationMs]);

  return { toast, showToast };
}
