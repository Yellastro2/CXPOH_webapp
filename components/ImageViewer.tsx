
import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, ItemType } from '../types';
import {
  CloseIcon, ChevronLeftIcon, ChevronRightIcon, MoveToFolderIcon,
  TrashIcon, DownloadIcon, ExtraIcon, CheckIcon, PlayIcon, PauseIcon,
  SpeakerWaveIcon, SpeakerXMarkIcon, ArrowPathIcon
} from './Icons';
import { api } from '../services/api';
import { ConfirmModal } from './ConfirmModal';

interface ImageViewerProps {
  images: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
  onMoveToFolder: (imageId: string) => void;
  tagsMap: Record<string, string>;
  onItemUpdate: (item: GalleryItem) => void;
  onItemDelete: (itemId: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images, initialIndex, onClose, onMoveToFolder, tagsMap, onItemUpdate, onItemDelete
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [diff, setDiff] = useState(0); // Swipe delta
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  // Zoom / Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [startPinchDist, setStartPinchDist] = useState<number | null>(null);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 }); // Pan start coordinates

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extra Mode (Metadata)
  const [isExtraMode, setIsExtraMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState("");
  const [editTags, setEditTags] = useState("");

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false); // Controls if the video player layer is shown
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = images[currentIndex];

  // Resolve tags for display
  const currentTagsNames = currentItem.tags
    ? currentItem.tags.map(id => tagsMap[id] || id)
    : [];

  useEffect(() => {
    // Reset states on index change
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsPlaying(false);
    setIsVideoActive(false);
    setProgress(0);
    setDuration(0);
    setShowControls(true);
  }, [currentIndex]);

  useEffect(() => {
    // Sync video volume and loop state when ref changes or state changes
    if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = isMuted;
        videoRef.current.loop = isLooping;
    }
  }, [volume, isMuted, isLooping, isVideoActive]);

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // --- Touch Handling ---

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExtraMode) return; // Block swipes in Extra mode
    if (e.touches.length === 2) {
      // Pinch start
      const dist = getDistance(e.touches);
      setStartPinchDist(dist);
    } else if (e.touches.length === 1) {
      setStartX(e.touches[0].clientX);
      setStartPan({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isExtraMode) return;
    if (e.touches.length === 2 && startPinchDist) {
      // Zooming
      const dist = getDistance(e.touches);
      const newScale = Math.min(Math.max(1, scale * (dist / startPinchDist)), 4);
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;

      if (scale > 1) {
        // Panning zoomed image
        const dx = x - startPan.x;
        const dy = y - startPan.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setStartPan({ x, y });
      } else {
        // Swiping
        const currentDiff = x - startX;
        // Resistance at edges
        if ((currentIndex === 0 && currentDiff > 0) || (currentIndex === images.length - 1 && currentDiff < 0)) {
           setDiff(currentDiff * 0.3);
        } else {
           setDiff(currentDiff);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (isExtraMode) return;
    setStartPinchDist(null);
    setIsDragging(false);

    if (scale > 1) {
       // Keep zoom, maybe boundaries check here?
       return;
    }

    if (Math.abs(diff) > 100) {
      // Swipe threshold met
      if (diff > 0 && currentIndex > 0) {
        // Swipe Right -> Prev
        setIsResetting(true);
        setDiff(window.innerWidth); // Animate out
        setTimeout(() => {
          setIsResetting(false); // Disable transition for instant snap
          handlePrev();
          setDiff(0);
        }, 300);
      } else if (diff < 0 && currentIndex < images.length - 1) {
        // Swipe Left -> Next
        setIsResetting(true);
        setDiff(-window.innerWidth);
        setTimeout(() => {
          setIsResetting(false);
          handleNext();
          setDiff(0);
        }, 300);
      } else {
         setDiff(0); // Snap back if at edge
      }
    } else {
      setDiff(0); // Snap back
    }
  };

  const handleDoubleTap = () => {
    if (isExtraMode) return;
    setScale(prev => (prev === 1 ? 2.5 : 1));
    setPan({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    const url = currentItem.fullUrl || currentItem.url;
    if (!url) return;

    try {
      // Fetch blob to ensure download works with auth headers/proxies if needed,
      // or just force browser download behavior
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = currentItem.type === ItemType.VIDEO ? 'mp4' : 'jpg';
      a.download = `download-${currentItem.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Download failed", e);
      // Fallback
      window.open(url, '_blank');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteItem(currentItem.id);
      onItemDelete(currentItem.id);
      setIsConfirmDeleteOpen(false);
    } catch (e) {
      console.error("Delete failed", e);
      alert("Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExtraMode = () => {
    if (isExtraMode) {
      // Close
      setIsExtraMode(false);
      setIsEditing(false);
    } else {
      // Open
      setIsExtraMode(true);
      setEditComment(currentItem.comment || "");
      setEditTags(currentTagsNames.join(" "));
    }
  };

  const handleSaveMetadata = async () => {
    try {
      // Parse tags string into array of names
      const tagNames = editTags.split(/[\s,]+/).filter(t => t.length > 0).map(t => t.replace(/^#/, ''));

      const updated = await api.updateItem(currentItem.id, {
        comment: editComment,
        tags: tagNames
      });
      onItemUpdate(updated);
      setIsEditing(false);
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to save updates");
    }
  };

  // Video Handlers
  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
        setIsMuted(false);
    }
  };

  const toggleMute = () => {
      setIsMuted(!isMuted);
  };

  const toggleLoop = () => {
      setIsLooping(!isLooping);
  };

  // Determine current image/video source
  // For Video:
  // - If isVideoActive is true, we render the video player
  // - Otherwise, we render the thumbnail
  const isVideo = currentItem.type === ItemType.VIDEO;
  const displayUrl = isVideo ? (currentItem.url || '') : (currentItem.fullUrl || currentItem.url || '');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col no-scrollbar">

      {/* --- Main Content Area --- */}
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
             // If extra mode is open, close it (unless we clicked on controls, which stop propagation)
             if (isExtraMode && !isEditing) {
                 setIsExtraMode(false);
             } else {
                 setShowControls(prev => !prev);
             }
        }}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(-100% + ${diff}px))`,
            transition: (isDragging || isResetting) ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Previous Image Placeholder */}
          <div className="min-w-full h-full flex items-center justify-center">
             {currentIndex > 0 && (
                <img
                  src={images[currentIndex - 1].url}
                  className="max-w-full max-h-full object-contain opacity-50"
                  alt="prev"
                />
             )}
          </div>

          {/* Current Image / Video */}
          <div className="min-w-full h-full flex items-center justify-center relative">

            {/* Video Player */}
            {isVideo && isVideoActive ? (
                <div className="w-full h-full flex items-center justify-center bg-black relative">
                    <video
                        ref={videoRef}
                        src={currentItem.fullUrl}
                        className="w-full h-full object-contain"
                        playsInline
                        onTimeUpdate={handleVideoTimeUpdate}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        onClick={(e) => {
                             e.stopPropagation(); // Don't toggle extra mode
                             setShowControls(prev => !prev);
                        }}
                    />

                    {/* Centered Play/Pause Button */}
                    {showControls && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <button
                                onClick={togglePlay}
                                className="bg-black/40 rounded-full p-4 backdrop-blur-sm pointer-events-auto hover:bg-black/60 transition-colors"
                            >
                                {isPlaying ? (
                                    <PauseIcon className="w-12 h-12 text-white" />
                                ) : (
                                    <PlayIcon className="w-12 h-12 text-white ml-1" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Custom Video Controls Bottom Bar */}
                    {showControls && (
                        <div
                             className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8 flex flex-col gap-2 pointer-events-auto"
                             onClick={(e) => e.stopPropagation()}
                        >
                            {/* Time and Scrubber Row */}
                            <div className="flex items-center gap-3">
                                <span className="text-white text-xs font-mono w-10">
                                    {formatTime(progress)}
                                </span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={progress}
                                    onChange={handleSeek}
                                    className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
                                />
                                <span className="text-white/70 text-xs font-mono w-10 text-right">
                                    {formatTime(duration)}
                                </span>
                            </div>

                            {/* Volume and Loop Controls Row */}
                            <div className="flex items-center justify-end gap-4 mt-1">
                                {/* Volume Group */}
                                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1">
                                    <button onClick={toggleMute} className="text-white hover:text-blue-400">
                                        {isMuted || volume === 0 ? (
                                            <SpeakerXMarkIcon className="w-5 h-5" />
                                        ) : (
                                            <SpeakerWaveIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>

                                {/* Loop Toggle */}
                                <button
                                    onClick={toggleLoop}
                                    className={`p-1 rounded-md transition-colors ${isLooping ? 'text-blue-400 bg-white/10' : 'text-white/70 hover:text-white'}`}
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Image / Video Thumbnail */
                <div
                    className="w-full h-full relative flex items-center justify-center"
                    style={{
                        transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s'
                    }}
                    onDoubleClick={handleDoubleTap}
                >
                     <img
                        src={displayUrl}
                        className="max-w-full max-h-full object-contain"
                        alt="current"
                        draggable={false}
                    />

                    {/* Play Button Overlay for Video */}
                    {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsVideoActive(true);
                                    setTimeout(() => {
                                        if(videoRef.current) {
                                            videoRef.current.play();
                                            setIsPlaying(true);
                                        }
                                    }, 100);
                                }}
                                className="bg-black/50 rounded-full p-4 backdrop-blur-sm active:scale-95 transition-transform"
                            >
                                <PlayIcon className="w-12 h-12 text-white" />
                            </button>
                        </div>
                    )}
                </div>
            )}

          </div>

          {/* Next Image Placeholder */}
          <div className="min-w-full h-full flex items-center justify-center">
             {currentIndex < images.length - 1 && (
                <img
                  src={images[currentIndex + 1].url}
                  className="max-w-full max-h-full object-contain opacity-50"
                  alt="next"
                />
             )}
          </div>
        </div>
      </div>

      {/* --- Top Bar (Close Button Only) --- */}
      <div
        className={`absolute top-0 left-0 p-4 flex z-50 transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <button onClick={onClose} className="text-white hover:opacity-70 pointer-events-auto p-1 drop-shadow-md">
          <CloseIcon className="w-8 h-8" />
        </button>
      </div>

      {/* --- Right Actions Column --- */}
      <div
        className={`absolute top-1/2 right-0 -translate-y-1/2 p-4 flex flex-col gap-6 z-50 transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
          {/* Extra / Edit Button */}
          <button
            onClick={() => isEditing ? handleSaveMetadata() : toggleExtraMode()}
            className={`text-white p-1 hover:opacity-70 pointer-events-auto drop-shadow-md ${isExtraMode ? 'text-blue-400' : ''}`}
          >
             {isEditing ? <CheckIcon className="w-7 h-7" /> : <ExtraIcon className="w-7 h-7" />}
          </button>

          <button onClick={handleDownload} className="text-white hover:opacity-70 pointer-events-auto drop-shadow-md p-1">
            <DownloadIcon className="w-7 h-7" />
          </button>

          <button
             onClick={() => onMoveToFolder(currentItem.id)}
             className="text-white hover:opacity-70 pointer-events-auto drop-shadow-md p-1"
          >
            <MoveToFolderIcon className="w-7 h-7" />
          </button>

          <button
             onClick={() => setIsConfirmDeleteOpen(true)}
             className="text-white hover:opacity-70 pointer-events-auto drop-shadow-md p-1"
          >
            <TrashIcon className="w-7 h-7 text-red-400" />
          </button>
      </div>

      {/* --- Bottom Extra Overlay --- */}
      {isExtraMode && (
          <div
             className="absolute inset-0 z-40 flex flex-col justify-end"
             onClick={(e) => {
                 // Close if clicking the empty space above
                 if (!isEditing) setIsExtraMode(false);
             }}
          >
            <div
                className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-8 px-6 text-white"
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking text
            >
               {isEditing ? (
                  <div className="flex flex-col gap-3 animate-fadeIn">
                      <input
                         type="text"
                         className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                         placeholder="Tags (space separated)"
                         value={editTags}
                         onChange={e => setEditTags(e.target.value)}
                      />
                      <textarea
                         className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 min-h-[80px]"
                         placeholder="Add a comment..."
                         value={editComment}
                         onChange={e => setEditComment(e.target.value)}
                      />
                      <button
                         onClick={handleSaveMetadata}
                         className="bg-blue-600 text-white font-medium py-2 rounded-lg mt-2 active:scale-95 transition-transform"
                      >
                         Save
                      </button>
                  </div>
               ) : (
                  <div className="flex flex-col gap-2" onClick={() => setIsEditing(true)}>
                     <div className="flex flex-wrap gap-2 mb-1">
                        {currentTagsNames.length > 0 ? (
                           currentTagsNames.map((tag, idx) => (
                              <span key={idx} className="font-medium text-blue-300">
                                 #{tag}
                              </span>
                           ))
                        ) : (
                           <span className="text-gray-400 italic">Tap to add tags...</span>
                        )}
                     </div>
                     <p className="text-sm leading-relaxed text-gray-200">
                        {currentItem.comment || <span className="text-gray-400 italic">Tap to add a comment...</span>}
                     </p>
                  </div>
               )}
            </div>
          </div>
      )}

      {/* --- Desktop Nav Arrows --- */}
      {showControls && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hidden md:block z-50 p-2"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hidden md:block z-50 p-2"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
        </>
      )}

      {/* Deletion Confirmation */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Item"
        message="Are you sure you want to delete this file? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};
