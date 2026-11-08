import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount } from '../types/vore';
import {
  loginUserOnCloud,
  fetchUserProfileById,
} from '../services/userApiService';

interface AuthContextType {
  currentUser: UserAccount | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; message?: string; user?: UserAccount }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setCurrentUserDirectly: (user: UserAccount | null) => void;
}

const SESSION_STORAGE_KEY = 'swaraku_current_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore error
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh data profil user dari Cloud Database saat halaman di-refresh / dimuat ulang
  useEffect(() => {
    const syncFreshProfile = async () => {
      if (!currentUser?.id) return;
      try {
        setIsRefreshing(true);
        const freshUser = await fetchUserProfileById(currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(freshUser));
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Gagal sinkronisasi data profil terbaru:', err);
      } finally {
        setIsRefreshing(false);
      }
    };

    syncFreshProfile();
  }, []);

  const login = async (
    usernameOrEmail: string,
    password?: string
  ): Promise<{ success: boolean; message?: string; user?: UserAccount }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validasi langsung ke Server Cloud Database (Google Sheets API / Firestore)
      const result = await loginUserOnCloud(usernameOrEmail, password);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        if (typeof window !== 'undefined') {
          // HANYA menyimpan sesi user aktif saat ini di perangkat, bukan database users!
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result.user));
        }
        return { success: true, user: result.user };
      } else {
        const errorMsg = result.message || 'Username atau password tidak cocok.';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Terjadi kesalahan saat menghubungi database server.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('swaraku_current_user'); // Bersihkan legacy key jika ada
    }
  };

  const refreshProfile = async () => {
    if (!currentUser?.id) return;
    setIsRefreshing(true);
    try {
      const freshUser = await fetchUserProfileById(currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(freshUser));
        }
      }
    } catch (err) {
      console.error('[AuthContext] Gagal memperbarui profil dari server:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const setCurrentUserDirectly = (user: UserAccount | null) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isRefreshing,
        error,
        login,
        logout,
        refreshProfile,
        setCurrentUserDirectly,
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
