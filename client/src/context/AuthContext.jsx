import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { isBackendAvailable } from '../utils/apiHealth';
import {
  DevAuthError,
  buildDevLoginResponse,
  createDemoDevUser,
  createDevUserFromSignup,
  isDevEnvironment,
  isBackendUnavailableError,
  matchesDevCredentials,
} from '../utils/devAuth';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
};

export const getDashboardPath = (role) => {
  const routes = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    staff: '/staff/dashboard',
    admin: '/admin/dashboard',
  };
  return routes[role] || '/login';
};

const readStoredAuth = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const userRaw = localStorage.getItem(STORAGE_KEYS.user);
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token: storedToken, user: storedUser } = readStoredAuth();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const persistAuth = useCallback((nextToken, nextUser) => {
    localStorage.setItem(STORAGE_KEYS.token, nextToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    setToken(null);
    setUser(null);
  }, []);

  const loginWithDevFallback = useCallback(
    (email, password) => {
      if (!isDevEnvironment()) {
        throw new DevAuthError('Unable to reach the server. Please check your connection and try again.');
      }

      if (matchesDevCredentials(email, password)) {
        const devUser = createDemoDevUser();
        const data = buildDevLoginResponse(devUser);
        persistAuth(data.token, data.user);
        return data;
      }

      throw new DevAuthError('Invalid development credentials.');
    },
    [persistAuth]
  );

  const registerWithDevFallback = useCallback(
    (payload) => {
      if (!isDevEnvironment()) {
        throw new DevAuthError('Unable to reach the server. Please check your connection and try again.');
      }

      const devUser = createDevUserFromSignup({
        username: payload.username,
        email: payload.email,
        role: payload.role,
      });
      const data = buildDevLoginResponse(
        devUser,
        'Development account created locally. Signed in for this session.'
      );
      persistAuth(data.token, data.user);
      return data;
    },
    [persistAuth]
  );

  const login = useCallback(
    async (email, password) => {
      const backendOnline = await isBackendAvailable();

      if (!backendOnline && isDevEnvironment()) {
        return loginWithDevFallback(email, password);
      }

      try {
        const { data } = await axiosInstance.post('/auth/login', { email, password });
        persistAuth(data.token, data.user);
        return data;
      } catch (error) {
        if (isDevEnvironment() && isBackendUnavailableError(error)) {
          return loginWithDevFallback(email, password);
        }
        throw error;
      }
    },
    [persistAuth, loginWithDevFallback]
  );

  const register = useCallback(
    async (payload) => {
      const backendOnline = await isBackendAvailable();

      if (!backendOnline && isDevEnvironment()) {
        return registerWithDevFallback(payload);
      }

      try {
        const { data } = await axiosInstance.post('/auth/register', payload);
        return data;
      } catch (error) {
        if (isDevEnvironment() && isBackendUnavailableError(error)) {
          return registerWithDevFallback(payload);
        }
        throw error;
      }
    },
    [registerWithDevFallback]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
