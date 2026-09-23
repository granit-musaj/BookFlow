import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../lib/api';
import { isDemo, setDemoUser } from '../lib/demo';
import { AuthResponse, PublicUser } from '../types/auth';

type AuthContextValue = {
  user: PublicUser | null;
  ready: boolean;
  setSession: (response: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(isDemo());

  useEffect(() => {
    if (isDemo()) {
      return;
    }

    let cancelled = false;
    api<AuthResponse>('/auth/refresh', { method: 'POST', body: '{}' })
      .then((response) => {
        if (!cancelled) {
          setAccessToken(response.tokens.accessToken);
          setUser(response.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      setSession: (response) => {
        setAccessToken(response.tokens.accessToken);
        if (isDemo()) {
          setDemoUser(response.user);
        }
        setUser(response.user);
      },
      logout: () => {
        if (isDemo()) {
          setDemoUser(null);
        } else {
          void api('/auth/logout', { method: 'POST', body: '{}' }).catch(() => undefined);
        }
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
