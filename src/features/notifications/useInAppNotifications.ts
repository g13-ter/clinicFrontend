import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../../services/api";
import type { InAppNotification } from "../../utils/types";

interface NotificationResponse {
  items: InAppNotification[];
  unreadCount: number;
}

export interface InAppNotificationsState {
  items: InAppNotification[];
  unreadCount: number;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const InAppNotificationsContext = createContext<InAppNotificationsState | null>(null);

export function InAppNotificationsProvider({
  value,
  children,
}: {
  value: InAppNotificationsState;
  children: ReactNode;
}) {
  return createElement(InAppNotificationsContext.Provider, { value }, children);
}

const NOTIFICATION_POLL_INTERVAL_MS = 10_000;

export function useInAppNotifications(enabled: boolean) {
  const sharedState = useContext(InAppNotificationsContext);
  const localEnabled = enabled && !sharedState;
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(localEnabled);

  const refresh = useCallback(async () => {
    if (!localEnabled) return;
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
  }, [localEnabled]);

  useEffect(() => {
    if (!localEnabled) {
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
  }, [localEnabled, refresh]);

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

  const localState = { items, unreadCount, error, loading, refresh, markRead, markAllRead };
  return enabled && sharedState ? sharedState : localState;
}
