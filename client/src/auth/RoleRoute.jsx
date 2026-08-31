import { Navigate } from 'react-router-dom';
import { getDashboardPath, useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  // Auth check is still in flight (e.g. hard refresh / direct URL nav) —
  // wait instead of treating "not yet loaded" as "not authenticated".
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#8b8894]">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

export default RoleRoute;
