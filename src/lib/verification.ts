import { supabase } from './supabase';

// A UI cooldown only. Supabase enforces the actual server-side sending limits.
const retryAfter = new Map<string, number>();
export const EMAIL_RETRY_SECONDS = 60;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function markEmailRequested(email: string): void {
  retryAfter.set(normalizeEmail(email), Date.now() + EMAIL_RETRY_SECONDS * 1000);
}

export function emailRetrySeconds(email: string): number {
  return Math.max(0, Math.ceil(((retryAfter.get(normalizeEmail(email)) ?? 0) - Date.now()) / 1000));
}

export async function resendSignupCode(email: string): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) throw new Error('Enter a valid email address.');
  if (emailRetrySeconds(cleanEmail)) throw new Error('Please wait before requesting another code.');
  // Set before awaiting so repeated requests cannot run concurrently.
  markEmailRequested(cleanEmail);
  const { error } = await supabase.auth.resend({
    type: 'signup', email: cleanEmail,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function verifySignupCode(email: string, token: string): Promise<string> {
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) throw new Error('Enter a valid email address.');
  if (!/^\d+$/.test(token.trim())) throw new Error('Enter the numeric code from your email.');
  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail, token: token.trim(), type: 'email',
  });
  if (error) throw error;
  if (!data.user || !data.session) throw new Error('No sign-in session was returned. Please try logging in.');
  retryAfter.delete(cleanEmail);
  return data.user.id;
}
