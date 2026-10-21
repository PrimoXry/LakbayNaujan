import { supabase } from './supabase';

export const MAX_SPOT_PHOTOS = 10;
export type SpotPhotoDraft = { preview: string; file?: File; uploadedUrl?: string };

export function spotImages(spot: { image_url?: string | null; image_urls?: string[] | null }): string[] {
  const images = [...new Set((spot.image_urls ?? []).filter(url => typeof url === 'string' && url.trim()))];
  return images.length ? images : spot.image_url ? [spot.image_url] : [];
}

export function validateSpotPhotos(files: File[], existingCount: number): void {
  if (existingCount + files.length > MAX_SPOT_PHOTOS) throw new Error(`Choose up to ${MAX_SPOT_PHOTOS} photos per destination.`);
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024)) {
    throw new Error('Choose JPEG, PNG or WebP photos no larger than 5 MB each.');
  }
}

export async function uploadSpotPhotos(photos: SpotPhotoDraft[]): Promise<string[]> {
  const urls: string[] = [];
  for (const photo of photos) {
    if (photo.file && !photo.uploadedUrl) {
      const ext = photo.file.type === 'image/png' ? 'png' : photo.file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `spots/${crypto.randomUUID()}.${ext}`;
      const bucket = supabase.storage.from('tourist-images');
      const { error } = await bucket.upload(path, photo.file, { contentType: photo.file.type, upsert: false });
      if (error) throw error;
      // Remember successful uploads so a failed later upload/save can be retried.
      photo.uploadedUrl = bucket.getPublicUrl(path).data.publicUrl;
    }
    urls.push(photo.uploadedUrl ?? photo.preview);
  }
  return urls;
}
