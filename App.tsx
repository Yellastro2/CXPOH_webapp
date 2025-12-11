
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GalleryGrid } from './components/GalleryGrid';
import { Modal } from './components/Modal';
import { ImageViewer } from './components/ImageViewer';
import { FolderPicker } from './components/FolderPicker';
import { DeleteFolderModal } from './components/DeleteFolderModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Snackbar } from './components/Snackbar';
import {
  PlusIcon, PhotoIcon, ChevronLeftIcon, SearchIcon, TrashIcon,
  DownloadIcon, MoveToFolderIcon, ShareIcon
} from './components/Icons';
import { api } from './services/api';
import { GalleryItem, ItemType } from './types';
import { STRINGS } from './resources';

function App() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const currentFolderId = folderPath.length > 0 ? folderPath[folderPath.length - 1] : undefined;

  const [folderTitleMap, setFolderTitleMap] = useState<Record<string, string>>({});
  const [allFolders, setAllFolders] = useState<GalleryItem[]>([]);
  const [tagsMap, setTagsMap] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);

  // Modals
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [isFolderDeleteModalOpen, setIsFolderDeleteModalOpen] = useState(false);
  const [isConfirmDeleteFilesOpen, setIsConfirmDeleteFilesOpen] = useState(false);

  // Action Loading States
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false, message: '', type: 'success'
  });

  // Search State
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selection Mode State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelectionMode = selectedIds.size > 0;

  // Track if we are moving a single image (from Viewer) or batch
  const [singleImageToMoveId, setSingleImageToMoveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showUploadButton = process.env.SHOW_UPLOAD_BUTTON === 'true';

  useEffect(() => {
    if (!isSearchMode) {
      loadItems();
    }
  }, [currentFolderId, isSearchMode]);

  useEffect(() => {
    // Clear selection when changing folder or exiting search
    setSelectedIds(new Set());
  }, [currentFolderId, isSearchMode]);

  useEffect(() => {
    loadAllFolders();
    loadTags();
  }, []);

  useEffect(() => {
    if (isFolderPickerOpen) {
      loadAllFolders();
    }
  }, [isFolderPickerOpen]);

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

  const visibleMedia = useMemo(() => {
    return items.filter(item => item.type === ItemType.IMAGE || item.type === ItemType.VIDEO);
  }, [items]);

  const filteredTags = useMemo(() => {
    if (!searchQuery) return [];
    const query = (searchQuery as string).toLowerCase().replace(/^#/, '');
    const tagList = Object.entries(tagsMap).map(([id, name]) => ({ id, name: name as string }));
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

  const handleItemClick = (item: GalleryItem) => {
    if (item.type === ItemType.FOLDER) {
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
    setFolderPath(prev => prev.slice(0, -1));
  };

  const handleMoveToFolderRequest = (imageId: string) => {
    setSingleImageToMoveId(imageId);
    setIsFolderPickerOpen(true);
  };

  const handleFolderSelect = async (targetFolderId: string | undefined) => {
    // Determine items to move
    let idsToMove: string[] = [];
    if (isSelectionMode) {
      idsToMove = Array.from(selectedIds);
    } else if (singleImageToMoveId) {
      idsToMove = [singleImageToMoveId];
    }

    if (idsToMove.length === 0) return;

    try {
      await api.moveItems(idsToMove, targetFolderId); // Batch API call
      setIsFolderPickerOpen(false);
      setSingleImageToMoveId(null);

      // If batch move, exit selection mode
      if (isSelectionMode) {
          setSelectedIds(new Set());
      }

      await loadItems();

      // If moving current viewing image, fix index
      if (singleImageToMoveId && viewingImageIndex !== null) {
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
    loadTags();
  };

  const handleItemDelete = (deletedItemId: string) => {
    setViewingImageIndex(null);
    loadItems();
  };

  const handleDeleteConfirm = async (saveContent?: boolean) => {
    // Determine context: Folder Delete vs Batch Selection Delete

    // Case 1: Deleting current open folder (Header Trash Icon)
    if (!isSelectionMode && currentFolderId) {
       setIsDeletingFolder(true);
       try {
         await api.deleteItems([currentFolderId], saveContent); // Pass single ID as array
         setIsFolderDeleteModalOpen(false);
         handleBack();
         loadAllFolders();
       } catch (error) {
         console.error("Delete folder failed", error);
         alert(STRINGS.ERRORS.DELETE_FOLDER);
       } finally {
         setIsDeletingFolder(false);
       }
       return;
    }

    // Case 2: Batch Selection Delete
    if (isSelectionMode && selectedIds.size > 0) {
        const ids = Array.from(selectedIds);

        // Determine if we are deleting folders (Modal type check happened before opening)
        const hasFolders = ids.some(id => items.find(i => i.id === id)?.type === ItemType.FOLDER);

        if (hasFolders) {
            setIsDeletingFolder(true); // Re-use spinner state
        } else {
            setIsDeletingFiles(true);
        }

        try {
            await api.deleteItems(ids, saveContent);
            setIsFolderDeleteModalOpen(false);
            setIsConfirmDeleteFilesOpen(false);
            setSelectedIds(new Set()); // Clear selection
            loadItems();
            loadAllFolders(); // Update sidebar/tree if folders were deleted
        } catch (error) {
            console.error("Batch delete failed", error);
            alert("Ошибка удаления");
        } finally {
            setIsDeletingFolder(false);
            setIsDeletingFiles(false);
        }
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
    loadItems();
  };

  const handleTagClick = (tagName: string) => {
    setSearchQuery(`#${tagName} `);
    searchInputRef.current?.focus();
  };

  // Selection Mode Handlers
  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleCancelSelection = () => {
    setSelectedIds(new Set());
  };

  // -- Batch Actions --

  const handleBatchDeleteClick = () => {
    const ids = Array.from(selectedIds);
    const hasFolder = ids.some(id => items.find(i => i.id === id)?.type === ItemType.FOLDER);

    if (hasFolder) {
        setIsFolderDeleteModalOpen(true);
    } else {
        setIsConfirmDeleteFilesOpen(true);
    }
  };

  const handleBatchMoveClick = () => {
    setIsFolderPickerOpen(true);
  };

  const handleBatchShareClick = async () => {
     // Filter out folders, only share files
     const fileItems = items.filter(i => selectedIds.has(i.id) && i.type !== ItemType.FOLDER);
     if (fileItems.length === 0) return;

     try {
         await api.sendToTelegram(fileItems);
         setSnackbar({ open: true, message: STRINGS.IMAGE_VIEWER.SNACKBAR_SENT, type: 'success' });
         handleCancelSelection();
     } catch (error) {
         console.error("Batch share failed", error);
         setSnackbar({ open: true, message: STRINGS.IMAGE_VIEWER.SNACKBAR_SEND_FAIL, type: 'error' });
     }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.type === ItemType.FOLDER && b.type !== ItemType.FOLDER) return -1;
    if (a.type !== ItemType.FOLDER && b.type === ItemType.FOLDER) return 1;
    return 0;
  });

  const currentTitle = currentFolderId
    ? (folderTitleMap[currentFolderId] || STRINGS.HEADER.FOLDER_TITLE_DEFAULT)
    : STRINGS.HEADER.DEFAULT_TITLE;

  return (
    <div className="min-h-screen bg-tg-bg font-sans text-tg-text transition-colors duration-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        multiple
      />

      <header className="sticky top-0 z-40 bg-tg-header backdrop-blur-md shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between relative">

          {isSelectionMode ? (
            /* SELECTION MODE HEADER */
            <div className="flex w-full items-center justify-between animate-fadeIn">
               <div className="flex items-center gap-2">
                 <button
                   onClick={handleCancelSelection}
                   className="text-tg-accent hover:opacity-70 flex items-center -ml-2 pr-2"
                 >
                    <ChevronLeftIcon className="w-6 h-6" />
                    <span className="text-base">{STRINGS.HEADER.CANCEL}</span>
                 </button>
               </div>

               <div className="font-semibold text-lg">
                  {STRINGS.HEADER.SELECTED}: {selectedIds.size}
               </div>

               <div className="flex items-center gap-1">
                 <button onClick={handleBatchDeleteClick} className="text-tg-destructive p-2 hover:opacity-70">
                    <TrashIcon className="w-6 h-6" />
                 </button>
                 <button onClick={handleBatchMoveClick} className="text-tg-accent p-2 hover:opacity-70">
                    <MoveToFolderIcon className="w-6 h-6" />
                 </button>
                 <button onClick={handleBatchShareClick} className="text-tg-accent p-2 hover:opacity-70">
                    <ShareIcon className="w-6 h-6" />
                 </button>
               </div>
            </div>
          ) : isSearchMode ? (
            /* SEARCH MODE HEADER */
            <div className="flex w-full items-center gap-2 animate-fadeIn">
               <button
                 onClick={handleExitSearch}
                 className="text-tg-accent hover:opacity-70 p-1"
               >
                 <ChevronLeftIcon className="w-6 h-6" />
               </button>
               <input
                 ref={searchInputRef}
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                 placeholder={STRINGS.SEARCH.PLACEHOLDER}
                 className="flex-1 bg-tg-bg text-tg-text rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-tg-link/50 text-sm placeholder-tg-hint border border-transparent"
               />
               <button
                 onClick={handleSearch}
                 className="text-tg-accent hover:opacity-70 p-1"
               >
                 <SearchIcon className="w-6 h-6" />
               </button>

               {searchQuery && filteredTags.length > 0 && (
                 <div className="absolute top-11 left-0 right-0 bg-tg-secondary-bg shadow-xl max-h-60 overflow-y-auto z-50">
                    {filteredTags.map(tag => (
                      <div
                        key={tag.id}
                        onClick={() => handleTagClick(tag.name)}
                        className="px-4 py-3 hover:bg-tg-bg cursor-pointer text-sm flex items-center gap-2"
                      >
                         <span className="text-tg-hint">#</span>
                         <span className="text-tg-text">{tag.name}</span>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          ) : (
            /* NORMAL HEADER */
            <>
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                {currentFolderId && (
                  <button
                    onClick={handleBack}
                    className="text-tg-accent hover:opacity-70 flex items-center -ml-2 pr-2"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                    <span className="text-base">{STRINGS.HEADER.BACK}</span>
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
                    className="text-tg-destructive hover:opacity-70 active:opacity-50 transition-opacity p-2 disabled:opacity-30"
                  >
                    <TrashIcon className="w-6 h-6" />
                  </button>
                )}

                <button
                  onClick={() => setIsSearchMode(true)}
                  className="text-tg-accent hover:opacity-70 active:opacity-50 transition-opacity p-2"
                >
                  <SearchIcon className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={loading}
                  className="text-tg-accent hover:opacity-70 active:opacity-50 transition-opacity p-2 disabled:opacity-30"
                >
                  <PlusIcon className="w-7 h-7" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto min-h-[calc(100vh-48px)]">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-tg-link/30 border-t-tg-link rounded-full animate-spin"></div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-tg-hint">
            <p>{STRINGS.EMPTY_STATE.FOLDER}</p>
          </div>
        ) : (
          <GalleryGrid
            items={sortedItems}
            onItemClick={handleItemClick}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
          />
        )}
      </main>

      {showUploadButton && !isSelectionMode && (
        <div className="fixed bottom-6 right-6 z-30 md:hidden">
          <button
            onClick={handleUploadClick}
            disabled={loading}
            className="bg-tg-button text-tg-button-text w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform disabled:opacity-70"
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

      {/* Delete Modal for Folders (Both Single and Batch with Folder) */}
      <DeleteFolderModal
        isOpen={isFolderDeleteModalOpen}
        onClose={() => setIsFolderDeleteModalOpen(false)}
        onDeleteOnly={() => handleDeleteConfirm(true)}
        onDeleteAll={() => handleDeleteConfirm(false)}
        isLoading={isDeletingFolder}
      />

      {/* Delete Modal for Files Only (Batch) */}
      <ConfirmModal
        isOpen={isConfirmDeleteFilesOpen}
        title={STRINGS.MODAL_CONFIRM_DELETE_FILE.TITLE}
        message="Вы уверены что хотите удалить выбранные элементы?"
        onConfirm={() => handleDeleteConfirm(false)}
        onCancel={() => setIsConfirmDeleteFilesOpen(false)}
        isLoading={isDeletingFiles}
      />

      {viewingImageIndex !== null && visibleMedia.length > 0 && (
        <ImageViewer
          images={visibleMedia}
          initialIndex={Math.min(viewingImageIndex, visibleMedia.length - 1)}
          onClose={() => setViewingImageIndex(null)}
          onMoveToFolder={handleMoveToFolderRequest}
          tagsMap={tagsMap}
          onItemUpdate={handleItemUpdate}
          onItemDelete={handleItemDelete}
        />
      )}

      <FolderPicker
        isOpen={isFolderPickerOpen}
        folders={allFolders}
        onClose={() => setIsFolderPickerOpen(false)}
        onSelect={handleFolderSelect}
        // Pass selectedIds if in selection mode to disable them in the picker
        disabledFolderIds={isSelectionMode ? selectedIds : undefined}
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
}

export default App;
