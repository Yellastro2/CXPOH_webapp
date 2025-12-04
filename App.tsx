
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GalleryGrid } from './components/GalleryGrid';
import { Modal } from './components/Modal';
import { ImageViewer } from './components/ImageViewer';
import { FolderPicker } from './components/FolderPicker';
import { DeleteFolderModal } from './components/DeleteFolderModal';
import { PlusIcon, PhotoIcon, ChevronLeftIcon, SearchIcon, TrashIcon } from './components/Icons';
import { api } from './services/api'; // Use the API factory
import { GalleryItem, ItemType, Tag } from './types';

function App() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Navigation Stack: Stores the history of folder IDs.
  // Empty array = Root. ['id1', 'id2'] = Root -> id1 -> id2.
  const [folderPath, setFolderPath] = useState<string[]>([]);

  // Derived current folder ID
  const currentFolderId = folderPath.length > 0 ? folderPath[folderPath.length - 1] : undefined;

  // Cache folder names for the header title
  const [folderTitleMap, setFolderTitleMap] = useState<Record<string, string>>({});
  const [allFolders, setAllFolders] = useState<GalleryItem[]>([]); // For the picker

  // Tags Mapping
  const [tagsMap, setTagsMap] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

  // Folder Deletion State
  const [isFolderDeleteModalOpen, setIsFolderDeleteModalOpen] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // Search State
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track the image pending move
  const [imageToMoveId, setImageToMoveId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showUploadButton = process.env.SHOW_UPLOAD_BUTTON === 'true';

  // Load items when current folder changes
  useEffect(() => {
    // If in search mode (showing results), we don't auto-reload folder content on nav change
    // unless we explicitly exited search.
    if (!isSearchMode) {
      loadItems();
    }
  }, [currentFolderId, isSearchMode]);

  // Load global data (Folders for picker, Tags) on mount
  useEffect(() => {
    loadAllFolders();
    loadTags();
  }, []);

  // Reload folders when picker opens to be fresh
  useEffect(() => {
    if (isFolderPickerOpen) {
      loadAllFolders();
    }
  }, [isFolderPickerOpen]);

  // Focus search input when mode activates
  useEffect(() => {
    if (isSearchMode) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchMode]);

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
      // Also update title map from this list
      const newTitles: Record<string, string> = {};
      folders.forEach(f => {
        if (f.title) newTitles[f.id] = f.title;
      });
      setFolderTitleMap(prev => ({ ...prev, ...newTitles }));
    } catch (error) {
      console.error("Failed to load folders", error);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await api.getAllTags();
      const mapping: Record<string, string> = {};
      tags.forEach(t => mapping[t.id] = t.name);
      setTagsMap(mapping);
    } catch (e) {
      console.error("Failed to load tags", e);
    }
  };

  // Includes both Images and Videos
  const visibleMedia = useMemo(() => {
    return items.filter(item => item.type === ItemType.IMAGE || item.type === ItemType.VIDEO);
  }, [items]);

  // Filtered tags for search autocomplete
  const filteredTags = useMemo(() => {
    if (!searchQuery) return [];
    // Strip leading hash to allow searching like "#nature" or just "nature"
    // Also allows showing all tags if user just types "#"
    const query = searchQuery.toLowerCase().replace(/^#/, '');
    const tagList = Object.entries(tagsMap).map(([id, name]) => ({ id, name }));
    return tagList.filter(t => t.name.toLowerCase().includes(query));
  }, [searchQuery, tagsMap]);

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
      // If we are in search results, clicking a folder probably should navigate to it.
      // We push to stack and disable search mode implicitly because of dependency logic in useEffect.
      if (isSearchMode) {
        setIsSearchMode(false);
        setSearchQuery("");
      }
      setFolderPath(prev => [...prev, item.id]);
    } else {
      const index = visibleMedia.findIndex(img => img.id === item.id);
      if (index !== -1) {
        setViewingImageIndex(index);
      }
    }
  };

  const handleBack = () => {
    // Pop the last folder ID from history stack
    setFolderPath(prev => prev.slice(0, -1));
  };

  const handleMoveToFolderRequest = (imageId: string) => {
    setImageToMoveId(imageId);
    setIsFolderPickerOpen(true);
  };

  const handleFolderSelect = async (targetFolderId: string | undefined) => {
    if (!imageToMoveId) return;

    try {
      await api.moveItem(imageToMoveId, targetFolderId);
      setIsFolderPickerOpen(false);
      await loadItems();

      // Adjust viewer index if needed
      if (viewingImageIndex !== null) {
        setViewingImageIndex(prev => {
           if (prev === null) return null;
           return prev > 0 ? prev - 1 : 0;
        });
      }
    } catch (error) {
      console.error("Move failed", error);
    }
  };

  const handleItemUpdate = (updatedItem: GalleryItem) => {
    setItems(prevItems => prevItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
    ));
    // Also refresh tags in case new ones were created
    loadTags();
  };

  const handleItemDelete = (deletedItemId: string) => {
    setViewingImageIndex(null); // Close viewer
    loadItems(); // Refresh content
  };

  const handleDeleteFolder = async (saveContent: boolean) => {
    if (!currentFolderId) return;
    setIsDeletingFolder(true);
    try {
      await api.deleteItem(currentFolderId, saveContent);
      setIsFolderDeleteModalOpen(false);
      handleBack(); // Go up one level
      // Note: loadItems is triggered by effect on folderPath change
      // However, we should also reload AllFolders to update the picker/title map if needed
      loadAllFolders();
    } catch (error) {
      console.error("Delete folder failed", error);
      alert("Failed to delete folder");
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await api.searchFiles(searchQuery);
      setItems(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExitSearch = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    // Reload items for the current folder to restore view
    loadItems();
  };

  const handleTagClick = (tagName: string) => {
    setSearchQuery(`#${tagName}`);
    searchInputRef.current?.focus();
  };

  // Sort: Folders first, then Media (Images/Videos)
  const sortedItems = [...items].sort((a, b) => {
    // Folders always come first
    if (a.type === ItemType.FOLDER && b.type !== ItemType.FOLDER) return -1;
    if (a.type !== ItemType.FOLDER && b.type === ItemType.FOLDER) return 1;
    return 0;
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
      <header className="sticky top-0 z-40 bg-tg-header/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between relative">

          {isSearchMode ? (
            /* Search Mode Header */
            <div className="flex w-full items-center gap-2 animate-fadeIn">
               <button
                 onClick={handleExitSearch}
                 className="text-tg-link hover:opacity-70 p-1"
               >
                 <ChevronLeftIcon className="w-6 h-6" />
               </button>
               <input
                 ref={searchInputRef}
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                 placeholder="Search by tag..."
                 className="flex-1 bg-gray-100 border-none rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-tg-link/50 text-sm"
               />
               <button
                 onClick={handleSearch}
                 className="text-tg-link hover:opacity-70 p-1"
               >
                 <SearchIcon className="w-6 h-6" />
               </button>

               {/* Tags Autocomplete Dropdown */}
               {searchQuery && filteredTags.length > 0 && (
                 <div className="absolute top-12 left-0 right-0 bg-white shadow-xl border-t border-gray-100 max-h-60 overflow-y-auto z-50">
                    {filteredTags.map(tag => (
                      <div
                        key={tag.id}
                        onClick={() => handleTagClick(tag.name)}
                        className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 active:bg-blue-50 cursor-pointer text-sm flex items-center gap-2"
                      >
                         <span className="text-gray-400">#</span>
                         {tag.name}
                      </div>
                    ))}
                 </div>
               )}
            </div>
          ) : (
            /* Normal Header */
            <>
              <div className="flex items-center gap-2 overflow-hidden flex-1">
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
                {currentFolderId && (
                  <button
                    onClick={() => setIsFolderDeleteModalOpen(true)}
                    disabled={loading}
                    className="text-red-500 hover:opacity-70 active:opacity-50 transition-opacity p-2 disabled:opacity-30"
                    aria-label="Delete Folder"
                  >
                    <TrashIcon className="w-6 h-6 text-red-500" />
                  </button>
                )}

                <button
                  onClick={() => setIsSearchMode(true)}
                  className="text-tg-link hover:opacity-70 active:opacity-50 transition-opacity p-2"
                  aria-label="Search"
                >
                  <SearchIcon className="w-6 h-6" />
                </button>

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
            </>
          )}
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
          <GalleryGrid items={sortedItems} onItemClick={handleItemClick} />
        )}
      </main>

      {/* Floating Action Button (Mobile) - Conditioned by ENV */}
      {showUploadButton && (
        <div className="fixed bottom-6 right-6 z-30 md:hidden">
          <button
            onClick={handleUploadClick}
            disabled={loading}
            className="bg-tg-button text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform disabled:opacity-70"
          >
            <PhotoIcon className="w-6 h-6" />
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateFolder}
      />

      {/* Folder Deletion Modal */}
      <DeleteFolderModal
        isOpen={isFolderDeleteModalOpen}
        onClose={() => setIsFolderDeleteModalOpen(false)}
        onDeleteOnly={() => handleDeleteFolder(true)}
        onDeleteAll={() => handleDeleteFolder(false)}
        isLoading={isDeletingFolder}
      />

      {/* Image Viewer */}
      {viewingImageIndex !== null && visibleMedia.length > 0 && (
        <ImageViewer
          images={visibleMedia}
          initialIndex={Math.min(viewingImageIndex, visibleMedia.length - 1)} // Safety clamp
          onClose={() => setViewingImageIndex(null)}
          onMoveToFolder={handleMoveToFolderRequest}
          tagsMap={tagsMap}
          onItemUpdate={handleItemUpdate}
          onItemDelete={handleItemDelete}
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
