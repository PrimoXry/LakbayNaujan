/** Supabase Auth throws Error instances; database requests can return plain objects. */
export function errorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) return '';
  return typeof error.code === 'string' ? error.code : '';
}

/** Log only response diagnostics in development, never credentials or request bodies. */
export function logRequestError(operation: string, error: unknown): void {
  if (!import.meta.env.DEV) return;
  const diagnostic = {
    status: typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
      ? error.status : null,
    code: errorCode(error) || null,
    message: typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message : 'Unknown request failure',
  };
  console.error(`[LakbayNaujan ${operation}] ${JSON.stringify(diagnostic)}`);
}

export function errorMessage(error: unknown, fallback: string): string {
  const code = errorCode(error);
  const message = typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
    ? error.message.trim() : '';
  switch (code) {
    case 'over_email_send_rate_limit':
      return 'The email sending limit has been reached. Please try later or contact support if this continues.';
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait before trying again.';
    case 'email_address_not_authorized':
      return 'Email delivery is not enabled for this address. Please contact support.';
    case 'email_not_confirmed':
      return 'Please verify your email before logging in. You can request another code below.';
    case 'otp_expired':
      return 'This code is invalid or has expired. Use the latest email or request a new code.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Unable to sign up with these details. If you already have an account, log in instead.';
    case '23505':
      return 'That value is already in use. Please choose a different one.';
    case '42501':
      return 'You do not have permission to perform this action. Please check which account is signed in.';
  }
  if (/database error saving new user/i.test(message)) {
    return 'Account creation could not finish. Try a different username; if it still fails, contact support.';
  }
  if (/error sending confirmation email/i.test(message)) {
    return 'The email service could not send the confirmation. Please try later or contact support.';
  }
  if (/failed to fetch|fetch failed|networkerror|network request failed/i.test(message)) {
    return 'Could not connect to the server. Check your internet connection and try again.';
  }
  return message || fallback;
}
