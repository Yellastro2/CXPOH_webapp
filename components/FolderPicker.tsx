
import React from 'react';
import { GalleryItem, ItemType } from '../types';
import { FolderIcon, CloseIcon } from './Icons';

interface FolderPickerProps {
  folders: GalleryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | undefined) => void;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({ folders, isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-tg-bg rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-tg-header border-b border-tg-separator">
          <h3 className="text-lg font-semibold text-gray-900">Select Folder</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Grid Content */}
        <div className="p-4 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-3 gap-3">
             {/* Option to move to Root */}
             <button
                onClick={() => onSelect(undefined)}
                className="flex flex-col items-center p-3 rounded-xl bg-white active:bg-blue-50 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100"
              >
                <div className="text-gray-400 mb-2 p-2 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="w-6 h-6 bg-gray-300 rounded-sm" />
                </div>
                <span className="text-xs font-medium text-center text-gray-900 w-full">
                  Main Gallery
                </span>
              </button>

            {folders.length === 0 ? (
               null
            ) : (
              folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => onSelect(folder.id)}
                  className="flex flex-col items-center p-3 rounded-xl bg-white active:bg-blue-50 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100"
                >
                  <div className="text-blue-400 mb-2">
                    <FolderIcon className="w-10 h-10" />
                  </div>
                  <span className="text-xs font-medium text-center text-gray-900 line-clamp-2 w-full break-words">
                    {folder.title}
                  </span>
                </button>
              ))
            )}
          </div>
          {folders.length === 0 && (
            <div className="text-center py-4 text-tg-hint text-sm">
              Only "Main Gallery" available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
