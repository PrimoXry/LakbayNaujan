import { supabase } from './supabase';
import type { Profile } from './types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function destinationForUser(userId: string): Promise<string> {
  const profile = await getProfile(userId);
  return profile?.role === 'admin' ? '/admin' : '/tourists';
}
