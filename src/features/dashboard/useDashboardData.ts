import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { Appointment, DashboardStats } from "../../utils/types";
import type { UserRole } from "../../config/permissions";
import { clinicDateKey } from "../../utils/date";

type LegacyDashboardStats = Partial<DashboardStats> & { totalPatients?: number };

export function normalizeDashboardStats(data: LegacyDashboardStats): DashboardStats {
  return {
    totalStudents: data.totalStudents ?? data.totalPatients ?? 0,
    totalPatients: data.totalPatients ?? data.totalStudents ?? 0,
    patientsByType: data.patientsByType ?? { student: data.totalStudents ?? data.totalPatients ?? 0, teacher: 0, staff: 0 },
    usersByRole: {
      doctor: 0,
      nurse: 0,
      staff: 0,
      admin: 0,
      ...data.usersByRole,
    },
    todaysAppointments: data.todaysAppointments ?? 0,
    todayVisits: data.todayVisits ?? 0,
    consultationsToday: data.consultationsToday ?? 0,
    emergencyCasesToday: data.emergencyCasesToday ?? 0,
    pendingAppointments: data.pendingAppointments ?? data.todaysAppointments ?? 0,
    waitingPatients: data.waitingPatients ?? 0,
    monthlyConsultations: data.monthlyConsultations ?? 0,
    lowStockCount: data.lowStockCount ?? 0,
    outOfStockCount: data.outOfStockCount ?? 0,
    expiredCount: data.expiredCount ?? 0,
    pendingPurchaseRequests: data.pendingPurchaseRequests ?? 0,
    activeUsers: data.activeUsers ?? [],
    commonComplaints: data.commonComplaints ?? [],
    monthlyVisits: data.monthlyVisits ?? [],
    analyticsPatientType: data.analyticsPatientType ?? "all",
    analyticsTotalVisits: data.analyticsTotalVisits ?? 0,
    analyticsVisitBreakdown: data.analyticsVisitBreakdown ?? { student: 0, teacher: 0, staff: 0 },
    bmiRecordedCount: data.bmiRecordedCount ?? 0,
    bmiBreakdown: {
      underweight: 0,
      normalWeight: 0,
      overweight: 0,
      obese: 0,
      ...data.bmiBreakdown,
    },
    recentCases: data.recentCases ?? [],
    recentActivity: data.recentActivity ?? [],
  };
}

export type AnalyticsPatientType = DashboardStats["analyticsPatientType"];

export function useDashboardData(role: UserRole | null, userId?: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!role || role === "superadmin") {
      setStats(null);
      setError("");
      return;
    }
    let cancelled = false;

    api
      .get<LegacyDashboardStats>("/dashboard/stats")
      .then((response) => {
        if (!cancelled) setStats(normalizeDashboardStats(response.data));
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load dashboard");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    if (role !== "doctor" && role !== "nurse") {
      setTodayAppointments([]);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ date: clinicDateKey(), limit: "100" });
    if (role === "doctor" && userId) params.set("doctorId", userId);

    api
      .get<Appointment[]>(`/appointments?${params}`)
      .then((response) => {
        if (!cancelled) setTodayAppointments(response.data);
      })
      .catch(() => {
        if (!cancelled) setTodayAppointments([]);
      });

    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  return { stats, todayAppointments, error };
}
