import { Navigate } from 'react-router-dom';
import { getDashboardPath, useAuth } from '../context/AuthContext';
import { DEV_CORPS_PORTAL_ID } from '../data/devcorpsConfig';

const DevCorpsRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Auth check is still in flight (e.g. hard refresh / direct URL nav) —
  // wait instead of treating "not yet loaded" as "not authenticated".
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c10] text-sm text-[#8b8894]">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only accounts whose portal identifier is set to the DevCorps portal
  // (validated server-side via /api/devcorps/* and /auth/me) may enter.
  if (user.portal !== DEV_CORPS_PORTAL_ID) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
};

export default DevCorpsRoute;