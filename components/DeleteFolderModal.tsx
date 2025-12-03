
import React from 'react';

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Folder</h3>
          <p className="text-sm text-gray-500 mb-6">
            How do you want to proceed with the files inside this folder?
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onDeleteOnly}
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-medium bg-tg-button hover:bg-blue-600 rounded-xl active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center shadow-md shadow-blue-100"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  "Delete folder, move files to root"
              )}
            </button>

            <button
              onClick={onDeleteAll}
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-medium bg-red-500 hover:bg-red-600 rounded-xl active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center shadow-md shadow-red-200"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  "Delete folder and all content"
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3 px-4 text-gray-900 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
