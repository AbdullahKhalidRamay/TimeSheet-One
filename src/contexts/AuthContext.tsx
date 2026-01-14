import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, LoginRequest, LoginResponse, User } from '@/services/apiService';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!accessToken;

  // Initialize authentication from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken && storedRefreshToken && storedUser) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          try {
            await authService.getCurrentUser(storedAccessToken);
          } catch (error) {
            console.log('Stored token expired, attempting refresh...');
            await refreshAuth();
          }
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        // Clear invalid tokens
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before it expires
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        await logout();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15 minutes)

    return () => clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  const clearAuthData = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      console.log('Login response:', response);
      if (response.isSuccess && response.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data;
        
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (accessToken && refreshToken) {
        await authService.logout(refreshToken, accessToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthData();
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    if (!refreshToken) return false;

    try {
      const response = await authService.refreshToken(refreshToken);
      
      if (response.isSuccess && response.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data;
        
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setUser(userData);
        
        // Update localStorage
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
