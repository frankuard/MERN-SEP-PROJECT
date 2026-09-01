import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UtensilsCrossed, Wallet, Eye, EyeOff, Users, ClipboardList, MessageSquare, Calendar, BookOpen, School, History, ClipboardCheck, FileText, Phone, Search, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import Sidebar from '../components/common/Sidebar';
import { MenuTab, CreditTab } from '../components/admin/ManageCanteen/ManageCanteenSection';
import ManageSSDSection, { ReportRequestsPanel, SSD_SUB_TABS } from '../components/admin/ManageSSD/ManageSSDSection';
import ManageAttendanceSection from '../components/admin/ManageAttendance/ManageAttendanceSection';
import ManageCampusHelpSection from '../components/admin/ManageCampusHelp/ManageCampusHelpSection';
import ManageEventsSection from '../components/admin/ManageEvents/ManageEventsSection';
import ManageTimetableSection from '../components/admin/ManageTimetable/ManageTimetableSection';
import ManageResourcesSection from '../components/admin/ManageResources/ManageResourcesSection';
import ManageLostFoundSection from '../components/admin/ManageLostFound/ManageLostFoundSection';

const CANTEEN_NAV_ITEMS = [
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'credit', label: 'Credit Due', icon: Wallet },
];

// SSD admin's scope, per the permission table: Manage SSD (which already
// has its own internal sub-tabs), plus Attendance, Campus Help, and
// Events folded in under the same login — nothing in these existing
// section components is touched, just reused directly.
const SSD_NAV_ITEMS = [
  { id: 'ssd', label: 'Manage SSD', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList },
  { id: 'attendance-requests', label: 'Attendance Report Requests', icon: FileText },
  { id: 'peer-help', label: 'Peer Help Log', icon: MessageSquare },
  { id: 'contact-info', label: 'Contact Info', icon: Phone },
  { id: 'events', label: 'Events', icon: Calendar },
];

// Manage SSD keeps Event Registrants / Volunteer Opportunities / Volunteer
// Hours together as its own internal switcher — only Report Requests is
// pulled out, since it's now its own separate sidebar item above.
const SSD_MANAGE_TABS = SSD_SUB_TABS.filter((tab) => tab.id !== 'reports');

// Mirrors ManageTimetableSection's own ADMIN_TABS exactly — the sidebar
// drives the same 5 tabs that component already knows how to render.
const RTE_NAV_ITEMS = [
  { id: 'periods', label: 'Class Periods', icon: Calendar },
  { id: 'modules', label: 'Modules & Groups', icon: BookOpen },
  { id: 'classrooms', label: 'Classrooms', icon: School },
  { id: 'changes', label: 'Schedule Changes', icon: History },
  { id: 'requests', label: 'Room Requests', icon: ClipboardCheck },
];

// Resources + Lost & Found folded together, per the permission table.
// CCTV Requests is pulled out of Lost & Found into its own item; the
// rest of Lost & Found (Lost/Found/Claims) keeps its own tab switcher.
const RESOURCES_NAV_ITEMS = [
  { id: 'resources', label: 'Manage Resources', icon: BookOpen },
  { id: 'lost-found', label: 'Manage Lost & Found', icon: Search },
  { id: 'cctv', label: 'CCTV Requests', icon: Video },
];

// Same Sidebar, same theme, same layout shell as the main admin panel —
// just a 2-item nav instead of the full one, and MenuTab/CreditTab
// reused directly (no copy, no UI change from what's already built).
const CanteenDeptPanel = () => {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeTab, setActiveTab] = useState('menu');

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: t.pageBg }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} navItems={CANTEEN_NAV_ITEMS} />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {activeTab === 'menu' ? <MenuTab t={t} /> : <CreditTab t={t} />}
        </div>
      </main>
    </div>
  );
};

// Same shell, same Sidebar, same theme — 4 top-level tabs instead of 2.
const SSDDeptPanel = () => {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeTab, setActiveTab] = useState('ssd');

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: t.pageBg }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} navItems={SSD_NAV_ITEMS} />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {activeTab === 'ssd' && <ManageSSDSection t={t} subTabs={SSD_MANAGE_TABS} />}
          {activeTab === 'attendance' && <ManageAttendanceSection t={t} />}
          {activeTab === 'attendance-requests' && <ReportRequestsPanel t={t} />}
          {activeTab === 'peer-help' && <ManageCampusHelpSection t={t} activeTab="requests" />}
          {activeTab === 'contact-info' && <ManageCampusHelpSection t={t} activeTab="departments" />}
          {activeTab === 'events' && <ManageEventsSection t={t} />}
        </div>
      </main>
    </div>
  );
};

// Sidebar drives ManageTimetableSection's tab directly — same controlled
// pattern used elsewhere, no duplicate tab UI.
const RTEDeptPanel = () => {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeTab, setActiveTab] = useState('periods');

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: t.pageBg }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} navItems={RTE_NAV_ITEMS} />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <ManageTimetableSection t={t} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </main>
    </div>
  );
};

// Both sections reused completely as-is — each keeps its own internal
// tab switcher (Books/Sports/Requests, and Lost/Found/CCTV/Claims).
const ResourcesDeptPanel = () => {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeTab, setActiveTab] = useState('resources');

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: t.pageBg }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} navItems={RESOURCES_NAV_ITEMS} />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {activeTab === 'resources' && <ManageResourcesSection t={t} />}
          {activeTab === 'lost-found' && <ManageLostFoundSection t={t} activeTab="lost" />}
          {activeTab === 'cctv' && <ManageLostFoundSection t={t} activeTab="cctv" />}
        </div>
      </main>
    </div>
  );
};

const SECTION_LABELS = {
  super: 'Super Admin',
  canteen: 'Canteen Admin',
  ssd: 'SSD Admin',
  rte: 'RTE Admin',
  resources: 'Resources Admin',
};

const VALID_SECTIONS = Object.keys(SECTION_LABELS);

const AdminDeptSection = () => {
  const { section } = useParams();
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValidSection = VALID_SECTIONS.includes(section);

    // Strict, exact match only — an account's adminSection must equal the
  // clicked card's section exactly. A 'super' account only works on the
  // Super card, a 'canteen' account only works on the Canteen card, and
  // so on. No account works on more than one card.
  const isAuthorized = user?.role === 'admin' && user.adminSection === section;

  // The super panel already exists at /admin/dashboard — once authorized
  // here, bounce straight there instead of rendering anything in this file.
  useEffect(() => {
    if (section === 'super' && isAuthorized) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [section, isAuthorized, navigate]);
  // Also true for a super account clicking any *other* card by mistake —
  // they're authorized, but the super panel itself only lives at
  // /admin/dashboard, so route them there for consistency.

  if (!isValidSection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Unknown admin section.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm text-neutral-400">
        Loading...
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login(email, password);
      const loggedInUser = data?.user;

      const authorized =
        loggedInUser?.role === 'admin' && loggedInUser?.adminSection === section;

      if (!authorized) {
        toast.error("This account doesn't have access to this department");
        await logout();
      }
      // if authorized, `user` in context updates and this component
      // re-renders straight into the panel branch below (or the effect
      // above redirects, for super).
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-8">
          <h1 className="text-xl font-bold text-white">{SECTION_LABELS[section]}</h1>
          <p className="mt-1 text-sm text-neutral-400">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 pr-10 text-sm text-white outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-white"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-white py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authorized, and this isn't 'super' (that case already redirected away).
  switch (section) {
    case 'canteen':
      return <CanteenDeptPanel />;
    case 'ssd':
      return <SSDDeptPanel />;
    case 'rte':
      return <RTEDeptPanel />;
    case 'resources':
      return <ResourcesDeptPanel />;
    default:
      return <div className="min-h-screen bg-black p-8 text-white">{SECTION_LABELS[section]} panel coming soon.</div>;
  }
};

export default AdminDeptSection;