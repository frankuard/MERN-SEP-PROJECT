import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme];

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: t.pageBg }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: t.textMuted }}>
            Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl" style={{ color: t.textPrimary }}>
            Admin Portal
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: t.textMuted }}>
            Review pending approvals and manage platform access from the sidebar.
          </p>
          <div
            className="mt-8 rounded-2xl border p-6"
            style={{ backgroundColor: t.sidebarBg, borderColor: t.border }}
          >
            <p className="text-sm" style={{ color: t.textMuted }}>Signed in as</p>
            <p className="mt-1 text-lg font-medium" style={{ color: t.textPrimary }}>
              {user?.username || 'User'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
