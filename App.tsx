
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GalleryGrid } from './components/GalleryGrid';
import { Modal } from './components/Modal';
import { ImageViewer } from './components/ImageViewer';
import { FolderPicker } from './components/FolderPicker';
import { PlusIcon, PhotoIcon, FolderIcon, ChevronLeftIcon } from './components/Icons';
import { fetchInitialImages } from './services/imageService';
import { GalleryItem, ItemType } from './types';

// Simple UUID generator for browser
const generateId = () => Math.random().toString(36).substring(2, 9);

function App() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  
  // Track the image pending move
  const [imageToMoveId, setImageToMoveId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with some images
  useEffect(() => {
    const urls = fetchInitialImages(10);
    const initialItems: GalleryItem[] = urls.map(url => ({
      id: generateId(),
      type: ItemType.IMAGE,
      url: url,
      createdAt: Date.now()
    }));
    setItems(initialItems);
  }, []);

  // Get current folder object for title
  const currentFolder = useMemo(() => {
    return items.find(i => i.id === currentFolderId);
  }, [items, currentFolderId]);

  // Derived state: Items currently visible based on navigation
  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (currentFolderId) {
        return item.parentId === currentFolderId;
      }
      return !item.parentId;
    });
  }, [items, currentFolderId]);

  // Derived state: Images only (for the viewer navigation) in current scope
  const visibleImages = useMemo(() => {
    return visibleItems.filter(item => item.type === ItemType.IMAGE);
  }, [visibleItems]);

  // Derived state: All available folders (for the picker)
  // We exclude the current folder from destination list if needed, 
  // but showing all is fine for now (moving to self is harmless no-op).
  const allFolders = useMemo(() => {
    return items.filter(item => item.type === ItemType.FOLDER);
  }, [items]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: GalleryItem[] = Array.from(files).map(file => ({
      id: generateId(),
      type: ItemType.IMAGE,
      url: URL.createObjectURL(file), // Create local blob URL for preview
      title: file.name,
      createdAt: Date.now(),
      parentId: currentFolderId || undefined // Add to current folder
    }));

    setItems(prev => [...prev, ...newImages]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = (folderName: string) => {
    const newFolder: GalleryItem = {
      id: generateId(),
      type: ItemType.FOLDER,
      title: folderName,
      createdAt: Date.now(),
      parentId: currentFolderId || undefined // Create inside current folder
    };
    setItems(prev => [newFolder, ...prev]);
  };

  // Click on a grid item
  const handleItemClick = (item: GalleryItem) => {
    if (item.type === ItemType.FOLDER) {
      setCurrentFolderId(item.id);
    } else {
      // Find the index of this image within the *current visible images*
      const index = visibleImages.findIndex(img => img.id === item.id);
      if (index !== -1) {
        setViewingImageIndex(index);
      }
    }
  };

  const handleBack = () => {
    if (currentFolder && currentFolder.parentId) {
      setCurrentFolderId(currentFolder.parentId);
    } else {
      setCurrentFolderId(null);
    }
  };

  const handleMoveToFolderRequest = (imageId: string) => {
    setImageToMoveId(imageId);
    setIsFolderPickerOpen(true);
  };

  const handleFolderSelect = (folderId: string | undefined) => {
    if (!imageToMoveId) return;

    setItems(prev => prev.map(item => {
      if (item.id === imageToMoveId) {
        return { ...item, parentId: folderId };
      }
      return item;
    }));

    setIsFolderPickerOpen(false);
    
    // Auto-advance logic in viewer:
    // When moving an item out of the current view, we need to adjust the viewer index.
    if (viewingImageIndex !== null) {
      // If we move the last item, go to previous, else stay at same index (which becomes the next image)
      if (viewingImageIndex >= visibleImages.length - 1) {
         const newLength = visibleImages.length - 1;
         if (newLength < 0) setViewingImageIndex(null);
         else setViewingImageIndex(newLength);
      } 
    }
  };

  // Sort: Folders first, then Images
  const sortedVisibleItems = [...visibleItems].sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === ItemType.FOLDER ? -1 : 1;
  });

  return (
    <div className="min-h-screen bg-tg-bg font-sans text-tg-text">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
        multiple 
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-tg-header/80 backdrop-blur-md border-b border-tg-separator/30">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {currentFolderId && (
              <button 
                onClick={handleBack}
                className="text-tg-link hover:opacity-70 flex items-center -ml-2 pr-2"
              >
                <ChevronLeftIcon className="w-6 h-6" />
                <span className="text-base">Back</span>
              </button>
            )}
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {currentFolderId ? currentFolder?.title : 'Gallery'}
            </h1>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={handleUploadClick}
              className="text-tg-link hover:opacity-70 active:opacity-50 transition-opacity p-2"
              aria-label="Upload Images"
            >
              <PhotoIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-tg-link hover:opacity-70 active:opacity-50 transition-opacity p-2"
              aria-label="Create Folder"
            >
              <PlusIcon className="w-7 h-7" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto min-h-[calc(100vh-48px)]">
        {sortedVisibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-tg-hint">
            <p>Empty folder</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 pb-20">
             {sortedVisibleItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleItemClick(item)}
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
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-30 md:hidden">
        <button
          onClick={handleUploadClick}
          className="bg-tg-button text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        >
          <PhotoIcon className="w-6 h-6" />
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateFolder} 
      />

      {/* Image Viewer */}
      {viewingImageIndex !== null && visibleImages.length > 0 && (
        <ImageViewer
          images={visibleImages}
          initialIndex={viewingImageIndex}
          onClose={() => setViewingImageIndex(null)}
          onMoveToFolder={handleMoveToFolderRequest}
        />
      )}

      {/* Folder Picker */}
      <FolderPicker
        isOpen={isFolderPickerOpen}
        folders={allFolders}
        onClose={() => setIsFolderPickerOpen(false)}
        onSelect={handleFolderSelect}
      />
    </div>
  );
}

export default App;
