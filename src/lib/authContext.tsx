import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, BackendMember, getAuthToken, setAuthToken } from './api';
import {
  getLocalMembers,
  saveLocalMember,
  verifyLocalMember,
  updateLocalMember,
  getCachedCurrentUser,
  setCachedCurrentUser,
} from './localAuth';

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
  const [user, setUser] = useState<BackendMember | null>(() => getCachedCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setCachedCurrentUser(null);
      setIsLoading(false);
      return;
    }

    // If it's a local fallback token, load cached member immediately
    if (token.startsWith('local_token_')) {
      const cached = getCachedCurrentUser();
      if (cached) {
        setUser(cached);
      }
      setIsLoading(false);
      return;
    }

    // Try live backend API
    try {
      const me = await api.getMe();
      if (me && me.id) {
        setUser(me);
        setCachedCurrentUser(me);
      }
    } catch (err) {
      console.warn("Backend auth check failed, checking local cache:", err);
      const cached = getCachedCurrentUser();
      if (cached) {
        setUser(cached);
      } else {
        setAuthToken(null);
        setUser(null);
        setCachedCurrentUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const normEmail = email.trim().toLowerCase();

    try {
      let loggedUser: BackendMember | null = null;
      let token: string | null = null;

      // 1. Try Live Go Backend first
      try {
        const res = await api.login(normEmail, password);
        if (res && res.member) {
          loggedUser = res.member;
          token = res.token;
        }
      } catch (backendErr) {
        console.warn("Live backend unreachable, falling back to local auth mode:", backendErr);
      }

      // 2. Fallback to Local Verified Accounts
      if (!loggedUser) {
        const local = verifyLocalMember(normEmail, password);
        if (local) {
          loggedUser = local;
          token = `local_token_${local.id}_${Date.now()}`;
        } else if (normEmail === 'admin@techshastra.club' && password === 'admin123') {
          // Super admin fallback
          loggedUser = {
            id: 'admin_1',
            name: 'Super Admin',
            email: 'admin@techshastra.club',
            role: 'admin',
            bio: 'TechShastra Lead Administrator',
            created_at: new Date().toISOString(),
          };
          token = `local_token_admin_${Date.now()}`;
        } else {
          throw new Error('Invalid email or password.');
        }
      }

      if (token) {
        setAuthToken(token);
      }
      setUser(loggedUser);
      setCachedCurrentUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    const normEmail = data.email.trim().toLowerCase();

    try {
      let registeredUser: BackendMember | null = null;
      let token: string | null = null;

      // 1. Try Live Go Backend first
      try {
        const res = await api.register(data.name.trim(), normEmail, data.password, 'student');
        if (res && res.member) {
          registeredUser = res.member;
          token = res.token;
        }
      } catch (backendErr: any) {
        console.warn("Live backend unreachable, persisting account locally:", backendErr);
        // If the backend specifically rejected because email exists, bubble it up
        if (backendErr?.message && backendErr.message.includes('already registered')) {
          throw backendErr;
        }
      }

      // 2. Fallback to Local Member Creation
      if (!registeredUser) {
        const localMembers = getLocalMembers();
        const existing = localMembers.find(m => m.email.toLowerCase() === normEmail);
        if (existing) {
          throw new Error('An account with this email address already exists. Please log in.');
        }

        const newId = `usr_${Date.now()}`;
        registeredUser = {
          id: newId,
          name: data.name.trim(),
          email: normEmail,
          role: 'student',
          student_id: data.student_id?.trim() || '',
          bio: data.bio?.trim() || '',
          github: data.github?.trim() || '',
          linkedin: data.linkedin?.trim() || '',
          skills: data.skills?.trim() || '',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
          created_at: new Date().toISOString(),
          projects_count: 0,
          activity_count: 1,
          registration_count: 0,
        };

        saveLocalMember(registeredUser, data.password);
        token = `local_token_${newId}_${Date.now()}`;
      }

      if (token) {
        setAuthToken(token);
      }
      setUser(registeredUser);
      setCachedCurrentUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setCachedCurrentUser(null);
    sessionStorage.removeItem("ts_admin_session");
  };

  const updateProfile = async (data: { name?: string; bio?: string; github?: string; linkedin?: string; skills?: string; avatar?: string }) => {
    if (!user) return;
    
    let updated: BackendMember = {
      ...user,
      ...data,
    };

    try {
      const res = await api.updateProfile(data);
      if (res && res.id) {
        updated = res;
      }
    } catch (err) {
      console.warn("Live backend update failed, updating locally:", err);
    }

    setUser(updated);
    setCachedCurrentUser(updated);
    updateLocalMember(updated);
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
