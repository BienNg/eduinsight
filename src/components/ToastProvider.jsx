// src/components/ToastProvider.jsx
import { Toaster } from 'sonner';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontSize: '14px',
        },
        className: 'custom-toast',
        success: {
          style: {
            backgroundColor: '#ecfdf5',
            borderLeft: '4px solid #10b981',
            color: '#064e3b',
          },
        },
        error: {
          style: {
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            color: '#7f1d1d',
          },
        },
        loading: {
          style: {
            backgroundColor: '#f5f5f5',
            borderLeft: '4px solid #3b82f6',
            color: '#1e3a8a',
          },
        },
      }}
      closeButton
      richColors
      expand
    />
  );
};

export default ToastProvider;