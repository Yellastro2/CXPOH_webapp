
import React from 'react';
import { STRINGS } from '../resources';

interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteOnly: () => void;
  onDeleteAll: () => void;
  isLoading: boolean;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  isOpen,
  onClose,
  onDeleteOnly,
  onDeleteAll,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-tg-secondary-bg rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold text-tg-text mb-2">{STRINGS.MODAL_DELETE_FOLDER.TITLE}</h3>
          <p className="text-sm text-tg-hint mb-6">
            {STRINGS.MODAL_DELETE_FOLDER.MESSAGE}
          </p>
          
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onDeleteOnly}
              disabled={isLoading}
              className="w-full py-3 px-4 text-tg-button-text font-medium bg-tg-button hover:opacity-90 rounded-xl active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center shadow-md shadow-blue-900/20"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  STRINGS.MODAL_DELETE_FOLDER.BUTTON_DELETE_ONLY
              )}
            </button>

            <button
              onClick={onDeleteAll}
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-medium bg-tg-destructive hover:opacity-90 rounded-xl active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center shadow-md shadow-red-900/20"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  STRINGS.MODAL_DELETE_FOLDER.BUTTON_DELETE_ALL
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3 px-4 text-tg-text font-medium bg-tg-bg hover:opacity-80 rounded-xl active:scale-95 transition-all"
            >
              {STRINGS.MODAL_DELETE_FOLDER.BUTTON_CANCEL}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
