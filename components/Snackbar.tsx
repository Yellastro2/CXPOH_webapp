
import React, { useEffect } from 'react';

interface SnackbarProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  isOpen,
  message,
  type,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
      <div className={`px-4 py-2 rounded-full shadow-lg text-white font-medium text-sm flex items-center gap-2 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {type === 'success' ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
           </svg>
        ) : (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008h-.008v-.008Z" />
           </svg>
        )}
        {message}
      </div>
    </div>
  );
};
