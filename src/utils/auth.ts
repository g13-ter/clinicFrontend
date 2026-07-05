// Decodes the JWT payload to read user role without a server round-trip.

import type { UserRole } from "../config/permissions";
import { USER_ROLES } from "../config/permissions";

export type { UserRole };

interface TokenPayload {
  id: string;
  role: UserRole;
  exp?: number;
}

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

// Returns the decoded payload, or null if there is no token, it is malformed, or it is expired.
export const getCurrentUser = (): TokenPayload | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as Record<string, unknown>;

    if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem("token");
      return null;
    }

    if (typeof payload.id !== "string" || !isUserRole(payload.role)) {
      return null;
    }

    return { id: payload.id, role: payload.role, exp: payload.exp as number | undefined };
  } catch {
    return null;
  }
};

export const getCurrentRole = (): UserRole | null => getCurrentUser()?.role ?? null;
