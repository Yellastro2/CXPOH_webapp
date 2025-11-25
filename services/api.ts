
import { GalleryApi } from '../types';
import { mockApi } from './mockApi';
import { remoteApi } from './remoteApi';

// Determine which API to use based on environment variable
// Assuming process.env.USE_REAL_BACKEND is set to 'true' string when needed
const useRealBackend = process.env.USE_REAL_BACKEND === 'true';

export const api: GalleryApi = useRealBackend ? remoteApi : mockApi;
