import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "../store/hooks";

/**
 * Wraps auth pages (login, register, etc.).
 * Redirects authenticated users away to their intended destination or /chat.
 */
const PublicRoute: React.FC = () => {
  const { isAuthenticated, isBootstrapping } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (isBootstrapping) return null;

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/chat";
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
