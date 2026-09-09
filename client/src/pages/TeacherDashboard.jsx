import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Clock, LogOut, Calendar } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import { disconnectSocket } from '../socket/socket';

// Reuse the same student navbar — identical sticky header
import StudentNavbar from '../components/student/Dashboard/StudentNavbar';

// Section components — reuse where possible
import EventsSection    from '../components/student/EventsSection';
import ResourcesSection from '../components/student/ResourcesSection';
import ChatSection      from '../components/student/ChatSection';
import ProfileSection   from '../components/student/ProfileSection';
import CanteenSection   from '../components/student/CanteenSection';
import LostFoundSection from '../components/student/LostFoundSection';
import CampusHelpSection from '../components/student/CampusHelpSection';
import TimetableSection from '../components/student/TimetableSection';

// Teacher-specific dashboard home (greeting hero + announcements + events + canteen)
import TeacherDashboardHome from '../components/teacher/TeacherDashboardHome';

// Community Portal (user side) — membership approval + community workshops
import MembershipRequestsSection from '../components/community/MembershipRequestsSection';
import UserCommunitySection from '../components/community/UserCommunitySection';
import { communityByNavId, communityNavId, DEV_CORPS_COMMUNITIES } from '../data/devcorpsConfig';

// Every valid URL segment for /teacher/:tab
const VALID_TEACHER_TABS = [
  'dashboard', 'events', 'chat', 'canteen', 'lost-found',
  'campus-help', 'rte', 'resources', 'profile',
  // Community membership approval + one tab per approved community
  'community-requests',
  ...DEV_CORPS_COMMUNITIES.map(communityNavId),
];

// Teacher-specific page titles shown in the sticky navbar
const TEACHER_PAGE_TITLES = {
  dashboard:   'Dashboard',
  events:      'Campus Events',
  chat:        'Chat',
  canteen:     'Canteen',
  'lost-found': 'Lost & Found',
  'campus-help': 'Help',
  rte:         'Routine & Timetable',
  resources:   'Resources',
  profile:     'My Profile',
};

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  const { tab } = useParams();
  const navigate = useNavigate();

  const [viewingProfileId,    setViewingProfileId]    = useState(null);
  const [showProfileMenu,     setShowProfileMenu]     = useState(false);
  const [mobileSidebarOpen,   setMobileSidebarOpen]   = useState(false);
  const [autoOpenRequests,    setAutoOpenRequests]    = useState(false);

  const activeTab  = VALID_TEACHER_TABS.includes(tab) ? tab : 'dashboard';
  const setActiveTab = (nextTab) => navigate(`/teacher/${nextTab}`);

  // A sidebar community nav id (e.g. 'community-ai-horizon') resolves to the
  // actual community, so the user-side Community section knows what to render.
  const activeCommunity = communityByNavId(activeTab);

  const handleSidebarTabChange = (tabId) => setActiveTab(tabId);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'Good morning';
    if (h >= 12 && h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const teacherName = user?.username ? user.username.split(' ')[0] : 'Teacher';

  return (
    <div
      className="flex min-h-screen w-full font-sans antialiased"
      style={{ backgroundColor: t.pageBg, color: t.textPrimary }}
    >
      {/* Sidebar — identical wiring to student */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleSidebarTabChange}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-x-hidden">

        {/* Reuse StudentNavbar with teacher page titles injected via activeTab */}
        <StudentNavbar
          t={t}
          activeTab={activeTab}
          onNavigateHome={() => setActiveTab('dashboard')}
          studentName={teacherName}
          username={user?.username || ''}
          profileImage={user?.profileImage || ''}
          onNavigateTab={setActiveTab}
          showProfileMenu={showProfileMenu}
          onToggleProfileMenu={() => setShowProfileMenu((p) => !p)}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenFriendRequests={() => setActiveTab('chat')}
          creditDue={null}
          profileMenuContent={
            showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl border p-3 shadow-xl z-50"
                style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
              >
                {/* Header row — name + email + mobile logout */}
                <div className="flex items-start justify-between gap-2 border-b pb-3 px-1" style={{ borderColor: t.border }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
                      {user?.username || 'Teacher'}
                    </p>
                    <p className="truncate text-xs font-medium" style={{ color: t.textMuted }}>
                      {user?.email || ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors lg:hidden"
                    style={{ color: t.textMuted }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
                    aria-label="Log out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>

                {/* Quick-nav items */}
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('profile'); setViewingProfileId(null); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-bold transition-colors"
                    style={{ color: t.textPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.pageBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <User size={16} style={{ color: t.textMuted }} />
                    My Profile &amp; Bio
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('dashboard'); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-bold transition-colors"
                    style={{ color: t.textPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.pageBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Clock size={16} style={{ color: t.textMuted }} />
                    View Upcoming Classes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('events'); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-bold transition-colors"
                    style={{ color: t.textPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.pageBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Calendar size={16} style={{ color: t.textMuted }} />
                    Campus Events
                  </button>
                </div>
              </div>
            )
          }
        />

        {/* Scrollable main body — identical padding/max-width logic to student */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'chat' ? 'p-0 flex flex-col' : 'px-6 py-8 sm:px-8 lg:px-10'}`}>
          <div
            className={
              activeTab === 'chat'
                ? 'flex flex-1 flex-col p-4 sm:p-6'
                : `mx-auto space-y-8 ${activeTab === 'dashboard' ? 'max-w-5xl' : 'max-w-6xl'}`
            }
            style={activeTab === 'dashboard' ? { fontFamily: '"Nunito", sans-serif' } : undefined}
          >

            {/* Dashboard home — same layout as student, attendance swapped for next class */}
            {activeTab === 'dashboard' && (
              <TeacherDashboardHome
                t={t}
                greeting={greeting}
                teacherName={teacherName}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* Events — full reuse */}
            {activeTab === 'events' && (
              <EventsSection t={t} />
            )}

            {/* Canteen — full reuse */}
            {activeTab === 'canteen' && (
              <CanteenSection t={t} />
            )}

            {/* Lost & Found — full reuse */}
            {activeTab === 'lost-found' && (
              <LostFoundSection t={t} />
            )}

            {/* Campus Help — full reuse */}
            {activeTab === 'campus-help' && (
              <CampusHelpSection t={t} user={user} />
            )}

            {/* Routine & Timetable — full reuse */}
            {activeTab === 'rte' && (
              <TimetableSection t={t} />
            )}

            {/* Resources — full reuse */}
            {activeTab === 'resources' && (
              <ResourcesSection t={t} />
            )}

            {/* Chat — full reuse */}
            {activeTab === 'chat' && (
              <ChatSection
                t={t}
                onViewProfile={(id) => { setViewingProfileId(id); setActiveTab('profile'); }}
              />
            )}

            {/* Profile — full reuse */}
            {activeTab === 'profile' && (
              <ProfileSection
                t={t}
                profileUserId={viewingProfileId}
                onBack={() => setViewingProfileId(null)}
                onViewProfile={(id) => setViewingProfileId(id)}
                onOpenChat={() => setActiveTab('chat')}
                autoOpenRequests={autoOpenRequests}
                onAutoOpenRequestsHandled={() => setAutoOpenRequests(false)}
              />
            )}

            {/* Community membership requests — approval overlay lives here */}
            {activeTab === 'community-requests' && (
              <MembershipRequestsSection t={t} />
            )}

            {/* Approved community — events + Community Workshops tab */}
            {activeCommunity && (
              <UserCommunitySection community={activeCommunity} t={t} />
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
