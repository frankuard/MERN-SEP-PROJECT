import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Calendar, Clock, MapPin, Search, PlusCircle, CheckCircle2,
  AlertCircle, ChevronRight, RefreshCw, X, Coffee, BookOpen,
  MessageSquare, User, Sparkles, Filter, ExternalLink, ArrowRight,
  School, HelpCircle, Package, FileText, Check, ShieldAlert, HeartHandshake,
  Utensils, Users, ThumbsUp, Send, Share2, Eye
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import toast from 'react-hot-toast';

// Available classroom pool
const CLASSROOM_POOL = [
  { id: 'sr01', name: 'SR01 Wolves', block: 'Block A, 1st Floor', capacity: 60, facilities: 'Projector · AC · Whiteboard' },
  { id: 'sr02', name: 'SR02 Compton', block: 'Block A, 2nd Floor', capacity: 55, facilities: 'Smart Screen · Audio' },
  { id: 'mechi', name: 'Mechi', block: 'Block B, Ground Floor', capacity: 45, facilities: 'Whiteboard · Mic System' },
  { id: 'kankai', name: 'Kankai', block: 'Block B, 1st Floor', capacity: 50, facilities: 'Projector · Smart Podium' },
  { id: 'baraha', name: 'Baraha', block: 'Block C, 2nd Floor', capacity: 40, facilities: 'Whiteboard · High-speed WiFi' },
  { id: 'lt01', name: 'LT01 Wulfurana', block: 'Main Lecture Hall', capacity: 120, facilities: 'Dual Projectors · Stage · AC' },
];

const INITIAL_COLLEGE_EVENTS = [
  {
    id: 'ce1',
    name: 'Devfest Program',
    date: 'Aug 26',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    badge: '🎤 Tech Conference',
    registered: false,
  },
  {
    id: 'ce2',
    name: 'FUTURMA',
    date: 'Sep 20',
    time: '11:30 AM',
    venue: 'Tech Hall Block B',
    badge: '🤖 Robotics & AI',
    registered: false,
  },
  {
    id: 'ce3',
    name: 'DASHAIN CARNIVAL',
    date: 'Sep 27',
    time: '1:00 PM',
    venue: 'College Ground',
    badge: '🏆 Annual Fest',
    registered: false,
  },
];

const INITIAL_COMMUNITY_EVENTS = [
  {
    id: 'cme1',
    name: 'AI Horizon Workshop',
    org: 'AI Horizon',
    date: 'Aug 22',
    time: '2:00 PM',
    venue: 'LT01 Wulfurana',
    badge: '🧠 Workshop',
    joined: false,
  },
  {
    id: 'cme2',
    name: 'Competitive Coding Sprint',
    org: 'Coding Club',
    date: 'Aug 24',
    time: '3:30 PM',
    venue: 'Lab 3',
    badge: '💻 Hackathon',
    joined: false,
  },
  {
    id: 'cme3',
    name: 'UI/UX Design Jam',
    org: 'Creative Guild',
    date: 'Aug 29',
    time: '1:00 PM',
    venue: 'Design Studio',
    badge: '🎨 Design Session',
    joined: false,
  },
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'Semester project submission',
    date: 'Aug 25',
    tag: 'Academic',
    urgent: true,
    desc: 'Submit all final phase documentation along with GitHub repository links to your respective advisors.',
  },
  {
    id: 'a2',
    title: "Tomorrow's classes start at 10 AM",
    date: 'Aug 17',
    tag: 'Schedule',
    urgent: false,
    desc: 'Due to scheduled morning faculty meeting, periods 1 and 2 will be adjusted into the afternoon schedule.',
  },
  {
    id: 'a3',
    title: 'Library closed after 4 PM today',
    date: 'Today',
    tag: 'Notice',
    urgent: false,
    desc: 'Routine server maintenance and quarterly inventory stock check taking place in central library.',
  },
  {
    id: 'a4',
    title: 'Scholarship renewal verification deadline',
    date: 'Aug 28',
    tag: 'Admin',
    urgent: true,
    desc: 'Submit renewed grade sheets and recommendation letters at Room 102 before 3:00 PM.',
  },
];

const INITIAL_LOST_FOUND = [
  {
    id: 'lf1',
    title: 'Rojika ko bag',
    location: 'Library, 2nd Floor Table 4',
    time: '2 hours ago',
    category: 'Bags',
    status: 'Unclaimed',
    color: '#f59e0b',
  },
  {
    id: 'lf2',
    title: 'Keychain with blue tag',
    location: 'Block A, Room 204',
    time: '4 hours ago',
    category: 'Keys',
    status: 'Unclaimed',
    color: '#f59e0b',
  },
  {
    id: 'lf3',
    title: 'Phone (Samsung black case)',
    location: 'Cafeteria counter',
    time: 'Yesterday',
    category: 'Electronics',
    status: 'Claimed',
    color: '#10b981',
  },
];

const INITIAL_CAMPUS_HELP = [
  {
    id: 'ch1',
    request: 'Can someone share today’s DBMS notes?',
    author: 'Ankit Sharma',
    sem: 'CS 5th Sem',
    replies: 3,
    time: '1h ago',
    solved: false,
  },
  {
    id: 'ch2',
    request: 'Need a scientific calculator for tomorrow’s exam.',
    author: 'Priya Shrestha',
    sem: 'BBA 2nd Sem',
    replies: 1,
    time: '3h ago',
    solved: true,
  },
  {
    id: 'ch3',
    request: 'Looking for a study partner for AI midterms.',
    author: 'Rohan KC',
    sem: 'BCA 4th Sem',
    replies: 4,
    time: '5h ago',
    solved: false,
  },
];

const CANTEEN_SPECIALS = [
  'Aalu Nimki',
  'Gillo Chatpatey',
  'Diya Ko Royal Biryani',
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Interactive states
  const [collegeEvents, setCollegeEvents] = useState(INITIAL_COLLEGE_EVENTS);
  const [communityEvents, setCommunityEvents] = useState(INITIAL_COMMUNITY_EVENTS);
  const [announcements] = useState(INITIAL_ANNOUNCEMENTS);
  const [lostFoundItems, setLostFoundItems] = useState(INITIAL_LOST_FOUND);
  const [helpRequests, setHelpRequests] = useState(INITIAL_CAMPUS_HELP);

  // Classroom permissions map: { [roomId]: 'vacant' | 'pending' | 'approved' }
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

  // Modals state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAskHelpModal, setShowAskHelpModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Form states for modals
  const [newLostItem, setNewLostItem] = useState({ title: '', location: '', category: 'General' });
  const [newHelpRequest, setNewHelpRequest] = useState('');

  // Random room selection on mount
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
        icon: '🟡',
      });
      // Simulate approval after 3 seconds for seamless demo
      setTimeout(() => {
        setClassPermissions((prev) => ({ ...prev, [roomId]: 'approved' }));
        toast.success(`Permission Approved for ${CLASSROOM_POOL.find((r) => r.id === roomId)?.name || 'Classroom'}!`, {
          icon: '🟢',
        });
      }, 3500);
    } else if (current === 'pending') {
      setClassPermissions((prev) => ({ ...prev, [roomId]: 'approved' }));
      toast.success('Permission marked as Approved!', { icon: '🟢' });
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
            next ? `Registered for ${ev.name}! 🎉` : `Registration cancelled for ${ev.name}`
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
            next ? `Joined ${ev.name}! 🚀` : `Left event ${ev.name}`
          );
          return { ...ev, joined: next };
        }
        return ev;
      })
    );
  };

  const handleAddLostItem = (e) => {
    e.preventDefault();
    if (!newLostItem.title.trim() || !newLostItem.location.trim()) {
      toast.error('Please enter the item name and location');
      return;
    }
    const item = {
      id: `lf_${Date.now()}`,
      title: newLostItem.title.trim(),
      location: newLostItem.location.trim(),
      time: 'Just now',
      category: newLostItem.category,
      status: 'Unclaimed',
      color: '#f59e0b',
    };
    setLostFoundItems((prev) => [item, ...prev]);
    setNewLostItem({ title: '', location: '', category: 'General' });
    setShowReportModal(false);
    toast.success('Lost item report posted successfully!');
  };

  const handleAddHelpRequest = (e) => {
    e.preventDefault();
    if (!newHelpRequest.trim()) {
      toast.error('Please enter your request question');
      return;
    }
    const req = {
      id: `ch_${Date.now()}`,
      request: newHelpRequest.trim(),
      author: user?.username || 'Suraj Poddar',
      sem: 'Current Student',
      replies: 0,
      time: 'Just now',
      solved: false,
    };
    setHelpRequests((prev) => [req, ...prev]);
    setNewHelpRequest('');
    setShowAskHelpModal(false);
    toast.success('Help request shared with campus!');
  };

  // Dynamic greeting based on hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const studentName = user?.username ? user.username.split(' ')[0] : 'Suraj';

  // Format today's date
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
    { id: 3, text: 'New special in Canteen: Diya Ko Royal Biryani', time: '2h ago', unread: false },
    { id: 4, text: 'Library closes early at 4 PM today', time: '3h ago', unread: false },
  ];

  return (
    <div
      className="flex min-h-screen w-full font-sans antialiased"
      style={{
        backgroundColor: t.pageBg,
        color: t.textPrimary,
      }}
    >
      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <header
          className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b px-6 backdrop-blur-md sm:px-8 lg:px-10"
          style={{
            backgroundColor: `${t.pageBg}e6`,
            borderColor: t.border,
          }}
        >
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: t.textPrimary }}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'vacant-classes' && 'Vacant Classrooms'}
              {activeTab === 'lost-found' && 'Lost & Found Portal'}
              {activeTab === 'campus-posts' && 'Campus Posts'}
              {activeTab === 'campus-help' && 'Campus Help Desk'}
              {activeTab === 'borrow-lend' && 'Borrow / Lend Hub'}
              {activeTab === 'canteen' && 'Campus Canteen'}
              {activeTab === 'location' && 'Location Finder'}
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

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Date Capsule */}
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

            {/* Notification Bell */}
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

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{
                    backgroundColor: t.cardBg || '#ffffff',
                    borderColor: t.border,
                  }}
                >
                  <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: t.border }}>
                    <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                      Notifications 🔔
                    </h3>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      2 new
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

            {/* Profile Menu */}
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

              {/* Profile Dropdown */}
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
                        setShowAttendanceModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <CheckCircle2 size={14} /> Attendance History
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main View Container */}
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Conditional Views Based on Sidebar Active Tab */}
            {activeTab === 'vacant-classes' ? (
              /* DEDICATED VACANT CLASSES SECTION */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                      Vacant Classrooms 🏫
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                      Real-time availability of classrooms for study sessions, club meetings, and rehearsals.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-1.5 self-start rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: t.border, color: t.textPrimary }}
                  >
                    ← Back to Dashboard
                  </button>
                </div>

                {/* Classrooms Grid */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {CLASSROOM_POOL.map((room) => {
                    const status = classPermissions[room.id] || 'vacant';
                    return (
                      <div
                        key={room.id}
                        className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                        style={{
                          backgroundColor: t.cardBg || '#ffffff',
                          borderColor: t.border,
                        }}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                                {room.name}
                              </h3>
                              <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>
                                {room.block}
                              </p>
                            </div>
                            {status === 'vacant' && (
                              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Vacant
                              </span>
                            )}
                            {status === 'pending' && (
                              <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 animate-pulse">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span> Pending
                              </span>
                            )}
                            {status === 'approved' && (
                              <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                                <span className="h-2 w-2 rounded-full bg-blue-600"></span> Approved
                              </span>
                            )}
                          </div>

                          <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: t.border }}>
                            <div className="flex items-center justify-between text-xs" style={{ color: t.textMuted }}>
                              <span>Capacity:</span>
                              <span className="font-semibold" style={{ color: t.textPrimary }}>
                                {room.capacity} seats
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs" style={{ color: t.textMuted }}>
                              <span>Amenities:</span>
                              <span className="font-semibold" style={{ color: t.textPrimary }}>
                                {room.facilities}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5">
                          <button
                            type="button"
                            onClick={() => handleTakePermission(room.id)}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                              status === 'vacant'
                                ? 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                                : status === 'pending'
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {status === 'vacant' && 'Take Permission'}
                            {status === 'pending' && '🟡 Permission Pending (Click to Approve)'}
                            {status === 'approved' && '🟢 Approved (Release Room)'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab !== 'dashboard' ? (
              /* DEDICATED VIEW FOR OTHER TABS */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold capitalize" style={{ color: t.textPrimary }}>
                      {activeTab.replace('-', ' ')}
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                      Explore campus updates and records for {activeTab.replace('-', ' ')}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: t.border, color: t.textPrimary }}
                  >
                    ← Back to Dashboard
                  </button>
                </div>

                <div
                  className="rounded-2xl border p-8 text-center shadow-xs"
                  style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                >
                  <div
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-xs"
                    style={{ backgroundColor: t.hoverBg }}
                  >
                    🚀
                  </div>
                  <h3 className="mt-4 text-lg font-bold" style={{ color: t.textPrimary }}>
                    {activeTab.replace('-', ' ').toUpperCase()} Portal
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: t.textMuted }}>
                    All services are seamlessly connected with live data on your main Dashboard.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-6 rounded-xl bg-[#2f4336] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#25362b]"
                  >
                    Go to Main Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* MAIN DASHBOARD CONTENT */
              <>
                {/* 1. Header Section */}
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: t.textPrimary }}>
                      {greeting}, {studentName} 👋
                    </h2>
                    <p className="mt-1 text-sm font-medium italic" style={{ color: t.textMuted }}>
                      Here’s what’s happening on campus
                    </p>
                  </div>
                </div>

                {/* 2. Quick Overview Cards (Three Compact Cards) */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Attendance Card */}
                  <div
                    className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                          Attendance
                        </span>
                        {87 < 75 ? (
                          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                            <ShieldAlert size={12} /> Low Alert
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            🟢 On Track
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline gap-3">
                        <span className="text-4xl font-extrabold tracking-tight" style={{ color: t.textPrimary }}>
                          87%
                        </span>
                        <div className="text-xs font-medium" style={{ color: t.textMuted }}>
                          <span className="font-bold text-emerald-600">42 Present</span> ·{' '}
                          <span className="font-bold text-red-500">6 Absent</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                          style={{ width: '87%' }}
                        ></div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAttendanceModal(true)}
                      className="mt-5 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View Attendance →
                    </button>
                  </div>

                  {/* Upcoming Events Overview Card */}
                  <div
                    className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                          Upcoming Events
                        </span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                          3 Next
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-lg font-bold" style={{ color: t.textPrimary }}>
                          🎤 Devfest Program
                        </p>
                        <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
                          Aug 26 · 10:00 AM · Main Auditorium
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: t.textMuted }}>
                        <Clock size={13} />
                        <span>Nearest event in 10 days</span>
                      </div>
                    </div>

                    <a
                      href="#college-events"
                      className="mt-5 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View Schedule →
                    </a>
                  </div>

                  {/* Canteen Overview Card */}
                  <div
                    className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                          Canteen
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          ⭐ Special
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
                          Today&apos;s Specials:
                        </p>
                        <p className="mt-1 text-sm font-bold leading-snug" style={{ color: t.textPrimary }}>
                          {CANTEEN_SPECIALS.join(' · ')}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-baseline justify-between rounded-lg bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-xs">
                        <span className="font-semibold text-emerald-600">Diya Ko Royal Biryani</span>
                        <span className="font-extrabold" style={{ color: t.textPrimary }}>NPR 220</span>
                      </div>
                    </div>

                    <a
                      href="#canteen-section"
                      className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Check Menu →
                    </a>
                  </div>
                </div>

                {/* 3. Row: College Events (Left) | Community Events (Right) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* College Events Section */}
                  <div
                    id="college-events"
                    className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Upcoming College Events 🏛️
                          </h3>
                          <p className="text-xs" style={{ color: t.textMuted }}>
                            Official campus ceremonies, fests &amp; conferences
                          </p>
                        </div>
                        <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-[11px] font-semibold" style={{ color: t.textMuted }}>
                          {collegeEvents.length} Events
                        </span>
                      </div>

                      <div className="mt-4 space-y-3.5">
                        {collegeEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700 sm:flex-row sm:items-center"
                            style={{
                              backgroundColor: t.pageBg,
                              borderColor: t.border,
                            }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                                  {ev.name}
                                </h4>
                                <span className="rounded-md bg-white/80 dark:bg-black/40 px-2 py-0.5 text-[10px] font-bold" style={{ color: t.textMuted }}>
                                  {ev.badge}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: t.textMuted }}>
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {ev.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} /> {ev.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} /> {ev.venue}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleCollegeEvent(ev.id)}
                              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                ev.registered
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                              }`}
                            >
                              {ev.registered ? 'Registered ✅' : 'Register'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Community Events Section */}
                  <div
                    className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Community Events 🤝
                          </h3>
                          <p className="text-xs" style={{ color: t.textMuted }}>
                            Organized by AI Horizon, Coding Clubs &amp; Student Groups
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          Student-Led
                        </span>
                      </div>

                      <div className="mt-4 space-y-3.5">
                        {communityEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700 sm:flex-row sm:items-center"
                            style={{
                              backgroundColor: t.pageBg,
                              borderColor: t.border,
                            }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                                  {ev.name}
                                </h4>
                                <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                  {ev.org}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: t.textMuted }}>
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {ev.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} /> {ev.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} /> {ev.venue}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleCommunityEvent(ev.id)}
                              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                ev.joined
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                              }`}
                            >
                              {ev.joined ? 'Joined 🎉' : 'Join Event'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Row: Important Announcements (Left) | Today's Canteen (Right) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Important Announcements Card */}
                  <div
                    className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Important Announcements 📢
                          </h3>
                          <p className="text-xs" style={{ color: t.textMuted }}>
                            Official notices and deadline alerts
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAnnouncementsModal(true)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View All →
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {announcements.slice(0, 4).map((a) => (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 rounded-xl border p-3.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                            style={{
                              backgroundColor: t.pageBg,
                              borderColor: t.border,
                            }}
                          >
                            <span className="mt-0.5 text-base">📢</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <h4 className="truncate text-xs font-bold" style={{ color: t.textPrimary }}>
                                  {a.title}
                                </h4>
                                <span className="shrink-0 rounded-md bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                  {a.date}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-1 text-xs" style={{ color: t.textMuted }}>
                                {a.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Today's Canteen Detailed Card */}
                  <div
                    id="canteen-section"
                    className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Today&apos;s Canteen 🍽️
                          </h3>
                          <p className="text-xs" style={{ color: t.textMuted }}>
                            Fresh menu, availability &amp; crowd status
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          <span>Current Crowd:</span>
                          <span>🟡 Medium</span>
                        </div>
                      </div>

                      {/* Featured Special Banner */}
                      <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/40 p-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                              Today&apos;s Special ⭐
                            </span>
                            <h4 className="mt-0.5 text-sm font-extrabold" style={{ color: t.textPrimary }}>
                              🍗 Chicken Momo
                            </h4>
                          </div>
                          <span className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
                            NPR 120
                          </span>
                        </div>
                      </div>

                      {/* Top 3 Menu Items */}
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                          Top 3 Today
                        </p>
                        <div className="space-y-2.5">
                          <div
                            className="flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">🥟</span>
                              <div>
                                <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                                  1. Chicken Momo
                                </p>
                                <p className="text-[11px] font-semibold text-emerald-600">NPR 120</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                              🟢 Available
                            </span>
                          </div>

                          <div
                            className="flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">🍜</span>
                              <div>
                                <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                                  2. Chowmein
                                </p>
                                <p className="text-[11px] font-semibold text-emerald-600">NPR 100</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                              🟡 Almost Sold Out
                            </span>
                          </div>

                          <div
                            className="flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">🍛</span>
                              <div>
                                <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                                  3. Thakali Set
                                </p>
                                <p className="text-[11px] font-semibold text-emerald-600">NPR 180</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                              🟢 Available
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Row: Vacant Class Card (Left) | Lost & Found (Right) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Vacant Class Dashboard Card (ONLY ONE random room displayed) */}
                  <div
                    className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Vacant Classroom 🏫
                          </h3>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Live Room
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={shuffleRandomRoom}
                            className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: t.border, color: t.textMuted }}
                            title="Check another random vacant classroom"
                          >
                            <RefreshCw size={12} /> Shuffle
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('vacant-classes')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View All (6) →
                          </button>
                        </div>
                      </div>

                      {/* Display Selected Room */}
                      <div className="mt-5 rounded-2xl border p-5" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                              Available Class
                            </p>
                            <h4 className="mt-1 text-xl font-extrabold" style={{ color: t.textPrimary }}>
                              🏫 {currentRandomRoom.name}
                            </h4>
                            <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                              {currentRandomRoom.block} · {currentRandomRoom.facilities}
                            </p>
                          </div>

                          {currentRandomStatus === 'vacant' && (
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> 🟢 Vacant
                            </span>
                          )}
                          {currentRandomStatus === 'pending' && (
                            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 animate-pulse">
                              <span className="h-2 w-2 rounded-full bg-amber-500"></span> 🟡 Pending
                            </span>
                          )}
                          {currentRandomStatus === 'approved' && (
                            <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                              <span className="h-2 w-2 rounded-full bg-blue-600"></span> 🟢 Approved
                            </span>
                          )}
                        </div>

                        <div className="mt-5">
                          <button
                            type="button"
                            onClick={() => handleTakePermission(currentRandomRoom.id)}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-xs ${
                              currentRandomStatus === 'vacant'
                                ? 'bg-[#2f4336] text-white hover:bg-[#25362b]'
                                : currentRandomStatus === 'pending'
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {currentRandomStatus === 'vacant' && 'Take Permission'}
                            {currentRandomStatus === 'pending' && '🟡 Permission Pending (Click to Approve)'}
                            {currentRandomStatus === 'approved' && '🟢 Approved (Release Room)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lost & Found Dashboard Section */}
                  <div
                    className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Lost &amp; Found 🎒
                          </h3>
                          <p className="text-xs" style={{ color: t.textMuted }}>
                            Recently reported campus belongings
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowReportModal(true)}
                            className="rounded-lg bg-[#2f4336] px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                          >
                            + Report Item
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('lost-found')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View All →
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {lostFoundItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-xl border p-3.5 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                            style={{
                              backgroundColor: t.pageBg,
                              borderColor: t.border,
                            }}
                          >
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold" style={{ color: t.textPrimary }}>
                                {item.title}
                              </h4>
                              <p className="flex items-center gap-1 text-[11px]" style={{ color: t.textMuted }}>
                                <MapPin size={11} /> {item.location} · {item.time}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === 'Claimed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status === 'Claimed' ? '🟢 Claimed' : '🟡 Unclaimed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Row: Campus Help Section */}
                <div
                  className="rounded-2xl border p-6 shadow-xs"
                  style={{
                    backgroundColor: t.cardBg || '#ffffff',
                    borderColor: t.border,
                  }}
                >
                  <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center" style={{ borderColor: t.border }}>
                    <div>
                      <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                        Campus Help &amp; Peer Requests 🙋
                      </h3>
                      <p className="text-xs" style={{ color: t.textMuted }}>
                        Student-to-student assistance for study notes, calculators, books &amp; project help
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAskHelpModal(true)}
                        className="rounded-xl bg-[#2f4336] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                      >
                        + Ask Help
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('campus-help')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View Requests →
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {helpRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-all hover:shadow-md"
                        style={{
                          backgroundColor: t.pageBg,
                          borderColor: t.border,
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                              {req.sem}
                            </span>
                            <span className="text-[10px]" style={{ color: t.textMuted }}>
                              {req.time}
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-bold leading-snug" style={{ color: t.textPrimary }}>
                            “{req.request}”
                          </p>

                          <p className="mt-2 text-xs" style={{ color: t.textMuted }}>
                            by <span className="font-semibold" style={{ color: t.textPrimary }}>{req.author}</span>
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: t.border }}>
                          <span className="flex items-center gap-1 text-xs" style={{ color: t.textMuted }}>
                            <MessageSquare size={13} /> {req.replies} responses
                          </span>
                          <button
                            type="button"
                            onClick={() => toast.success(`Replying to ${req.author}...`)}
                            className="rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: t.border, color: t.textPrimary }}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Report Lost Item Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                Report Lost Item 🎒
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLostItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold" style={{ color: t.textPrimary }}>
                  Item Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blue Dell Laptop Charger"
                  value={newLostItem.title}
                  onChange={(e) => setNewLostItem({ ...newLostItem, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold" style={{ color: t.textPrimary }}>
                  Where was it seen/lost?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block B, Ground floor Lab 2"
                  value={newLostItem.location}
                  onChange={(e) => setNewLostItem({ ...newLostItem, location: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold" style={{ color: t.textPrimary }}>
                  Category
                </label>
                <select
                  value={newLostItem.category}
                  onChange={(e) => setNewLostItem({ ...newLostItem, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                >
                  <option value="Bags">Bags &amp; Wallets</option>
                  <option value="Electronics">Electronics &amp; Gadgets</option>
                  <option value="Keys">Keys &amp; IDs</option>
                  <option value="Books">Books &amp; Notebooks</option>
                  <option value="General">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl border px-4 py-2.5 text-xs font-bold"
                  style={{ borderColor: t.border }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2f4336] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Ask Help Modal */}
      {showAskHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                Ask for Campus Help 🙋
              </h3>
              <button
                type="button"
                onClick={() => setShowAskHelpModal(false)}
                className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHelpRequest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold" style={{ color: t.textPrimary }}>
                  What do you need help with?
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Can someone share handwritten notes for Operating Systems Chapter 4?"
                  value={newHelpRequest}
                  onChange={(e) => setNewHelpRequest(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-3 text-xs outline-none"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskHelpModal(false)}
                  className="rounded-xl border px-4 py-2.5 text-xs font-bold"
                  style={{ borderColor: t.border }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2f4336] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                >
                  Post Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Attendance Details Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                  Attendance Breakdown 📊
                </h3>
                <p className="text-xs" style={{ color: t.textMuted }}>
                  Semester attendance overview (Minimum required: 75%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border p-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                  <p className="text-2xl font-extrabold text-emerald-600">87%</p>
                  <p className="text-[11px] font-semibold" style={{ color: t.textMuted }}>Overall</p>
                </div>
                <div className="rounded-xl border p-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                  <p className="text-2xl font-extrabold text-blue-600">42</p>
                  <p className="text-[11px] font-semibold" style={{ color: t.textMuted }}>Present Days</p>
                </div>
                <div className="rounded-xl border p-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                  <p className="text-2xl font-extrabold text-red-500">6</p>
                  <p className="text-[11px] font-semibold" style={{ color: t.textMuted }}>Absent Days</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  Subject-Wise Breakdown
                </p>
                <div className="space-y-2 text-xs">
                  {[
                    { subject: 'Database Management Systems', pct: 92, status: 'Safe' },
                    { subject: 'Operating Systems', pct: 88, status: 'Safe' },
                    { subject: 'Artificial Intelligence', pct: 84, status: 'Safe' },
                    { subject: 'Computer Networks', pct: 82, status: 'Safe' },
                  ].map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-2.5"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                    >
                      <span className="font-semibold" style={{ color: t.textPrimary }}>{sub.subject}</span>
                      <span className="font-bold text-emerald-600">{sub.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="rounded-xl bg-[#2f4336] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Announcements Modal */}
      {showAnnouncementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                  All Important Announcements 📢
                </h3>
                <p className="text-xs" style={{ color: t.textMuted }}>
                  Campus updates and deadlines
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAnnouncementsModal(false)}
                className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border p-4 space-y-1.5"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      {a.tag}
                    </span>
                    <span className="text-xs font-semibold text-amber-600">{a.date}</span>
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    {a.title}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: t.textMuted }}>
                    {a.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAnnouncementsModal(false)}
                className="rounded-xl bg-[#2f4336] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

