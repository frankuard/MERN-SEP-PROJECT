import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Calendar, User, CreditCard, Mic2, Cpu, Trophy,
  BrainCircuit, Code, Palette, CheckCircle2, Clock
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import toast from 'react-hot-toast';

// Initial Data Constants & Endpoints
import {
  CLASSROOM_POOL,
  INITIAL_COLLEGE_EVENTS,
  INITIAL_COMMUNITY_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_LOST_FOUND,
  INITIAL_CAMPUS_HELP,
  INITIAL_CAMPUS_POSTS,
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
import VacantClassesSection from '../components/student/VacantClassesSection';
import CampusPostsSection from '../components/student/CampusPostsSection';
import LocationSection from '../components/student/LocationSection';
import CampusHelpSection from '../components/student/CampusHelpSection';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  // Active section tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared state variables
  const [collegeEvents, setCollegeEvents] = useState(INITIAL_COLLEGE_EVENTS);
  const [communityEvents, setCommunityEvents] = useState(INITIAL_COMMUNITY_EVENTS);
  const [announcements] = useState(INITIAL_ANNOUNCEMENTS);
  const [lostFoundItems, setLostFoundItems] = useState(INITIAL_LOST_FOUND);
  const [helpRequests, setHelpRequests] = useState(INITIAL_CAMPUS_HELP);
  const [campusPosts, setCampusPosts] = useState(INITIAL_CAMPUS_POSTS);

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CLASSROOM_POOL.length);
    setRandomRoomIndex(randomIndex);
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
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Evening';
  }, []);

  const studentName = user?.username ? user.username.split(' ')[0] : 'Suraj';

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  const notificationsList = [
    { id: 1, text: 'Devfest registration is now open', time: '10m ago', unread: true },
    { id: 2, text: 'Class SR01 Wolves permission granted', time: '1h ago', unread: true },
    { id: 3, text: 'RTE: Friday Workshop time adjusted to 8:30 AM', time: '2h ago', unread: true },
    { id: 4, text: 'Canteen Credit balance updated', time: '3h ago', unread: false },
    { id: 5, text: 'SSD Attendance verified for Spring Semester', time: '4h ago', unread: false },
  ];

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
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content View */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <header
          className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b px-6 backdrop-blur-md sm:px-8 lg:px-10"
          style={{
            backgroundColor: `${t.pageBg}e6`,
            borderColor: t.border,
          }}
        >
          {/* Section Heading & Breadcrumb */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: t.textPrimary }}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'events' && 'Campus Events Hub'}
              {activeTab === 'lost-found' && 'Lost & Found Portal'}
              {activeTab === 'resources' && 'Campus Resources & Services'}
              {activeTab === 'canteen' && 'Campus Canteen & Ordering'}
              {activeTab === 'timetable' && 'Academic Timetable (L4CG3)'}
              {activeTab === 'ssd-help' && 'SSD Help & Records'}
              {activeTab === 'vacant-classes' && 'Vacant Classrooms'}
              {activeTab === 'campus-posts' && 'Campus Social Posts'}
              {activeTab === 'location' && 'Campus Locations & Map'}
              {activeTab === 'campus-help' && 'Campus Help & Contact Directory'}
            </h1>
            {activeTab !== 'dashboard' && (
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="hidden rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:underline sm:inline-block"
                style={{ color: t.textMuted }}
              >
                ← Back to Dashboard
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Credit Due Option -> Shown ONLY when in Canteen section */}
            {activeTab === 'canteen' && (
              <div
                className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-xs dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <CreditCard size={14} className="text-amber-600" />
                <span>Credit Due: NPR {canteenCreditBalance}</span>
              </div>
            )}

            {/* Live Date Pill */}
            <div
              className="hidden items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-xs sm:flex"
              style={{
                backgroundColor: t.cardBg || '#ffffff',
                borderColor: t.border,
                color: t.textPrimary,
              }}
            >
              <Calendar size={13} style={{ color: t.textMuted }} />
              <span>{todayFormatted}</span>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border shadow-xs transition-transform hover:scale-105"
                style={{
                  backgroundColor: t.cardBg || '#ffffff',
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{
                    backgroundColor: t.cardBg || '#ffffff',
                    borderColor: t.border,
                  }}
                >
                  <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: t.border }}>
                    <div className="flex items-center gap-1.5">
                      <Bell size={15} className="text-blue-600" />
                      <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        Notifications
                      </h3>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      3 new
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {notificationsList.map((n) => (
                      <div
                        key={n.id}
                        className="flex flex-col rounded-xl p-2.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          backgroundColor: n.unread ? (theme === 'dark' ? '#232934' : '#f4f6fb') : 'transparent',
                        }}
                      >
                        <p className="font-medium" style={{ color: t.textPrimary }}>
                          {n.text}
                        </p>
                        <span className="mt-1 text-[10px]" style={{ color: t.textMuted }}>
                          {n.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-full border p-1 pr-3 shadow-xs transition-transform hover:scale-105"
                style={{
                  backgroundColor: t.cardBg || '#ffffff',
                  borderColor: t.border,
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: theme === 'dark' ? '#3b82f6' : '#2f4336' }}
                >
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-xs font-bold sm:inline-block" style={{ color: t.textPrimary }}>
                  {user?.username || 'Suraj Poddar'}
                </span>
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{
                    backgroundColor: t.cardBg || '#ffffff',
                    borderColor: t.border,
                  }}
                >
                  <div className="border-b pb-2 px-2" style={{ borderColor: t.border }}>
                    <p className="text-sm font-bold" style={{ color: t.textPrimary }}>
                      {user?.username || 'Suraj Poddar'}
                    </p>
                    <p className="text-xs capitalize" style={{ color: t.textMuted }}>
                      {user?.email || 'suraj.student@campus.edu'}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('dashboard');
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <User size={14} /> My Profile &amp; Bio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('timetable');
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <Clock size={14} /> View Class Timetable
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('ssd-help');
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <CheckCircle2 size={14} /> View Attendance in SSD
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* 1. Resources Section */}
            {activeTab === 'resources' && (
              <ResourcesSection
                t={t}
                libraryBooks={libraryBooks}
                pendingBookApprovals={pendingBookApprovals}
                onToggleBorrowBook={handleToggleBorrowBook}
                sportsGearRequests={sportsGearRequests}
                onSportsRequestSubmit={handleSportsRequestSubmit}
                budgetClaims={budgetClaims}
                onBudgetClaimSubmit={handleBudgetClaimSubmit}
                complaintTickets={complaintTickets}
                onComplaintSubmit={handleComplaintSubmit}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* 2. Lost & Found Section */}
            {activeTab === 'lost-found' && (
              <LostFoundSection
                t={t}
                lostFoundItems={lostFoundItems}
                setLostFoundItems={setLostFoundItems}
                cctvRequests={cctvRequests}
                setCctvRequests={setCctvRequests}
              />
            )}

            {/* 3. Campus Posts Section */}
            {activeTab === 'campus-posts' && (
              <CampusPostsSection
                t={t}
                campusPosts={campusPosts}
                onToggleLikePost={toggleLikePost}
                onNavigateTab={setActiveTab}
              />
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

            {/* 5. Timetable Section (Position: Canteen -> Timetable -> SSD Help) */}
            {activeTab === 'timetable' && (
              <TimetableSection
                t={t}
                onNavigateTab={setActiveTab}
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
              <EventsSection
                t={t}
                collegeEvents={collegeEvents}
                communityEvents={communityEvents}
                onToggleCollegeEvent={toggleCollegeEvent}
                onToggleCommunityEvent={toggleCommunityEvent}
                renderEventIcon={renderEventIcon}
              />
            )}

            {/* 8. Vacant Classes Section */}
            {activeTab === 'vacant-classes' && (
              <VacantClassesSection
                t={t}
                classPermissions={classPermissions}
                onTakePermission={handleTakePermission}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* 9. Locations Section */}
            {activeTab === 'location' && (
              <LocationSection
                t={t}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* 10. Campus Help Section */}
            {activeTab === 'campus-help' && (
              <CampusHelpSection
                t={t}
                user={user}
                helpRequests={helpRequests}
                setHelpRequests={setHelpRequests}
              />
            )}

            {/* 11. Dashboard Home View */}
            {activeTab === 'dashboard' && (
              <DashboardHome
                t={t}
                greeting={greeting}
                studentName={studentName}
                collegeEvents={collegeEvents}
                communityEvents={communityEvents}
                announcements={announcements}
                lostFoundItems={lostFoundItems}
                helpRequests={helpRequests}
                currentRandomRoom={currentRandomRoom}
                currentRandomStatus={currentRandomStatus}
                onShuffleRandomRoom={shuffleRandomRoom}
                onTakeClassPermission={handleTakePermission}
                onToggleCollegeEvent={toggleCollegeEvent}
                onToggleCommunityEvent={toggleCommunityEvent}
                onNavigateTab={setActiveTab}
                renderEventIcon={renderEventIcon}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
