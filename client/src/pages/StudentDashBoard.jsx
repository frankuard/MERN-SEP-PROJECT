import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Calendar, Clock, MapPin, Search, PlusCircle, CheckCircle2,
  AlertCircle, ChevronRight, RefreshCw, X, Coffee, BookOpen,
  MessageSquare, User, Sparkles, Filter, ExternalLink, ArrowRight,
  School, HelpCircle, Package, FileText, Check, ShieldAlert, HeartHandshake,
  UtensilsCrossed, Users, ThumbsUp, Send, Share2, Eye, Mic2, Cpu,
  Trophy, BrainCircuit, Code, Palette, Megaphone, Flame, Tag, CheckSquare,
  GraduationCap, Award, CreditCard, Banknote, QrCode, ShoppingBag, Plus, Minus,
  History, DollarSign, Wallet, Heart, MessageCircle, Bookmark, CheckCheck, TrendingUp
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

// College Events
const INITIAL_COLLEGE_EVENTS = [
  {
    id: 'ce1',
    name: 'Devfest Program',
    date: 'Aug 26',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    badge: 'Tech Conference',
    iconType: 'mic',
    registered: false,
    desc: 'Annual flagship technical symposium featuring keynotes, panel discussions, and student project exhibitions.',
  },
  {
    id: 'ce2',
    name: 'FUTURMA',
    date: 'Sep 20',
    time: '11:30 AM',
    venue: 'Tech Hall Block B',
    badge: 'Robotics & AI',
    iconType: 'cpu',
    registered: false,
    desc: 'Cutting-edge innovation expo showcasing autonomous robotics, hardware hacks, and machine learning prototypes.',
  },
  {
    id: 'ce3',
    name: 'DASHAIN CARNIVAL',
    date: 'Sep 27',
    time: '1:00 PM',
    venue: 'College Ground',
    badge: 'Annual Fest',
    iconType: 'trophy',
    registered: false,
    desc: 'Inter-department cultural celebration with acoustic live music, art installations, and traditional food stalls.',
  },
];

// Community Events
const INITIAL_COMMUNITY_EVENTS = [
  {
    id: 'cme1',
    name: 'AI Horizon Workshop',
    org: 'AI Horizon',
    date: 'Aug 22',
    time: '2:00 PM',
    venue: 'LT01 Wulfurana',
    badge: 'Workshop',
    iconType: 'brain',
    joined: false,
    desc: 'Hands-on generative AI and LLM prompt engineering masterclass guided by senior student mentors.',
  },
  {
    id: 'cme2',
    name: 'Competitive Coding Sprint',
    org: 'Coding Club',
    date: 'Aug 24',
    time: '3:30 PM',
    venue: 'Lab 3',
    badge: 'Hackathon',
    iconType: 'code',
    joined: false,
    desc: 'Fast-paced algorithmic challenge focusing on dynamic programming and graph theory problem solving.',
  },
  {
    id: 'cme3',
    name: 'UI/UX Design Jam',
    org: 'Creative Guild',
    date: 'Aug 29',
    time: '1:00 PM',
    venue: 'Design Studio',
    badge: 'Design Session',
    iconType: 'palette',
    joined: false,
    desc: 'Figma wireframing and responsive component styling sprint for next-generation student applications.',
  },
];

// Announcements
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

// Lost & Found Items
const INITIAL_LOST_FOUND = [
  {
    id: 'lf1',
    title: 'Rojika ko bag',
    location: 'Library, 2nd Floor Table 4',
    time: '2 hours ago',
    category: 'Bags',
    status: 'Unclaimed',
  },
  {
    id: 'lf2',
    title: 'Keychain with blue tag',
    location: 'Block A, Room 204',
    time: '4 hours ago',
    category: 'Keys',
    status: 'Unclaimed',
  },
  {
    id: 'lf3',
    title: 'Phone (Samsung black case)',
    location: 'Cafeteria counter',
    time: 'Yesterday',
    category: 'Electronics',
    status: 'Claimed',
  },
];

// Campus Help Requests
const INITIAL_CAMPUS_HELP = [
  {
    id: 'ch1',
    request: 'Can someone share today’s DBMS notes?',
    author: 'Ankit Sharma',
    sem: 'CS 5th Sem',
    replies: 3,
    time: '1h ago',
  },
  {
    id: 'ch2',
    request: 'Need a scientific calculator for tomorrow’s exam.',
    author: 'Priya Shrestha',
    sem: 'BBA 2nd Sem',
    replies: 1,
    time: '3h ago',
  },
  {
    id: 'ch3',
    request: 'Looking for a study partner for AI midterms.',
    author: 'Rohan KC',
    sem: 'BCA 4th Sem',
    replies: 4,
    time: '5h ago',
  },
];

// Full Canteen Menu Items
const CANTEEN_MENU = [
  { id: 'cm0', name: 'Diya Ko Royal Biryani', price: 220, category: 'Meals', available: true },
  { id: 'cm1', name: 'Aalu Nimki', price: 50, category: 'Snacks', available: true },
  { id: 'cm2', name: 'Chatpatey', price: 50, category: 'Snacks', available: true },
  { id: 'cm3', name: 'Chicken Chatpatey', price: 100, category: 'Snacks', available: true },
  { id: 'cm4', name: 'Fried Rice', price: 100, category: 'Meals', available: true },
  { id: 'cm5', name: 'Chicken Chowmein', price: 100, category: 'Momo & Noodles', available: true },
  { id: 'cm6', name: 'Veg Chowmein', price: 60, category: 'Momo & Noodles', available: true },
  { id: 'cm7', name: 'Samosa', price: 50, category: 'Snacks', available: true },
  { id: 'cm8', name: 'Lassi', price: 80, category: 'Beverages', available: true },
  { id: 'cm9', name: 'Thuppa', price: 80, category: 'Momo & Noodles', available: true },
  { id: 'cm10', name: 'Veg Momo', price: 80, category: 'Momo & Noodles', available: true },
  { id: 'cm11', name: 'Chicken Momo', price: 120, category: 'Momo & Noodles', available: true },
];

const CANTEEN_SPECIALS_LIST = [
  { id: 1, name: 'Diya Ko Royal Biryani', price: 220, isBold: true },
  { id: 2, name: 'Chicken Momo', price: 120, isBold: false },
  { id: 3, name: 'Aalu Nimki', price: 50, isBold: false },
];

// Official Campus Social Media Posts Feed
const INITIAL_CAMPUS_POSTS = [
  {
    id: 'post_1',
    author: 'Biratnagar International College',
    handle: '@bic_biratnagar',
    avatar: '🏫',
    time: '2 hours ago',
    category: 'Campus Reels & Vibes',
    caption: 'Register gareu tah? 🤩 XPERIA: Experience The Intelligence registration is officially LIVE! Join us for an adrenaline-fueled tech fest packed with student hacks, robotics showdowns, and interactive live workshops.',
    image: '/post-1.png',
    likes: 142,
    comments: 18,
    shares: 9,
    liked: false,
    tag: '#XPERIA2026 #BICStudents #CampusLife',
  },
  {
    id: 'post_2',
    author: 'BIC International MBA Department',
    handle: '@bic_mba',
    avatar: '🎓',
    time: 'Yesterday at 04:30 PM',
    category: 'Guest Speaker Series',
    caption: 'Guest Speaker Session: “IPR Essentials: Trademarks, Copyright and Patents for Business and Digital Content” led by distinguished guest Mr. Kunal Singh Chauhan (Section Officer, High Court of Nepal). Session kicks off this Friday 07:00 AM onwards at BIC Hall.',
    image: '/post-2.png',
    likes: 79,
    comments: 2,
    shares: 14,
    liked: false,
    tag: '#IPREssentials #GuestLecture #HighCourtNepal #BICMBA',
  },
  {
    id: 'post_3',
    author: 'BIC Research & Academic Guild',
    handle: '@bic_research',
    avatar: '📚',
    time: '2 days ago',
    category: 'Academic Insights',
    caption: 'Guest Speaker Session: “Applied Research in Business” featuring Dr. Chandra Upadhyay (Assistant Professor, Tribhuwan University). A comprehensive seminar guiding our scholars on rigorous empirical methodologies and modern market case studies.',
    image: '/post-3.png',
    likes: 118,
    comments: 6,
    shares: 11,
    liked: false,
    tag: '#AppliedResearch #BusinessAnalytics #TribhuwanUniversity #BIC',
  },
  {
    id: 'post_4',
    author: 'AI Horizon & BIC Devcorps',
    handle: '@bic.ai_horizon',
    avatar: '🤖',
    time: '3 days ago',
    category: 'Tech Summits & Partnerships',
    caption: 'Official Partnership Announcement! 🤝 Proud to partner with Birat Sports Zone, Goti Soda, The Kush Garden, and Laxmi iStore for XPERIA: Experience The Intelligence at LT-01 Wulfurana. Grab your passes early!',
    image: '/post-4.png',
    likes: 215,
    comments: 24,
    shares: 32,
    liked: false,
    tag: '#AIHorizon #Devcorps #BiratSportsZone #Sponsorships',
  },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [eventsFilter, setEventsFilter] = useState('all'); // 'all' | 'college' | 'community'
  const [ssdActiveSubTab, setSsdActiveSubTab] = useState('scholarship'); // Default to scholarship or attendance
  const [postFilter, setPostFilter] = useState('all');

  // Interactive states
  const [collegeEvents, setCollegeEvents] = useState(INITIAL_COLLEGE_EVENTS);
  const [communityEvents, setCommunityEvents] = useState(INITIAL_COMMUNITY_EVENTS);
  const [announcements] = useState(INITIAL_ANNOUNCEMENTS);
  const [lostFoundItems, setLostFoundItems] = useState(INITIAL_LOST_FOUND);
  const [helpRequests, setHelpRequests] = useState(INITIAL_CAMPUS_HELP);
  const [campusPosts, setCampusPosts] = useState(INITIAL_CAMPUS_POSTS);

  // Canteen ordering system states
  const [cart, setCart] = useState({}); // { [itemId]: quantity }
  const [orderPreference, setOrderPreference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'cash' | 'online' | 'canteen_credit'
  const [canteenCreditBalance, setCanteenCreditBalance] = useState(150); // persistent pending credit balance in NPR
  const [orderHistory, setOrderHistory] = useState([
    { id: 'ord_101', item: 'Chicken Momo × 1', amount: 120, method: 'Credit Khata', time: 'Yesterday' },
  ]);

  // Modals for payment workflows
  const [showOnlineQrModal, setShowOnlineQrModal] = useState(false);
  const [showCashTokenModal, setShowCashTokenModal] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // Attendance tracking logger
  const [attendanceRecords, setAttendanceRecords] = useState([
    { date: 'Today (Aug 17)', status: 'Present', time: '09:45 AM', room: 'SR01 Wolves' },
    { date: 'Aug 16', status: 'Present', time: '09:50 AM', room: 'LT01 Wulfurana' },
    { date: 'Aug 15', status: 'Present', time: '09:40 AM', room: 'SR02 Compton' },
    { date: 'Aug 14', status: 'Absent', time: '-', room: '-' },
    { date: 'Aug 13', status: 'Present', time: '10:05 AM', room: 'Baraha' },
  ]);
  const [isLoggedToday, setIsLoggedToday] = useState(true);

  // Volunteering history
  const volunteeringHistory = [
    { id: 'v1', role: 'Campus Orientation Peer Mentor', event: 'Freshers Induction 2026', hours: 12, date: 'Aug 2026', verified: true },
    { id: 'v2', role: 'Blood Donation Camp Coordinator', event: 'Red Cross & Campus Health Drive', hours: 8, date: 'Jul 2026', verified: true },
    { id: 'v3', role: 'TechFest IT Logistics Volunteer', event: 'Annual TechFest 2026', hours: 16, date: 'May 2026', verified: true },
  ];

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

  // General Modals state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAskHelpModal, setShowAskHelpModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPayCreditModal, setShowPayCreditModal] = useState(false);

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
    };
    setLostFoundItems((prev) => [item, ...prev]);
    setNewLostItem({ title: '', location: '', category: 'General' });
    setShowReportModal(false);
    toast.success('Lost item report posted successfully!');
  };

  const handleClaimLostItem = (id) => {
    setLostFoundItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Claimed' } : item))
    );
    toast.success('Item status marked as Claimed!');
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
    };
    setHelpRequests((prev) => [req, ...prev]);
    setNewHelpRequest('');
    setShowAskHelpModal(false);
    toast.success('Help request shared with campus!');
  };

  // Canteen cart actions
  const updateCartQuantity = (itemId, delta) => {
    setCart((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = CANTEEN_MENU.find((m) => m.id === id);
        return item ? { ...item, qty, total: item.price * qty } : null;
      })
      .filter(Boolean);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.total, 0);
  }, [cartItems]);

  const handleProcessOrder = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Please add at least one food item to your order.');
      return;
    }

    const orderDescription = cartItems.map((i) => `${i.name} × ${i.qty}`).join(', ');
    const orderData = {
      id: `ord_${Date.now()}`,
      item: orderDescription,
      amount: cartSubtotal,
      preference: orderPreference,
      tokenNumber: Math.floor(100 + Math.random() * 900),
    };
    setLastPlacedOrder(orderData);

    if (paymentMethod === 'cash') {
      setShowCashTokenModal(true);
      toast('Please go to counter to pay cash & collect your token.', {
        icon: '💵',
        duration: 4000,
      });
      setOrderHistory((prev) => [
        { ...orderData, method: 'Cash (Counter)', time: 'Just now' },
        ...prev,
      ]);
      setCart({});
      setOrderPreference('');
    } else if (paymentMethod === 'online') {
      setShowOnlineQrModal(true);
    } else if (paymentMethod === 'canteen_credit') {
      setCanteenCreditBalance((prev) => prev + cartSubtotal);
      toast.success(
        `Order placed! NPR ${cartSubtotal} added to your Credit Due (Khata). Total due: NPR ${canteenCreditBalance + cartSubtotal}`,
        { icon: '💳', duration: 4500 }
      );
      setOrderHistory((prev) => [
        { ...orderData, method: 'Credit Khata', time: 'Just now' },
        ...prev,
      ]);
      setCart({});
      setOrderPreference('');
    }
  };

  const handleConfirmOnlinePayment = () => {
    if (!lastPlacedOrder) return;
    toast.success(`Online payment of NPR ${lastPlacedOrder.amount} verified! Order sent to kitchen.`, { icon: '✅' });
    setOrderHistory((prev) => [
      { ...lastPlacedOrder, method: 'Online (Fonepay QR)', time: 'Just now' },
      ...prev,
    ]);
    setShowOnlineQrModal(false);
    setCart({});
    setOrderPreference('');
  };

  const handleClearCredit = () => {
    if (canteenCreditBalance <= 0) {
      toast('You have no pending balance to clear.', { icon: 'ℹ️' });
      return;
    }
    setCanteenCreditBalance(0);
    setShowPayCreditModal(false);
    toast.success('Canteen Credit balance cleared successfully! Receipt generated.', { icon: '✅' });
  };

  const handleTrackAttendanceToday = () => {
    if (isLoggedToday) {
      toast.success('Today’s attendance is already tracked & verified! 🟢');
      return;
    }
    setIsLoggedToday(true);
    setAttendanceRecords((prev) => [
      { date: 'Today (Aug 17)', status: 'Present', time: '09:45 AM', room: 'SR01 Wolves' },
      ...prev,
    ]);
    toast.success('Attendance recorded for today! Present at SR01 Wolves.', { icon: '✅' });
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
    { id: 3, text: 'Canteen Credit balance updated', time: '2h ago', unread: false },
    { id: 4, text: 'SSD Attendance verified for Spring Semester', time: '3h ago', unread: false },
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
              {activeTab === 'ssd-help' && 'SSD Help & Records'}
              {activeTab === 'canteen' && 'Campus Canteen & Ordering'}
              {activeTab === 'campus-posts' && 'Campus Social Posts'}
              {activeTab === 'lost-found' && 'Lost & Found Portal'}
              {activeTab === 'vacant-classes' && 'Vacant Classrooms'}
              {activeTab === 'borrow-lend' && 'Borrow / Lend Hub'}
              {activeTab === 'location' && 'Location Finder'}
              {activeTab === 'campus-help' && 'Campus Help Desk'}
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

          {/* Right Controls: Credit Due (ONLY shown when on Canteen tab), Date Pill, Notification Bell, User Avatar */}
          <div className="flex items-center gap-3">
            {/* Credit Due Option -> Shown ONLY after clicking Canteen section */}
            {activeTab === 'canteen' && (
              <button
                type="button"
                onClick={() => setShowPayCreditModal(true)}
                className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-xs transition-transform hover:scale-105 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                title="Click to view & pay your Credit Due (Khata)"
              >
                <CreditCard size={14} className="text-amber-600" />
                <span>Credit Due: NPR {canteenCreditBalance}</span>
              </button>
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
                        setActiveTab('ssd-help');
                        setSsdActiveSubTab('attendance');
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <CheckCircle2 size={14} /> Track Attendance in SSD
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
            {/* ------------------------------------------------------------- */}
            {/* VIEW A: DEDICATED CAMPUS SOCIAL POSTS FEED */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'campus-posts' ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="text-blue-600" size={24} />
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                        Campus Social Feed &amp; Recent Posts
                      </h2>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                      Official updates, reels, guest speaker announcements, and student club buzz at Biratnagar International College.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderColor: t.border, color: t.textPrimary }}
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                </div>

                {/* Posts Feed Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {campusPosts.map((post) => (
                    <article
                      key={post.id}
                      className="flex flex-col justify-between overflow-hidden rounded-3xl border shadow-xs transition-all hover:shadow-md"
                      style={{
                        backgroundColor: t.cardBg || '#ffffff',
                        borderColor: t.border,
                      }}
                    >
                      {/* Post Header */}
                      <div className="p-5 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-lg shadow-xs">
                              {post.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                                  {post.author}
                                </h3>
                                <span className="rounded-full bg-blue-600 text-white p-0.5 text-[9px] flex items-center justify-center h-3.5 w-3.5">
                                  ✓
                                </span>
                              </div>
                              <p className="text-[11px]" style={{ color: t.textMuted }}>
                                {post.handle} · {post.time}
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-[10px] font-bold" style={{ color: t.textMuted }}>
                            {post.category}
                          </span>
                        </div>

                        {/* Caption */}
                        <p className="mt-3.5 text-xs leading-relaxed" style={{ color: t.textPrimary }}>
                          {post.caption}
                        </p>
                        <p className="mt-1.5 text-[11px] font-bold text-blue-600">
                          {post.tag}
                        </p>
                      </div>

                      {/* Post Media Image */}
                      <div className="relative w-full bg-black/5 overflow-hidden border-y" style={{ borderColor: t.border }}>
                        <img
                          src={post.image}
                          alt={post.caption}
                          className="h-80 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                        />
                      </div>

                      {/* Engagement Bar */}
                      <div className="p-4 flex items-center justify-between border-t" style={{ borderColor: t.border }}>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => toggleLikePost(post.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-125 ${
                              post.liked ? 'text-red-500' : 'hover:text-red-500'
                            }`}
                            style={{ color: post.liked ? '#ef4444' : t.textMuted }}
                          >
                            <Heart size={16} className={post.liked ? 'fill-red-500 text-red-500' : ''} />
                            <span>{post.likes}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toast('Comments section opened', { icon: '💬' })}
                            className="flex items-center gap-1.5 text-xs font-bold hover:text-blue-600 transition-colors"
                            style={{ color: t.textMuted }}
                          >
                            <MessageCircle size={16} />
                            <span>{post.comments}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toast.success('Post link copied to clipboard!', { icon: '🔗' })}
                            className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-600 transition-colors"
                            style={{ color: t.textMuted }}
                          >
                            <Share2 size={16} />
                            <span>{post.shares}</span>
                          </button>
                        </div>

                        <span className="text-[11px] font-medium" style={{ color: t.textMuted }}>
                          Biratnagar International College
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : activeTab === 'canteen' ? (
              /* ------------------------------------------------------------- */
              /* VIEW B: DEDICATED CANTEEN & ORDERING SYSTEM (FULL MENU) */
              /* ------------------------------------------------------------- */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Credit Balance Card */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="text-amber-600" size={24} />
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                        Campus Canteen &amp; Food Ordering
                      </h2>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                      Order fresh campus meals, specify preferences, and pay via Cash, Online QR, or Credit Khata.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center gap-3 rounded-2xl border p-3.5 shadow-xs"
                      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                          Credit Due (Khata)
                        </p>
                        <p className="text-base font-extrabold text-amber-700 dark:text-amber-400">
                          NPR {canteenCreditBalance} Pending
                        </p>
                      </div>
                      {canteenCreditBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPayCreditModal(true)}
                          className="ml-2 rounded-xl bg-[#2f4336] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                        >
                          Pay Khata
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2-Column Ordering Layout: Menu Items (Left) | Order Cart & Preferences (Right) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Left Column: Menu Items */}
                  <div className="space-y-4 lg:col-span-7">
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: t.border }}>
                      <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                        Available Menu Items
                      </h3>
                      <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
                        {CANTEEN_MENU.length} Items Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      {CANTEEN_MENU.map((item) => {
                        const qtyInCart = cart[item.id] || 0;
                        return (
                          <div
                            key={item.id}
                            className="flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md"
                            style={{
                              backgroundColor: t.cardBg || '#ffffff',
                              borderColor: t.border,
                            }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                                  {item.name}
                                </h4>
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  Available
                                </span>
                              </div>
                              <span className="text-[11px]" style={{ color: t.textMuted }}>
                                {item.category}
                              </span>
                              <p className="text-sm font-extrabold text-emerald-600">
                                NPR {item.price}
                              </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: t.border }}>
                              {qtyInCart > 0 ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.id, -1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-black/5 dark:hover:bg-white/5"
                                    style={{ borderColor: t.border }}
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold" style={{ color: t.textPrimary }}>
                                    {qtyInCart}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.id, 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2f4336] text-white hover:bg-[#25362b]"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.id, 1)}
                                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                  style={{ borderColor: t.border, color: t.textPrimary }}
                                >
                                  <Plus size={13} /> Add to Cart
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Order Checkout & Custom Preferences */}
                  <div className="space-y-4 lg:col-span-5">
                    <div
                      className="rounded-2xl border p-5 shadow-xs sticky top-24"
                      style={{
                        backgroundColor: t.cardBg || '#ffffff',
                        borderColor: t.border,
                      }}
                    >
                      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
                        <div className="flex items-center gap-2">
                          <ShoppingBag size={18} className="text-emerald-600" />
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Your Food Cart
                          </h3>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
                          {cartItems.length} items
                        </span>
                      </div>

                      {cartItems.length === 0 ? (
                        <div className="py-8 text-center" style={{ color: t.textMuted }}>
                          <ShoppingBag size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-xs font-semibold">Your food cart is empty</p>
                          <p className="text-[11px]">Click &quot;Add to Cart&quot; on any menu dish to order</p>
                        </div>
                      ) : (
                        <form onSubmit={handleProcessOrder} className="mt-4 space-y-4">
                          {/* Itemized List */}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {cartItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between rounded-xl border p-2.5 text-xs"
                                style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                              >
                                <div>
                                  <p className="font-bold" style={{ color: t.textPrimary }}>
                                    {item.name}
                                  </p>
                                  <p className="text-[11px]" style={{ color: t.textMuted }}>
                                    NPR {item.price} × {item.qty}
                                  </p>
                                </div>
                                <span className="font-extrabold text-emerald-600">
                                  NPR {item.total}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Extra Preferences / What is needed */}
                          <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                              Extra Preferences (What else is needed?)
                            </label>
                            <textarea
                              rows={2}
                              placeholder="e.g. Extra spicy achar, no onions, pack separately for takeaway..."
                              value={orderPreference}
                              onChange={(e) => setOrderPreference(e.target.value)}
                              className="w-full rounded-xl border p-2.5 text-xs outline-none"
                              style={{
                                backgroundColor: t.pageBg,
                                borderColor: t.border,
                                color: t.textPrimary,
                              }}
                            />
                          </div>

                          {/* Payment Method Selector */}
                          <div>
                            <label className="block text-xs font-bold mb-2" style={{ color: t.textPrimary }}>
                              Select Payment Option
                            </label>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {/* 1. Cash */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 font-bold transition-all ${
                                  paymentMethod === 'cash'
                                    ? 'border-[#2f4336] bg-[#2f4336] text-white shadow-xs'
                                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                                style={{ borderColor: paymentMethod === 'cash' ? '#2f4336' : t.border }}
                              >
                                <Banknote size={16} className="mb-1" />
                                <span>Cash</span>
                              </button>

                              {/* 2. Online */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('online')}
                                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 font-bold transition-all ${
                                  paymentMethod === 'online'
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                                style={{ borderColor: paymentMethod === 'online' ? '#2563eb' : t.border }}
                              >
                                <QrCode size={16} className="mb-1" />
                                <span>Online (QR)</span>
                              </button>

                              {/* 3. Credit Khata */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('canteen_credit')}
                                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 font-bold transition-all ${
                                  paymentMethod === 'canteen_credit'
                                    ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                                style={{ borderColor: paymentMethod === 'canteen_credit' ? '#d97706' : t.border }}
                              >
                                <CreditCard size={16} className="mb-1" />
                                <span>Credit Khata</span>
                              </button>
                            </div>

                            {paymentMethod === 'cash' && (
                              <p className="mt-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-2 text-[11px] font-medium" style={{ color: t.textMuted }}>
                                ℹ️ Pay NPR {cartSubtotal} at the counter when picking up your food.
                              </p>
                            )}

                            {paymentMethod === 'online' && (
                              <p className="mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2 text-[11px] font-medium text-blue-800 dark:text-blue-300">
                                ℹ️ Scan Machhapuchchhre Bank QR code (Fonepay/eSewa/Khalti) on the next step.
                              </p>
                            )}

                            {paymentMethod === 'canteen_credit' && (
                              <p className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                ℹ️ NPR {cartSubtotal} will be added to your pending Credit Due (Khata).
                              </p>
                            )}
                          </div>

                          {/* Subtotal & Order Button */}
                          <div className="border-t pt-3" style={{ borderColor: t.border }}>
                            <div className="flex items-center justify-between text-sm font-bold mb-3">
                              <span style={{ color: t.textPrimary }}>Total Amount:</span>
                              <span className="text-base text-emerald-600 font-extrabold">
                                NPR {cartSubtotal}
                              </span>
                            </div>

                            <button
                              type="submit"
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f4336] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#25362b]"
                            >
                              {paymentMethod === 'online'
                                ? 'Proceed to QR Payment →'
                                : paymentMethod === 'cash'
                                ? 'Confirm Cash Order'
                                : 'Add to Credit Khata & Order'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'ssd-help' ? (
              /* ------------------------------------------------------------- */
              /* VIEW C: DEDICATED SSD HELP (ATTENDANCE, VOLUNTEERING, SCHOLARSHIP AAA STATUS) */
              /* ------------------------------------------------------------- */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="text-blue-600" size={24} />
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                        Student Services Department (SSD) Help
                      </h2>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                      Official evaluation records, attendance tracking, volunteering service, and scholarship AAA status.
                    </p>
                  </div>

                  {/* Sub-Tabs Selector */}
                  <div
                    className="flex items-center gap-1 rounded-xl border p-1 shadow-xs self-start"
                    style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                  >
                    <button
                      type="button"
                      onClick={() => setSsdActiveSubTab('scholarship')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        ssdActiveSubTab === 'scholarship'
                          ? 'bg-[#2f4336] text-white shadow-xs'
                          : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Scholarship (AAA Status)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSsdActiveSubTab('attendance')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        ssdActiveSubTab === 'attendance'
                          ? 'bg-[#2f4336] text-white shadow-xs'
                          : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Attendance Tracker
                    </button>
                    <button
                      type="button"
                      onClick={() => setSsdActiveSubTab('volunteering')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        ssdActiveSubTab === 'volunteering'
                          ? 'bg-[#2f4336] text-white shadow-xs'
                          : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Volunteering History
                    </button>
                  </div>
                </div>

                {/* SubTab 1: Scholarship AAA Status (Exact Request) */}
                {ssdActiveSubTab === 'scholarship' && (
                  <div className="space-y-6">
                    <div
                      className="rounded-3xl border p-7 shadow-xs"
                      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                    >
                      <div className="flex flex-col justify-between gap-3 border-b pb-5 sm:flex-row sm:items-center" style={{ borderColor: t.border }}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
                            <Award size={26} />
                          </div>
                          <div>
                            <h3 className="text-lg font-extrabold" style={{ color: t.textPrimary }}>
                              Scholarship AAA Evaluation Status
                            </h3>
                            <p className="text-xs" style={{ color: t.textMuted }}>
                              Student Services Department official evaluation metric for tuition grant &amp; merit retention
                            </p>
                          </div>
                        </div>

                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800 shadow-xs">
                          <CheckCheck size={16} /> AAA Verified &amp; Approved
                        </span>
                      </div>

                      {/* AAA Status Display: ATTENDANCE (87%), ACADEMIC (84%), ATTITUDE (2%) */}
                      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {/* 1. ATTENDANCE (87%) */}
                        <div
                          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md"
                          style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                                Metric 1 · AAA
                              </span>
                              <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                                Above Target
                              </span>
                            </div>

                            <h4 className="mt-2 text-sm font-extrabold uppercase" style={{ color: t.textPrimary }}>
                              Attendance
                            </h4>

                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-4xl font-black text-emerald-600">
                                87%
                              </span>
                              <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
                                / 100%
                              </span>
                            </div>

                            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                              <div
                                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                                style={{ width: '87%' }}
                              />
                            </div>
                          </div>

                          <p className="mt-4 text-xs font-medium" style={{ color: t.textMuted }}>
                            Requirement: <span className="font-bold text-emerald-600">≥ 75%</span> (Compliant &amp; Active)
                          </p>
                        </div>

                        {/* 2. ACADEMIC (84%) */}
                        <div
                          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md"
                          style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold tracking-wider uppercase text-blue-700 dark:text-blue-400">
                                Metric 2 · AAA
                              </span>
                              <span className="rounded-md bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 text-[10px] font-extrabold text-blue-800 dark:text-blue-300">
                                Honors Level
                              </span>
                            </div>

                            <h4 className="mt-2 text-sm font-extrabold uppercase" style={{ color: t.textPrimary }}>
                              Academic
                            </h4>

                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-4xl font-black text-blue-600">
                                84%
                              </span>
                              <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
                                / 100%
                              </span>
                            </div>

                            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                              <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                style={{ width: '84%' }}
                              />
                            </div>
                          </div>

                          <p className="mt-4 text-xs font-medium" style={{ color: t.textMuted }}>
                            Requirement: <span className="font-bold text-blue-600">≥ 70%</span> (Eligible for 50% waiver)
                          </p>
                        </div>

                        {/* 3. ATTITUDE (2%) */}
                        <div
                          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md"
                          style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold tracking-wider uppercase text-purple-700 dark:text-purple-400">
                                Metric 3 · AAA
                              </span>
                              <span className="rounded-md bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-extrabold text-purple-800 dark:text-purple-300">
                                Exemplary Conduct
                              </span>
                            </div>

                            <h4 className="mt-2 text-sm font-extrabold uppercase" style={{ color: t.textPrimary }}>
                              Attitude
                            </h4>

                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-4xl font-black text-purple-600">
                                2%
                              </span>
                              <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
                                Infraction Index (Clean)
                              </span>
                            </div>

                            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                              <div
                                className="h-full rounded-full bg-purple-600 transition-all duration-500"
                                style={{ width: '2%' }}
                              />
                            </div>
                          </div>

                          <p className="mt-4 text-xs font-medium" style={{ color: t.textMuted }}>
                            Standard: <span className="font-bold text-purple-600">&lt; 5%</span> (Exemplary peer discipline)
                          </p>
                        </div>
                      </div>

                      {/* Summary Note Banner */}
                      <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-amber-500/10 border border-emerald-500/20 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                              AAA Status Summary: Attendance 87% · Academic 84% · Attitude 2%
                            </p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                              Student meets all criteria for full institutional scholarship fee concession.
                            </p>
                          </div>
                          <span className="rounded-xl bg-[#2f4336] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs">
                            Active Award
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab 2: Attendance Tracker */}
                {ssdActiveSubTab === 'attendance' && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                      <div
                        className="rounded-2xl border p-5 shadow-xs text-center"
                        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                      >
                        <p className="text-3xl font-extrabold text-emerald-600">87%</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: t.textPrimary }}>
                          Overall Attendance
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Above 75% Requirement</p>
                      </div>

                      <div
                        className="rounded-2xl border p-5 shadow-xs text-center"
                        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                      >
                        <p className="text-3xl font-extrabold text-blue-600">42</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: t.textPrimary }}>
                          Present Days
                        </p>
                        <p className="text-[10px]" style={{ color: t.textMuted }}>Total sessions attended</p>
                      </div>

                      <div
                        className="rounded-2xl border p-5 shadow-xs text-center"
                        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                      >
                        <p className="text-3xl font-extrabold text-red-500">6</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: t.textPrimary }}>
                          Absent Days
                        </p>
                        <p className="text-[10px]" style={{ color: t.textMuted }}>Excused/Unexcused</p>
                      </div>

                      <div
                        className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs"
                        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                      >
                        <div>
                          <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                            Daily Attendance
                          </p>
                          <p className="text-[11px]" style={{ color: t.textMuted }}>
                            {isLoggedToday ? 'Verified Present Today' : 'Pending Check-In'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleTrackAttendanceToday}
                          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#2f4336] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                        >
                          <CheckCircle2 size={14} /> Click to Track Attendance
                        </button>
                      </div>
                    </div>

                    {/* Attendance Logs Table */}
                    <div
                      className="rounded-2xl border p-6 shadow-xs"
                      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                    >
                      <h3 className="text-base font-bold mb-4" style={{ color: t.textPrimary }}>
                        Recent Attendance Activity Log
                      </h3>
                      <div className="space-y-2.5">
                        {attendanceRecords.map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-xl border p-3.5 text-xs"
                            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-2.5 w-2.5 rounded-full ${
                                  rec.status === 'Present' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              <div>
                                <p className="font-bold" style={{ color: t.textPrimary }}>
                                  {rec.date}
                                </p>
                                <p className="text-[11px]" style={{ color: t.textMuted }}>
                                  {rec.room !== '-' ? `Room: ${rec.room}` : 'No entry recorded'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[11px]" style={{ color: t.textMuted }}>
                                {rec.time}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  rec.status === 'Present'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab 3: Volunteering History */}
                {ssdActiveSubTab === 'volunteering' && (
                  <div className="space-y-6">
                    <div
                      className="rounded-2xl border p-6 shadow-xs"
                      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                    >
                      <div className="flex items-center justify-between border-b pb-4 mb-5" style={{ borderColor: t.border }}>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Community Volunteering &amp; Service Hours
                          </h3>
                          <p className="text-xs" style={{ color: t.textMuted }}>
                            Official records registered with Student Services Department
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                          36 Total Hours Completed
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {volunteeringHistory.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                                  {item.role}
                                </h4>
                                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                  {item.event}
                                </span>
                              </div>
                              <p className="text-xs" style={{ color: t.textMuted }}>
                                Date: {item.date} · Verified by SSD Campus Coordinator
                              </p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                                +{item.hours} Hours
                              </span>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Verified ✅
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'lost-found' ? (
              /* ------------------------------------------------------------- */
              /* VIEW D: DEDICATED LOST & FOUND PORTAL */
              /* ------------------------------------------------------------- */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Search className="text-blue-600" size={24} />
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                        Lost &amp; Found Portal
                      </h2>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                      Report misplaced belongings, claim found items, and keep our campus honest and connected.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="rounded-xl bg-[#2f4336] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                    >
                      + Report Lost Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderColor: t.border, color: t.textPrimary }}
                    >
                      ← Dashboard
                    </button>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {lostFoundItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                      style={{
                        backgroundColor: t.cardBg || '#ffffff',
                        borderColor: t.border,
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            {item.title}
                          </h4>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              item.status === 'Claimed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-xs" style={{ color: t.textMuted }}>
                          <p className="flex items-center gap-1.5">
                            <MapPin size={13} /> {item.location}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock size={13} /> Reported: {item.time}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Tag size={13} /> Category: {item.category}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t pt-3" style={{ borderColor: t.border }}>
                        {item.status === 'Unclaimed' ? (
                          <button
                            type="button"
                            onClick={() => handleClaimLostItem(item.id)}
                            className="w-full rounded-xl bg-[#2f4336] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                          >
                            Claim this Item
                          </button>
                        ) : (
                          <div className="text-center text-xs font-semibold text-emerald-600">
                            Claimed &amp; Returned
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'events' ? (
              /* ------------------------------------------------------------- */
              /* VIEW E: DEDICATED EVENTS HUB */
              /* ------------------------------------------------------------- */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-blue-600" size={24} />
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                        Campus Events Hub
                      </h2>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                      Browse and register for official college programs and student community workshops.
                    </p>
                  </div>

                  <div
                    className="flex items-center gap-1 rounded-xl border p-1 shadow-xs self-start"
                    style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                  >
                    <button
                      type="button"
                      onClick={() => setEventsFilter('all')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        eventsFilter === 'all'
                          ? 'bg-[#2f4336] text-white shadow-xs'
                          : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      All Events
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventsFilter('college')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        eventsFilter === 'college'
                          ? 'bg-[#2f4336] text-white shadow-xs'
                          : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      College Events
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventsFilter('community')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        eventsFilter === 'community'
                          ? 'bg-[#2f4336] text-white shadow-xs'
                          : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Community Events
                    </button>
                  </div>
                </div>

                {/* College Events */}
                {(eventsFilter === 'all' || eventsFilter === 'college') && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold border-b pb-2" style={{ color: t.textPrimary, borderColor: t.border }}>
                      Official College Events
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {collegeEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                                {renderEventIcon(ev.iconType)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                                  {ev.name}
                                </h4>
                                <span className="text-[11px] font-semibold text-blue-600">{ev.badge}</span>
                              </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                              {ev.desc}
                            </p>
                            <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                              <div className="flex items-center gap-2">
                                <Calendar size={13} /> <span className="font-semibold" style={{ color: t.textPrimary }}>{ev.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={13} /> <span>{ev.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin size={13} /> <span>{ev.venue}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-5">
                            <button
                              type="button"
                              onClick={() => toggleCollegeEvent(ev.id)}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                ev.registered
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                              }`}
                            >
                              {ev.registered ? 'Registered' : 'Register for Event'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Events */}
                {(eventsFilter === 'all' || eventsFilter === 'community') && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-base font-bold border-b pb-2" style={{ color: t.textPrimary, borderColor: t.border }}>
                      Student Community Events
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {communityEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40">
                                {renderEventIcon(ev.iconType)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                                  {ev.name}
                                </h4>
                                <span className="text-[11px] font-semibold text-purple-600">by {ev.org}</span>
                              </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                              {ev.desc}
                            </p>
                            <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                              <div className="flex items-center gap-2">
                                <Calendar size={13} /> <span className="font-semibold" style={{ color: t.textPrimary }}>{ev.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={13} /> <span>{ev.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin size={13} /> <span>{ev.venue}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-5">
                            <button
                              type="button"
                              onClick={() => toggleCommunityEvent(ev.id)}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                ev.joined
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                              }`}
                            >
                              {ev.joined ? 'Joined Session' : 'Join Event'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'vacant-classes' ? (
              /* ------------------------------------------------------------- */
              /* VIEW F: DEDICATED VACANT CLASSES */
              /* ------------------------------------------------------------- */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <School className="text-emerald-600" size={24} />
                    <h2 className="text-2xl font-bold" style={{ color: t.textPrimary }}>
                      Vacant Classrooms
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="rounded-xl border px-3.5 py-2 text-xs font-semibold"
                    style={{ borderColor: t.border, color: t.textPrimary }}
                  >
                    ← Back to Dashboard
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {CLASSROOM_POOL.map((room) => {
                    const status = classPermissions[room.id] || 'vacant';
                    return (
                      <div
                        key={room.id}
                        className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs"
                        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                                {room.name}
                              </h3>
                              <p className="text-xs" style={{ color: t.textMuted }}>
                                {room.block}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                status === 'vacant'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {status === 'vacant' ? 'Vacant' : status === 'pending' ? 'Pending' : 'Approved'}
                            </span>
                          </div>

                          <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                            <p>Capacity: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.capacity} seats</span></p>
                            <p>Amenities: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.facilities}</span></p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <button
                            type="button"
                            onClick={() => handleTakePermission(room.id)}
                            className={`w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all ${
                              status === 'vacant'
                                ? 'bg-[#2f4336] hover:bg-[#25362b]'
                                : status === 'pending'
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {status === 'vacant' ? 'Take Permission' : status === 'pending' ? 'Permission Pending' : 'Approved (Release)'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* VIEW G: MAIN DASHBOARD VIEW */
              /* ------------------------------------------------------------- */
              <>
                {/* 1. Header Section with Real-Time Greeting */}
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
                  {/* Attendance Card -> Connected to SSD Help */}
                  <div
                    className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md cursor-pointer"
                    onClick={() => {
                      setActiveTab('ssd-help');
                      setSsdActiveSubTab('attendance');
                    }}
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                          Attendance (SSD)
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> On Track
                        </span>
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

                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                          style={{ width: '87%' }}
                        ></div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('ssd-help');
                        setSsdActiveSubTab('attendance');
                      }}
                      className="mt-5 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View Attendance in SSD →
                    </button>
                  </div>

                  {/* Upcoming Events Overview Card -> Connected to Events Hub */}
                  <div
                    className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md cursor-pointer"
                    onClick={() => setActiveTab('events')}
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
                        <div className="flex items-center gap-2">
                          <Mic2 size={16} className="text-blue-600 shrink-0" />
                          <p className="text-lg font-bold truncate" style={{ color: t.textPrimary }}>
                            Devfest Program
                          </p>
                        </div>
                        <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
                          Aug 26 · 10:00 AM · Main Auditorium
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: t.textMuted }}>
                        <Clock size={13} />
                        <span>Nearest event in 10 days</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('events');
                      }}
                      className="mt-5 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View Schedule in Events Hub →
                    </button>
                  </div>

                  {/* Today Canteen Special Overview Card -> Navigates to Canteen Ordering */}
                  <div
                    className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md cursor-pointer"
                    onClick={() => setActiveTab('canteen')}
                    style={{
                      backgroundColor: t.cardBg || '#ffffff',
                      borderColor: t.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                          Today Canteen Special
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          <Flame size={12} className="text-amber-600" /> Specials
                        </span>
                      </div>

                      {/* 3 Food Item Point-Wise List with Diya Ko Royal Biryani Bold */}
                      <div className="mt-3 space-y-2">
                        {CANTEEN_SPECIALS_LIST.map((food) => (
                          <div
                            key={food.id}
                            className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                              food.isBold
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-200'
                                : 'bg-black/5 dark:bg-white/5'
                            }`}
                          >
                            <span className={`flex items-center gap-1.5 ${food.isBold ? 'font-black text-sm tracking-tight' : 'font-medium'}`}>
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${food.isBold ? 'bg-amber-600 text-white font-bold' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                {food.id}
                              </span>
                              <strong className={food.isBold ? 'font-extrabold text-amber-900 dark:text-amber-200' : 'font-semibold'} style={{ color: food.isBold ? undefined : t.textPrimary }}>
                                {food.name}
                              </strong>
                            </span>
                            <span className={`font-extrabold ${food.isBold ? 'text-amber-700 dark:text-amber-300 text-xs' : 'text-emerald-600'}`}>
                              NPR {food.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('canteen');
                      }}
                      className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Order Food in Canteen →
                    </button>
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
                        <div className="flex items-center gap-2">
                          <Trophy size={18} className="text-amber-600" />
                          <div>
                            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                              Upcoming College Events
                            </h3>
                            <p className="text-xs" style={{ color: t.textMuted }}>
                              Official campus ceremonies, fests &amp; conferences
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('events')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View in Events Hub →
                        </button>
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
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                                  {renderEventIcon(ev.iconType)}
                                </div>
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
                              {ev.registered ? 'Registered' : 'Register'}
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
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-purple-600" />
                          <div>
                            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                              Community Events
                            </h3>
                            <p className="text-xs" style={{ color: t.textMuted }}>
                              Organized by AI Horizon, Coding Clubs &amp; Student Groups
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('events')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View in Events Hub →
                        </button>
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
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/50">
                                  {renderEventIcon(ev.iconType)}
                                </div>
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
                              {ev.joined ? 'Joined' : 'Join Event'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Row: Important Announcements (Left) | Canteen Quick Overview (Right) */}
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
                        <div className="flex items-center gap-2">
                          <Megaphone size={18} className="text-blue-600" />
                          <div>
                            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                              Important Announcements
                            </h3>
                            <p className="text-xs" style={{ color: t.textMuted }}>
                              Official notices and deadline alerts
                            </p>
                          </div>
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
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                              <Megaphone size={13} />
                            </span>
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

                  {/* Today's Canteen Dashboard Section */}
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
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed size={18} className="text-amber-600" />
                          <div>
                            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                              Today&apos;s Canteen
                            </h3>
                            <p className="text-xs" style={{ color: t.textMuted }}>
                              Fresh menu, live ordering &amp; crowd status
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          <span>Current Crowd:</span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span> Medium
                          </span>
                        </div>
                      </div>

                      {/* Featured Special Banner */}
                      <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/40 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                              <Flame size={20} />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                Today&apos;s Special
                              </span>
                              <h4 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
                                Chicken Momo
                              </h4>
                              <p className="text-xs" style={{ color: t.textMuted }}>
                                Fresh steamed dumplings with spicy tomato sesame chutney
                              </p>
                            </div>
                          </div>
                          <span className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
                            NPR 120
                          </span>
                        </div>
                      </div>

                      {/* Quick Ordering CTA with Credit Balance Status */}
                      <div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                              Order Online &amp; Skip The Queue
                            </p>
                            <p className="text-[11px]" style={{ color: t.textMuted }}>
                              11 fresh items available · Cash, Online QR or Credit Khata
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('canteen')}
                            className="rounded-xl bg-[#2f4336] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                          >
                            Open Menu &amp; Order →
                          </button>
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
                          <School size={18} className="text-emerald-600" />
                          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                            Vacant Classroom
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
                              {currentRandomRoom.name}
                            </h4>
                            <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                              {currentRandomRoom.block} · {currentRandomRoom.facilities}
                            </p>
                          </div>

                          {currentRandomStatus === 'vacant' && (
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Vacant
                            </span>
                          )}
                          {currentRandomStatus === 'pending' && (
                            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 animate-pulse">
                              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Pending
                            </span>
                          )}
                          {currentRandomStatus === 'approved' && (
                            <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                              <span className="h-2 w-2 rounded-full bg-blue-600"></span> Approved
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
                            {currentRandomStatus === 'pending' && 'Permission Pending (Click to Approve)'}
                            {currentRandomStatus === 'approved' && 'Approved (Release Room)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lost & Found Dashboard Section -> Connected to Lost & Found Portal */}
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
                          <Search size={18} className="text-blue-600" />
                          <div>
                            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                              Lost &amp; Found
                            </h3>
                            <p className="text-xs" style={{ color: t.textMuted }}>
                              Recently reported campus belongings
                            </p>
                          </div>
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
                            View All in Portal →
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
                              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === 'Claimed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.status === 'Claimed' ? 'bg-emerald-600' : 'bg-amber-600'
                                }`}
                              ></span>
                              {item.status}
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
                    <div className="flex items-center gap-2">
                      <HelpCircle size={20} className="text-blue-600" />
                      <div>
                        <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                          Campus Help &amp; Peer Requests
                        </h3>
                        <p className="text-xs" style={{ color: t.textMuted }}>
                          Student-to-student assistance for study notes, calculators, books &amp; project help
                        </p>
                      </div>
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

      {/* 1. Online QR Payment Modal */}
      {showOnlineQrModal && lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2 text-left">
                <QrCode size={18} className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    Scan &amp; Pay Online
                  </h3>
                  <p className="text-[11px]" style={{ color: t.textMuted }}>
                    Machhapuchchhre Bank / Fonepay
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnlineQrModal(false)}
                className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Attached QR Code Image */}
            <div className="mx-auto overflow-hidden rounded-2xl border bg-white p-2 shadow-xs max-w-[260px]">
              <img
                src="/canteen-qr.jpg"
                alt="Machhapuchchhre Bank Fonepay QR - Suraj Poddar"
                className="h-auto w-full object-contain rounded-xl select-none"
              />
            </div>

            {/* Total to pay */}
            <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                Amount to Pay
              </p>
              <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
                NPR {lastPlacedOrder.amount}
              </p>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                Order: {lastPlacedOrder.item}
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleConfirmOnlinePayment}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f4336] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
              >
                <CheckCircle2 size={16} /> I Have Paid / Confirm Order
              </button>
              <button
                type="button"
                onClick={() => setShowOnlineQrModal(false)}
                className="w-full rounded-xl border py-2 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: t.border }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cash Payment Counter Token Modal */}
      {showCashTokenModal && lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-3">
              <Banknote size={28} />
            </div>

            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
              Cash Order Confirmed!
            </h3>
            <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
              Please go to the canteen counter to pay and collect your meal.
            </p>

            <div className="mt-4 rounded-2xl border p-4 bg-black/5 dark:bg-white/5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Your Token Number
              </p>
              <p className="text-4xl font-extrabold text-[#2f4336] dark:text-emerald-400">
                #{lastPlacedOrder.tokenNumber}
              </p>
              <p className="text-xs font-semibold text-emerald-600">
                Amount to Pay: NPR {lastPlacedOrder.amount}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCashTokenModal(false)}
              className="mt-5 w-full rounded-xl bg-[#2f4336] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
            >
              Done / Got It
            </button>
          </div>
        </div>
      )}

      {/* 3. Report Lost Item Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <Search size={18} className="text-blue-600" />
                <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                  Report Lost Item
                </h3>
              </div>
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

      {/* 4. Ask Help Modal */}
      {showAskHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-blue-600" />
                <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                  Ask for Campus Help
                </h3>
              </div>
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

      {/* 5. Pay Canteen Credit Modal */}
      {showPayCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <Wallet size={20} className="text-amber-600" />
                <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                  Pay Credit Due (Khata)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayCreditModal(false)}
                className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4 text-center">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Total Pending Balance
                </p>
                <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
                  NPR {canteenCreditBalance}
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                  Account: {studentName} ({user?.email || 'Student Portal'})
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                  Select Settlement Option:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPayCreditModal(false);
                      setLastPlacedOrder({ amount: canteenCreditBalance, item: 'Credit Khata Balance Settlement' });
                      setShowOnlineQrModal(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-xs hover:bg-blue-700"
                  >
                    <QrCode size={16} /> Pay via Fonepay QR
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCredit}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#2f4336] py-3 font-bold text-white shadow-xs hover:bg-[#25362b]"
                  >
                    <Banknote size={16} /> Pay Cash at Counter
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPayCreditModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-bold"
                style={{ borderColor: t.border }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Announcements Modal */}
      {showAnnouncementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                  All Important Announcements
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
