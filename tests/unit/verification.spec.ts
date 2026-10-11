import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { resend: vi.fn(), verifyOtp: vi.fn() } },
}));

let verification: typeof import('@/lib/verification');

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-11T00:00:00Z'));
  verification = await import('@/lib/verification');
});
afterEach(() => vi.useRealTimers());

describe('signup confirmation requests', () => {
  it('resends signup confirmation using the normalized address', async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: { user: null, session: null }, error: null });
    await verification.resendSignupCode(' Person@Example.com ');
    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: 'signup', email: 'person@example.com',
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    expect(verification.emailRetrySeconds('PERSON@example.com')).toBe(60);
  });

  it('blocks duplicate requests until the cooldown expires', async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: { user: null, session: null }, error: null });
    await verification.resendSignupCode('person@example.com');
    await expect(verification.resendSignupCode('person@example.com')).rejects.toThrow('Please wait');
    expect(supabase.auth.resend).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    await verification.resendSignupCode('person@example.com');
    expect(supabase.auth.resend).toHaveBeenCalledTimes(2);
  });

  it('propagates SMTP errors so the page cannot report success', async () => {
    const error = { code: 'email_address_not_authorized', message: 'Email address not authorized' };
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: { user: null, session: null }, error } as never);
    await expect(verification.resendSignupCode('person@example.com')).rejects.toBe(error);
  });

  it('propagates rejected network requests', async () => {
    vi.mocked(supabase.auth.resend).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(verification.resendSignupCode('person@example.com')).rejects.toThrow('Failed to fetch');
  });

  it('rejects invalid inputs without contacting Supabase', async () => {
    await expect(verification.resendSignupCode('not-an-email')).rejects.toThrow('valid email');
    await expect(verification.verifySignupCode('person@example.com', '')).rejects.toThrow('numeric code');
    expect(supabase.auth.resend).not.toHaveBeenCalled();
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('does not treat a response without a session as successful verification', async () => {
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({ data: { user: { id: 'user-1' }, session: null }, error: null } as never);
    await expect(verification.verifySignupCode('person@example.com', '123456')).rejects.toThrow('No sign-in session');
  });

  it('preserves expired-code errors', async () => {
    const error = { code: 'otp_expired', message: 'Token has expired or is invalid' };
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({ data: { user: null, session: null }, error } as never);
    await expect(verification.verifySignupCode('person@example.com', '123456')).rejects.toBe(error);
  });

  it('verifies the email code and clears the cooldown only after success', async () => {
    verification.markEmailRequested('person@example.com');
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({ data: { user: { id: 'user-1' }, session: { access_token: 'test' } }, error: null } as never);
    await expect(verification.verifySignupCode(' Person@Example.com ', ' 123456 ')).resolves.toBe('user-1');
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'person@example.com', token: '123456', type: 'email' });
    expect(verification.emailRetrySeconds('person@example.com')).toBe(0);
  });
});
