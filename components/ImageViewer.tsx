
import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, ItemType } from '../types';
import { 
  CloseIcon, ChevronLeftIcon, ChevronRightIcon, MoveToFolderIcon, 
  TrashIcon, DownloadIcon, ExtraIcon, CheckIcon, PlayIcon, PauseIcon,
  SpeakerWaveIcon, SpeakerXMarkIcon, ArrowPathIcon, ShareIcon
} from './Icons';
import { api } from '../services/api';
import { ConfirmModal } from './ConfirmModal';
import { AlertModal } from './AlertModal';
import { Snackbar } from './Snackbar';
import { STRINGS } from '../resources';

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
  
  // Swipe & Animation State
  const [diff, setDiff] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isResetting, setIsResetting] = useState(false); // Disables transition for instant index swap
  const [pendingDirection, setPendingDirection] = useState<'next' | 'prev' | null>(null);

  // Zoom / Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [startPinchDist, setStartPinchDist] = useState<number | null>(null);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 }); 

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSizeAlertOpen, setIsSizeAlertOpen] = useState(false);

  // Sharing State
  const [isSharing, setIsSharing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false, message: '', type: 'success'
  });

  // Extra Mode (Metadata)
  const [isExtraMode, setIsExtraMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState("");
  const [editTags, setEditTags] = useState("");

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false); 
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = images[currentIndex];
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
  
  // Resolve tags for display
  const currentTagsNames = currentItem.tags
    ? currentItem.tags.map(id => tagsMap[id] || id)
    : [];

  // Reset states when slide changes
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsPlaying(false);
    setIsVideoActive(false);
    setProgress(0);
    setDuration(0);
    setShowControls(true);
    setIsExtraMode(false);
    setIsEditing(false);
    setIsSharing(false);
  }, [currentIndex]);

  // Sync video element with React state
  useEffect(() => {
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

  // --- Touch Handling (Swipe & Zoom) ---

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExtraMode) return;
    
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches);
      setStartPinchDist(dist);
    } else if (e.touches.length === 1) {
      setStartX(e.touches[0].clientX);
      setStartPan({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
      // Reset diff immediately on start to prevent ghosting if animation was stuck
      setDiff(0);
      setIsResetting(false);
      setPendingDirection(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isExtraMode) return;
    
    if (e.touches.length === 2 && startPinchDist) {
      // Pinch Zoom
      const dist = getDistance(e.touches);
      const newScale = Math.min(Math.max(1, scale * (dist / startPinchDist)), 4);
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      
      if (scale > 1) {
        // Pan (Zoomed)
        const dx = x - startPan.x;
        const dy = y - startPan.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setStartPan({ x, y });
      } else {
        // Swipe (Normal)
        const currentDiff = x - startX;
        // Edge resistance
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

    // If zoomed, don't swipe slides
    if (scale > 1) return;

    const threshold = window.innerWidth * 0.2; // 20% width to trigger

    if (diff > threshold && currentIndex > 0) {
      // Swipe Right -> Prev
      setPendingDirection('prev');
      setDiff(window.innerWidth); // Animate fully out
    } else if (diff < -threshold && currentIndex < images.length - 1) {
      // Swipe Left -> Next
      setPendingDirection('next');
      setDiff(-window.innerWidth); // Animate fully out
    } else {
      // Snap back if threshold not met
      setDiff(0);
      setPendingDirection(null);
    }
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Prevent bubbling events (e.g. from children) from triggering this logic
    if (e.target !== e.currentTarget) return;
    
    if (!pendingDirection) return;

    // 1. Disable transition momentarily
    setIsResetting(true); 

    // 2. Change Index (Content Swap)
    if (pendingDirection === 'next') {
        if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1);
    } else if (pendingDirection === 'prev') {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    }

    // 3. Reset Position Instantly (while invisible/transition disabled)
    setDiff(0);
    setPendingDirection(null);

    // 4. Re-enable transition for next interaction
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setIsResetting(false);
        });
    });
  };

  const handleDoubleTap = () => {
    if (isExtraMode) return;
    setScale(prev => (prev === 1 ? 2.5 : 1));
    setPan({ x: 0, y: 0 });
  };

  // --- Actions ---

  const handleDownload = async () => {
    if (currentItem.sizeBytes && currentItem.sizeBytes > MAX_VIDEO_SIZE) {
        setIsSizeAlertOpen(true);
        return;
    }

    const url = currentItem.fullUrl || currentItem.url;
    if (!url) return;
    
    try {
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
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
        await api.sendToTelegram(currentItem);
        setSnackbar({ open: true, message: STRINGS.IMAGE_VIEWER.SNACKBAR_SENT, type: 'success' });
    } catch (e: any) {
        console.error("Share failed", e);
        setSnackbar({ open: true, message: e.message || STRINGS.IMAGE_VIEWER.SNACKBAR_SEND_FAIL, type: 'error' });
    } finally {
        setIsSharing(false);
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
      alert(STRINGS.IMAGE_VIEWER.ERROR_DELETE);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExtraMode = () => {
    if (isExtraMode) {
      setIsExtraMode(false);
      setIsEditing(false);
    } else {
      setIsExtraMode(true);
      setEditComment(currentItem.comment || "");
      setEditTags(currentTagsNames.join(" "));
    }
  };

  const handleSaveMetadata = async () => {
    try {
      const tagNames = editTags.split(/[\s,]+/).filter(t => t.length > 0).map(t => t.replace(/^#/, ''));
      const updated = await api.updateItem(currentItem.id, {
        comment: editComment,
        tags: tagNames
      });
      onItemUpdate(updated);
      setIsEditing(false);
    } catch (e) {
      console.error("Update failed", e);
      alert(STRINGS.IMAGE_VIEWER.ERROR_SAVE);
    }
  };

  // --- Video Controls ---

  const activateVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Size check
    if (currentItem.sizeBytes && currentItem.sizeBytes > MAX_VIDEO_SIZE) {
        setIsSizeAlertOpen(true);
        return;
    }

    setIsVideoActive(true);
    setTimeout(() => {
        if(videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    }, 100);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
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

  const isVideo = currentItem.type === ItemType.VIDEO;
  const displayUrl = isVideo ? (currentItem.url || '') : (currentItem.fullUrl || currentItem.url || '');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col no-scrollbar">
      
      {/* Main Swipe Container */}
      <div 
        className="relative flex-1 overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
             if (isExtraMode && !isEditing) {
                 setIsExtraMode(false);
                 return;
             }
             if (!isExtraMode) {
                setShowControls(prev => !prev);
             }
        }}
      >
        <div 
          className="flex h-full w-full"
          style={{ 
            // 300% width container logic: [-100% (center) + offset]
            transform: `translateX(calc(-100% + ${diff}px))`,
            transition: (isDragging || isResetting) ? 'none' : 'transform 0.3s ease-out'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {/* Previous Slide */}
          <div className="min-w-full h-full flex items-center justify-center">
             {currentIndex > 0 && (
                <img 
                  src={images[currentIndex - 1].url} 
                  className="max-w-full max-h-full object-contain opacity-50" 
                  alt="prev"
                  draggable={false} 
                />
             )}
          </div>

          {/* Current Slide */}
          <div className="min-w-full h-full flex items-center justify-center relative">
            
            {isVideo && isVideoActive ? (
                /* Video Player Active */
                <div className="w-full h-full flex items-center justify-center bg-black relative">
                    <video
                        ref={videoRef}
                        src={currentItem.fullUrl}
                        className="w-full h-full object-contain"
                        playsInline
                        onTimeUpdate={() => videoRef.current && setProgress(videoRef.current.currentTime)}
                        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                        onEnded={() => setIsPlaying(false)}
                        onClick={(e) => {
                             if (!isExtraMode) {
                                e.stopPropagation(); 
                                setShowControls(prev => !prev);
                             }
                        }}
                    />
                    
                    {/* Play/Pause Center Button */}
                    {showControls && !isExtraMode && (
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

                    {/* Bottom Controls Bar */}
                    {showControls && !isExtraMode && (
                        <div 
                             className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8 flex flex-col gap-2 pointer-events-auto"
                             onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-white text-xs font-mono w-10">{formatTime(progress)}</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={progress}
                                    onChange={handleSeek}
                                    className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-white/70 text-xs font-mono w-10 text-right">{formatTime(duration)}</span>
                            </div>

                            <div className="flex items-center justify-end gap-4 mt-1">
                                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1">
                                    <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-400">
                                        {isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                                    </button>
                                    <input 
                                        type="range"
                                        min="0" max="1" step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => {
                                            setVolume(parseFloat(e.target.value));
                                            if(parseFloat(e.target.value) > 0) setIsMuted(false);
                                        }}
                                        className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsLooping(!isLooping)}
                                    className={`p-1 rounded-md transition-colors ${isLooping ? 'text-blue-400 bg-white/10' : 'text-white/70 hover:text-white'}`}
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Static Image / Thumbnail */
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
                    
                    {isVideo && !isExtraMode && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button 
                                onClick={activateVideo}
                                className="bg-black/50 rounded-full p-4 backdrop-blur-sm active:scale-95 transition-transform"
                            >
                                <PlayIcon className="w-12 h-12 text-white" />
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Next Slide */}
          <div className="min-w-full h-full flex items-center justify-center">
             {currentIndex < images.length - 1 && (
                <img 
                  src={images[currentIndex + 1].url} 
                  className="max-w-full max-h-full object-contain opacity-50" 
                  alt="next" 
                  draggable={false}
                />
             )}
          </div>
        </div>
      </div>

      {/* --- Close Button --- */}
      <div className={`absolute top-0 left-0 p-4 z-50 transition-opacity duration-300 ${showControls || isExtraMode ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onClose} className="text-white hover:opacity-70 drop-shadow-md">
          <CloseIcon className="w-8 h-8" />
        </button>
      </div>

      {/* --- Action Buttons (Right Vertical Stack) --- */}
      <div 
        className={`absolute ${isExtraMode ? 'top-0 right-0 p-4' : 'top-1/2 right-0 -translate-y-1/2 p-4'} flex flex-col gap-6 z-50 transition-all duration-300 ${showControls || isExtraMode ? 'opacity-100' : 'opacity-0'}`}
      >
          {/* Metadata / Save */}
          <button 
            onClick={() => isEditing ? handleSaveMetadata() : toggleExtraMode()}
            className={`text-white p-1 hover:opacity-70 drop-shadow-md ${isExtraMode ? 'text-blue-400' : ''}`}
          >
             {isEditing ? <CheckIcon className="w-7 h-7" /> : <ExtraIcon className="w-7 h-7" />}
          </button>

          {!isExtraMode && (
            <>
              {/* Share Button */}
              <button 
                onClick={handleShare} 
                disabled={isSharing}
                className="text-white hover:opacity-70 drop-shadow-md p-1 disabled:opacity-50"
              >
                {isSharing ? (
                   <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <ShareIcon className="w-7 h-7" />
                )}
              </button>

              <button onClick={handleDownload} className="text-white hover:opacity-70 drop-shadow-md p-1">
                <DownloadIcon className="w-7 h-7" />
              </button>
              <button onClick={() => onMoveToFolder(currentItem.id)} className="text-white hover:opacity-70 drop-shadow-md p-1">
                <MoveToFolderIcon className="w-7 h-7" />
              </button>
              <button onClick={() => setIsConfirmDeleteOpen(true)} className="text-white hover:opacity-70 drop-shadow-md p-1">
                <TrashIcon className="w-7 h-7 text-red-400" />
              </button>
            </>
          )}
      </div>

      {/* --- Extra Overlay --- */}
      {isExtraMode && (
          <div 
             className="absolute inset-0 z-40 flex flex-col justify-end"
             onClick={() => !isEditing && setIsExtraMode(false)}
          >
            <div 
                className="bg-gradient-to-t from-black/90 via-black/80 to-transparent pt-12 pb-10 px-6 text-white w-full"
                onClick={(e) => e.stopPropagation()} 
            >
               {isEditing ? (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                      <input 
                         type="text" 
                         className="bg-transparent border-none p-0 text-blue-300 placeholder-white/30 focus:ring-0 text-lg font-medium w-full"
                         placeholder={STRINGS.IMAGE_VIEWER.PLACEHOLDER_TAGS}
                         value={editTags}
                         onChange={e => setEditTags(e.target.value)}
                         autoFocus
                      />
                      <textarea 
                         className="bg-transparent border-none p-0 text-white placeholder-white/30 focus:ring-0 text-base leading-relaxed resize-none w-full min-h-[100px]"
                         placeholder={STRINGS.IMAGE_VIEWER.PLACEHOLDER_COMMENT}
                         value={editComment}
                         onChange={e => setEditComment(e.target.value)}
                      />
                  </div>
               ) : (
                  <div className="flex flex-col gap-3" onClick={() => setIsEditing(true)}>
                     <div className="flex flex-wrap gap-2">
                        {currentTagsNames.length > 0 ? (
                           currentTagsNames.map((tag, idx) => (
                              <span key={idx} className="font-medium text-blue-300 text-lg">#{tag}</span>
                           ))
                        ) : (
                           <span className="text-gray-500 italic text-lg">{STRINGS.IMAGE_VIEWER.TAGS_EMPTY}</span>
                        )}
                     </div>
                     <p className="text-base leading-relaxed text-gray-200 whitespace-pre-wrap">
                        {currentItem.comment || <span className="text-gray-500 italic">{STRINGS.IMAGE_VIEWER.PLACEHOLDER_DESCRIPTION}</span>}
                     </p>
                  </div>
               )}
            </div>
          </div>
      )}

      {/* --- Desktop Arrows --- */}
      {showControls && !isExtraMode && (
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

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={isConfirmDeleteOpen}
        title={STRINGS.MODAL_CONFIRM_DELETE_FILE.TITLE}
        message={STRINGS.MODAL_CONFIRM_DELETE_FILE.MESSAGE}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        isLoading={isDeleting}
      />

      {/* Size Alert Modal */}
      <AlertModal 
        isOpen={isSizeAlertOpen}
        title={STRINGS.MODAL_ALERT_SIZE.TITLE}
        message={STRINGS.MODAL_ALERT_SIZE.MESSAGE}
        onClose={() => setIsSizeAlertOpen(false)}
      />

      {/* Snackbar Notification */}
      <Snackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};
