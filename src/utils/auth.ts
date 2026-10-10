import type { UserRole } from "../config/permissions";
import { USER_ROLES } from "../config/permissions";

export type { UserRole };

export interface CurrentUser {
  id: string;
  role: UserRole;
  mustChangePassword: boolean;
  termsAccepted: true;
  exp?: number;
}

const SESSION_KEY = "clinic_session";
const SESSION_EVENT = "clinic-session-changed";
const SESSION_CHANNEL = "clinic-session";

const notifySessionChanged = (status: "authenticated" | "cleared"): void => {
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: status }));
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.postMessage(status);
    channel.close();
  }
};

export const subscribeToSessionChanges = (listener: () => void): (() => void) => {
  const onLocalChange = () => listener();
  window.addEventListener(SESSION_EVENT, onLocalChange);
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(SESSION_CHANNEL) : null;
  if (channel) channel.onmessage = listener;
  return () => {
    window.removeEventListener(SESSION_EVENT, onLocalChange);
    channel?.close();
  };
};

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

export const saveCurrentSession = (
  user: { id: string; role: UserRole; mustChangePassword?: boolean },
  expiresAt: string
): void => {
  const expiry = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiry)) return;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: user.id, role: user.role, mustChangePassword: user.mustChangePassword === true, termsAccepted: true, exp: Math.floor(expiry / 1000) })
  );
  notifySessionChanged("authenticated");
};

export const clearCurrentSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
  // Remove legacy JWTs left by older deployments.
  localStorage.removeItem("token");
  notifySessionChanged("cleared");
};

export type SessionRestoreResult =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "terms_required"; user: { id: string; role: UserRole; mustChangePassword: boolean }; expiresAt: string }
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
        user?: { id?: unknown; role?: unknown; mustChangePassword?: unknown };
        termsAccepted?: unknown;
        expiresAt?: unknown;
      };
    };

    const id = payload.data?.user?.id;
    const role = payload.data?.user?.role;
    const expiresAt = payload.data?.expiresAt;
    const termsAccepted = payload.data?.termsAccepted;
    const mustChangePassword = payload.data?.user?.mustChangePassword === true;

    if (
      typeof id !== "string" ||
      !isUserRole(role) ||
      typeof expiresAt !== "string" ||
      Number.isNaN(new Date(expiresAt).getTime()) ||
      typeof termsAccepted !== "boolean"
    ) {
      return {
        status: "unavailable",
        message: "The server returned an invalid session response.",
      };
    }

    if (!termsAccepted) {
      clearCurrentSession();
      return { status: "terms_required", user: { id, role, mustChangePassword }, expiresAt };
    }

    saveCurrentSession({ id, role, mustChangePassword }, expiresAt);

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

    if (
      typeof payload.id !== "string" ||
      !isUserRole(payload.role) ||
      payload.termsAccepted !== true
    ) {
      clearCurrentSession();
      return null;
    }

    return {
      id: payload.id,
      role: payload.role,
      mustChangePassword: payload.mustChangePassword === true,
      termsAccepted: true,
      exp: payload.exp as number | undefined,
    };
  } catch {
    clearCurrentSession();
    return null;
  }
};

export const getCurrentRole = (): UserRole | null =>
  getCurrentUser()?.role ?? null;
