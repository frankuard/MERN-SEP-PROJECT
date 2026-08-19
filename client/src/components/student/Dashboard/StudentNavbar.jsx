import React from 'react';
import { Bell, Home } from 'lucide-react';
import NavbarMeta from './NavbarMeta';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  events: 'Campus Events',
  'lost-found': 'Lost & Found',
  resources: 'Resources',
  canteen: 'Canteen',
  timetable: 'Timetable',
  'ssd-help': 'SSD Help',
  'vacant-classes': 'Vacant Classes',
  'campus-posts': 'Campus Posts',
  location: 'Locations',
  'campus-help': 'Campus Help',
};

const StudentNavbar = ({
  t,
  activeTab,
  onNavigateHome,
  studentName,
  username,
  showNotifications,
  onToggleNotifications,
  showProfileMenu,
  onToggleProfileMenu,
  notificationsList,
  creditDue,
  profileMenuContent,
}) => {
  const pageTitle = PAGE_TITLES[activeTab] || 'Dashboard';
  const initial = (studentName || username || 'S').charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 flex h-19 w-full shrink-0 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10"
      style={{
        backgroundColor: t.navbarBg,
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      {/* Left — home icon + BIC logo + page title */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors"
          style={{
            backgroundColor: activeTab === 'dashboard' ? (t.navbarChip || t.chipBg) : 'transparent',
            color: t.textPrimary,
          }}
          aria-label="Go to Dashboard"
          title="Dashboard"
        >
          <Home size={22} strokeWidth={2.5} />
        </button>

        <img
          src="/bic-logo-full.png"
          alt="Biratnagar International College"
          className="hidden h-9 w-auto shrink-0 object-contain sm:block lg:h-10"
        />

        <span className="hidden h-7 w-px shrink-0 sm:block" style={{ backgroundColor: t.border }} />

        <h1
          className="truncate text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: t.textPrimary }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Right — time/date pill · bell · profile pill */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-3.5">
        {creditDue}

        <NavbarMeta t={t} />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:scale-105"
            style={{
              backgroundColor: t.navbarChip || t.chipBg,
              color: t.navbarChipText || t.textPrimary,
            }}
            aria-label="Notifications"
          >
            <Bell size={22} strokeWidth={2} />
            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold"
              style={{
                backgroundColor: t.navbarDateBg || '#111',
                color: t.navbarDateText || '#fff',
              }}
            >
              3
            </span>
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-xl z-50"
              style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: t.border }}>
                <h3 className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Notifications</h3>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                  style={{ backgroundColor: t.navbarDateBg || '#111', color: t.navbarDateText || '#fff' }}
                >
                  3 new
                </span>
              </div>
              <div className="mt-2.5 flex max-h-64 flex-col gap-2 overflow-y-auto">
                {notificationsList.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl p-2.5 text-xs"
                    style={{
                      backgroundColor: n.unread ? (t.chipBg) : 'transparent',
                    }}
                  >
                    <p className="font-semibold" style={{ color: t.textPrimary }}>{n.text}</p>
                    <span className="mt-1 block text-[10px]" style={{ color: t.textMuted }}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile pill */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleProfileMenu}
            className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 transition-transform hover:scale-[1.02] sm:pr-4.5"
            style={{ backgroundColor: t.navbarChip || t.chipBg }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
              style={{
                backgroundColor: t.navbarDateBg || '#111',
                color: t.navbarDateText || '#fff',
              }}
            >
              {initial}
            </div>
            <span
              className="hidden max-w-25 truncate text-sm font-bold sm:inline sm:max-w-30"
              style={{ color: t.navbarChipText || t.textPrimary }}
            >
              {username}
            </span>
          </button>
          {profileMenuContent}
        </div>
      </div>
    </header>
  );
};

export default StudentNavbar;