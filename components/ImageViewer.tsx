
import React, { useState, useEffect, useCallback } from 'react';
import { GalleryItem } from '../types';
import { CloseIcon, MoveToFolderIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ImageViewerProps {
  images: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
  onMoveToFolder: (imageId: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  images, 
  initialIndex, 
  onClose, 
  onMoveToFolder 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Update index if initialIndex changes (unlikely in this flow but good practice)
  useEffect(() => {
    if (initialIndex < images.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, images.length]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]); // Dependencies for closure freshness

  const showNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, images.length]);

  const showPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Touch Handlers for Swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      showNext();
    }
    if (isRightSwipe) {
      showPrev();
    }
  };

  // If list became empty (e.g. all moved)
  if (!images[currentIndex]) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center animate-fadeIn">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button 
          onClick={onClose} 
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <CloseIcon className="w-8 h-8" />
        </button>

        <button 
          onClick={() => onMoveToFolder(currentImage.id)}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
        >
          <span className="text-sm font-medium hidden md:block">Move to Folder</span>
          <MoveToFolderIcon className="w-7 h-7" />
        </button>
      </div>

      {/* Main Image Area with Gestures */}
      <div 
        className="w-full h-full flex items-center justify-center relative touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img 
          src={currentImage.url} 
          alt="Fullscreen view" 
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />

        {/* Desktop Arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); showPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block transition-all"
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
        )}
        
        {currentIndex < images.length - 1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); showNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block transition-all"
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
        )}
      </div>

      {/* Footer / Counter */}
      <div className="absolute bottom-6 text-white/80 text-sm font-medium px-4 py-1 bg-black/30 rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};
