// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ChevronLeft, ChevronRight, LogOut, Moon, Sun } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import { useTheme } from '../../context/ThemeContext';
// import navConfig from '../../data/navConfig';
// import { themes } from '../../data/themes';
// import { disconnectSocket } from '../../socket/socket';

// const roleLabels = {
//   student: 'Student Portal',
//   teacher: 'Teacher Portal',
//   staff: 'Staff Portal',
//   admin: 'Admin Portal',
// };

// const Sidebar = ({ activeTab: controlledActiveTab, onTabChange }) => {
//   const { user, logout } = useAuth();
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();
//   const t = themes[theme] || themes.light;

//   const [collapsed, setCollapsed] = useState(false);
//   const [internalActiveId, setInternalActiveId] = useState('dashboard');

//   const activeId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveId;

//   const role = user?.role || 'student';
//   const items = navConfig[role] || navConfig.student;
//   const username = user?.username || 'Suraj Poddar';
//   const initials = username.charAt(0).toUpperCase() || 'S';

//   const handleItemClick = (id) => {
//     if (controlledActiveTab === undefined) {
//       setInternalActiveId(id);
//     }
//     if (onTabChange) {
//       onTabChange(id);
//     }
//   };

//   const handleLogout = () => {
//     disconnectSocket();
//     logout();
//     navigate('/login', { replace: true });
//   };

//   return (
//     <aside
//       className={`relative flex min-h-screen shrink-0 flex-col border-r transition-all duration-300 select-none ${
//         collapsed ? 'w-20' : 'w-64'
//       }`}
//       style={{
//         backgroundColor: t.sidebarBg,
//         borderColor: t.border,
//         color: t.textPrimary,
//       }}
//     >
//       {/* User Header */}
//       <div
//         className={`relative flex items-center border-b px-4 py-5 ${
//           collapsed ? 'justify-center' : 'gap-3'
//         }`}
//         style={{ borderColor: t.border }}
//       >
//         <div
//           className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold shadow-sm"
//           style={{
//             backgroundColor: theme === 'dark' ? '#3b82f6' : '#2f4336',
//             color: '#ffffff',
//           }}
//         >
//           {initials}
//         </div>

//         {!collapsed && (
//           <div className="min-w-0 flex-1">
//             <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
//               {role}
//             </p>
//             <h2 className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>
//               {roleLabels[role] || 'Student Portal'}
//             </h2>
//           </div>
//         )}

//         <button
//           type="button"
//           onClick={() => setCollapsed(!collapsed)}
//           className="absolute top-6 -right-3.5 z-40 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-105"
//           style={{
//             backgroundColor: t.cardBg || '#ffffff',
//             borderColor: t.border,
//             color: t.textPrimary,
//           }}
//           aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
//         >
//           {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
//         </button>
//       </div>

//       {/* Theme Toggle Pill */}
//       <div className="px-4 pt-4">
//         <button
//           type="button"
//           onClick={toggleTheme}
//           className="flex h-7 w-12 items-center rounded-full border p-0.5 transition-colors"
//           style={{
//             backgroundColor: t.hoverBg,
//             borderColor: t.border,
//           }}
//           aria-label="Toggle dark/light mode"
//           title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
//         >
//           <div
//             className="flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-sm transition-transform duration-200"
//             style={{
//               backgroundColor: t.cardBg || '#ffffff',
//               color: t.textPrimary,
//               transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0px)',
//             }}
//           >
//             {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
//           </div>
//         </button>
//       </div>

//       {/* Main Nav Items */}
//       <div className="flex-1 overflow-y-auto px-3 pt-5">
//         {!collapsed && (
//           <p
//             className="px-2.5 pb-2 text-[11px] font-bold uppercase tracking-widest"
//             style={{ color: t.textMuted }}
//           >
//             Main
//           </p>
//         )}

//         <nav className="flex flex-col gap-1.5" aria-label="Sidebar Navigation">
//           {items.map((item) => {
//             const Icon = item.icon;
//             const isActive = activeId === item.id;

//             return (
//               <button
//                 key={item.id}
//                 type="button"
//                 onClick={() => handleItemClick(item.id)}
//                 className={`flex items-center rounded-xl px-3 py-2.5 text-left font-medium transition-all duration-200 ${
//                   collapsed ? 'justify-center' : 'gap-3'
//                 } ${
//                   isActive
//                     ? 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
//                     : 'hover:bg-black/5 dark:hover:bg-white/5'
//                 }`}
//                 style={{
//                   backgroundColor: isActive ? t.activeBg : 'transparent',
//                   color: isActive ? t.activeText : t.textPrimary,
//                   border: isActive
//                     ? `1px solid ${t.activeBorder}`
//                     : '1px solid transparent',
//                 }}
//               >
//                 <Icon
//                   size={19}
//                   className="shrink-0"
//                   style={{
//                     color: isActive ? t.activeText : t.textMuted,
//                   }}
//                   aria-hidden="true"
//                 />
//                 {!collapsed && (
//                   <span className="truncate text-[13.5px] tracking-tight">
//                     {item.label}
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </nav>
//       </div>

//       {/* Logout Footer */}
//       <div className="border-t p-3" style={{ borderColor: t.border }}>
//         <button
//           type="button"
//           onClick={handleLogout}
//           className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
//             collapsed ? 'justify-center' : 'gap-3'
//           }`}
//           style={{ color: t.textMuted }}
//           onMouseEnter={(event) => {
//             event.currentTarget.style.backgroundColor = t.hoverBg;
//             event.currentTarget.style.color = '#ef4444';
//           }}
//           onMouseLeave={(event) => {
//             event.currentTarget.style.backgroundColor = 'transparent';
//             event.currentTarget.style.color = t.textMuted;
//           }}
//         >
//           <LogOut size={18} aria-hidden="true" />
//           {!collapsed && <span>Log out</span>}
//         </button>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, Moon, Sun } from 'lucide-react';
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

  const activeId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveId;

  const role = user?.role || 'student';
  const items = navConfig[role] || navConfig.student;
  const username = user?.username || 'Suraj Poddar';
  const initials = username.charAt(0).toUpperCase() || 'S';

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
      className={`relative flex min-h-screen shrink-0 flex-col border-r transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        backgroundColor: t.sidebarBg,
        borderColor: t.border,
        color: t.textPrimary,
      }}
    >
      {/* User Header */}
      <div
        className={`relative flex items-center border-b px-4 py-5 ${
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

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-6 -right-3.5 z-40 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-105"
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
            color: t.textPrimary,
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
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
      <div className="flex-1 overflow-y-auto px-3 pt-5">
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