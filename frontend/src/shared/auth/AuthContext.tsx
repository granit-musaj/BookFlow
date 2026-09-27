import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../lib/api';
import { getDemoUser, isDemo, setDemoUser } from '../lib/demo';
import { AuthResponse, PublicUser } from '../types/auth';

type AuthContextValue = {
  user: PublicUser | null;
  ready: boolean;
  setSession: (response: AuthResponse) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => (isDemo() ? getDemoUser() : null));
  const [ready, setReady] = useState(isDemo());

  useEffect(() => {
    if (isDemo()) {
      if (user) {
        setAccessToken('demo-access');
      }
      return;
    }

    let cancelled = false;
    api<AuthResponse>('/auth/refresh', { method: 'POST', body: '{}' })
      .then((response) => {
        setAccessToken(response.tokens.accessToken);
        return api<PublicUser>('/auth/me');
      })
      .then((me) => {
        if (!cancelled) {
          setUser(me);
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
      logout: async () => {
        if (isDemo()) {
          setDemoUser(null);
        } else {
          await api('/auth/logout', { method: 'POST', body: '{}' }).catch(() => undefined);
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
