import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  restoreCurrentSession,
  clearCurrentSession,
  subscribeToSessionChanges,
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
  const [termsRequired, setTermsRequired] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user) return;
    let cancelled = false;

    setChecking(true);
    setServiceError("");
    restoreCurrentSession()
      .then((result) => {
        if (cancelled) return;
        if (result.status === "authenticated") setUser(result.user);
        if (result.status === "terms_required") setTermsRequired(true);
        if (result.status === "unavailable") setServiceError(result.message);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey, user]);

  useEffect(() => {
    if (!user) return;
    const expire = () => {
      clearCurrentSession();
      setUser(null);
      setTermsRequired(false);
    };
    const checkSession = () => {
      const current = getCurrentUser();
      if (!current) setUser(null);
    };
    const expiryDelay = user.exp ? Math.max(0, user.exp * 1000 - Date.now()) : null;
    const expiryTimer = expiryDelay === null ? null : window.setTimeout(expire, expiryDelay);
    const unsubscribe = subscribeToSessionChanges(checkSession);
    document.addEventListener("visibilitychange", checkSession);
    window.addEventListener("focus", checkSession);
    return () => {
      if (expiryTimer !== null) window.clearTimeout(expiryTimer);
      unsubscribe();
      document.removeEventListener("visibilitychange", checkSession);
      window.removeEventListener("focus", checkSession);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const configuredMinutes = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES ?? 15);
    const idleMilliseconds = Math.max(5, configuredMinutes) * 60_000;
    let timer = 0;
    const lock = () => {
      void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
        clearCurrentSession();
        setUser(null);
      });
    };
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lock, idleMilliseconds);
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [user]);

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
    return <Navigate to={termsRequired ? "/login?reason=terms-required" : "/login"} replace />;
  }

  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
