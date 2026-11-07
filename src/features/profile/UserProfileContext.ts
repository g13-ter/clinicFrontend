import { createContext, useContext } from "react";
import type { User } from "../../utils/types";

export interface UserProfileContextValue {
  profile: User | null;
  updateProfile: (profile: User) => void;
}

export const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
