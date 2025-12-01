
export enum ItemType {
  FOLDER = 'FOLDER',
  IMAGE = 'IMAGE'
}

export interface Tag {
  id: string;
  name: string;
}

export interface GalleryItem {
  id: string;
  type: ItemType;
  title?: string; // For folders
  url?: string;   // For images (Preview variant)
  fullUrl?: string; // For images (Full variant)
  createdAt: number;
  parentId?: string; // ID of the folder containing this item

  // Metadata
  tags?: string[]; // Array of tag IDs
  comment?: string;
}

export interface GalleryApi {
  getItems(parentId?: string): Promise<GalleryItem[]>;
  getAllFolders(): Promise<GalleryItem[]>;
  createFolder(name: string, parentId?: string): Promise<GalleryItem>;
  moveItem(itemId: string, targetParentId?: string): Promise<void>;
  uploadFile(file: File, parentId?: string): Promise<GalleryItem>;
  getAllTags(): Promise<Tag[]>;
  updateItem(itemId: string, updates: { comment?: string; tags?: string[] }): Promise<GalleryItem>;
}

// Minimal Telegram Web App Types
export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  requestFullscreen: () => void;
  initData: string;
  initDataUnsafe: any;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
