import { describe, expect, it } from "vitest";
import { can, hasRole, patientsListPath, ROUTE_ACCESS } from "../config/permissions";

describe("permissions", () => {
  it("grants manageAppointments to staff and nurse only", () => {
    expect(can("staff", "manageAppointments")).toBe(true);
    expect(can("nurse", "manageAppointments")).toBe(true);
    expect(can("doctor", "manageAppointments")).toBe(false);
    expect(can("admin", "manageAppointments")).toBe(false);
  });

  it("maps staff to the basic patient list endpoint", () => {
    expect(patientsListPath("staff")).toBe("/patients/basic");
    expect(patientsListPath("nurse")).toBe("/patients?limit=200");
    expect(patientsListPath("doctor")).toBe(null);
  });

  it("keeps route access aligned with nav expectations", () => {
    expect(hasRole("staff", ROUTE_ACCESS["/appointments"])).toBe(true);
    expect(hasRole("staff", ROUTE_ACCESS["/patients"])).toBe(false);
    expect(hasRole("admin", ROUTE_ACCESS["/audit-log"])).toBe(true);
  });
});
