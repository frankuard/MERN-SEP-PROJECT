import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, User, Mic2, Cpu, Trophy,
  BrainCircuit, Code, Palette, CheckCircle2, Clock, LogOut
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import { disconnectSocket } from '../socket/socket';
import toast from 'react-hot-toast';

// Initial Data Constants & Endpoints
import {
  CLASSROOM_POOL,
  INITIAL_COLLEGE_EVENTS,
  INITIAL_COMMUNITY_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_LOST_FOUND,
  INITIAL_LIBRARY_BOOKS,
  INITIAL_VOLUNTEERING_HISTORY,
  INITIAL_VOLUNTEER_REQUESTS,
  INITIAL_ATTENDANCE_RECORDS,
} from '../data/studentDashboardData';

// Modular Sidebar Section Components
import DashboardHome from '../components/student/DashboardHome';
import EventsSection from '../components/student/EventsSection';
import TimetableSection from '../components/student/TimetableSection';
import SSDHelpSection from '../components/student/SSDHelpSection';
import LostFoundSection from '../components/student/LostFoundSection';
import ResourcesSection from '../components/student/ResourcesSection';
import CanteenSection from '../components/student/CanteenSection';
import CampusHelpSection from '../components/student/CampusHelpSection';
import ProfileSection from '../components/student/ProfileSection';
import ChatSection from '../components/student/ChatSection';
import StudentNavbar from '../components/student/Dashboard/StudentNavbar';
import lostFoundApi from '../api/lostFoundApi';

// Every valid section for /student/:tab. Anything else in the URL
// (typo, stale bookmark, etc.) silently falls back to rendering 'dashboard'
// without forcing a redirect.
const VALID_STUDENT_TABS = [
  'dashboard', 'resources', 'lost-found', 'canteen', 'ssd-help',
  'events', 'rte', 'campus-help', 'profile', 'chat',
];


const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  // Active section tab now lives in the URL itself (/student/:tab) instead
  // of React state or sessionStorage — a reload just re-requests the same
  // URL, so you land back on the same section automatically.
  const { tab } = useParams();
  const navigate = useNavigate();
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const activeTab = VALID_STUDENT_TABS.includes(tab) ? tab : 'dashboard';

  // Same name/signature as before (`setActiveTab('lost-found')`), so every
  // existing caller — Sidebar, StudentNavbar, DashboardHome's onNavigateTab,
  // TimetableSection's onNavigateTab, etc. — keeps working unchanged.
  const setActiveTab = (nextTab) => {
    navigate(`/student/${nextTab}`);
  };

  const [autoOpenFriendRequests, setAutoOpenFriendRequests] = useState(false);

  const handleOpenFriendRequests = () => {
    // Navigate to the Chat section which has the Requests tab
    setActiveTab('chat');
  };
  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  const handleSidebarTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Shared state variables
  const [collegeEvents, setCollegeEvents] = useState(INITIAL_COLLEGE_EVENTS);
  const [communityEvents, setCommunityEvents] = useState(INITIAL_COMMUNITY_EVENTS);
  const [announcements] = useState(INITIAL_ANNOUNCEMENTS);
  const [lostFoundItems, setLostFoundItems] = useState(INITIAL_LOST_FOUND);

  // CCTV Requests List
  const [cctvRequests, setCctvRequests] = useState([
    {
      id: 'cctv_101',
      location: 'Library 2nd Floor, Table 4',
      date: '2026-08-16',
      timeFrom: '01:30 PM',
      timeTo: '03:00 PM',
      reason: 'Black laptop bag misplaced near window counter',
      status: 'In Review',
      submittedAt: 'Yesterday',
    },
  ]);

  // Resources State
  const [libraryBooks, setLibraryBooks] = useState(INITIAL_LIBRARY_BOOKS);
  const [pendingBookApprovals, setPendingBookApprovals] = useState({});
  const [sportsGearRequests, setSportsGearRequests] = useState([
    { id: 'sp_1', item: 'Cricket Bat', qty: 2, slot: 'Lunch Break (01:00 PM)', status: 'Approved' },
    { id: 'sp_2', item: 'Table Tennis (Rackets & Balls)', qty: 1, slot: 'Sports Hour (04:00 PM)', status: 'Ready for Pickup' },
  ]);
  const [budgetClaims, setBudgetClaims] = useState([
    { id: 'bc_1', title: 'XPERIA Hackathon Refreshments & Banner', amount: 3500, category: 'Club Event & Project', status: 'Approved by SSD' },
  ]);
  const [complaintTickets, setComplaintTickets] = useState([
    {
      id: 'cmp_101',
      issue: 'AC Problem',
      room: 'SR01 Wolves',
      urgency: 'High',
      description: 'AC unit is making grinding noise and cooling is weak during afternoon sessions.',
      status: 'Assigned to Maintenance',
      time: 'Today',
    },
    {
      id: 'cmp_102',
      issue: 'Projector Issue',
      room: 'LT01 Wulfurana',
      urgency: 'Medium',
      description: 'HDMI color distortion on main presentation screen.',
      status: 'Resolved',
      time: 'Yesterday',
    },
  ]);

  // Canteen balance state
  const [canteenCreditBalance, setCanteenCreditBalance] = useState(150);

  // SSD Department States
  const [attendanceRecords] = useState(INITIAL_ATTENDANCE_RECORDS);
  const [volunteeringHistory] = useState(INITIAL_VOLUNTEERING_HISTORY);
  const [volunteerRequests, setVolunteerRequests] = useState(INITIAL_VOLUNTEER_REQUESTS);

  // Classroom permissions map
  const [classPermissions, setClassPermissions] = useState({
    sr01: 'vacant',
    sr02: 'vacant',
    mechi: 'vacant',
    kankai: 'vacant',
    baraha: 'vacant',
    lt01: 'vacant',
  });

  // Random vacant room on dashboard
  const [randomRoomIndex, setRandomRoomIndex] = useState(0);

  // Header Dropdowns
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Mobile sidebar drawer — owned here so the navbar's hamburger (inside
  // the sticky header) and the Sidebar drawer itself stay in sync.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CLASSROOM_POOL.length);
    setRandomRoomIndex(randomIndex);
  }, []);

  useEffect(() => {
    const loadLostFoundData = async () => {
      try {
        const [items, cctv] = await Promise.all([
          lostFoundApi.getItems(),
          lostFoundApi.getMyCctvRequests(),
        ]);
        if (items && items.length > 0) setLostFoundItems(items);
        if (cctv && cctv.length > 0) setCctvRequests(cctv);
      } catch (err) {
        console.warn('Initial Lost & Found load from MongoDB:', err.message);
      }
    };
    loadLostFoundData();
  }, []);

  const currentRandomRoom = CLASSROOM_POOL[randomRoomIndex] || CLASSROOM_POOL[0];
  const currentRandomStatus = classPermissions[currentRandomRoom.id] || 'vacant';

  const shuffleRandomRoom = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * CLASSROOM_POOL.length);
    } while (nextIndex === randomRoomIndex && CLASSROOM_POOL.length > 1);
    setRandomRoomIndex(nextIndex);
  };

  const handleTakePermission = (roomId) => {
    const current = classPermissions[roomId] || 'vacant';
    if (current === 'vacant') {
      setClassPermissions((prev) => ({ ...prev, [roomId]: 'pending' }));
      toast.success('Permission request submitted! Status: Pending Approval', {
        icon: '⏳',
      });
      setTimeout(() => {
        setClassPermissions((prev) => ({ ...prev, [roomId]: 'approved' }));
        toast.success(`Permission Approved for ${CLASSROOM_POOL.find((r) => r.id === roomId)?.name || 'Classroom'}!`, {
          icon: '✅',
        });
      }, 3000);
    } else if (current === 'pending') {
      setClassPermissions((prev) => ({ ...prev, [roomId]: 'approved' }));
      toast.success('Permission marked as Approved!', { icon: '✅' });
    } else {
      setClassPermissions((prev) => ({ ...prev, [roomId]: 'vacant' }));
      toast('Permission released. Classroom is now Vacant.', { icon: 'ℹ️' });
    }
  };

  const toggleCollegeEvent = (id) => {
    setCollegeEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === id) {
          const next = !ev.registered;
          toast[next ? 'success' : 'dismiss'](
            next ? `Registered for ${ev.name}` : `Registration cancelled for ${ev.name}`
          );
          return { ...ev, registered: next };
        }
        return ev;
      })
    );
  };

  const toggleCommunityEvent = (id) => {
    setCommunityEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === id) {
          const next = !ev.joined;
          toast[next ? 'success' : 'dismiss'](
            next ? `Joined ${ev.name}` : `Left event ${ev.name}`
          );
          return { ...ev, joined: next };
        }
        return ev;
      })
    );
  };

  const toggleLikePost = (postId) => {
    setCampusPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.liked;
          return {
            ...p,
            liked: nextLiked,
            likes: nextLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  // Library Book Borrow / Return Workflow with 5-sec Bimala Mam Approval
  const handleToggleBorrowBook = (bookId) => {
    if (pendingBookApprovals[bookId]) return;

    const targetBook = libraryBooks.find((b) => b.id === bookId);
    if (!targetBook) return;

    if (targetBook.available) {
      setPendingBookApprovals((prev) => ({ ...prev, [bookId]: 'borrowing' }));
      toast.loading(
        `Submitting book issue request for "${targetBook.name}" to Bimala Mam (Library In-Charge)...`,
        { id: `book_${bookId}`, duration: 5000 }
      );

      setTimeout(() => {
        setPendingBookApprovals((prev) => {
          const next = { ...prev };
          delete next[bookId];
          return next;
        });
        setLibraryBooks((prev) =>
          prev.map((b) =>
            b.id === bookId
              ? { ...b, available: false, issuedTo: `Issued to ${user?.username || 'Suraj Poddar'} (Due: Sep 01)` }
              : b
          )
        );
        toast.success(
          `✅ Bimala Mam (Library In-Charge) approved! Book "${targetBook.name}" issued for 14 days.`,
          { id: `book_${bookId}`, duration: 4000 }
        );
      }, 5000);
    } else {
      setPendingBookApprovals((prev) => ({ ...prev, [bookId]: 'returning' }));
      toast.loading(
        `Returning "${targetBook.name}" at library counter. Waiting for Bimala Mam verification...`,
        { id: `book_${bookId}`, duration: 5000 }
      );

      setTimeout(() => {
        setPendingBookApprovals((prev) => {
          const next = { ...prev };
          delete next[bookId];
          return next;
        });
        setLibraryBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, available: true, issuedTo: null } : b))
        );
        toast.success(
          `✅ Bimala Mam verified and accepted the return for "${targetBook.name}"! Record cleared.`,
          { id: `book_${bookId}`, duration: 4000 }
        );
      }, 5000);
    }
  };

  const handleSportsRequestSubmit = (formData) => {
    const newReq = {
      id: `sp_${Date.now()}`,
      item: formData.item,
      qty: formData.qty,
      slot: formData.slot,
      status: 'Approved & Ready for Pickup',
    };
    setSportsGearRequests((prev) => [newReq, ...prev]);
    toast.success(`Requested ${formData.qty} × ${formData.item}! Approved by Sports Dept.`, { icon: '⚽' });
  };

  const handleBudgetClaimSubmit = (formData) => {
    const newClaim = {
      id: `bc_${Date.now()}`,
      title: formData.title,
      amount: Number(formData.amount),
      category: formData.category,
      status: 'Approved by SSD',
    };
    setBudgetClaims((prev) => [newClaim, ...prev]);
    toast.success(`Budget Claim of NPR ${newClaim.amount} submitted to SSD!`, { icon: '💰' });
  };

  const handleComplaintSubmit = (formData) => {
    const newTicket = {
      id: `cmp_${Date.now().toString().slice(-4)}`,
      issue: formData.issue,
      room: formData.room,
      urgency: formData.urgency,
      description: formData.description.trim(),
      status: 'Assigned to Maintenance Staff',
      time: 'Just now',
    };
    setComplaintTickets((prev) => [newTicket, ...prev]);
    toast.success(`Complaint Ticket #${newTicket.id} logged for ${newTicket.issue}!`, { icon: '🔧' });
  };

  const handleToggleApplyVolunteer = (reqId) => {
    setVolunteerRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          const next = !r.applied;
          toast.success(
            next ? `Volunteer application submitted for "${r.eventTitle}"!` : `Volunteer application withdrawn.`
          );
          return { ...r, applied: next };
        }
        return r;
      })
    );
  };

  // Dynamic greeting based on real local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const studentName = user?.username ? user.username.split(' ')[0] : 'Suraj';



  const renderEventIcon = (type) => {
    switch (type) {
      case 'mic':
        return <Mic2 size={16} className="text-blue-600" />;
      case 'cpu':
        return <Cpu size={16} className="text-indigo-600" />;
      case 'trophy':
        return <Trophy size={16} className="text-amber-600" />;
      case 'brain':
        return <BrainCircuit size={16} className="text-purple-600" />;
      case 'code':
        return <Code size={16} className="text-emerald-600" />;
      case 'palette':
        return <Palette size={16} className="text-pink-600" />;
      default:
        return <Calendar size={16} className="text-gray-600" />;
    }
  };

  return (
    <div
      className="flex min-h-screen w-full font-sans antialiased"
      style={{
        backgroundColor: t.pageBg,
        color: t.textPrimary,
      }}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleSidebarTabChange}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      {/* Main Content View */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
                <StudentNavbar
          t={t}
          activeTab={activeTab}
          onNavigateHome={() => setActiveTab('dashboard')}
          studentName={studentName}
          username={user?.username || ''}
          profileImage={user?.profileImage || ''}
                  onNavigateTab={setActiveTab}
          showProfileMenu={showProfileMenu}
          onToggleProfileMenu={() => setShowProfileMenu(!showProfileMenu)}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenFriendRequests={handleOpenFriendRequests}
          creditDue={null}
                    profileMenuContent={
            showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl border p-3 shadow-xl z-50"
                style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
              >
                <div className="flex items-start justify-between gap-2 border-b pb-3 px-1" style={{ borderColor: t.border }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
                      {user?.username || 'Suraj Poddar'}
                    </p>
                    <p className="truncate text-xs font-medium" style={{ color: t.textMuted }}>
                      {user?.email || 'suraj.student@campus.edu'}
                    </p>
                  </div>
                  {/* Mobile-only logout, right beside the name — the
                      sidebar's own logout button lives inside its
                      off-canvas drawer, which takes an extra tap to reach
                      on mobile, so it's mirrored here for quick access.
                      Desktop already has the sidebar visible at all times,
                      so it's left untouched there. */}
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors lg:hidden"
                    style={{ color: t.textMuted }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>

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
                    onClick={() => { setActiveTab('rte'); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-bold transition-colors"
                    style={{ color: t.textPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.pageBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Clock size={16} style={{ color: t.textMuted }} />
                    View Class Timetable
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('ssd-help'); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-bold transition-colors"
                    style={{ color: t.textPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.pageBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <CheckCircle2 size={16} style={{ color: t.textMuted }} />
                    View Attendance in SSD
                  </button>
                </div>
              </div>
            )
          }
        />

        {/* Scrollable Main Body */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'chat' ? 'p-0 flex flex-col' : 'px-6 py-8 sm:px-8 lg:px-10'}`}>
          <div className={
            activeTab === 'chat'
              ? 'flex flex-1 flex-col p-4 sm:p-6'
              : `mx-auto space-y-8 ${activeTab === 'dashboard' ? 'max-w-5xl' : 'max-w-6xl'}`
          } style={activeTab === 'dashboard' ? { fontFamily: '"Nunito", sans-serif' } : undefined}>
            {/* 1. Resources Section */}
            {activeTab === 'resources' && (
  <ResourcesSection
    t={t}
    sportsGearRequests={sportsGearRequests}
    onSportsRequestSubmit={handleSportsRequestSubmit}
  />
)}

            {/* 2. Lost & Found Section */}
            {activeTab === 'lost-found' && (
              <LostFoundSection t={t} />
            )}

            {/* 4. Canteen Section */}
            {activeTab === 'canteen' && (
              <CanteenSection
                t={t}
                user={user}
                studentName={studentName}
                canteenCreditBalance={canteenCreditBalance}
                setCanteenCreditBalance={setCanteenCreditBalance}
              />
            )}

            

            {/* 6. SSD Help Section */}
            {activeTab === 'ssd-help' && (
              <SSDHelpSection
                t={t}
                user={user}
                studentName={studentName}
                attendanceRecords={attendanceRecords}
                volunteeringHistory={volunteeringHistory}
                volunteerRequests={volunteerRequests}
                onToggleApplyVolunteer={handleToggleApplyVolunteer}
              />
            )}

            {/* 7. Events Section */}
            {activeTab === 'events' && (
              <EventsSection t={t} />
            )}

            {/* 5. RTE Section — merged Timetable + Vacant Classes */}
{activeTab === 'rte' && (
  <TimetableSection
    t={t}
    classPermissions={classPermissions}
    onTakePermission={handleTakePermission}
    onNavigateTab={setActiveTab}
  />
)}

            {/* 9. Campus Help Section */}

            {activeTab === 'campus-help' && (
              <CampusHelpSection t={t} user={user} />
            )}

            {/* 11. Profile Section */}
            {activeTab === 'profile' && (
               <ProfileSection
                t={t}
                profileUserId={viewingProfileId}
                onBack={() => setViewingProfileId(null)}
                onViewProfile={(id) => setViewingProfileId(id)}
                onOpenChat={() => setActiveTab('chat')}
                autoOpenRequests={autoOpenFriendRequests}
                onAutoOpenRequestsHandled={() => setAutoOpenFriendRequests(false)}
              />
            )}

            {/* 12. Chat Section — full page, not a popup */}
            {activeTab === 'chat' && (
              <ChatSection
                t={t}
                onViewProfile={(id) => { setViewingProfileId(id); setActiveTab('profile'); }}
              />
            )}

            {/* 10. Dashboard Home View */}
            {activeTab === 'dashboard' && (
              <DashboardHome
                t={t}
                greeting={greeting}
                studentName={studentName}
                collegeEvents={collegeEvents}
                communityEvents={communityEvents}
                announcements={announcements}
                onNavigateTab={setActiveTab}
              />
            )}

      
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;