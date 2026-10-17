import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '../types';

interface AuthUser {
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
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEFAULT_USER: AuthUser = {
  id: 'usr-obs-01',
  name: 'Lead Election Monitor',
  email: 'lead.observer@electionwatch.ng',
  role: 'REGISTERED_OBSERVER',
  badge: 'OBS-SW-042',
  jurisdiction: 'Lagos Island LGA & Ikeja LGA',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_USER);
  const [role, setRole] = useState<UserRole>('REGISTERED_OBSERVER');

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const logout = () => {
    setRole('PUBLIC_USER');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        switchRole,
        logout,
        isAuthenticated: !!user && role !== 'PUBLIC_USER',
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
