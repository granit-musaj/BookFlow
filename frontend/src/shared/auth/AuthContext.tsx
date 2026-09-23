import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { AuthResponse, PublicUser } from '../types/auth';

type AuthContextValue = {
  user: PublicUser | null;
  setSession: (response: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): PublicUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(readStoredUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setSession: (response) => {
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      },
    }),
    [user],
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
