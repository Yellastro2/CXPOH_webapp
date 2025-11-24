import React from 'react';
import { GalleryItem, ItemType } from '../types';
import { FolderIcon } from './Icons';

interface GalleryGridProps {
  items: GalleryItem[];
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ items }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 pb-20">
      {items.map((item) => (
        <div 
          key={item.id} 
          className={`
            relative group overflow-hidden rounded-xl aspect-square shadow-sm transition-transform active:scale-95 duration-200 cursor-pointer
            ${item.type === ItemType.FOLDER ? 'bg-white flex flex-col items-center justify-center p-4' : 'bg-gray-200'}
          `}
        >
          {item.type === ItemType.FOLDER ? (
            <>
              <div className="text-blue-400 mb-2">
                <FolderIcon className="w-16 h-16 drop-shadow-sm" />
              </div>
              <span className="text-center text-sm font-medium text-gray-900 line-clamp-2 px-1 break-words w-full">
                {item.title}
              </span>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
};