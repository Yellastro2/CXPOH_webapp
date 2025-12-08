
import React from 'react';
import { GalleryItem, ItemType } from '../types';
import { FolderIcon, PlayIcon } from './Icons';

interface GalleryGridProps {
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ items, onItemClick }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 pb-20">
      {items.map((item) => (
        <div 
          key={item.id} 
          onClick={() => onItemClick(item)}
          className={`
            relative group overflow-hidden rounded-xl aspect-square shadow-sm transition-transform active:scale-95 duration-200 cursor-pointer
            ${item.type === ItemType.FOLDER 
              ? 'bg-tg-secondary-bg flex flex-col items-center justify-center p-4'
              : 'bg-tg-secondary-bg'}
          `}
        >
          {item.type === ItemType.FOLDER ? (
            <>
              <div className="text-tg-link mb-2">
                <FolderIcon className="w-16 h-16 drop-shadow-sm" />
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
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              
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
      ))}
    </div>
  );
};
