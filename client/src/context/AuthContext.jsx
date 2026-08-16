import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

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

  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email, password });
    persistAuth(data.token, data.user);
    return data;
  }, [persistAuth]);

  const register = useCallback(async (payload) => {
    const { data } = await axiosInstance.post('/auth/register', payload);
    return data;
  }, []);

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
