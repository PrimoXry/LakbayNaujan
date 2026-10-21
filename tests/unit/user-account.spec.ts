import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { accountError, avatarUrl, changePassword, loadSavedSpots, savePersonalProfile, setSpotSaved, uploadAvatar, validateAvatar, type UserProfile } from '@/lib/userAccount';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), storage: { from: vi.fn() }, auth: { updateUser: vi.fn() } } }));
const profile: UserProfile = { id: 'user-1', username: 'maria', role: 'user', display_name: 'Maria', avatar_path: 'user-1/old.png' };
function query(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
}
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal('crypto', { randomUUID: () => 'test-avatar' }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('account schema diagnostics', () => {
  it.each([
    ['PGRST205', "Could not find the table 'public.saved_spots' in the schema cache"],
    ['42703', 'column saved_spots.created_at does not exist'],
  ])('preserves the actual %s failure and feature context during development', (code, message) => {
    vi.stubEnv('DEV', true);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = accountError({ code, message }, 'Could not load your saved spots.');
    expect(result).toContain('Could not load your saved spots.');
    expect(result).toContain(message);
    expect(result).toContain(code);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[LakbayNaujan account]'));
  });

  it('keeps the failing feature identifiable without exposing schema details in production', () => {
    vi.stubEnv('DEV', false);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = accountError({ code: '42P01', message: 'relation public.saved_spots does not exist' }, 'Could not load your saved spots.');
    expect(result).toContain('Could not load your saved spots.');
    expect(result).not.toContain('public.saved_spots');
    expect(log).not.toHaveBeenCalled();
  });

  it('preserves network and permission errors rather than labeling them as missing setup', () => {
    expect(accountError({ code: '42501' }, 'Could not load saved spots.')).toContain('permission');
    expect(accountError(new TypeError('Failed to fetch'), 'Could not load saved spots.')).toContain('connect');
  });
});

describe('personal account changes', () => {
  it('saves trimmed personal fields without sending role or identity changes', async () => {
    const db = query({ data: profile, error: null });
    vi.mocked(supabase.from).mockReturnValue(db as never);
    await savePersonalProfile('user-1', ' Maria Cruz ', ' maria_cruz ');
    expect(db.update).toHaveBeenCalledWith({ display_name: 'Maria Cruz', username: 'maria_cruz' });
    expect(db.eq).toHaveBeenCalledWith('id', 'user-1');
  });
  it('rejects invalid names before making a request', async () => {
    await expect(savePersonalProfile('user-1', ' ', 'maria')).rejects.toThrow('Enter a name');
    await expect(savePersonalProfile('user-1', 'Maria', 'bad username')).rejects.toThrow('underscores');
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it('propagates a duplicate username failure', async () => {
    const error = { code: '23505' };
    vi.mocked(supabase.from).mockReturnValue(query({ data: null, error }) as never);
    await expect(savePersonalProfile('user-1', 'Maria', 'maria')).rejects.toBe(error);
  });
  it('checks password confirmation and strength before calling authentication', async () => {
    await expect(changePassword('old-password', 'short', 'short')).rejects.toThrow('8 characters');
    await expect(changePassword('old-password', 'new-password', 'different')).rejects.toThrow('do not match');
    await expect(changePassword('', 'new-password', 'new-password')).rejects.toThrow('current password');
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });
  it('sends current and new password through authentication without changing the profile table', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ error: null } as never);
    await changePassword('old-password', 'new-password', 'new-password');
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ current_password: 'old-password', password: 'new-password' });
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it('does not report a rejected password update as successful', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ error: { code: 'reauthentication_needed' } } as never);
    await expect(changePassword('old-password', 'new-password', 'new-password')).rejects.toThrow('log in again');
  });
});

describe('saved destinations', () => {
  it('loads only the current user’s saved IDs', async () => {
    const db = query({ data: [{ spot_id: 'spot-2' }, { spot_id: 'spot-1' }], error: null });
    vi.mocked(supabase.from).mockReturnValue(db as never);
    expect(await loadSavedSpots('user-1')).toEqual(['spot-2', 'spot-1']);
    expect(db.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
  it('treats saving an already saved spot as successful', async () => {
    const db = query({ error: { code: '23505' } });
    vi.mocked(supabase.from).mockReturnValue(db as never);
    await expect(setSpotSaved('user-1', 'spot-1', true)).resolves.toBeUndefined();
    expect(db.insert).toHaveBeenCalledWith({ user_id: 'user-1', spot_id: 'spot-1' });
  });
  it('limits removal to the requested user and destination', async () => {
    const db = query({ error: null });
    vi.mocked(supabase.from).mockReturnValue(db as never);
    await setSpotSaved('user-1', 'spot-1', false);
    expect(db.eq.mock.calls).toEqual([['user_id', 'user-1'], ['spot_id', 'spot-1']]);
  });
  it('preserves permission failures', async () => {
    const error = { code: '42501' };
    vi.mocked(supabase.from).mockReturnValue(query({ error }) as never);
    await expect(setSpotSaved('user-1', 'spot-1', true)).rejects.toBe(error);
  });
});

describe('private profile pictures', () => {
  const picture = () => new File(['png'], 'picture.png', { type: 'image/png' });
  it('rejects unsupported, empty and oversized files', () => {
    for (const file of [new File(['svg'], 'picture.svg', { type: 'image/svg+xml' }), new File([], 'empty.png', { type: 'image/png' }), new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })]) {
      expect(() => validateAvatar(file)).toThrow('2 MB');
    }
  });
  it('removes the new upload if saving its path fails and keeps the old picture', async () => {
    const bucket = { upload: vi.fn().mockResolvedValue({ error: null }), remove: vi.fn().mockResolvedValue({ error: null }) };
    vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
    const error = { code: '42501' };
    vi.mocked(supabase.from).mockReturnValue(query({ data: null, error }) as never);
    await expect(uploadAvatar(profile, picture())).rejects.toBe(error);
    expect(bucket.remove.mock.calls).toEqual([[['user-1/test-avatar.png']]]);
  });
  it('keeps a successful profile update successful when old-picture cleanup fails', async () => {
    const bucket = { upload: vi.fn().mockResolvedValue({ error: null }), remove: vi.fn().mockRejectedValue(new Error('Offline')) };
    const updated = { ...profile, avatar_path: 'user-1/test-avatar.png' };
    vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
    vi.mocked(supabase.from).mockReturnValue(query({ data: updated, error: null }) as never);
    expect(await uploadAvatar(profile, picture())).toEqual(updated);
    expect(bucket.remove).toHaveBeenCalledWith(['user-1/old.png']);
  });
  it('does not change the profile when the upload fails', async () => {
    const error = { message: 'Storage unavailable' };
    vi.mocked(supabase.storage.from).mockReturnValue({ upload: vi.fn().mockResolvedValue({ error }) } as never);
    await expect(uploadAvatar(profile, picture())).rejects.toBe(error);
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it('uses an expiring signed URL and skips requests for a missing picture', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed.png' }, error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrl } as never);
    expect(await avatarUrl(null)).toBeNull();
    expect(supabase.storage.from).not.toHaveBeenCalled();
    expect(await avatarUrl(profile.avatar_path)).toBe('https://example.com/signed.png');
    expect(createSignedUrl).toHaveBeenCalledWith(profile.avatar_path, 3600);
  });
});
