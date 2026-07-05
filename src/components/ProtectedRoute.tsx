import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";
import type { UserRole } from "../config/permissions";

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: readonly UserRole[];
}) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
