import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/auth";

// Minutes before token expiry to start showing the warning banner.
const WARNING_WINDOW_MINUTES = 5;

export function useSessionExpiryWarning() {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    const check = () => {
      const user = getCurrentUser();
      if (!user?.exp) {
        setMinutesLeft(null);
        return;
      }

      const secondsLeft = user.exp - Date.now() / 1000;
      const minutes = Math.ceil(secondsLeft / 60);

      setMinutesLeft(minutes > 0 && minutes <= WARNING_WINDOW_MINUTES ? minutes : null);
    };

    check();
    const interval = setInterval(check, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return minutesLeft;
}