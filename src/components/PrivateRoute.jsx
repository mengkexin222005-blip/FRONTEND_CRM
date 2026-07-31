import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRoleName } from "../utils/roleRedirect";

export default function PrivateRoute({ roles }) {
  const { accessToken, user } = useAuth();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedUserRole = normalizeRoleName(user.role);
  const normalizedAllowedRoles = (roles ?? []).map(normalizeRoleName);

  if (roles && !normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
