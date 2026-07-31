import type { UserRole } from "../config/permissions";
import { USER_ROLES } from "../config/permissions";

export type { UserRole };

export interface CurrentUser {
  id: string;
  role: UserRole;
  exp?: number;
}

const SESSION_KEY = "clinic_session";

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

export const saveCurrentSession = (
  user: { id: string; role: UserRole },
  expiresAt: string
): void => {
  const expiry = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiry)) return;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: user.id, role: user.role, exp: Math.floor(expiry / 1000) })
  );
};

export const clearCurrentSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
  // Remove legacy JWTs left by older deployments.
  localStorage.removeItem("token");
};

export type SessionRestoreResult =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  | { status: "unavailable"; message: string };

export const restoreCurrentSession = async (): Promise<SessionRestoreResult> => {
  try {
    const response = await fetch(`/api/auth/session`, {
      credentials: "include",
    });

    if (response.status === 401 || response.status === 403) {
      clearCurrentSession();
      return { status: "unauthenticated" };
    }

    if (!response.ok) {
      return {
        status: "unavailable",
        message: "The clinic service is temporarily unavailable.",
      };
    }

    const payload = (await response.json()) as {
      data?: {
        user?: { id?: unknown; role?: unknown };
        expiresAt?: unknown;
      };
    };

    const id = payload.data?.user?.id;
    const role = payload.data?.user?.role;
    const expiresAt = payload.data?.expiresAt;

    if (
      typeof id !== "string" ||
      !isUserRole(role) ||
      typeof expiresAt !== "string" ||
      Number.isNaN(new Date(expiresAt).getTime())
    ) {
      return {
        status: "unavailable",
        message: "The server returned an invalid session response.",
      };
    }

    saveCurrentSession({ id, role }, expiresAt);

    const user = getCurrentUser();

    return user
      ? { status: "authenticated", user }
      : { status: "unauthenticated" };
  } catch {
    return {
      status: "unavailable",
      message: "Cannot connect to the clinic service. Check your connection and try again.",
    };
  }
};

// This cached profile controls navigation only. The server validates the
// HttpOnly session cookie and live account permissions on every API request.
export const getCurrentUser = (): CurrentUser | null => {
  const serialized = sessionStorage.getItem(SESSION_KEY);

  if (!serialized) return null;

  try {
    const payload = JSON.parse(serialized) as Record<string, unknown>;

    if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
      clearCurrentSession();
      return null;
    }

    if (typeof payload.id !== "string" || !isUserRole(payload.role)) {
      return null;
    }

    return {
      id: payload.id,
      role: payload.role,
      exp: payload.exp as number | undefined,
    };
  } catch {
    clearCurrentSession();
    return null;
  }
};

export const getCurrentRole = (): UserRole | null =>
  getCurrentUser()?.role ?? null;