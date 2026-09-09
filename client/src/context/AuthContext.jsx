import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import axiosInstance from '../api/axiosInstance';
import { connectSocket, disconnectSocket } from '../socket/socket';
import { DEV_CORPS_PORTAL_ID } from '../data/devcorpsConfig';

const AuthContext = createContext(null);

export const getDashboardPath = (user) => {
  // Dedicated community portals take precedence over the role-based routes.
  if (user?.portal === DEV_CORPS_PORTAL_ID) {
    return '/devcorps/dashboard';
  }

  const routes = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    staff: '/staff/dashboard',
    admin: '/admin/dashboard',
  };

  return routes[user?.role] || '/login';
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the logged-in user from the backend session.
  // The JWT is stored in an HttpOnly cookie, so JavaScript
  // does not need to access or store the token.
  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const response = await axiosInstance.get('/auth/me');

        if (mounted && response.data?.user) {
          setUser(response.data.user);
          connectSocket();
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
    });

    if (response.data?.user) {
      setUser(response.data.user);
      connectSocket();
    }

    return response.data;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await axiosInstance.post('/auth/register', payload);

    if (response.data?.user && response.data.user.status === 'approved') {
      setUser(response.data.user);
      connectSocket();
    }

    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      disconnectSocket();
    }
  }, []);

  // Re-fetch the authenticated user from the backend (e.g. right after the
  // user approves a community membership, so the sidebar's Community section
  // appears immediately). Returns the fresh user or null on failure.
  const refreshUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      if (response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: Boolean(user && (user.id || user._id)),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};