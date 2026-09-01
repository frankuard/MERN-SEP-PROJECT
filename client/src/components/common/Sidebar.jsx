import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
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

// Shown in place of the old "@handle" line, admin accounts only —
// mirrors the department picker's own section names.
const ADMIN_SECTION_LABELS = {
  super: 'Super Admin',
  canteen: 'Canteen Admin',
  ssd: 'SSD Admin',
  rte: 'RTE Admin',
  resources: 'Resources Admin',
};

const CHAUTARI_LOGO_URL = 'https://ik.imagekit.io/ltf9bjszh/logos/chautari-logo.png';

const Sidebar = ({ activeTab: controlledActiveTab, onTabChange, navItems }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const t = themes[theme] || themes.light;

  const [collapsed, setCollapsed] = useState(false); // desktop mini-rail toggle
  const [mobileOpen, setMobileOpen] = useState(false); // mobile off-canvas toggle
  const [internalActiveId, setInternalActiveId] = useState('dashboard');
  const navRef = useRef(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const activeId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveId;

  const role = user?.role || 'student';
  // Optional override so a scoped panel (e.g. a department admin's own
  // mini nav) can pass its own short item list — falls back to the
  // untouched role-based lookup everywhere else, unchanged.
  const items = navItems || navConfig[role] || navConfig.student;
  const username = user?.username || '';
  // Second line under the name: admin accounts show their department
  // ("Resource Admin", "SSD Admin"...), everyone else shows nothing here
  // (the role caption below already says "Student Portal" etc.).
  const subLabel = role === 'admin' ? (ADMIN_SECTION_LABELS[user?.adminSection] || 'Admin') : '';

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const checkOverflow = () => {
      setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    };
    checkOverflow();
    el.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);
    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [items, collapsed]);

  // Close the mobile drawer automatically if the viewport grows into desktop size
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const handleItemClick = (id) => {
    if (controlledActiveTab === undefined) setInternalActiveId(id);
    onTabChange?.(id);
    setMobileOpen(false); // always close the drawer on nav; no-op on desktop
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile hamburger trigger — hidden once the drawer is open or on desktop */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-md lg:hidden"
          style={{
            backgroundColor: t.sidebarBg,
            color: t.sidebarText,
            border: `1px solid ${t.sidebarBorder || t.border}`,
          }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Backdrop — only rendered on mobile while the drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col self-start
          transition-transform duration-300 select-none
          lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-[4.5rem]' : 'lg:w-[260px]'}`}
        style={{
          backgroundColor: t.sidebarBg,
          borderRight: `1px solid ${t.sidebarBorder || t.border}`,
          color: t.sidebarText,
        }}
      >
        {/* Profile header */}
        <div className={`px-4 pt-5 pb-4 ${collapsed ? 'lg:flex lg:flex-col lg:items-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:flex-col lg:gap-2' : ''}`}>
            {/* Chautari logo, black circle */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black p-2"
            >
              <img
                src={CHAUTARI_LOGO_URL}
                alt="Chautari"
                className="h-full w-full object-contain"
              />
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-[15px] font-extrabold" style={{ color: t.sidebarText }}>
                {username}
              </p>
              {subLabel && (
                <p className="truncate text-xs font-medium" style={{ color: t.sidebarMuted }}>
                  {subLabel}
                </p>
              )}
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.sidebarMuted }}>
                {roleLabels[role]}
              </p>
            </div>

            {/* Desktop-only collapse button */}
            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors lg:flex"
                style={{ color: t.sidebarMuted, backgroundColor: t.sidebarHover }}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            )}

            {/* Mobile-only close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors lg:hidden"
              style={{ color: t.sidebarMuted, backgroundColor: t.sidebarHover }}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mt-2 hidden h-7 w-7 items-center justify-center rounded-full lg:flex"
              style={{ color: t.sidebarMuted, backgroundColor: t.sidebarHover }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <div className={`px-4 pb-3 ${collapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-7 w-12 items-center rounded-full p-0.5"
            style={{ backgroundColor: t.sidebarHover }}
            aria-label="Toggle theme"
          >
            <div
              className="flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-sm transition-transform duration-200"
              style={{
                backgroundColor: theme === 'dark' ? '#333' : '#111',
                color: '#fff',
                transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0px)',
              }}
            >
              {theme === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
            </div>
          </button>
        </div>

        {/* Nav */}
        <div className="relative min-h-0 flex-1">
          <div ref={navRef} className="h-full overflow-y-auto px-3 pb-2">
            <p className={`px-2 pb-2 text-[10px] font-bold uppercase tracking-widest ${collapsed ? 'lg:hidden' : ''}`} style={{ color: t.sidebarMuted }}>
              Menu
            </p>
            <nav className="flex flex-col gap-1" aria-label="Sidebar Navigation">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-left text-[13px] font-bold transition-all duration-200 ${
                      collapsed ? 'lg:justify-center lg:rounded-xl lg:px-2 lg:gap-0' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? t.sidebarActiveBg : 'transparent',
                      color: isActive ? t.sidebarActiveText : t.sidebarText,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = t.sidebarHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon
                      size={18}
                      className="shrink-0"
                      style={{ color: isActive ? t.sidebarActiveText : t.sidebarMuted }}
                    />
                    <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {hasMoreBelow && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-1 pt-8">
              <div className="absolute inset-x-0 bottom-0 h-12" style={{ background: `linear-gradient(to top, ${t.sidebarBg}, transparent)` }} />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                <ChevronDown size={14} strokeWidth={2.5} />
              </span>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="border-t p-3" style={{ borderColor: t.sidebarBorder || t.border }}>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              collapsed ? 'lg:justify-center lg:gap-0' : ''
            }`}
            style={{ color: t.sidebarMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = t.sidebarHover;
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = t.sidebarMuted;
            }}
          >
            <LogOut size={17} />
            <span className={collapsed ? 'lg:hidden' : ''}>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;