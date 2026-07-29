import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser, saveCurrentSession } from "../utils/auth";
import type { UserRole } from "../config/permissions";

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: readonly UserRole[];
}) {
  const [user, setUser] = useState(getCurrentUser);
  const [checking, setChecking] = useState(user === null);

  useEffect(() => {
    if (user) return;
    let cancelled = false;

    fetch("/api/auth/session", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{
          data: {
            user: { id: string; role: UserRole };
            expiresAt: string;
          };
        }>;
      })
      .then((response) => {
        if (cancelled || !response) return;
        saveCurrentSession(response.data.user, response.data.expiresAt);
        setUser(getCurrentUser());
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Restoring your secure session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
