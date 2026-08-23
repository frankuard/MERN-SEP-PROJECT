import { useState } from 'react';
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme];

  const [activeTab, setActiveTab] = useState('dashboard');
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