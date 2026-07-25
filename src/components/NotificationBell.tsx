import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { BellIcon } from "./icons";
import type { DashboardStats } from "../utils/types";

// No new backend endpoint needed - this reuses GET /api/dashboard/stats,
// which every role can already call and which already computes everything
// needed here. There's no persistent "read/unread" state: this is a live
// status view that reflects the system RIGHT NOW, not a historical inbox -
// closing it and reopening it will show the same things if they're still
// true, which is the correct behavior for "is anything outstanding".
const POLL_INTERVAL_MS = 30000;

interface AlertItem {
  id: string;
  message: string;
  tone: "warning" | "info";
  link: string;
}

function buildAlerts(role: string | null | undefined, stats: DashboardStats): AlertItem[] {
  const items: AlertItem[] = [];
  const stockConcerns = stats.lowStockCount + stats.outOfStockCount;

  if ((role === "admin" || role === "nurse") && stockConcerns > 0) {
    items.push({
      id: "stock",
      message: `${stockConcerns} medicine ${stockConcerns === 1 ? "item needs" : "items need"} restocking`,
      tone: "warning",
      link: "/medicines",
    });
  }

  if ((role === "admin" || role === "nurse") && stats.expiredCount > 0) {
    items.push({
      id: "expired",
      message: `${stats.expiredCount} medicine ${stats.expiredCount === 1 ? "item has" : "items have"} expired`,
      tone: "warning",
      link: "/medicines",
    });
  }

  if (role === "admin" && stats.pendingPurchaseRequests > 0) {
    items.push({
      id: "purchase-requests",
      message: `${stats.pendingPurchaseRequests} purchase ${stats.pendingPurchaseRequests === 1 ? "request needs" : "requests need"} your review`,
      tone: "warning",
      link: "/purchase-requests",
    });
  } else if (role === "nurse" && stats.pendingPurchaseRequests > 0) {
    items.push({
      id: "purchase-requests",
      message: `${stats.pendingPurchaseRequests} purchase ${stats.pendingPurchaseRequests === 1 ? "request" : "requests"} awaiting admin review`,
      tone: "info",
      link: "/purchase-requests",
    });
  }

  if (role === "nurse" && stats.waitingPatients > 0) {
    items.push({
      id: "queue",
      message: `${stats.waitingPatients} patient ${stats.waitingPatients === 1 ? "is" : "are"} currently in the queue`,
      tone: "info",
      link: "/patient-queue",
    });
  }

  if (role === "doctor" && stats.waitingPatients > 0) {
    items.push({
      id: "queue",
      message: `${stats.waitingPatients} patient ${stats.waitingPatients === 1 ? "is" : "are"} currently in the clinic`,
      tone: "info",
      link: "/patient-queue",
    });
  }

  if ((role === "doctor" || role === "staff") && stats.todaysAppointments > 0) {
    items.push({
      id: "appointments",
      message: `${stats.todaysAppointments} appointment${stats.todaysAppointments === 1 ? "" : "s"} scheduled today`,
      tone: "info",
      link: "/appointments",
    });
  }

  return items;
}

function NotificationBell() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      api
        .get<DashboardStats>("/dashboard/stats")
        .then((res) => {
          if (!cancelled) setAlerts(buildAlerts(role, res.data));
        })
        .catch(() => {
          // Stay quiet on failure - a notification bell shouldn't itself
          // throw errors at the user; it just won't update this cycle.
        });
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative text-gray-500 hover:text-sky-600 p-2 rounded-full hover:bg-gray-100"
      >
        <BellIcon className="w-5 h-5" />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold text-gray-700">Notifications</p>
            <p className="text-xs text-gray-400">Live status — updates automatically</p>
          </div>
          <div className="max-h-80 overflow-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">You're all caught up.</p>
            ) : (
              alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => goTo(a.link)}
                  className="w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 flex items-start gap-2"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      a.tone === "warning" ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  <span className="text-sm text-gray-700">{a.message}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;