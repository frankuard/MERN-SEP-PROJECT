import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import navConfig from '../../data/navConfig';
import { themes } from '../../data/themes';
import { disconnectSocket } from '../../socket/socket';

const roleLabels = {
  student: 'Student Portal',
  teacher: 'Teacher Portal',
  staff: 'Staff Portal',
  admin: 'Admin Portal',
};

const Sidebar = ({ activeTab: controlledActiveTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const t = themes[theme] || themes.light;

  const [collapsed, setCollapsed] = useState(false);
  const [internalActiveId, setInternalActiveId] = useState('dashboard');
  const navRef = useRef(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const activeId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveId;

  const role = user?.role || 'student';
  const items = navConfig[role] || navConfig.student;
  const username = user?.username || 'Suraj Poddar';
  const initials = username.charAt(0).toUpperCase() || 'S';

  // Fixed accent for the scroll hint — reuses the same accent already used
  // for the active nav highlight, so it's a color proven to read well in
  // both light and dark mode, rather than a muted theme-gray nobody notices.
  const scrollAccent = t.activeBorder || '#168899';

  // Detect whether the nav list has content hidden below the fold, so we can
  // show a "scroll for more" hint instead of relying on users to notice a
  // thin scrollbar on their own.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setHasMoreBelow(remaining > 4);
    };

    checkOverflow();
    el.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);

    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [items, collapsed]);

  const handleItemClick = (id) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveId(id);
    }
    if (onTabChange) {
      onTabChange(id);
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col self-start border-r transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        backgroundColor: t.sidebarBg,
        borderColor: t.border,
        color: t.textPrimary,
      }}
    >
      <style>{`
        .sidebar-nav-scroll::-webkit-scrollbar { width: 6px; }
        .sidebar-nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb { background-color: ${scrollAccent}; border-radius: 999px; }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb:hover { background-color: ${scrollAccent}; opacity: 0.85; }
      `}</style>

      {/* Sidebar controls toolbar */}
      <div
        className={`flex items-center border-b px-3 py-2.5 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
        style={{ borderColor: t.border, backgroundColor: t.hoverBg }}
      >
        {!collapsed && (
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: t.textMuted }}
          >
            Menu
          </span>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-110"
          style={{
            backgroundColor: scrollAccent,
            borderColor: '#ffffff',
            color: '#ffffff',
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>
      </div>

      {/* User Header */}
      <div
        className={`flex items-center border-b px-4 py-4 ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
        style={{ borderColor: t.border }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold shadow-sm"
          style={{
            backgroundColor: theme === 'dark' ? '#3b82f6' : '#2f4336',
            color: '#ffffff',
          }}
        >
          {initials}
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
              {role}
            </p>
            <h2 className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>
              {roleLabels[role] || 'Student Portal'}
            </h2>
          </div>
        )}
      </div>

      {/* Theme Toggle Pill */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-7 w-12 items-center rounded-full border p-0.5 transition-colors"
          style={{
            backgroundColor: t.hoverBg,
            borderColor: t.border,
          }}
          aria-label="Toggle dark/light mode"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <div
            className="flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-sm transition-transform duration-200"
            style={{
              backgroundColor: t.cardBg || '#ffffff',
              color: t.textPrimary,
              transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0px)',
            }}
          >
            {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
          </div>
        </button>
      </div>

      {/* Main Nav Items */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={navRef}
          className="sidebar-nav-scroll h-full overflow-y-auto px-3 pt-5 pb-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: `${scrollAccent} transparent` }}
        >
          {!collapsed && (
            <p
              className="px-2.5 pb-2 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: t.textMuted }}
            >
              Main
            </p>
          )}

          <nav className="flex flex-col gap-1.5" aria-label="Sidebar Navigation">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center rounded-xl px-3 py-2.5 text-left font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : 'gap-3'
                  } ${
                    isActive
                      ? 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isActive ? t.activeBg : 'transparent',
                    color: isActive ? t.activeText : t.textPrimary,
                    border: isActive
                      ? `1px solid ${t.activeBorder}`
                      : '1px solid transparent',
                  }}
                >
                  <Icon
                    size={19}
                    className="shrink-0"
                    style={{
                      color: isActive ? t.activeText : t.textMuted,
                    }}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <span className="truncate text-[13.5px] tracking-tight">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Scroll-for-more hint — only shown while there's hidden content below */}
        {hasMoreBelow && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-1.5 pt-8">
            <div
              className="absolute inset-x-0 bottom-0 h-16"
              style={{
                background: `linear-gradient(to top, ${t.sidebarBg}, transparent)`,
              }}
            />
            <div className="relative flex items-center justify-center">
              <span
                className="absolute h-9 w-9 animate-ping rounded-full opacity-40"
                style={{ backgroundColor: scrollAccent }}
              />
              <span
                className="relative flex h-9 w-9 animate-bounce items-center justify-center rounded-full shadow-md"
                style={{ backgroundColor: scrollAccent }}
              >
                <ChevronDown size={20} color="#ffffff" strokeWidth={3} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer: signed-in-as + logout */}
      <div className="space-y-2 border-t p-3" style={{ borderColor: t.border }}>
        {/* Signed in as */}
        {!collapsed ? (
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: t.hoverBg }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: theme === 'dark' ? '#3b82f6' : '#2f4336',
                color: '#ffffff',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-semibold"
                style={{ color: t.textPrimary }}
              >
                {username}
              </p>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-wider"
                style={{ color: t.textMuted }}
              >
                Signed in as {role}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`Signed in as ${role}`}>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: theme === 'dark' ? '#3b82f6' : '#2f4336',
                color: '#ffffff',
              }}
            >
              {initials}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
          style={{ color: t.textMuted }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = t.hoverBg;
            event.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = 'transparent';
            event.currentTarget.style.color = t.textMuted;
          }}
        >
          <LogOut size={18} aria-hidden="true" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;