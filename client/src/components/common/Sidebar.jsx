import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
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

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const t = themes[theme];

  const [collapsed, setCollapsed] = useState(false);
  const [activeId, setActiveId] = useState('dashboard');

  const role = user?.role || 'student';
  const items = navConfig[role] || navConfig.student;
  const initials = user?.username?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={`relative flex min-h-screen flex-col border-r transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        backgroundColor: t.sidebarBg,
        borderColor: t.border,
        color: t.textPrimary,
      }}
    >
      <div
        className={`flex items-center border-b px-4 py-5 ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
        style={{ borderColor: t.border }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          {initials}
        </div>

        {!collapsed && (
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: t.textMuted }}>
              {role}
            </p>
            <h2 className="truncate text-sm font-semibold" style={{ color: t.textPrimary }}>
              {user?.username || roleLabels[role]}
            </h2>
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 right-0 z-50 flex h-8 w-8 translate-x-1/2 items-center justify-center rounded-full border shadow-md"
          style={{
            backgroundColor: t.sidebarBg,
            borderColor: t.border,
            color: t.textPrimary,
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '>' : '<'}
        </button>
      </div>

      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={toggleTheme}
          className={`relative h-10 rounded-full transition-all duration-300 ${
            collapsed ? 'w-10' : 'w-16'
          }`}
          style={{ backgroundColor: t.hoverBg }}
          aria-label="Toggle theme"
        >
          <div
            className={`absolute top-1 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
              theme === 'dark' ? 'left-1' : 'left-7'
            }`}
            style={{ backgroundColor: t.sidebarBg, color: t.textPrimary }}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4">
        {!collapsed && (
          <p
            className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: t.textMuted }}
          >
            Main
          </p>
        )}

        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className={`flex items-center rounded-lg px-3 py-2.5 transition-all duration-200 ${
                collapsed ? 'justify-center' : 'gap-3'
              }`}
              style={{
                backgroundColor: activeId === item.id ? t.activeBg : 'transparent',
                color: activeId === item.id ? t.activeText : t.textPrimary,
                border:
                  activeId === item.id
                    ? `1px solid ${t.activeBorder}`
                    : '1px solid transparent',
              }}
            >
              <item.icon size={19} aria-hidden="true" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t px-3 py-4" style={{ borderColor: t.border }}>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center rounded-lg px-3 py-2.5 transition-colors ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
          style={{ color: t.textMuted }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = t.hoverBg;
            event.currentTarget.style.color = t.textPrimary;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = 'transparent';
            event.currentTarget.style.color = t.textMuted;
          }}
        >
          <LogOut size={19} aria-hidden="true" />
          {!collapsed && <span className="text-sm font-medium">Log out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
