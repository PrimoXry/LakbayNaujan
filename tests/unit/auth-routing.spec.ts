import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { destinationForUser } from '@/lib/auth';

type Target = { path: string; meta: { requiresAuth?: boolean; requiresAdmin?: boolean }; query: Record<string, string> };
const hooks = vi.hoisted(() => ({ guard: null as null | ((to: Target) => Promise<unknown>) }));
vi.mock('@ionic/vue-router', () => ({
  createWebHistory: vi.fn(),
  createRouter: () => ({ beforeEach: (guard: typeof hooks.guard) => { hooks.guard = guard; } }),
}));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getUser: vi.fn() } } }));
vi.mock('@/lib/auth', () => ({ destinationForUser: vi.fn() }));
import '@/router';

beforeEach(() => vi.resetAllMocks());

describe('auth navigation failures', () => {
  it.each(['/signup', '/verify', '/auth/callback'])('keeps %s reachable without a session request', async (path) => {
    expect(await hooks.guard!({ path, meta: {}, query: {} })).toBe(true);
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('blocks a protected route when session validation fails', async () => {
    vi.mocked(supabase.auth.getUser).mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await hooks.guard!({ path: '/admin', meta: { requiresAuth: true, requiresAdmin: true }, query: {} }))
      .toEqual({ path: '/login', query: { reason: 'session' } });
  });

  it('handles returned auth errors as well as rejected requests', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: { message: 'Network error' } } as never);
    expect(await hooks.guard!({ path: '/tourists', meta: { requiresAuth: true }, query: {} }))
      .toEqual({ path: '/login', query: { reason: 'session' } });
  });

  it('denies admin access when the profile query fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null } as never);
    vi.mocked(destinationForUser).mockRejectedValue({ message: 'Permission lookup failed' });
    expect(await hooks.guard!({ path: '/admin', meta: { requiresAuth: true, requiresAdmin: true }, query: {} }))
      .toEqual({ path: '/login', query: { reason: 'profile' } });
  });

  it('denies admin access to an ordinary user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null } as never);
    vi.mocked(destinationForUser).mockResolvedValue('/tourists');
    expect(await hooks.guard!({ path: '/admin', meta: { requiresAuth: true, requiresAdmin: true }, query: {} })).toBe('/tourists');
  });

  it('does not redirect the error page back into a failed permission lookup', async () => {
    expect(await hooks.guard!({ path: '/login', meta: {}, query: { reason: 'profile' } })).toBe(true);
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });
});
