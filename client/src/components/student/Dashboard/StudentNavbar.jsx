import React from 'react';
import { Bell, Home, Menu } from 'lucide-react';
import NavbarMeta from './NavbarMeta';
import NotificationBell from '../../common/NotificationBell';
import ChatButton from '../../common/ChatButton';


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
  chat: 'Chat',
  profile: 'My Profile',
  rte: 'RTE',
};

const StudentNavbar = ({
  t,
  activeTab,
  onNavigateHome,
  studentName,
  username,
  profileImage,
  showProfileMenu,
  onToggleProfileMenu,
  onNavigateTab,
  creditDue,
  profileMenuContent,
  onOpenMobileMenu,
  onOpenFriendRequests,
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
      {/* Left — hamburger (mobile) / home icon (desktop) + BIC logo + page title */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {/* Mobile menu trigger — lives inside this sticky header instead of
            a separate position:fixed button, so it's guaranteed to stay
            put as the page scrolls rather than drifting or lagging. */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors lg:hidden"
          style={{ color: t.textPrimary }}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onNavigateHome}
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors lg:flex"
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

        <ChatButton t={t} />
        <NotificationBell t={t} onNavigate={onNavigateTab} />

        {/* Profile pill */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleProfileMenu}
            className="relative flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 transition-transform hover:scale-[1.02] sm:pr-4.5"
            style={{ backgroundColor: t.navbarChip || t.chipBg }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-extrabold"
              style={{
                backgroundColor: t.navbarDateBg || '#111',
                color: t.navbarDateText || '#fff',
              }}
            >
              {profileImage ? (
                <img src={profileImage} alt={username} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
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