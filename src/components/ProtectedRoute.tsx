import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";
import type { UserRole } from "../utils/auth";

// ProtectedRoute blocks access if there is no token, it is expired, or the role is not allowed.
function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
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


