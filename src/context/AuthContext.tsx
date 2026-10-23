import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';
import { loginManagement, registerManagement, logoutManagement, sendSessionHeartbeat } from '../services/api';

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
  sessionId: string | null;
  login: (userData: AuthUser, token?: string, sessionId?: string) => void;
  loginWithCredentials: (email: string, password?: string) => Promise<AuthUser>;
  registerWithCredentials: (data: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    badge?: string;
    jurisdiction?: string;
  }) => Promise<{ user?: AuthUser; requiresApproval?: boolean; message: string }>;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperOrProjectAdmin: boolean;
}

const STORAGE_USER_KEY = 'neramp_mgmt_auth_user';
const STORAGE_TOKEN_KEY = 'neramp_mgmt_token';
const STORAGE_SESSION_KEY = 'neramp_mgmt_session_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === 'SUPER_ADMIN' && parsed?.name?.includes('Ibrahim')) {
          parsed.name = 'Engr. Idris A.';
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_SESSION_KEY);
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role) return parsed.role;
      }
    } catch {
      // ignore
    }
    return 'PUBLIC_USER';
  });

  // Session Heartbeat Effect: updates session duration while active
  useEffect(() => {
    if (!sessionId || !user || role === 'PUBLIC_USER') return;

    // Send initial heartbeat
    sendSessionHeartbeat(sessionId, user.email);

    const interval = setInterval(() => {
      sendSessionHeartbeat(sessionId, user.email);
    }, 30000); // every 30s

    return () => clearInterval(interval);
  }, [sessionId, user, role]);

  const login = (userData: AuthUser, token?: string, newSessionId?: string) => {
    setUser(userData);
    setRole(userData.role);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
      if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token);
      if (newSessionId) {
        localStorage.setItem(STORAGE_SESSION_KEY, newSessionId);
        setSessionId(newSessionId);
      }
    } catch {
      // ignore
    }
  };

  const loginWithCredentials = async (email: string, password?: string): Promise<AuthUser> => {
    const res = await loginManagement(email, password);
    const authUser: AuthUser = res.user;
    login(authUser, res.token, res.sessionId);
    return authUser;
  };

  const registerWithCredentials = async (data: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    badge?: string;
    jurisdiction?: string;
  }): Promise<{ user?: AuthUser; requiresApproval?: boolean; message: string }> => {
    const res = await registerManagement(data);
    if (res.token && res.sessionId && !res.requiresApproval) {
      const authUser: AuthUser = res.user;
      login(authUser, res.token, res.sessionId);
      return { user: authUser, requiresApproval: false, message: res.message };
    }
    return {
      user: res.user,
      requiresApproval: true,
      message:
        res.message ||
        'Registration submitted successfully. Your account is pending review and authorization by the Super Admin (Engr. Idris A.) or Project Admin before access is granted.',
    };
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const logout = () => {
    if (sessionId && user) {
      logoutManagement(sessionId, user.email);
    }
    setRole('PUBLIC_USER');
    setUser(null);
    setSessionId(null);
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_SESSION_KEY);
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
        sessionId,
        login,
        loginWithCredentials,
        registerWithCredentials,
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
