import { Navigate } from "react-router-dom";
import { useAuth, AdminRole } from "../admin/AuthContext";

interface RequireRoleProps {
  roles: AdminRole[];
  children: React.ReactNode;
}

/**
 * Route-level authorization guard. Renders children only if the current
 * user's profile role is in the allowed list. Otherwise redirects to the
 * admin dashboard. This is a client-side guard — database RLS policies
 * are the authoritative security boundary.
 */
export default function RequireRole({ roles, children }: RequireRoleProps) {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (!profile) return <Navigate to="/admin/login" replace />;
  if (!profile.active) return <Navigate to="/admin/login" replace />;
  if (!roles.includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
