import React, { useState, useEffect, useRef } from 'react';
import type { Toast as ToastType } from '../../hooks/useToast';
import './Toast.css';

interface ToastProps {
  toast: ToastType | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const [localToast, setLocalToast] = useState<ToastType | null>(null);
  const [closing, setClosing] = useState(false);
  const wasShowingRef = useRef(false);

  useEffect(() => {
    if (toast) {
      wasShowingRef.current = true;
      setLocalToast(toast);
      setClosing(false);
    } else if (wasShowingRef.current) {
      wasShowingRef.current = false;
      setClosing(true);
      const t = setTimeout(() => setLocalToast(null), 200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!localToast) return null;
  return (
    <div className={`toast toast--${localToast.severity}${closing ? ' toast--closing' : ''}`} role="alert">
      {localToast.message}
    </div>
  );
};
