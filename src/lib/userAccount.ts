import { supabase } from './supabase';
import { errorCode, errorMessage, logRequestError } from './errors';
import type { Profile } from './types';

export type UserProfile = Profile & { display_name: string | null; avatar_path: string | null };
const AVATAR_BUCKET = 'profile-avatars';
export const AVATAR_PRESETS = [
  { id: 'fern', label: 'Fern' },
  { id: 'luna', label: 'Luna' },
  { id: 'kai', label: 'Kai' },
  { id: 'sage', label: 'Sage' },
  { id: 'river', label: 'River' },
  { id: 'amara', label: 'Amara' },
] as const;
export type AvatarPresetId = typeof AVATAR_PRESETS[number]['id'];

export function avatarPresetFromPath(path: string | null): AvatarPresetId | null {
  const id = path?.match(/\/preset\/([^/]+)$/)?.[1];
  return AVATAR_PRESETS.find(preset => preset.id === id)?.id ?? null;
}

export function avatarPresetUrl(preset: AvatarPresetId): string {
  return `${import.meta.env.BASE_URL}avatars/${preset}.svg`;
}

function isUploadedAvatar(profile: UserProfile, path: string | null): path is string {
  return !!path && path.startsWith(`${profile.id}/`) && avatarPresetFromPath(path) === null;
}

export function accountError(error: unknown, fallback: string): string {
  const code = errorCode(error);
  if (['PGRST204', 'PGRST205', '42703', '42P01'].includes(code)) {
    logRequestError('account', error);
    // A missing relation, missing column, and stale API schema are different
    // failures. Preserve their diagnostics locally instead of hiding all three
    // behind a generic "feature not available" message.
    if (import.meta.env.DEV) {
      return `${fallback} ${errorMessage(error, 'The account database could not be read.')} [${code}]`;
    }
    return `${fallback} Account data is temporarily unavailable. Please try again or contact support.`;
  }
  return errorMessage(error, fallback);
}

export async function loadUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return { ...data, display_name: data.display_name ?? null, avatar_path: data.avatar_path ?? null } as UserProfile;
}

export async function savePersonalProfile(userId: string, name: string, username: string): Promise<UserProfile> {
  const displayName = name.trim();
  const loginName = username.trim();
  if (!displayName || displayName.length > 80) throw new Error('Enter a name between 1 and 80 characters.');
  if (!/^[A-Za-z0-9_]{3,30}$/.test(loginName)) throw new Error('Use 3–30 letters, numbers or underscores for your username.');
  const { data, error } = await supabase.from('profiles')
    .update({ display_name: displayName, username: loginName }).eq('id', userId).select('*').single();
  if (error) throw error;
  return data as UserProfile;
}

export async function avatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const preset = avatarPresetFromPath(path);
  if (preset) return avatarPresetUrl(preset);
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function validateAvatar(file: File): void {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024) {
    throw new Error('Choose a JPEG, PNG or WebP picture no larger than 2 MB.');
  }
}

export async function uploadAvatar(profile: UserProfile, file: File): Promise<UserProfile> {
  validateAvatar(file);
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const { error: uploadError } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from('profiles').update({ avatar_path: path })
    .eq('id', profile.id).select('*').single();
  if (error) {
    // Remove only the new, unreferenced upload if the profile could not be saved.
    await bucket.remove([path]).catch(() => undefined);
    throw error;
  }
  if (isUploadedAvatar(profile, profile.avatar_path)) {
    // A cleanup failure must not turn a successful profile save into a failed save.
    await bucket.remove([profile.avatar_path]).catch(() => undefined);
  }
  return data as UserProfile;
}

export async function saveAvatarPreset(profile: UserProfile, preset: AvatarPresetId): Promise<UserProfile> {
  if (!AVATAR_PRESETS.some(option => option.id === preset)) throw new Error('Choose one of the available avatar stickers.');
  const path = `${profile.id}/preset/${preset}`;
  const { data, error } = await supabase.from('profiles').update({ avatar_path: path })
    .eq('id', profile.id).select('*').single();
  if (error) throw error;
  if (isUploadedAvatar(profile, profile.avatar_path)) {
    await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatar_path]).catch(() => undefined);
  }
  return data as UserProfile;
}

export async function loadSavedSpots(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('saved_spots').select('spot_id').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => row.spot_id as string);
}

export async function setSpotSaved(userId: string, spotId: string, saved: boolean): Promise<void> {
  if (saved) {
    const { error } = await supabase.from('saved_spots').insert({ user_id: userId, spot_id: spotId });
    if (error && error.code !== '23505') throw error;
  } else {
    const { error } = await supabase.from('saved_spots').delete().eq('user_id', userId).eq('spot_id', spotId);
    if (error) throw error;
  }
}

export async function changePassword(currentPassword: string, password: string, confirmation: string): Promise<void> {
  if (!currentPassword) throw new Error('Enter your current password.');
  if (password.length < 8) throw new Error('Use at least 8 characters for your new password.');
  if (password !== confirmation) throw new Error('The new passwords do not match.');
  if (password === currentPassword) throw new Error('Choose a different password from your current one.');
  const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
  if (error) {
    if (error.code === 'reauthentication_needed' || error.code === 'reauthentication_not_valid') {
      throw new Error('Please log out and log in again before changing your password.');
    }
    throw error;
  }
}
