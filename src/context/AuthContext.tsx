import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import {api, getToken, setToken} from '@/lib/api';
import type {User} from '@/types';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  updateProfile: (fields: {name?: string; phone?: string}) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Restore the session from a persisted JWT on first load
    if (!getToken()) {
      setInitializing(false);
      return;
    }
    api<{user: User}>('/auth/me')
      .then(r => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setInitializing(false));
  }, []);

  const value: AuthContextValue = {
    user,
    initializing,
    async login(email, password) {
      const r = await api<{token: string; user: User}>('/auth/login', {method: 'POST', body: {email, password}});
      setToken(r.token);
      setUser(r.user);
      return r.user;
    },
    async register(name, email, password, phone) {
      const r = await api<{token: string; user: User}>('/auth/register', {
        method: 'POST',
        body: {name, email, password, phone},
      });
      setToken(r.token);
      setUser(r.user);
      return r.user;
    },
    logout() {
      setToken(null);
      setUser(null);
    },
    async updateProfile(fields) {
      const r = await api<{user: User}>('/auth/me', {method: 'PATCH', body: fields});
      setUser(r.user);
      return r.user;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
