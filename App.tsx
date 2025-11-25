
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GalleryGrid } from './components/GalleryGrid';
import { Modal } from './components/Modal';
import { ImageViewer } from './components/ImageViewer';
import { FolderPicker } from './components/FolderPicker';
import { PlusIcon, PhotoIcon, FolderIcon, ChevronLeftIcon } from './components/Icons';
import { api } from './services/api'; // Use the API factory
import { GalleryItem, ItemType } from './types';

function App() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  
  // Cache folder names for the header title (since we might not have the full folder object loaded in the current view)
  const [folderTitleMap, setFolderTitleMap] = useState<Record<string, string>>({});
  const [allFolders, setAllFolders] = useState<GalleryItem[]>([]); // For the picker

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  
  // Track the image pending move
  const [imageToMoveId, setImageToMoveId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load items when current folder changes
  useEffect(() => {
    loadItems();
  }, [currentFolderId]);

  // Load all folders whenever the folder picker is opened
  useEffect(() => {
    if (isFolderPickerOpen) {
      loadAllFolders();
    }
  }, [isFolderPickerOpen]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.getItems(currentFolderId);
      setItems(data);
      
      // Update title map if we found folders
      const newTitles: Record<string, string> = {};
      data.forEach(item => {
        if (item.type === ItemType.FOLDER && item.title) {
          newTitles[item.id] = item.title;
        }
      });
      setFolderTitleMap(prev => ({ ...prev, ...newTitles }));

    } catch (error) {
      console.error("Failed to load items", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllFolders = async () => {
    try {
      const folders = await api.getAllFolders();
      setAllFolders(folders);
      // Also update title map from this complete list to ensure we have titles for back navigation
      const newTitles: Record<string, string> = {};
      folders.forEach(f => {
        if (f.title) newTitles[f.id] = f.title;
      });
      setFolderTitleMap(prev => ({ ...prev, ...newTitles }));
    } catch (error) {
      console.error("Failed to load folders", error);
    }
  };

  // Find current folder parent ID for back navigation
  // Since we only load current items, we need to look up the parent of the current folder.
  // In a real app, `getItems` might return metadata about the current folder, or we'd have a `getFolderDetails` endpoint.
  // For this Mock implementation, we'll rely on the `allFolders` cache or we might lose the parent reference if we refresh deep.
  // To fix this simply: The API logic for `back` is tricky without a `getFolder(id)` method. 
  // Let's iterate allFolders to find the current folder's parent.
  const currentFolder = useMemo(() => {
    return allFolders.find(f => f.id === currentFolderId);
  }, [allFolders, currentFolderId]);

  // Ensure we have folder data. If allFolders is empty (first load deep), try to fetch them.
  useEffect(() => {
    if (currentFolderId && allFolders.length === 0) {
      loadAllFolders();
    }
  }, [currentFolderId, allFolders.length]);

  const visibleImages = useMemo(() => {
    return items.filter(item => item.type === ItemType.IMAGE);
  }, [items]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    try {
      // Upload sequentially for simplicity
      for (let i = 0; i < files.length; i++) {
        await api.uploadFile(files[i], currentFolderId);
      }
      await loadItems();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    setLoading(true);
    try {
      await api.createFolder(folderName, currentFolderId);
      await loadItems();
    } catch (error) {
      console.error("Create folder failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Click on a grid item
  const handleItemClick = (item: GalleryItem) => {
    if (item.type === ItemType.FOLDER) {
      setCurrentFolderId(item.id);
    } else {
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
      setCurrentFolderId(undefined);
    }
  };

  const handleMoveToFolderRequest = (imageId: string) => {
    setImageToMoveId(imageId);
    setIsFolderPickerOpen(true);
  };

  const handleFolderSelect = async (targetFolderId: string | undefined) => {
    if (!imageToMoveId) return;

    // Optimistic UI update or wait for API? Let's wait for API to be safe.
    try {
      await api.moveItem(imageToMoveId, targetFolderId);
      
      setIsFolderPickerOpen(false);
      
      // Refresh current view
      await loadItems();

      // Adjust viewer index if needed (since item disappeared from current view)
      if (viewingImageIndex !== null) {
        // Simple logic: Close viewer if list empty, or clamp index
        // Note: visibleImages will be stale until next render, so we can't fully calculate new index here accurately
        // without complex optimistic state. For now, we'll close the viewer if it gets confusing, 
        // or just let the re-render handle it (might show next image automatically).
        // Let's just re-validate the index in the effect or render.
        // Actually, if we refresh items, the Viewer will re-render with new images list.
        // We need to ensure we don't go out of bounds.
        setViewingImageIndex(prev => {
           if (prev === null) return null;
           // We'll rely on the fact that loadItems updates `items`, calculating `visibleImages`.
           // The Viewer component handles standard props updates, but we might shift.
           // A safe bet is:
           return prev > 0 ? prev - 1 : 0;
        });
      }

    } catch (error) {
      console.error("Move failed", error);
    }
  };

  // Sort: Folders first, then Images
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === ItemType.FOLDER ? -1 : 1;
  });

  const currentTitle = currentFolderId 
    ? (folderTitleMap[currentFolderId] || 'Folder') 
    : 'Gallery';

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
              {currentTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={handleUploadClick}
              disabled={loading}
              className="text-tg-link hover:opacity-70 active:opacity-50 transition-opacity p-2 disabled:opacity-30"
              aria-label="Upload Images"
            >
              <PhotoIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
              className="text-tg-link hover:opacity-70 active:opacity-50 transition-opacity p-2 disabled:opacity-30"
              aria-label="Create Folder"
            >
              <PlusIcon className="w-7 h-7" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto min-h-[calc(100vh-48px)]">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-tg-hint">
            <p>Empty folder</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 pb-20">
             {sortedItems.map((item) => (
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
          disabled={loading}
          className="bg-tg-button text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform disabled:opacity-70"
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
          initialIndex={Math.min(viewingImageIndex, visibleImages.length - 1)} // Safety clamp
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
