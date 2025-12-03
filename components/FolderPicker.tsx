
import React, { useMemo } from 'react';
import { GalleryItem } from '../types';
import { FolderIcon, CloseIcon } from './Icons';

interface FolderPickerProps {
  folders: GalleryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | undefined) => void;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({ folders, isOpen, onClose, onSelect }) => {
  // Build a flat list with depth information for rendering a tree structure
  const hierarchy = useMemo(() => {
    const map = new Map<string, GalleryItem[]>();

    // Group items by parentId
    folders.forEach(item => {
      const pid = item.parentId || 'root';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)?.push(item);
    });

    const result: { item: GalleryItem; depth: number }[] = [];

    // Recursive traversal to build order
    const traverse = (pid: string, depth: number) => {
      const children = map.get(pid) || [];
      // Sort alphabetically for cleaner tree
      children.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

      children.forEach(child => {
        result.push({ item: child, depth });
        traverse(child.id, depth + 1);
      });
    };

    traverse('root', 0);
    return result;
  }, [folders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-tg-bg rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-tg-header border-b border-tg-separator shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Select Folder</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1">
            <CloseIcon className="w-6 h-6 text-tg-link" />
          </button>
        </div>

        {/* Content - Hierarchical List */}
        <div className="p-2 overflow-y-auto">
           {/* Option to move to Root (Main Gallery) */}
           <button
              onClick={() => onSelect(undefined)}
              className="flex items-center w-full p-3 rounded-xl hover:bg-white active:bg-blue-50 transition-colors gap-3 mb-1"
            >
               <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-lg text-gray-500 shrink-0">
                  <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded-sm" />
               </div>
               <span className="text-sm font-medium text-gray-900">Main Gallery</span>
            </button>

            {/* Folder Tree */}
            {hierarchy.map(({ item, depth }) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="flex items-center w-full p-2 rounded-xl hover:bg-white active:bg-blue-50 transition-colors gap-3 my-0.5"
                style={{ paddingLeft: `${8 + depth * 24}px` }}
              >
                <div className="shrink-0 text-blue-400">
                   <FolderIcon className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {item.title}
                </span>
              </button>
            ))}

            {folders.length === 0 && (
               <div className="text-center py-8 text-tg-hint text-sm">
                 No folders created yet.
               </div>
            )}
        </div>
      </div>
    </div>
  );
};
