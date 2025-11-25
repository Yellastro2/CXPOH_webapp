
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Swipe Logic State
  const [diff, setDiff] = useState(0); // Pixel offset during drag
  const [isDragging, setIsDragging] = useState(false); // User is physically dragging
  const [isAnimating, setIsAnimating] = useState(false); // Automatic slide animation in progress
  const [isResetting, setIsResetting] = useState(false); // Instant reset state (no transition)

  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update index if initialIndex changes externally
  useEffect(() => {
    if (initialIndex < images.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, images.length]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') slideTo('prev');
      if (e.key === 'ArrowRight') slideTo('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, isAnimating]);

  const slideTo = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    // Check bounds
    if (direction === 'prev' && currentIndex === 0) return;
    if (direction === 'next' && currentIndex === images.length - 1) return;

    setIsAnimating(true);
    
    // 1. Determine target offset (width of screen)
    const screenWidth = window.innerWidth;
    const targetDiff = direction === 'next' ? -screenWidth : screenWidth;

    // 2. Animate to that offset
    setDiff(targetDiff);

    // 3. After animation, update index and reset offset silently
    setTimeout(() => {
      // Disable transition immediately to prevent "sliding back" visual
      setIsResetting(true);

      // Update logical state
      setCurrentIndex(prev => direction === 'next' ? prev + 1 : prev - 1);
      setDiff(0);
      
      setIsDragging(false);
      setIsAnimating(false);

      // Re-enable transition after DOM update is flushed
      requestAnimationFrame(() => {
        setTimeout(() => {
             setIsResetting(false);
        }, 50);
      });
    }, 300); // Match CSS transition duration
  }, [currentIndex, images.length, isAnimating]);


  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDiff(0);
    // Ensure transition is enabled for dragging (it is disabled by isDragging=true usually, but checking logic below)
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || isAnimating) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX.current;
    
    // Resistance at edges
    if ((currentIndex === 0 && delta > 0) || (currentIndex === images.length - 1 && delta < 0)) {
        setDiff(delta * 0.3);
    } else {
        setDiff(delta);
    }
  };

  const onTouchEnd = () => {
    if (isAnimating) return;
    setIsDragging(false);
    touchStartX.current = null;

    const threshold = window.innerWidth * 0.25; // Swipe at least 25% of screen

    if (diff > threshold && currentIndex > 0) {
      slideTo('prev');
    } else if (diff < -threshold && currentIndex < images.length - 1) {
      slideTo('next');
    } else {
      // Snap back (animate back to 0)
      setDiff(0);
    }
  };

  // Render Helpers
  const currentImage = images[currentIndex];
  const prevImage = images[currentIndex - 1];
  const nextImage = images[currentIndex + 1];

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center animate-fadeIn overflow-hidden">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
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

      {/* Main Slider Area */}
      <div 
        ref={containerRef}
        className="w-full h-full relative touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sliding Track: Width 300%, Shifted -100% to center current image */}
        <div 
            className="flex h-full items-center"
            style={{ 
                width: '300%',
                marginLeft: '-100%', 
                transform: `translate3d(${diff}px, 0, 0)`,
                // We disable transition if dragging (immediate follow) OR if resetting (instant jump)
                transition: (isDragging || isResetting) ? 'none' : 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' 
            }}
        >
            {/* Previous Image Slot */}
            <div className="w-1/3 h-full flex items-center justify-center p-1 md:p-4">
                {prevImage && (
                    <img 
                        src={prevImage.url} 
                        alt="Previous" 
                        className="max-h-full max-w-full object-contain select-none"
                        draggable={false}
                    />
                )}
            </div>

            {/* Current Image Slot */}
            <div className="w-1/3 h-full flex items-center justify-center p-0 md:p-4 relative">
                <img 
                    src={currentImage.url} 
                    alt="Current" 
                    className="max-h-full max-w-full object-contain select-none shadow-2xl"
                    draggable={false}
                />
            </div>

            {/* Next Image Slot */}
            <div className="w-1/3 h-full flex items-center justify-center p-1 md:p-4">
                {nextImage && (
                    <img 
                        src={nextImage.url} 
                        alt="Next" 
                        className="max-h-full max-w-full object-contain select-none"
                        draggable={false}
                    />
                )}
            </div>
        </div>

        {/* Desktop Arrows (Overlay on top of slider) */}
        {currentIndex > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); slideTo('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block transition-all"
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
        )}
        
        {currentIndex < images.length - 1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); slideTo('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block transition-all"
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
        )}
      </div>

      {/* Footer / Counter */}
      <div className="absolute bottom-6 z-20 text-white/90 text-sm font-medium px-4 py-1 bg-black/40 rounded-full backdrop-blur-md">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};
