import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "../store/hooks";

/**
 * Wraps protected pages. Redirects to /login if not authenticated.
 * Preserves the attempted URL so we can redirect back after login.
 */
const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isBootstrapping } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (isBootstrapping) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
