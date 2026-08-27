import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationApi from '../api/notificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30000; // 30 seconds

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const refreshUnreadCount = useCallback(() => {
    if (!user) return;
    notificationApi.getUnreadCount()
      .then((data) => setUnreadCount(data?.unreadCount ?? 0))
      .catch(() => {
        // Silent — a failed poll shouldn't surface an error toast every 30s.
      });
  }, [user]);

  const fetchNotifications = useCallback((page = 1) => {
    if (!user) return;
    setLoading(true);
    notificationApi.getMyNotifications(page)
      .then((data) => {
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        if (typeof data?.unreadCount === 'number') setUnreadCount(data.unreadCount);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [user]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationApi.markAsRead(id);
    } catch {
      // Roll back is skippable here — next poll/fetch will resync truth anyway.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllAsRead();
    } catch {
      refreshUnreadCount();
    }
  }, [refreshUnreadCount]);

  const deleteNotification = useCallback(async (id) => {
    const wasUnread = notifications.find((n) => n._id === id)?.isRead === false;
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationApi.deleteNotification(id);
    } catch {
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // Start/stop polling based on login state
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    refreshUnreadCount();
    pollRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, refreshUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};

export default NotificationContext;