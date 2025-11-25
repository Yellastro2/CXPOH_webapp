
import { GalleryApi, GalleryItem, ItemType } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Random image generator
const getRandomImage = (): string => {
  const seed = Math.floor(Math.random() * 10000);
  return `https://picsum.photos/seed/${seed}/500/500`;
};

// Initial state simulation (In-memory database)
let mockDb: GalleryItem[] = Array.from({ length: 10 }, () => ({
  id: generateId(),
  type: ItemType.IMAGE,
  url: getRandomImage(),
  createdAt: Date.now(),
}));

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi: GalleryApi = {
  async getItems(parentId?: string): Promise<GalleryItem[]> {
    await delay(300); // Fake latency
    return mockDb.filter(item => item.parentId === parentId);
  },

  async getAllFolders(): Promise<GalleryItem[]> {
    await delay(100);
    return mockDb.filter(item => item.type === ItemType.FOLDER);
  },

  async createFolder(name: string, parentId?: string): Promise<GalleryItem> {
    await delay(300);
    const newFolder: GalleryItem = {
      id: generateId(),
      type: ItemType.FOLDER,
      title: name,
      createdAt: Date.now(),
      parentId: parentId
    };
    mockDb.unshift(newFolder); // Add to beginning
    return newFolder;
  },

  async moveItem(itemId: string, targetParentId?: string): Promise<void> {
    await delay(300);
    mockDb = mockDb.map(item => {
      if (item.id === itemId) {
        return { ...item, parentId: targetParentId };
      }
      return item;
    });
  },

  async uploadFile(file: File, parentId?: string): Promise<GalleryItem> {
    await delay(500); // Simulate upload time
    const newItem: GalleryItem = {
      id: generateId(),
      type: ItemType.IMAGE,
      url: URL.createObjectURL(file), // In mock we just use local blob
      title: file.name,
      createdAt: Date.now(),
      parentId: parentId
    };
    mockDb.push(newItem);
    return newItem;
  }
};
