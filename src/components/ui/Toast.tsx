import React from 'react';
import type { Toast as ToastType } from '../../hooks/useToast';
import './Toast.css';

interface ToastProps {
  toast: ToastType | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.severity}`} role="alert">
      {toast.message}
    </div>
  );
};
