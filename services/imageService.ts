/**
 * Generates a random image URL using picsum.photos.
 * Returns a 500x500 image URL.
 */
export const getImage = (): string => {
  // Using a random seed to ensure different images
  const seed = Math.floor(Math.random() * 10000);
  // We use the seed in the URL to make it distinct
  return `https://picsum.photos/seed/${seed}/500/500`;
};

/**
 * Simulates fetching a batch of images.
 */
export const fetchInitialImages = (count: number = 10): string[] => {
  return Array.from({ length: count }, () => getImage());
};