
import React from 'react';
import { STRINGS } from '../resources';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden transform transition-all" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-8">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-white font-medium bg-tg-button hover:bg-blue-600 rounded-xl active:scale-95 transition-all shadow-md"
            >
              {STRINGS.MODAL_ALERT_SIZE.BUTTON_OK}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
