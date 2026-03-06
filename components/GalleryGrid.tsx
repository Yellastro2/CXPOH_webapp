
import React from 'react';
import { GalleryItem, ItemType } from '../types';
import { FolderIcon, PlayIcon, CircleIcon, CheckCircleSolidIcon, MusicalNoteIcon, DocumentIcon } from './Icons';

interface GalleryGridProps {
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
}

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const mStr = m < 10 && h > 0 ? `0${m}` : `${m}`;
  const sStr = s < 10 ? `0${s}` : `${s}`;

  if (h > 0) {
    return `${h}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
};

const formatSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
            ) : item.type === ItemType.AUDIO ? (
              <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-2 text-center">
                 <MusicalNoteIcon className="w-10 h-10 text-white/50 mb-2" />
                 <div className="flex flex-col gap-0.5 w-full">
                    <span className="text-white text-xs font-bold line-clamp-1 break-all px-1">
                        {item.title || item.id}
                    </span>
                    {item.artist && (
                        <span className="text-white/70 text-xs line-clamp-1 break-all px-1">
                            {item.artist}
                        </span>
                    )}
                 </div>
                 {/* Duration Badge */}
                 {item.durationSeconds !== undefined && item.durationSeconds > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm font-mono">
                        {formatDuration(item.durationSeconds)}
                    </div>
                 )}
              </div>
            ) : item.type === ItemType.DOCUMENT ? (
              <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 p-2 text-center">
                 <DocumentIcon className="w-10 h-10 text-white/50 mb-2" />
                 <div className="flex flex-col gap-0.5 w-full">
                    <span className="text-white text-xs font-bold line-clamp-2 break-all px-1">
                        {item.title || item.id}
                    </span>
                 </div>
                 {/* Size Badge */}
                 {item.sizeBytes !== undefined && item.sizeBytes > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm font-mono">
                        {formatSize(item.sizeBytes)}
                    </div>
                 )}
              </div>
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
                   <>
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="bg-black/30 rounded-full p-2 backdrop-blur-[2px]">
                              <PlayIcon className="w-8 h-8 text-white opacity-90" />
                           </div>
                       </div>
                       {/* Duration Badge */}
                       {item.durationSeconds !== undefined && item.durationSeconds > 0 && (
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm font-mono">
                                {formatDuration(item.durationSeconds)}
                            </div>
                       )}
                   </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
