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

export const getDashboardPath = (role) => {
  const routes = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    staff: '/staff/dashboard',
    admin: '/admin/dashboard',
  };
  return routes[role] || '/login';
};

// Purge any legacy authentication keys that might have existed in localStorage
const purgeLegacyStorage = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('auth');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('chautari_remember_email');
    localStorage.removeItem('chautari_remember_me');
  } catch {}
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session by verifying HttpOnly cookie with backend
  useEffect(() => {
    purgeLegacyStorage();

    let isMounted = true;
    const initAuth = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/me');
        if (isMounted && data && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithDevFallback = useCallback(
    (email, password) => {
      if (!isDevEnvironment()) {
        throw new DevAuthError('Unable to reach the server. Please check your connection and try again.');
      }

      if (matchesDevCredentials(email, password)) {
        const devUser = createDemoDevUser();
        const data = buildDevLoginResponse(devUser);
        setUser(data.user);
        return data;
      }

      throw new DevAuthError('Invalid development credentials.');
    },
    []
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
      setUser(data.user);
      return data;
    },
    []
  );

  const login = useCallback(
    async (email, password) => {
      const backendOnline = await isBackendAvailable();

      if (!backendOnline && isDevEnvironment()) {
        return loginWithDevFallback(email, password);
      }

      try {
        const { data } = await axiosInstance.post('/auth/login', { email, password });
        if (data.user) {
          setUser(data.user);
        }
        return data;
      } catch (error) {
        if (isDevEnvironment() && isBackendUnavailableError(error)) {
          return loginWithDevFallback(email, password);
        }
        throw error;
      }
    },
    [loginWithDevFallback]
  );

  const register = useCallback(
    async (payload) => {
      const backendOnline = await isBackendAvailable();

      if (!backendOnline && isDevEnvironment()) {
        return registerWithDevFallback(payload);
      }

      try {
        const { data } = await axiosInstance.post('/auth/register', payload);
        if (data.user && data.user.status === 'approved') {
          setUser(data.user);
        }
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

  const loginWithGoogle = useCallback(
    async (googlePayload) => {
      const { data } = await axiosInstance.post('/auth/google', googlePayload);
      if (data.user) {
        setUser(data.user);
      }
      return data;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {}
    purgeLegacyStorage();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && (user.id || user._id)),
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, loading, login, register, loginWithGoogle, logout]
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
