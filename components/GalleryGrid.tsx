
import React from 'react';
import { GalleryItem, ItemType } from '../types';
import { FolderIcon, PlayIcon, CircleIcon, CheckCircleSolidIcon } from './Icons';

interface GalleryGridProps {
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  items,
  onItemClick,
  isSelectionMode,
  selectedIds,
  onToggleSelection
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 pb-20">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);

        return (
          <div
            key={item.id}
            onClick={() => {
              if (isSelectionMode) {
                onToggleSelection(item.id);
              } else {
                onItemClick(item);
              }
            }}
            className={`
              relative group overflow-hidden rounded-xl aspect-square shadow-sm transition-transform active:scale-95 duration-200 cursor-pointer
              ${item.type === ItemType.FOLDER
                ? 'bg-tg-secondary-bg flex flex-col items-center justify-center p-4'
                : 'bg-tg-secondary-bg'}
              ${isSelected ? 'ring-4 ring-tg-button ring-inset' : ''}
            `}
          >
            {/* Selection Checkbox (Visible on hover or always in selection mode) */}
            <div
              className={`absolute top-2 right-2 z-20 ${!isSelectionMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(item.id);
              }}
            >
              {isSelected ? (
                <CheckCircleSolidIcon className="w-7 h-7 text-tg-button bg-white rounded-full" />
              ) : (
                <CircleIcon className="w-7 h-7 text-tg-button drop-shadow-md" />
              )}
            </div>

            {item.type === ItemType.FOLDER ? (
              <>
                <div className="text-tg-accent mb-2">
                  <FolderIcon className="w-16 h-16 drop-shadow-sm " />
                </div>
                <span className="text-center text-sm font-medium text-tg-text line-clamp-2 px-1 break-words w-full">
                  {item.title}
                </span>
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-tg-button opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            ) : (
              <div className="w-full h-full relative">
                 <img
                  src={item.url}
                  alt="Gallery item"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-black/0 ${isSelectionMode ? '' : 'hover:bg-black/10'} transition-colors`} />

                {item.type === ItemType.VIDEO && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="bg-black/30 rounded-full p-2 backdrop-blur-[2px]">
                          <PlayIcon className="w-8 h-8 text-white opacity-90" />
                       </div>
                   </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
