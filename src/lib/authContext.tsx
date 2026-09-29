import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, BackendMember, getAuthToken, setAuthToken } from './api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  student_id?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  skills?: string;
}

interface AuthContextType {
  user: BackendMember | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; bio?: string; github?: string; linkedin?: string; skills?: string; avatar?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BackendMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.warn("Failed to validate auth session:", err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.member);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      // Call api.register or custom payload
      const res = await api.login(data.email, data.password).catch(async () => {
        // Fallback register
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Registration failed' }));
          throw new Error(err.error || 'Registration failed');
        }
        const json = await response.json();
        if (json.token) setAuthToken(json.token);
        return json;
      });
      setUser(res.member);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    // Also clear admin session if any
    sessionStorage.removeItem("ts_admin_session");
  };

  const updateProfile = async (data: { name?: string; bio?: string; github?: string; linkedin?: string; skills?: string; avatar?: string }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'core';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
