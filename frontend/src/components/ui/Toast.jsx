import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(30, 41, 59, 0.85)',
          color: '#F8FAFC',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 18px',
        },
        success: {
          iconTheme: {
            primary: '#16A34A',
            secondary: '#FFFFFF',
          },
          style: {
            borderLeft: '4px solid #16A34A',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC2626',
            secondary: '#FFFFFF',
          },
          style: {
            borderLeft: '4px solid #DC2626',
          },
        },
      }}
    />
  );
};

export const notify = {
  success: (msg, opts) => toast.success(msg, opts),
  error: (msg, opts) => toast.error(msg, opts),
  warning: (msg, opts) => toast(msg, { icon: '⚠️', ...opts }),
  info: (msg, opts) => toast(msg, { icon: 'ℹ️', ...opts }),
};

export default ToastProvider;
