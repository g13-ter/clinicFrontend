import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  restoreCurrentSession,
  type CurrentUser,
} from "../utils/auth";
import type { UserRole } from "../config/permissions";

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: readonly UserRole[];
}) {
  const [user, setUser] = useState<CurrentUser | null>(getCurrentUser);
  const [checking, setChecking] = useState(user === null);
  const [serviceError, setServiceError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (user) return;
    let cancelled = false;

    setChecking(true);
    setServiceError("");
    restoreCurrentSession()
      .then((result) => {
        if (cancelled) return;
        if (result.status === "authenticated") setUser(result.user);
        if (result.status === "unavailable") setServiceError(result.message);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey, user]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Restoring your secure session...
      </div>
    );
  }

  if (serviceError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Clinic service unavailable</h1>
          <p className="mt-2 text-sm text-gray-600">{serviceError}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
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
