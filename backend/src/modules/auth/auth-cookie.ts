import { CookieOptions } from 'express';

export const REFRESH_COOKIE = 'refreshToken';

type SameSite = 'lax' | 'strict' | 'none';

function cookieSameSite(): SameSite {
  const raw = String(process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase();
  if (raw === 'strict' || raw === 'none' || raw === 'lax') {
    return raw;
  }
  return 'lax';
}

function cookieSecure() {
  const raw = process.env.COOKIE_SECURE;
  if (raw === 'true' || raw === '1') {
    return true;
  }
  if (raw === 'false' || raw === '0') {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

export function refreshCookieOptions(): CookieOptions {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  const path = process.env.COOKIE_PATH?.trim() || '/api/auth';
  return {
    httpOnly: true,
    // Browsers drop Secure cookies on plain HTTP. Default is secure in production.
    secure: cookieSecure(),
    sameSite: cookieSameSite(),
    path,
    ...(domain ? { domain } : {}),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
