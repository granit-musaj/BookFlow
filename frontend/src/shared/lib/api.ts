import { handleDemo, isDemo } from './demo';

export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type AuthPayload = {
  user: unknown;
  tokens: { accessToken: string; refreshToken?: string };
};

export async function api<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  if (isDemo()) {
    return handleDemo<T>(path, options);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Backend-i nuk është i arritshëm. Për demo përdor ?demo=true ose butonin Provo.');
  }

  const data = (await response.json().catch(() => null)) as T | { message?: string };

  if (response.status === 401 && !retried && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return api<T>(path, options, true);
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data ? String(data.message) : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

async function tryRefresh() {
  try {
    const result = await api<AuthPayload>('/auth/refresh', { method: 'POST', body: '{}' });
    setAccessToken(result.tokens.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}
