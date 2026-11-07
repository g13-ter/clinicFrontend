import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../../services/api";
import type { User } from "../../utils/types";
import { UserProfileContext } from "./UserProfileContext";

export function UserProfileProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const [storedProfile, setStoredProfile] = useState<{
    userId: string;
    profile: User;
  } | null>(null);

  const updateProfile = useCallback((profile: User) => {
    if (userId) setStoredProfile({ userId, profile });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setStoredProfile(null);
      return;
    }

    let active = true;
    api.get<User>("/users/me")
      .then((response) => {
        if (active) setStoredProfile({ userId, profile: response.data });
      })
      .catch(() => {
        // The rest of the workspace remains available if profile loading fails.
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const profile = storedProfile?.userId === userId ? storedProfile.profile : null;
  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile]);

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}
