import { getCurrentRole, getCurrentUser, type UserRole } from "../utils/auth";
import { can, hasRole, type Capability } from "../config/permissions";

export const useAuth = () => {
  const user = getCurrentUser();
  const role = getCurrentRole();

  return {
    user,
    role,
    isAuthenticated: user !== null,
    hasRole: (allowed: readonly UserRole[]) => hasRole(role, allowed),
    can: (capability: Capability) => can(role, capability),
  };
};
