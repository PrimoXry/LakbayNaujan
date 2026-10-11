import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorCode, errorMessage, logRequestError } from '@/lib/errors';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('request error messages', () => {
  it('preserves a plain PostgREST error instead of discarding it', () => {
    expect(errorMessage({ message: 'Could not find the table', code: 'PGRST205' }, 'Something went wrong.'))
      .toBe('Could not find the table');
  });

  it('handles Error instances, unknown errors, and missing messages', () => {
    expect(errorMessage(new Error('Connection closed'), 'Fallback')).toBe('Connection closed');
    for (const value of [null, undefined, {}, { message: 123 }, { message: ' ' }]) {
      expect(errorMessage(value, 'Fallback')).toBe('Fallback');
    }
  });

  it('explains restricted email delivery without claiming the email was sent', () => {
    expect(errorMessage({ code: 'email_address_not_authorized', message: 'not authorized' }, 'Fallback'))
      .toContain('Email delivery is not enabled');
  });

  it('distinguishes sending limits from an expired verification code', () => {
    expect(errorMessage({ code: 'over_email_send_rate_limit' }, 'Fallback')).toContain('sending limit');
    expect(errorMessage({ code: 'otp_expired' }, 'Fallback')).toContain('invalid or has expired');
  });

  it('identifies unconfirmed email errors for the login recovery link', () => {
    expect(errorCode({ code: 'email_not_confirmed' })).toBe('email_not_confirmed');
    expect(errorCode(null)).toBe('');
    expect(errorCode({ code: 123 })).toBe('');
  });
});

describe('development request diagnostics', () => {
  it('prints the server status, code and message without logging the request object', () => {
    vi.stubEnv('DEV', true);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logRequestError('signup', {
      status: 500, code: 'unexpected_failure', message: 'Error sending confirmation email',
      password: 'do-not-log', access_token: 'do-not-log', request: { email: 'private@example.com' },
    });
    expect(log).toHaveBeenCalledExactlyOnceWith('[LakbayNaujan signup] {"status":500,"code":"unexpected_failure","message":"Error sending confirmation email"}');
  });

  it('does not log diagnostics in production', () => {
    vi.stubEnv('DEV', false);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logRequestError('signup', new Error('Server error'));
    expect(log).not.toHaveBeenCalled();
  });
});
