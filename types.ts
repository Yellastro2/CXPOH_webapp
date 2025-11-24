
export enum ItemType {
  FOLDER = 'FOLDER',
  IMAGE = 'IMAGE'
}

export interface GalleryItem {
  id: string;
  type: ItemType;
  title?: string; // For folders
  url?: string;   // For images
  createdAt: number;
  parentId?: string; // ID of the folder containing this item
}
