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
    // Staff receive a basic read-only patient view.
    expect(hasRole("staff", ROUTE_ACCESS["/patients"])).toBe(true);
    expect(hasRole("admin", ROUTE_ACCESS["/audit-log"])).toBe(true);
    expect(hasRole("admin", ROUTE_ACCESS["/patients/:id"])).toBe(false);
    expect(hasRole("admin", ROUTE_ACCESS["/patient-queue"])).toBe(false);
    expect(hasRole("admin", ROUTE_ACCESS["/appointments"])).toBe(false);
    expect(hasRole("doctor", ROUTE_ACCESS["/clinical-workspace"])).toBe(true);
    expect(hasRole("nurse", ROUTE_ACCESS["/clinical-workspace"])).toBe(true);
    expect(hasRole("staff", ROUTE_ACCESS["/clinical-workspace"])).toBe(false);
  });

  it("allows staff and nurses to register student information", () => {
    expect(can("staff", "editPatients")).toBe(true);
    expect(can("nurse", "editPatients")).toBe(true);
    expect(can("doctor", "editPatients")).toBe(false);
    expect(hasRole("staff", ROUTE_ACCESS["/patients"])).toBe(true);
    expect(hasRole("nurse", ROUTE_ACCESS["/patients"])).toBe(true);
  });
});
