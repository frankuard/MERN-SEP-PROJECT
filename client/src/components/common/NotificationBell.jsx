import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationBell = ({ t, onNavigate }) => {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (n) => {
    if (!n.isRead) markAsRead(n._id);
    if (n.link && onNavigate) {
      // Notification links are sometimes stored with a leading slash
      // ('/events', '/ssd-help') while activeTab checks expect the bare
      // tab id ('events', 'ssd-help'). Strip it here so both forms work,
      // regardless of which format any given controller wrote.
      onNavigate(n.link.replace(/^\//, ''));
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: t.textPrimary }}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed left-1/2 top-16 z-50 w-[90vw] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl border shadow-lg sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 sm:w-80 sm:max-w-none sm:translate-x-0 sm:sm:w-96"
          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        >
          <div className="flex items-center justify-between border-b p-3.5" style={{ borderColor: t.border }}>
            <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: t.accentPrimary }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="p-6 text-center text-sm" style={{ color: t.textMuted }}>Loading...</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="p-6 text-center text-sm" style={{ color: t.textMuted }}>No notifications yet.</p>
            )}
            {!loading && notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className="flex cursor-pointer items-start gap-2.5 border-b p-3.5 transition-colors last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: t.border, backgroundColor: n.isRead ? 'transparent' : t.chipBg }}
              >
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.accentPrimary }} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-snug" style={{ color: t.textPrimary }}>{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed" style={{ color: t.textMuted }}>{n.message}</p>
                  <p className="mt-1 text-[10px] font-semibold" style={{ color: t.textMuted }}>{timeAgo(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                      className="rounded-lg p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Mark as read"
                    >
                      <Check size={13} style={{ color: t.textMuted }} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                    className="rounded-lg p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                    title="Delete"
                  >
                    <Trash2 size={13} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;