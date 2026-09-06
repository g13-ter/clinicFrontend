import type { DashboardStats } from "./types";

export interface DashboardAlert {
  id: string;
  message: string;
  tone: "warning" | "info";
  link: string;
}

export function buildDashboardAlerts(
  role: string | null | undefined,
  stats: DashboardStats,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const stockConcerns = stats.lowStockCount + stats.outOfStockCount;

  if (role === "nurse" && stockConcerns > 0) {
    alerts.push({
      id: "stock",
      message: `${stockConcerns} medicine ${stockConcerns === 1 ? "item needs" : "items need"} restocking`,
      tone: "warning",
      link: "/dashboard?view=inventory",
    });
  }

  if (role === "nurse" && stats.expiredCount > 0) {
    alerts.push({
      id: "expired",
      message: `${stats.expiredCount} medicine ${stats.expiredCount === 1 ? "item has" : "items have"} expired`,
      tone: "warning",
      link: "/dashboard?view=inventory",
    });
  }

  if (role === "admin" && stats.pendingPurchaseRequests > 0) {
    alerts.push({
      id: "purchase-requests",
      message: `${stats.pendingPurchaseRequests} purchase ${stats.pendingPurchaseRequests === 1 ? "request needs" : "requests need"} review`,
      tone: "warning",
      link: "/dashboard?section=purchase-requests",
    });
  } else if (role === "nurse" && stats.pendingPurchaseRequests > 0) {
    alerts.push({
      id: "purchase-requests",
      message: `${stats.pendingPurchaseRequests} purchase ${stats.pendingPurchaseRequests === 1 ? "request is" : "requests are"} awaiting admin review`,
      tone: "info",
      link: "/dashboard?view=purchase-requests",
    });
  }

  if ((role === "doctor" || role === "nurse") && stats.waitingPatients > 0) {
    alerts.push({
      id: "queue",
      message: `${stats.waitingPatients} student ${stats.waitingPatients === 1 ? "is" : "are"} waiting in the clinic`,
      tone: "info",
      link: role === "doctor" ? "/dashboard?tab=visits" : "/dashboard?view=visits",
    });
  }

  if ((role === "doctor" || role === "staff") && stats.todaysAppointments > 0) {
    alerts.push({
      id: "appointments",
      message: `${stats.todaysAppointments} appointment${stats.todaysAppointments === 1 ? "" : "s"} scheduled today`,
      tone: "info",
      link: role === "doctor" ? "/dashboard?tab=appointments" : "/dashboard?view=appointments",
    });
  }

  return alerts;
}

export const dashboardAlertKey = (alert: DashboardAlert): string =>
  `${alert.id}:${alert.message}`;
