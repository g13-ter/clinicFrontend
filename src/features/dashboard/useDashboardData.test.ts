import { describe, expect, it } from "vitest";
import { normalizeDashboardStats } from "./useDashboardData";
import { localDateKey } from "../../utils/date";

describe("dashboard data normalization", () => {
  it("provides safe defaults for an incomplete API response", () => {
    const result = normalizeDashboardStats({ totalPatients: 12, todaysAppointments: 3 });

    expect(result.totalStudents).toBe(12);
    expect(result.analyticsPatientType).toBe("all");
    expect(result.analyticsVisitBreakdown).toEqual({ student: 0, teacher: 0, staff: 0 });
    expect(result.bmiRecordedCount).toBe(0);
    expect(result.bmiBreakdown).toEqual({ underweight: 0, normalWeight: 0, overweight: 0, obese: 0 });
    expect(result.pendingAppointments).toBe(3);
    expect(result.usersByRole).toEqual({ doctor: 0, nurse: 0, staff: 0, admin: 0 });
    expect(result.recentCases).toEqual([]);
  });

  it("formats a date using its local calendar day", () => {
    expect(localDateKey(new Date(2026, 6, 28, 23, 30))).toBe("2026-07-28");
  });
});
