
import React from 'react';
import { STRINGS } from '../resources';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div 
        className="bg-tg-secondary-bg rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden transform transition-all" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold text-tg-text mb-2">{title}</h3>
          <p className="text-sm text-tg-hint mb-8">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 text-tg-text font-medium bg-tg-bg hover:opacity-80 rounded-xl active:scale-95 transition-all"
            >
              {STRINGS.MODAL_CONFIRM_DELETE_FILE.BUTTON_CANCEL}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 text-white font-medium bg-tg-destructive hover:opacity-90 rounded-xl active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center shadow-lg shadow-red-900/20"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  STRINGS.MODAL_CONFIRM_DELETE_FILE.BUTTON_DELETE
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
