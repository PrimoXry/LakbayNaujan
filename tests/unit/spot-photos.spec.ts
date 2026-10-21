import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { spotImages, uploadSpotPhotos, validateSpotPhotos, type SpotPhotoDraft } from '@/lib/spotPhotos';

vi.mock('@/lib/supabase', () => ({ supabase: { storage: { from: vi.fn() } } }));
beforeEach(() => vi.resetAllMocks());
const picture = (name = 'lake.png') => new File(['photo'], name, { type: 'image/png' });

describe('destination photos', () => {
  it('uses the ordered database gallery, removes duplicates, and supports existing covers', () => {
    expect(spotImages({ image_urls: ['second.png', 'first.png', 'second.png', ''], image_url: 'old.png' }))
      .toEqual(['second.png', 'first.png']);
    expect(spotImages({ image_url: 'old.png' })).toEqual(['old.png']);
    expect(spotImages({ image_urls: [], image_url: 'old.png' })).toEqual(['old.png']);
    expect(spotImages({ image_url: null })).toEqual([]);
  });

  it('rejects oversized, empty, unsupported files and excess photos', () => {
    expect(() => validateSpotPhotos([picture()], 9)).not.toThrow();
    expect(() => validateSpotPhotos([picture(), picture()], 9)).toThrow('10 photos');
    for (const file of [new File([], 'empty.png', { type: 'image/png' }),
      new File(['svg'], 'bad.svg', { type: 'image/svg+xml' }),
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })]) {
      expect(() => validateSpotPhotos([file], 0)).toThrow('5 MB');
    }
  });

  it('preserves saved photos and ordered new uploads without reuploading on retry', async () => {
    const bucket = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://photos.example/${path}` } })),
    };
    vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
    const drafts: SpotPhotoDraft[] = [{ preview: 'saved.png' }, { file: picture(), preview: 'blob:first' }, { file: picture('view.png'), preview: 'blob:second' }];
    const urls = await uploadSpotPhotos(drafts);
    expect(urls[0]).toBe('saved.png');
    expect(urls.slice(1)).toEqual(drafts.slice(1).map(photo => photo.uploadedUrl));
    expect(bucket.upload).toHaveBeenCalledTimes(2);
    expect(await uploadSpotPhotos(drafts)).toEqual(urls);
    expect(bucket.upload).toHaveBeenCalledTimes(2);
    expect(supabase.storage.from).toHaveBeenCalledWith('tourist-images');
    expect(await uploadSpotPhotos([])).toEqual([]);
  });

  it('retains successful uploads when a later photo fails, then retries only the failed one', async () => {
    const failure = { message: 'Upload unavailable' };
    const bucket = {
      upload: vi.fn().mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: failure }).mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://photos.example/${path}` } })),
    };
    vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
    const drafts: SpotPhotoDraft[] = [{ file: picture(), preview: 'blob:first' }, { file: picture(), preview: 'blob:second' }];
    await expect(uploadSpotPhotos(drafts)).rejects.toBe(failure);
    expect(drafts[0].uploadedUrl).toBeTruthy();
    expect(drafts[1].uploadedUrl).toBeUndefined();
    const urls = await uploadSpotPhotos(drafts);
    expect(urls[0]).toBe(drafts[0].uploadedUrl);
    expect(urls).toHaveLength(2);
    expect(bucket.upload).toHaveBeenCalledTimes(3);
  });
});
