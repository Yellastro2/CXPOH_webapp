
import React, { useMemo } from 'react';
import { GalleryItem } from '../types';
import { FolderIcon, CloseIcon } from './Icons';
import { STRINGS } from '../resources';

interface FolderPickerProps {
  folders: GalleryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | undefined) => void;
  disabledFolderIds?: Set<string>;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({
  folders,
  isOpen,
  onClose,
  onSelect,
  disabledFolderIds
}) => {
  const hierarchy = useMemo(() => {
    const map = new Map<string, GalleryItem[]>();

    folders.forEach(item => {
      const pid = item.parentId || 'root';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)?.push(item);
    });

    const result: { item: GalleryItem; depth: number }[] = [];

    const traverse = (pid: string, depth: number) => {
      const children = map.get(pid) || [];
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
      <div className="bg-tg-secondary-bg rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 shrink-0">
          <h3 className="text-lg font-semibold text-tg-text">{STRINGS.FOLDER_PICKER.TITLE}</h3>
          <button onClick={onClose} className="text-tg-hint hover:text-tg-text p-1">
            <CloseIcon className="w-6 h-6 text-tg-accent" />
          </button>
        </div>

        <div className="p-2 overflow-y-auto">
           <button
              onClick={() => onSelect(undefined)}
              className="flex items-center w-full p-3 rounded-xl hover:bg-tg-bg active:opacity-70 transition-colors gap-3 mb-1 group"
            >
               <div className="w-10 h-10 flex items-center justify-center bg-tg-bg rounded-lg text-tg-hint shrink-0 border border-tg-separator/10">
                  <div className="w-4 h-4 border-2 border-dashed border-current rounded-sm" />
               </div>
               <span className="text-sm font-medium text-tg-text">{STRINGS.FOLDER_PICKER.ROOT_OPTION}</span>
            </button>

            {hierarchy.map(({ item, depth }) => {
              const isDisabled = disabledFolderIds?.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && onSelect(item.id)}
                  disabled={isDisabled}
                  className={`flex items-center w-full p-2 rounded-xl transition-colors gap-3 my-0.5
                    ${isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-tg-bg active:opacity-70 cursor-pointer'
                    }
                  `}
                  style={{ paddingLeft: `${8 + depth * 24}px` }}
                >
                  <div className="shrink-0 text-tg-accent">
                     <FolderIcon className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium text-tg-text truncate">
                    {item.title}
                  </span>
                </button>
              );
            })}

            {folders.length === 0 && (
               <div className="text-center py-8 text-tg-hint text-sm">
                 {STRINGS.FOLDER_PICKER.EMPTY}
               </div>
            )}
        </div>
      </div>
    </div>
  );
};
