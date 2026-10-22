import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badge?: string;
  jurisdiction?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  login: (userData: AuthUser) => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperOrProjectAdmin: boolean;
}

const STORAGE_KEY = 'neramp_mgmt_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === 'SUPER_ADMIN' && parsed?.name?.includes('Ibrahim')) {
          parsed.name = 'Engr. Idris A.';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role) return parsed.role;
      }
    } catch {
      // ignore
    }
    return 'PUBLIC_USER';
  });

  const login = (userData: AuthUser) => {
    setUser(userData);
    setRole(userData.role);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // ignore
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const logout = () => {
    setRole('PUBLIC_USER');
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const isAuthenticated = !!user && role !== 'PUBLIC_USER';
  const isSuperOrProjectAdmin = role === 'SUPER_ADMIN' || role === 'PROJECT_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        login,
        switchRole,
        logout,
        isAuthenticated,
        isSuperOrProjectAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
