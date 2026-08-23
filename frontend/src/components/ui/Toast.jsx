import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1E293B',
          color: '#F8FAFC',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          style: { borderLeft: '4px solid #16A34A' },
        },
        error: {
          style: { borderLeft: '4px solid #DC2626' },
        },
        loading: {
          style: { borderLeft: '4px solid #D97706' },
        },
      }}
    />
  );
}
