import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleRoute from './auth/RoleRoute';
import { getDashboardPath, useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminDepartmentPicker from './pages/AdminDepartmentPicker';
import AdminDeptSection from './pages/AdminDeptSection';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard from './pages/StudentDashBoard';
import TeacherDashboard from './pages/TeacherDashboard';

const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c10] text-sm text-[#8b8894]">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};



const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Public — reachable without being logged in. /admin always lands
          here now; the department login itself happens per-card in
          AdminDeptSection, not via ProtectedRoute. */}
      <Route path="/admin" element={<Navigate to="/admin/dept" replace />} />
      <Route path="/admin/dept" element={<AdminDepartmentPicker />} />
      <Route path="/admin/dept/:section" element={<AdminDeptSection />} />

      <Route element={<ProtectedRoute />}>
        {/* /student with no section -> default to the dashboard tab */}
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route
          path="/student/:tab"
          element={
            <RoleRoute allowedRoles={['student']}>
              <StudentDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/teacher/dashboard"
          element={
            <RoleRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <RoleRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </RoleRoute>
          }
        />

        {/* Untouched — direct URL access to the actual super-admin panel
            still requires login, same as always. */}
        <Route
          path="/admin/:tab"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;