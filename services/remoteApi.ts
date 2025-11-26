
import { GalleryApi, GalleryItem, ItemType } from '../types';

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
  storageId?: string | null;
  sizeBytes?: number;
}

const mapBackendToFrontend = (item: BackendItem): GalleryItem => {
  const isFolder = item.type === 'FOLDER';

  // Construct URL for file download via proxy
  let imageUrl = undefined;
  if (!isFolder && item.storageId) {
    // Since <img> tags cannot send custom headers, we must pass the initData
    // in the URL query string so the backend can validate the request.
    const initData = getInitData();
    imageUrl = `${API_BASE}/api/telegram/file?fileId=${encodeURIComponent(item.storageId)}&initData=${encodeURIComponent(initData)}`;
  }

  return {
    id: item.id,
    type: isFolder ? ItemType.FOLDER : ItemType.IMAGE,
    title: item.name,
    url: imageUrl,
    // Since API doesn't return timestamps yet, default to 0 to avoid NaN
    createdAt: 0,
    parentId: undefined
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
    // API limitation: No endpoint to get all folders recursively.
    // Strategy: Fetch root items and filter for folders.
    // This allows moving items to root-level folders at least.
    try {
      const rootItems = await this.getItems(undefined);
      return rootItems.filter(i => i.type === ItemType.FOLDER);
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
      type: ItemType.IMAGE,
      url: URL.createObjectURL(file),
      title: file.name,
      createdAt: Date.now(),
      parentId: parentId
    };
  }
};
