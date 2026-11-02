import { supabase } from './supabase';

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

export type AdminUserInput = {
  email: string;
  username: string;
  display_name: string;
  role: 'user' | 'admin';
  password?: string;
};

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const result = await supabase.functions.invoke('admin-users', { body: { action, ...payload } });
  if (!result.error) return result.data as T;

  let message = result.error.message || 'The user management request failed.';
  const context = 'context' in result.error ? result.error.context : undefined;
  if (context instanceof Response) {
    try {
      const body = await context.clone().json() as { code?: string; error?: string; message?: string };
      if (body.error || body.message) message = body.error ?? body.message ?? message;
      if (body.code === 'NOT_FOUND') message = 'The admin-users Edge Function is not deployed. Deploy it with: supabase functions deploy admin-users';
    } catch { /* Keep the SDK error when the response is not JSON. */ }
  }
  if (message === 'Failed to send a request to the Edge Function') {
    message = 'The admin-users Edge Function could not be reached. Deploy it with: supabase functions deploy admin-users';
  }
  throw new Error(message);
}

export async function loadAdminUsers(): Promise<AdminUser[]> {
  const result = await invoke<{ users: AdminUser[] }>('list');
  return result.users;
}

export async function createAdminUser(input: AdminUserInput): Promise<AdminUser> {
  const result = await invoke<{ user: AdminUser }>('create', { user: input });
  return result.user;
}

export async function updateAdminUser(id: string, input: AdminUserInput): Promise<AdminUser> {
  const result = await invoke<{ user: AdminUser }>('update', { id, user: input });
  return result.user;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await invoke('delete', { id });
}
