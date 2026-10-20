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

  if (role === "nurse") {
    for (const batch of stats.expiredBatches ?? []) {
      const expiryDate = new Date(batch.expiryDate).toLocaleDateString([], { dateStyle: "medium" });
      alerts.push({
        id: `expired-medicine:${batch.batchNumber}:${batch.expiryDate}`,
        message: `Expired: ${batch.medicineName}, batch ${batch.batchNumber} has ${batch.quantityRemaining} ${batch.unit} remaining (expired ${expiryDate}).`,
        tone: "warning",
        link: "/dashboard?view=inventory",
      });
    }

    const expiringBatches = stats.expiringBatches ?? [];
    const urgent = expiringBatches.filter((batch) => batch.daysUntilExpiry <= 7);
    const upcoming = expiringBatches.filter((batch) => batch.daysUntilExpiry > 7);
    const batchAlert = (batch: typeof expiringBatches[number], window: "7-day" | "30-day"): DashboardAlert => {
      const expiryDate = new Date(batch.expiryDate).toLocaleDateString([], { dateStyle: "medium" });
      const days = batch.daysUntilExpiry === 0
        ? "expires today"
        : `expires in ${batch.daysUntilExpiry} day${batch.daysUntilExpiry === 1 ? "" : "s"}`;
      return {
        id: `medicine-expiry-${window}:${batch.batchNumber}:${batch.expiryDate}`,
        message: `${window === "7-day" ? "7-day reminder" : "30-day warning"}: ${batch.medicineName}, batch ${batch.batchNumber} has ${batch.quantityRemaining} ${batch.unit} remaining; ${days} (${expiryDate}).`,
        tone: "warning",
        link: "/dashboard?view=inventory",
      };
    };
    alerts.push(...urgent.map((batch) => batchAlert(batch, "7-day")));
    alerts.push(...upcoming.map((batch) => batchAlert(batch, "30-day")));
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
