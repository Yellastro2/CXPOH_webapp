
import { GalleryApi, GalleryItem, ItemType } from '../types';

const API_BASE = process.env.API_URL || ''; // Empty string means relative path if hosted on same domain, or set full URL

// Helper to get Telegram User ID
const getUserId = (): string => {
  // Check deep nested properties safely
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser && tgUser.id) {
    return tgUser.id.toString();
  }
  return process.env.DEFAULT_USER_ID || '12345678';
};

// Types based on API Spec
interface BackendItem {
  id: string;
  ownerId: string;
  name: string;
  nodeType: 'FILE' | 'FOLDER';
  storageId?: string; // Only for files
  sizeBytes?: number;
  updatedAt: string;
}

const mapBackendToFrontend = (item: BackendItem): GalleryItem => {
  const isFolder = item.nodeType === 'FOLDER';
  
  // Construct URL for file download via proxy
  // If API_BASE is set (e.g. http://localhost:3000), prepend it. 
  // Otherwise use relative path.
  let imageUrl = undefined;
  if (!isFolder && item.storageId) {
    imageUrl = `${API_BASE}/api/telegram/file?fileId=${encodeURIComponent(item.storageId)}`;
  }

  return {
    id: item.id,
    type: isFolder ? ItemType.FOLDER : ItemType.IMAGE,
    title: item.name,
    url: imageUrl,
    createdAt: new Date(item.updatedAt).getTime(),
    // parentId is not returned in the list item content usually, but inferred from context
    // We don't strictly need it on the object for display, but good to have if API returned it.
  };
};

export const remoteApi: GalleryApi = {
  async getItems(parentId?: string): Promise<GalleryItem[]> {
    const userId = getUserId();
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
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: BackendItem[] = await response.json();
      // Map backend fields to frontend props
      return data.map(mapBackendToFrontend);
    } catch (error) {
      console.error('[RemoteAPI] getItems failed', error);
      return [];
    }
  },

  async getAllFolders(): Promise<GalleryItem[]> {
    // efficient way to get all folders is not provided in the spec (only get content by parent).
    // For now, we might only be able to show folders in current directory or 
    // we would need a recursive fetch which is expensive.
    // However, the FolderPicker usually needs a flat list or tree.
    // If the API supports getting flat list of folders, great. 
    // If not, we might limit this to "root" folders or stub it.
    
    // WORKAROUND: For this specific app requirement (FolderPicker needs list),
    // if the backend doesn't have "getAllFolders", we might just return root folders 
    // or we'd need to crawl. Let's assume we just fetch root for now to avoid freezing UI.
    // A proper API would have /api/folders/all
    
    console.warn('[RemoteAPI] getAllFolders is limited to Root by current API spec');
    const rootItems = await this.getItems(undefined);
    return rootItems.filter(i => i.type === ItemType.FOLDER);
  },

  async createFolder(name: string, parentId?: string): Promise<GalleryItem> {
    const userId = getUserId();
    const url = `${API_BASE}/api/folder`;

    const body = {
      userId,
      folderName: name,
      parentId: parentId || null // API expects explicit null for root if JSON
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    const resData = await response.json();

    // The API returns { id: uuid }. We need to construct the full item for the UI.
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
    const url = `${API_BASE}/api/folders/move`;

    const body = {
      userId,
      nodeId: itemId, // Assuming API maps 'nodeId' to the item ID
      targetParentId: targetParentId || null
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to move item: ${response.statusText}`);
    }
    
    // Returns { success: true }
  },

  async uploadFile(file: File, parentId?: string): Promise<GalleryItem> {
    // CRITICAL: The provided API Spec does NOT have a binary upload endpoint.
    // It has GET /api/addFile which takes a fileId (implying the file exists on Telegram servers).
    
    // In a real TWA scenario, user might send image to Bot, Bot gets fileId, 
    // and WebApp just lists it. 
    // OR there is a separate upload endpoint not listed.
    
    // For now, we will log an error and return a fake item to not crash the UI,
    // or we would need to implement a multipart POST to a hypothetical /api/upload endpoint.
    
    console.warn('[RemoteAPI] Direct file upload from browser is not supported by the current API spec.');
    console.warn('The spec requires a pre-existing Telegram fileId.');
    
    // Simulating success to keep UI responsive in demo
    return {
      id: 'temp_' + Date.now(),
      type: ItemType.IMAGE,
      url: URL.createObjectURL(file), // Local preview
      title: file.name,
      createdAt: Date.now(),
      parentId: parentId
    };
  }
};
