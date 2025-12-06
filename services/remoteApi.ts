
import { GalleryApi, GalleryItem, ItemType, Tag } from '../types';

const API_BASE = process.env.API_URL || ''; // Empty string means relative path if hosted on same domain

// Helper to get Telegram User ID
const getUserId = (): string => {
  // Check deep nested properties safely
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser && tgUser.id) {
    return tgUser.id.toString();
  }
  return process.env.DEFAULT_USER_ID || '12345678';
};

// Helper to get Telegram Init Data
const getInitData = (): string => {
  const data = window.Telegram?.WebApp?.initData;
  // Check if data exists and is not empty
  if (data) return data;
  return "noinitData";
};

// Types based on new JSON Response
interface BackendItem {
  id: string;
  name: string;
  type: 'FILE' | 'FOLDER';
  fileType?: 'IMAGE' | 'VIDEO'; // New field
  storageId?: string | null;
  sizeBytes?: number;
  tags?: string[];
  comment?: string;
}

const mapBackendToFrontend = (item: BackendItem): GalleryItem => {
  const isFolder = item.type === 'FOLDER';
  const isVideo = item.fileType === 'VIDEO';

  let previewUrl = undefined;
  let fullUrl = undefined;

  if (!isFolder && item.storageId) {
    const initData = getInitData();
    const baseUrl = `${API_BASE}/api/telegram/image`;

    // Construct params for Preview
    const previewParams = new URLSearchParams({
      storageId: item.storageId,
      variant: 'PREVIEW',
      initData: initData
    });
    if (item.fileType) {
      previewParams.append('fileType', item.fileType);
    }
    previewUrl = `${baseUrl}?${previewParams.toString()}`;

    // Construct params for Full
    const fullParams = new URLSearchParams({
      storageId: item.storageId,
      variant: 'FULL',
      initData: initData
    });
    if (item.fileType) {
      fullParams.append('fileType', item.fileType);
    }
    fullUrl = `${baseUrl}?${fullParams.toString()}`;
  }

  // Determine ItemType
  let itemType = ItemType.IMAGE; // Default for files
  if (isFolder) {
    itemType = ItemType.FOLDER;
  } else if (isVideo) {
    itemType = ItemType.VIDEO;
  }

  return {
    id: item.id,
    type: itemType,
    title: item.name,
    url: previewUrl, // Default URL is used for grid preview (for video it's the thumbnail)
    fullUrl: fullUrl, // Full URL is used for full screen viewer (for video it's the thumbnail for now)
    createdAt: 0,
    parentId: undefined,
    sizeBytes: item.sizeBytes, // Map sizeBytes
    tags: item.tags,
    comment: item.comment
  };
};

export const remoteApi: GalleryApi = {
  async getItems(parentId?: string): Promise<GalleryItem[]> {
    const userId = getUserId();
    const initData = getInitData();
    const url = new URL(`${API_BASE}/api/folders/content`, window.location.origin);

    url.searchParams.append('userId', userId);
    if (parentId) {
      url.searchParams.append('parentId', parentId);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Telegram-Init-Data': initData
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: BackendItem[] = await response.json();
      return data.map(mapBackendToFrontend);
    } catch (error) {
      console.error('[RemoteAPI] getItems failed', error);
      return [];
    }
  },

  async getAllFolders(): Promise<GalleryItem[]> {
    const userId = getUserId();
    const initData = getInitData();
    const url = new URL(`${API_BASE}/api/folders/flat`, window.location.origin);
    url.searchParams.append('userId', userId);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Telegram-Init-Data': initData
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.statusText}`);
      }

      interface FlatFolderDto {
        id: string;
        name: string;
        parentId: string | null;
        comment?: string | null;
      }

      const data: FlatFolderDto[] = await response.json();
      return data.map(f => ({
        id: f.id,
        type: ItemType.FOLDER,
        title: f.name,
        // Handle explicit "null" string or actual null/undefined
        parentId: (f.parentId === 'null' || !f.parentId) ? undefined : f.parentId,
        createdAt: 0
      }));
    } catch (error) {
      console.error('[RemoteAPI] getAllFolders failed', error);
      return [];
    }
  },

  async createFolder(name: string, parentId?: string): Promise<GalleryItem> {
    const userId = getUserId();
    const initData = getInitData();
    const url = `${API_BASE}/api/folder`;

    const body = {
      userId,
      folderName: name,
      parentId: parentId || null
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    const resData = await response.json();

    // The API returns { id: uuid }. Construct the UI item optimistically.
    return {
      id: resData.id,
      type: ItemType.FOLDER,
      title: name,
      createdAt: Date.now(),
      parentId: parentId
    };
  },

  async moveItem(itemId: string, targetParentId?: string): Promise<void> {
    const userId = getUserId();
    const initData = getInitData();
    const url = `${API_BASE}/api/folders/move`;

    const body = {
      userId,
      nodeId: itemId,
      newParentId: targetParentId || null
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to move item: ${response.statusText}`);
    }
  },

  async uploadFile(file: File, parentId?: string): Promise<GalleryItem> {
    console.warn('[RemoteAPI] Direct file upload from browser is not supported by the current API spec.');

    // Stub for UI responsiveness
    return {
      id: 'temp_' + Date.now(),
      type: ItemType.IMAGE, // Default stub type
      url: URL.createObjectURL(file),
      title: file.name,
      createdAt: Date.now(),
      parentId: parentId
    };
  },

  async getAllTags(): Promise<Tag[]> {
    const userId = getUserId();
    const initData = getInitData();
    const url = new URL(`${API_BASE}/api/tags/all`, window.location.origin);
    url.searchParams.append('userId', userId);

    try {
      const response = await fetch(url.toString(), {
         method: 'GET',
         headers: {
            'Accept': 'application/json',
            'X-Telegram-Init-Data': initData
         }
      });
      if (!response.ok) {
         throw new Error('Failed to fetch tags');
      }
      return await response.json();
    } catch (e) {
      console.error('[RemoteAPI] getAllTags failed', e);
      return [];
    }
  },

  async updateItem(itemId: string, updates: { comment?: string; tags?: string[] }): Promise<GalleryItem> {
    const userId = getUserId();
    const initData = getInitData();
    const url = `${API_BASE}/api/file/update`;

    const body = {
        userId,
        nodeId: itemId,
        comment: updates.comment,
        tags: updates.tags // Sending array of Tag Names strings
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Failed to update item: ${response.statusText}`);
    }

    const itemData: BackendItem = await response.json();
    return mapBackendToFrontend(itemData);
  },

  async searchFiles(query: string): Promise<GalleryItem[]> {
    const userId = getUserId();
    const initData = getInitData();
    const url = `${API_BASE}/api/search`;

    const body = {
        userId,
        query
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': initData
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
        }

        const data: BackendItem[] = await response.json();
        return data.map(mapBackendToFrontend);
    } catch (error) {
        console.error('[RemoteAPI] searchFiles failed', error);
        return [];
    }
  },

  async deleteItem(itemId: string, saveContent?: boolean): Promise<void> {
    const userId = getUserId();
    const initData = getInitData();
    const url = `${API_BASE}/api/folders/delete`;

    const body = {
      userId: parseInt(userId), // Ensure numeric type for backend
      nodeId: itemId,
      saveContent: saveContent
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.statusText}`);
    }
  }
};
