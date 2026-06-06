import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { User } from '@/types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Read initial state synchronously from localStorage — no async at this point
function getInitialToken(): string | null {
  return localStorage.getItem('token');
}

function getInitialUser(): User | null {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token] = useState<string | null>(getInitialToken);
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loading, setLoading] = useState(false); // Never block if we have data already

  // isAuthenticated is based on what we have RIGHT NOW
  const isAuthenticated = !!token && !!user;

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Hard reload to clear all state cleanly
    window.location.href = '/login';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    // Hard reload after login to get clean state
    window.location.href = `/${newUser.role.toLowerCase()}/dashboard`;
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
