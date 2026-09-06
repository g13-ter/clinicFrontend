import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import type { InAppNotification } from "../../utils/types";

interface NotificationResponse {
  items: InAppNotification[];
  unreadCount: number;
}

const NOTIFICATION_POLL_INTERVAL_MS = 10_000;

export function useInAppNotifications(enabled: boolean) {
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await api.get<NotificationResponse>("/notifications?limit=100");
      setItems(response.data.items);
      setUnreadCount(response.data.unreadCount);
      setError("");
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setUnreadCount(0);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
    const interval = window.setInterval(refresh, NOTIFICATION_POLL_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [enabled, refresh]);

  const markRead = async (id: string) => {
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => item._id === id && !item.readAt ? { ...item, readAt } : item));
    setUnreadCount((current) => Math.max(0, current - (items.some((item) => item._id === id && !item.readAt) ? 1 : 0)));
    try {
      await api.put(`/notifications/${id}/read`, {});
    } catch {
      void refresh();
    }
  };

  const markAllRead = async () => {
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => item.readAt ? item : { ...item, readAt }));
    setUnreadCount(0);
    try {
      await api.put("/notifications/read-all", {});
    } catch {
      void refresh();
    }
  };

  return { items, unreadCount, error, loading, refresh, markRead, markAllRead };
}
