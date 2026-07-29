import type { UserRole } from "../config/permissions";
import { USER_ROLES } from "../config/permissions";

export type { UserRole };

interface TokenPayload {
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

// This cached profile controls navigation only. The server validates the
// HttpOnly session cookie and live account permissions on every API request.
export const getCurrentUser = (): TokenPayload | null => {
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

    return { id: payload.id, role: payload.role, exp: payload.exp as number | undefined };
  } catch {
    clearCurrentSession();
    return null;
  }
};

export const getCurrentRole = (): UserRole | null => getCurrentUser()?.role ?? null;
