// Decodes the JWT payload to read user role without a server round-trip.

export type UserRole = "admin" | "doctor" | "nurse" | "staff";

interface TokenPayload {
  id: string;
  role: UserRole;
}

// Returns the decoded payload, or null if there is no token, it is malformed, or it is expired.
export const getCurrentUser = (): TokenPayload | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));

    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem("token");
      return null;
    }

    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
};

export const getCurrentRole = (): UserRole | null => getCurrentUser()?.role ?? null;