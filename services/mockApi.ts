
import { GalleryApi, GalleryItem, ItemType, Tag } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Random image generator
const getRandomImage = (): string => {
  const seed = Math.floor(Math.random() * 10000);
  return `https://picsum.photos/seed/${seed}/500/500`;
};

// Mock Video URL (Public domain test video)
const MOCK_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

// Mock Tags
let mockTags: Tag[] = [
  { id: 'tag1', name: 'Nature' },
  { id: 'tag2', name: 'Work' },
  { id: 'tag3', name: 'Memes' }
];

// Initial state simulation (In-memory database)
let mockDb: GalleryItem[] = Array.from({ length: 12 }, (_, i) => {
  const url = getRandomImage();
  const isVideo = i === 3 || i === 7; // Mock videos at specific indices
  return {
    id: generateId(),
    type: isVideo ? ItemType.VIDEO : ItemType.IMAGE,
    url: url, // Preview is always an image
    fullUrl: isVideo ? MOCK_VIDEO_URL : url, // Full URL is video for video types
    createdAt: Date.now(),
    tags: i % 2 === 0 ? ['tag1'] : ['tag2', 'tag3'],
    comment: isVideo ? "Check out this cool video!" : (i % 3 === 0 ? "This is a sample comment for the photo." : undefined)
  };
});

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
    const url = URL.createObjectURL(file);
    const newItem: GalleryItem = {
      id: generateId(),
      type: ItemType.IMAGE,
      url: url,
      fullUrl: url,
      title: file.name,
      createdAt: Date.now(),
      parentId: parentId
    };
    mockDb.push(newItem);
    return newItem;
  },

  async getAllTags(): Promise<Tag[]> {
    await delay(100);
    return mockTags;
  },

  async updateItem(itemId: string, updates: { comment?: string; tags?: string[] }): Promise<GalleryItem> {
    await delay(300);

    // Process tags (convert names to IDs, creating new tags if necessary)
    let newTagIds: string[] | undefined = undefined;
    if (updates.tags) {
        newTagIds = [];
        for (const tagName of updates.tags) {
            let tag = mockTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
            if (!tag) {
                tag = { id: generateId(), name: tagName };
                mockTags.push(tag);
            }
            newTagIds.push(tag.id);
        }
    }

    const itemIndex = mockDb.findIndex(i => i.id === itemId);
    if (itemIndex === -1) throw new Error("Item not found");

    const updatedItem = {
        ...mockDb[itemIndex],
        comment: updates.comment !== undefined ? updates.comment : mockDb[itemIndex].comment,
        tags: newTagIds !== undefined ? newTagIds : mockDb[itemIndex].tags
    };

    mockDb[itemIndex] = updatedItem;
    return updatedItem;
  },

  async searchFiles(query: string): Promise<GalleryItem[]> {
    await delay(400);
    const lowerQuery = query.toLowerCase().replace('#', '');

    return mockDb.filter(item => {
        // Search in title
        if (item.title && item.title.toLowerCase().includes(lowerQuery)) return true;
        // Search in comments
        if (item.comment && item.comment.toLowerCase().includes(lowerQuery)) return true;
        // Search in tags
        if (item.tags) {
             const itemTagNames = item.tags.map(tagId => {
                 const tag = mockTags.find(t => t.id === tagId);
                 return tag ? tag.name.toLowerCase() : '';
             });
             if (itemTagNames.some(name => name.includes(lowerQuery))) return true;
        }
        return false;
    });
  },

  async deleteItem(itemId: string, saveContent?: boolean): Promise<void> {
    await delay(300);
    mockDb = mockDb.filter(item => item.id !== itemId);
  }
};
