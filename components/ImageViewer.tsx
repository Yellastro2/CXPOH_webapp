
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryItem } from '../types';
import { CloseIcon, MoveToFolderIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ExtraIcon, ShareIcon, CheckIcon, TrashIcon } from './Icons';
import { api } from '../services/api';
import { ConfirmModal } from './ConfirmModal';

interface ImageViewerProps {
  images: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
  onMoveToFolder: (imageId: string) => void;
  tagsMap?: Record<string, string>;
  onItemUpdate?: (item: GalleryItem) => void;
  onItemDelete?: (itemId: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex,
  onClose,
  onMoveToFolder,
  tagsMap = {},
  onItemUpdate,
  onItemDelete
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Swipe (Slider) State
  const [diff, setDiff] = useState(0); // Pixel offset during drag
  const [isAnimating, setIsAnimating] = useState(false); // Automatic slide animation in progress
  const [isResetting, setIsResetting] = useState(false); // Instant reset state

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false); // Is pinch gesture active

  // Extra Mode State
  const [isExtraMode, setIsExtraMode] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Touch Logic References
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const initialZoomDist = useRef<number | null>(null);
  const initialZoomLevel = useRef<number>(1);
  const startPan = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // Double Tap Ref
  const lastTapTime = useRef<number>(0);

  // Download loading state
  const [isDownloading, setIsDownloading] = useState(false);

  // Update index if initialIndex changes externally
  useEffect(() => {
    if (initialIndex < images.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, images.length]);

  // Reset Zoom/Pan/Extra on slide change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsExtraMode(false);
    setIsEditing(false); // Reset edit mode
  }, [currentIndex]);

  // Sync edit state with current image when opening edit mode or changing image
  const currentImage = images[currentIndex];
  useEffect(() => {
    if (currentImage) {
        setEditComment(currentImage.comment || "");
        const names = currentImage.tags?.map(id => tagsMap[id] || id).join(' ') || "";
        setEditTags(names);
    }
  }, [currentImage, tagsMap]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating || isExtraMode || isDeleteModalOpen) return;
      if (e.key === 'Escape') onClose();
      // Only navigate if not zoomed
      if (zoom <= 1) {
        if (e.key === 'ArrowLeft') slideTo('prev');
        if (e.key === 'ArrowRight') slideTo('next');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, isAnimating, zoom, isExtraMode, isDeleteModalOpen]);

  const slideTo = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;

    // Check bounds
    if (direction === 'prev' && currentIndex === 0) return;
    if (direction === 'next' && currentIndex === images.length - 1) return;

    setIsAnimating(true);

    const screenWidth = window.innerWidth;
    const targetDiff = direction === 'next' ? -screenWidth : screenWidth;

    setDiff(targetDiff);

    setTimeout(() => {
      setIsResetting(true);
      setCurrentIndex(prev => direction === 'next' ? prev + 1 : prev - 1);
      setDiff(0);
      setIsAnimating(false);

      requestAnimationFrame(() => {
        setTimeout(() => {
             setIsResetting(false);
        }, 50);
      });
    }, 300);
  }, [currentIndex, images.length, isAnimating]);


  // --- Helper: Distance between two fingers ---
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  // --- Touch Handlers ---

  const onTouchStart = (e: React.TouchEvent) => {
    // Disable gestures if in edit mode or delete modal is open
    if (isAnimating || isExtraMode || isDeleteModalOpen) return;

    // 1. Handle Double Tap
    const now = Date.now();
    if (now - lastTapTime.current < 300 && e.touches.length === 1) {
        // Double tap detected
        if (zoom > 1) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
        } else {
            setZoom(3); // Zoom in 3x
            // Ideally center on tap, but centering on image is simpler for now
            setPan({ x: 0, y: 0 });
        }
        lastTapTime.current = 0;
        return;
    }
    lastTapTime.current = now;

    // 2. Handle Pinch Start
    if (e.touches.length === 2) {
        setIsZooming(true);
        initialZoomDist.current = getDistance(e.touches);
        initialZoomLevel.current = zoom;
        return;
    }

    // 3. Handle Swipe/Pan Start
    if (e.touches.length === 1) {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        startPan.current = { ...pan };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isAnimating || isExtraMode || isDeleteModalOpen) return;

    // Pinch Zoom Logic
    if (e.touches.length === 2 && initialZoomDist.current) {
        const dist = getDistance(e.touches);
        const scaleFactor = dist / initialZoomDist.current;
        const newZoom = Math.min(Math.max(initialZoomLevel.current * scaleFactor, 1), 5); // Max zoom 5x
        setZoom(newZoom);
        return;
    }

    // Single Finger Logic
    if (e.touches.length === 1 && touchStartX.current !== null && touchStartY.current !== null) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX.current;
        const deltaY = currentY - touchStartY.current;

        if (zoom > 1) {
            // PAN logic (if zoomed)
            setPan({
                x: startPan.current.x + deltaX,
                y: startPan.current.y + deltaY
            });
        } else {
            // SWIPE logic (if not zoomed)
            if ((currentIndex === 0 && deltaX > 0) || (currentIndex === images.length - 1 && deltaX < 0)) {
                setDiff(deltaX * 0.3); // Resistance
            } else {
                setDiff(deltaX);
            }
        }
    }
  };

  const onTouchEnd = () => {
    if (isAnimating || isExtraMode || isDeleteModalOpen) return;

    setIsZooming(false);
    touchStartX.current = null;
    touchStartY.current = null;
    initialZoomDist.current = null;

    // If Zoomed out to < 1, reset to 1
    if (zoom < 1) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
    }

    // Swipe Slider Completion Logic (only if not zoomed)
    if (zoom === 1) {
        const threshold = window.innerWidth * 0.25;
        if (diff > threshold && currentIndex > 0) {
            slideTo('prev');
        } else if (diff < -threshold && currentIndex < images.length - 1) {
            slideTo('next');
        } else {
            setDiff(0); // Snap back
        }
    }
  };

  const handleDownload = async () => {
    const currentImage = images[currentIndex];
    // Prefer fullUrl, fallback to url
    const downloadUrl = currentImage?.fullUrl || currentImage?.url;

    if (!downloadUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const filename = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_` +
                       `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.jpg`;

      a.download = filename;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed", error);
      alert("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!currentImage) return;
    setIsSaving(true);
    try {
        const tagNames = editTags.split(' ').filter(t => t.trim().length > 0);
        const updatedItem = await api.updateItem(currentImage.id, {
            comment: editComment.trim(),
            tags: tagNames
        });

        if (onItemUpdate) {
            onItemUpdate(updatedItem);
        }
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to save changes", error);
        alert("Failed to save changes");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentImage) return;

    setIsDeleting(true);
    try {
        await api.deleteItem(currentImage.id);
        if (onItemDelete) {
            onItemDelete(currentImage.id);
        }
        setIsDeleteModalOpen(false);
    } catch (error) {
        console.error("Failed to delete item", error);
        alert("Failed to delete item");
    } finally {
        setIsDeleting(false);
    }
  };

  // Render Helpers
  const prevImage = images[currentIndex - 1];
  const nextImage = images[currentIndex + 1];

  if (!currentImage) return null;

  // Use fullUrl for high quality viewing
  const currentSrc = currentImage.fullUrl || currentImage.url;
  const prevSrc = prevImage ? (prevImage.fullUrl || prevImage.url) : undefined;
  const nextSrc = nextImage ? (nextImage.fullUrl || nextImage.url) : undefined;

  // Format Tags string for Display Mode
  const tagsString = currentImage.tags?.map(id => `#${tagsMap[id] || id}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center animate-fadeIn overflow-hidden">
      {/* Header Controls */}
      {(!isExtraMode || isEditing) && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
             <div /> {/* Spacer */}
             {isEditing ? (
                 <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-white p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
                 >
                    {isSaving ? "Saving..." : <CheckIcon className="w-8 h-8 text-green-400" />}
                 </button>
             ) : (
                <button
                onClick={onClose}
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                <CloseIcon className="w-8 h-8" />
                </button>
             )}
          </div>
      )}

      {/* Side Actions (Hide in Extra Mode) */}
      {!isExtraMode && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 items-center z-30">
            <button
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
            <ShareIcon className="w-8 h-8" />
            </button>

            <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
            {isDownloading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <DownloadIcon className="w-8 h-8" />
            )}
            </button>

            <button
            onClick={() => onMoveToFolder(currentImage.id)}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
            <MoveToFolderIcon className="w-8 h-8" />
            </button>

            <button
            onClick={handleDeleteClick}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
              <TrashIcon className="w-8 h-8" />
            </button>

            <button
            onClick={() => setIsExtraMode(true)}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
            >
            <ExtraIcon className="w-8 h-8" />
            </button>
        </div>
      )}


      {/* Main Slider Area */}
      <div
        className="w-full h-full relative touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
            // Click to exit extra mode ONLY if not editing
            if (isExtraMode && !isEditing) setIsExtraMode(false);
        }}
      >
        {/* Sliding Track */}
        <div
            className="flex h-full items-center"
            style={{
                width: '300%',
                marginLeft: '-100%',
                // Only move track if NOT zoomed and NOT extra mode.
                transform: `translate3d(${diff}px, 0, 0)`,
                // Disable transition if dragging, resetting, or zooming
                transition: (touchStartX.current || isResetting || isZooming || zoom > 1 || isExtraMode) ? 'none' : 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
        >
            {/* Previous Image Slot */}
            <div className="w-1/3 h-full flex items-center justify-center p-1 md:p-4">
                {prevSrc && (
                    <img
                        src={prevSrc}
                        alt="Previous"
                        className="max-h-full max-w-full object-contain select-none"
                        draggable={false}
                    />
                )}
            </div>

            {/* Current Image Slot - Applies Zoom Transform */}
            <div className="w-1/3 h-full flex items-center justify-center p-0 md:p-4 relative overflow-hidden">
                <img
                    src={currentSrc}
                    alt="Current"
                    className="max-h-full max-w-full object-contain select-none shadow-2xl transition-transform duration-100 ease-linear"
                    draggable={false}
                    style={{
                        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                        // Use transition only if not actively pinching/panning
                        transition: (touchStartX.current || isZooming) ? 'none' : 'transform 300ms ease-out'
                    }}
                />
            </div>

            {/* Next Image Slot */}
            <div className="w-1/3 h-full flex items-center justify-center p-1 md:p-4">
                {nextSrc && (
                    <img
                        src={nextSrc}
                        alt="Next"
                        className="max-h-full max-w-full object-contain select-none"
                        draggable={false}
                    />
                )}
            </div>
        </div>

        {/* Extra Mode Overlay */}
        {isExtraMode && (
             <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-10 gap-4"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside overlay inputs
             >
                 {/* Tags */}
                 {isEditing ? (
                     <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Add tags (space separated)"
                        className="bg-transparent text-white font-medium text-xl border-none outline-none placeholder-gray-500 w-full"
                        autoFocus
                     />
                 ) : (
                     <div
                        onClick={() => setIsEditing(true)}
                        className={`font-medium text-xl drop-shadow-md cursor-text ${tagsString ? 'text-white' : 'text-gray-500'}`}
                     >
                         {tagsString || "Add tags"}
                     </div>
                 )}

                 {/* Comment */}
                 {isEditing ? (
                     <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Enter comment"
                        className="bg-transparent text-white text-xs leading-snug border-none outline-none placeholder-gray-500 w-full resize-none h-16"
                     />
                 ) : (
                     <div
                        onClick={() => setIsEditing(true)}
                        className={`text-xs leading-snug drop-shadow-md cursor-text ${currentImage.comment ? 'text-white' : 'text-gray-500'}`}
                     >
                         {currentImage.comment || "Enter comment"}
                     </div>
                 )}
             </div>
        )}

        {/* Desktop Arrows (Only visible if not zoomed & not extra mode) */}
        {!isExtraMode && zoom === 1 && currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); slideTo('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block transition-all"
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
        )}

        {!isExtraMode && zoom === 1 && currentIndex < images.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); slideTo('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 hidden md:block transition-all"
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
        )}
      </div>

      {/* Footer / Counter */}
      {!isExtraMode && (
        <div className="absolute bottom-6 z-20 text-white/90 text-sm font-medium px-4 py-1 bg-black/40 rounded-full backdrop-blur-md">
            {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete File"
        message="Are you sure you want to permanently delete this file?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};
