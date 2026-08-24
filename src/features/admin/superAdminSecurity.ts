import type { UserRole } from "../../config/permissions";

export const isPrivilegedRole = (role: UserRole): boolean =>
  role === "admin" || role === "superadmin";

export const requiresAdministrativeStepUp = (actorRole: UserRole | null): boolean =>
  actorRole === "admin" || actorRole === "superadmin";
