import { Navigate } from 'react-router-dom';
import { getDashboardPath, useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

export default RoleRoute;
