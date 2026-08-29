import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import AdminDashboardHome from '../components/admin/Dashboard/AdminDashboardHome';
import ManageAttendanceSection from '../components/admin/ManageAttendance/ManageAttendanceSection';
// import PendingApprovalsSection from '../components/admin/PendingApprovals/...'; // wire in later
import ManageEventsSection from '../components/admin/ManageEvents/ManageEventsSection';
import ManageAnnouncementsSection from '../components/admin/ManageAnnouncements/ManageAnnouncementsSection';
import ManageCanteenSection from '../components/admin/ManageCanteen/ManageCanteenSection';
import ManageLostFoundSection from '../components/admin/ManageLostFound/ManageLostFoundSection';
import ManageCampusHelpSection from '../components/admin/ManageCampusHelp/ManageCampusHelpSection';
import ManageResourcesSection from '../components/admin/ManageResources/ManageResourcesSection';
import ManageTimetableSection from "../components/admin/ManageTimetable/ManageTimetableSection";
import ManageSSDSection from '../components/admin/ManageSSD/ManageSSDSection';
import ManageUsersSection from '../components/admin/ManageUsers/ManageUsersSection';

// Every valid section for /admin/:tab. Includes 'manage-ssd' and
// 'manage-users' which were previously missing from this list — those two
// tabs would have silently bounced back to 'dashboard' before this fix.
const VALID_ADMIN_TABS = [
  'dashboard', 'manage-attendance', 'manage-events', 'manage-announcements',
  'manage-canteen', 'manage-lost-found', 'manage-resources',
  'manage-campus-help', 'manage-timetable', 'manage-ssd', 'manage-users',
  'approvals',
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme];

  // Active section tab now lives in the URL itself (/admin/:tab) instead of
  // React state or sessionStorage — a reload just re-requests the same URL,
  // so you land back on the same section automatically.
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = VALID_ADMIN_TABS.includes(tab) ? tab : 'dashboard';

  // Same name/signature as before (`setActiveTab('manage-events')`), so
  // Sidebar's onTabChange and AdminDashboardHome's onNavigate keep working
  // unchanged.
  const setActiveTab = (nextTab) => {
    navigate(`/admin/${nextTab}`);
  };

  const adminName = user?.username || 'Admin';

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: t.pageBg }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">

          {activeTab === 'dashboard' && (
            <AdminDashboardHome
              t={t}
              adminName={user?.username || 'Admin'}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'manage-attendance' && (
            <ManageAttendanceSection t={t} />
          )}

          {activeTab === 'manage-events' && (
            <ManageEventsSection t={t} />
          )}
          {activeTab === 'manage-announcements' && (
            <ManageAnnouncementsSection t={t} />
          )}
          {activeTab === 'manage-canteen' && (
            <ManageCanteenSection t={t} />
          )}

          {activeTab === 'manage-lost-found' && (
  <ManageLostFoundSection t={t} />
)}

{activeTab === 'manage-resources' && (
  <ManageResourcesSection t={t} />
)}

{activeTab === "manage-users" && (
  <ManageUsersSection t={t} />
)}

{activeTab === 'manage-campus-help' && (
  <ManageCampusHelpSection t={t} />
)}

{activeTab === 'manage-ssd' && (
  <ManageSSDSection t={t} />
)}

{activeTab === "manage-timetable" && (
  <ManageTimetableSection t={t} />
)}

          {activeTab === 'approvals' && (
            <div>
              <p className="text-sm" style={{ color: t.textMuted }}>
                Pending Approvals — wire in your existing ApprovalList/ApprovalCard components here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;