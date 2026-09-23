import { handleDemo, isDemo, enableDemo } from './demo';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isDemo()) {
    return handleDemo<T>(path, options);
  }

  const token = localStorage.getItem('accessToken');

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = (await response.json().catch(() => null)) as T | { message?: string };

    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'message' in data
          ? String(data.message)
          : 'Request failed';
      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    if (error instanceof TypeError) {
      enableDemo();
      return handleDemo<T>(path, options);
    }
    throw error;
  }
}
