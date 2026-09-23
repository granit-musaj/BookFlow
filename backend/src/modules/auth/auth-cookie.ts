import { CookieOptions } from 'express';

export const REFRESH_COOKIE = 'refreshToken';

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // Browsers drop Secure cookies on plain HTTP. In production the API must be HTTPS
    // or login/refresh fails silently after the first 15 minutes.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
