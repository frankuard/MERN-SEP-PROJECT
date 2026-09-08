import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Calendar, User, LogOut } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import { disconnectSocket } from '../socket/socket';

// Reuse the same navbar as Student/Teacher — identical sticky header
import StudentNavbar from '../components/student/Dashboard/StudentNavbar';

// Section components — full reuse of shared campus sections
import EventsSection from '../components/student/EventsSection';
import ChatSection from '../components/student/ChatSection';
import ProfileSection from '../components/student/ProfileSection';
import ManageEventsSection from '../components/admin/ManageEvents/ManageEventsSection';

// DevCorps-specific sections
import DevCorpsDashboardHome from '../components/devcorps/DevCorpsDashboardHome';
import DevCorpsDocumentation from '../components/devcorps/DevCorpsDocumentation';
import EventRequestSection from '../components/devcorps/EventRequestSection';
import CommunitiesSection from '../components/devcorps/CommunitiesSection';

import { communityByNavId, communityNavId, DEV_CORPS_COMMUNITIES } from '../data/devcorpsConfig';

// Every valid URL segment for /devcorps/:tab. Anything else in the URL
// (typo, stale bookmark, etc.) silently falls back to rendering 'dashboard'.
// 'profile' is intentionally NOT in the sidebar — it exists only so the
// shared Chat/Profile sections keep their "view profile" round-trip.
// 'manage-events' is exclusive to the DevCorps portal admin (portalRole
// 'admin') — members are redirected to the Events tab below.
const VALID_DEV_CORPS_TABS = [
  'dashboard', 'events', 'chat', 'documentation', 'profile', 'manage-events',
  // 'communities' overview + one tab per member community
  'communities',
  ...DEV_CORPS_COMMUNITIES.map(communityNavId),
];

const DevCorpsDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  const { tab } = useParams();
  const navigate = useNavigate();

  // Manage Events (and all event moderation powers) is exclusive to the
  // DevCorps portal admin — regular community members get the plain Events tab.
  const isDevCorpsAdmin = user?.portalRole === 'admin';

  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [autoOpenRequests, setAutoOpenRequests] = useState(false);

  const requestedTab = VALID_DEV_CORPS_TABS.includes(tab) ? tab : 'dashboard';
  const activeTab = requestedTab === 'manage-events' && !isDevCorpsAdmin ? 'events' : requestedTab;
  const setActiveTab = (nextTab) => navigate(`/devcorps/${nextTab}`);

  // A sidebar community nav id (e.g. 'community-ai-horizon') resolves to the
  // actual community, so the Communities view can filter its events.
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
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const memberName = user?.username ? user.username.split(' ')[0] : 'DevCorps';

  return (
    <div
      className="flex min-h-screen w-full font-sans antialiased"
      style={{ backgroundColor: t.pageBg, color: t.textPrimary }}
    >
      {/* Sidebar — DevCorps items via the portal-aware role lookup */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleSidebarTabChange}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-x-hidden">

        {/* Reuse StudentNavbar with DevCorps page titles injected via activeTab */}
        <StudentNavbar
          t={t}
          activeTab={activeTab}
          onNavigateHome={() => setActiveTab('dashboard')}
          studentName={memberName}
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
                      {user?.username || 'DevCorps Member'}
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
                    onClick={() => { setActiveTab('events'); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-bold transition-colors"
                    style={{ color: t.textPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.pageBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Calendar size={16} style={{ color: t.textMuted }} />
                    Campus Events
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('documentation'); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-bold transition-colors"
                    style={{ color: t.textPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.pageBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <BookOpen size={16} style={{ color: t.textMuted }} />
                    Documentation
                  </button>
                </div>
              </div>
            )
          }
        />

        {/* Scrollable main body — identical padding/max-width logic to student/teacher */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'chat' ? 'p-0 flex flex-col' : 'px-6 py-8 sm:px-8 lg:px-10'}`}>
          <div
            className={
              activeTab === 'chat'
                ? 'flex flex-1 flex-col p-4 sm:p-6'
                : `mx-auto space-y-8 ${activeTab === 'dashboard' ? 'max-w-5xl' : 'max-w-6xl'}`
            }
            style={activeTab === 'dashboard' ? { fontFamily: '"Nunito", sans-serif' } : undefined}
          >

            {/* Dashboard home — same layout as student/teacher, minus
                attendance/classes/canteen, with the Next Upcoming Event card */}
            {activeTab === 'dashboard' && (
              <DevCorpsDashboardHome
                t={t}
                greeting={greeting}
                memberName={memberName}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* Events — DevCorps admin sees the full Event Board; the five
                member communities see their Event Request submission/tracking. */}
            {activeTab === 'events' && (isDevCorpsAdmin ? (
              <EventsSection t={t} />
            ) : (
              <EventRequestSection t={t} />
            ))}

            {/* Manage Events — exclusive to the DevCorps portal admin. Scoped
                to Community events only (college/campus events never appear
                or become manageable here). */}
            {activeTab === 'manage-events' && isDevCorpsAdmin && (
              <ManageEventsSection t={t} devcorpsMode />
            )}

            {/* Communities — overview of all five, or a single community's
                events when one of the sidebar's community nav items is active. */}
            {activeCommunity ? (
              <CommunitiesSection
                t={t}
                community={activeCommunity}
                onNavigateCommunity={(community) => setActiveTab(communityNavId(community))}
                onBack={() => setActiveTab('communities')}
              />
            ) : activeTab === 'communities' && (
              <CommunitiesSection
                t={t}
                onNavigateCommunity={(community) => setActiveTab(communityNavId(community))}
                onBack={() => setActiveTab('dashboard')}
              />
            )}

            {/* Documentation — DevCorps-specific, backend-gated */}
            {activeTab === 'documentation' && (
              <DevCorpsDocumentation t={t} />
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

          </div>
        </main>
      </div>
    </div>
  );
};

export default DevCorpsDashboard;