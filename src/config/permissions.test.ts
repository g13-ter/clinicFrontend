import { describe, expect, it } from "vitest";
import { can, hasRole, NAV_ITEMS, patientsListPath, ROUTE_ACCESS } from "../config/permissions";

describe("permissions", () => {
  it("grants manageAppointments to staff and nurse only", () => {
    expect(can("staff", "manageAppointments")).toBe(true);
    expect(can("nurse", "manageAppointments")).toBe(true);
    expect(can("doctor", "manageAppointments")).toBe(false);
    expect(can("admin", "manageAppointments")).toBe(false);
  });

  it("maps staff to the basic patient list endpoint", () => {
    expect(patientsListPath("staff")).toBe("/patients/basic");
    expect(patientsListPath("nurse")).toBe("/patients");
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
    expect(ROUTE_ACCESS["/analytics"]).toEqual(["doctor", "nurse"]);
    expect(ROUTE_ACCESS["/medicines"]).toEqual(["nurse"]);
    expect(ROUTE_ACCESS["/reports"]).toEqual(["doctor", "nurse"]);
    expect(can("doctor", "searchPrescriptionMedicines")).toBe(true);
    expect(can("doctor", "viewMedicines")).toBe(false);
    expect(can("admin", "viewReports")).toBe(false);
    expect(can("staff", "viewAnalytics")).toBe(false);
    expect(can("admin", "viewAnalytics")).toBe(false);
    expect(can("doctor", "viewAnalytics")).toBe(true);
    expect(can("nurse", "viewAnalytics")).toBe(true);
    expect(hasRole("superadmin", ROUTE_ACCESS["/users"])).toBe(true);
    expect(hasRole("superadmin", ROUTE_ACCESS["/roles-permissions"])).toBe(true);
    expect(hasRole("superadmin", ROUTE_ACCESS["/appointments"])).toBe(false);
    expect(hasRole("superadmin", ROUTE_ACCESS["/medicines"])).toBe(false);
    expect(can("superadmin", "managePrivilegedUsers")).toBe(true);
    expect(can("admin", "managePrivilegedUsers")).toBe(false);
  });

  it("allows staff and nurses to register student information", () => {
    expect(can("staff", "editPatients")).toBe(true);
    expect(can("nurse", "editPatients")).toBe(true);
    expect(can("doctor", "editPatients")).toBe(false);
    expect(hasRole("staff", ROUTE_ACCESS["/patients"])).toBe(true);
    expect(hasRole("nurse", ROUTE_ACCESS["/patients"])).toBe(true);
  });

  it("keeps clinical-record access aligned with the backend", () => {
    expect(can("admin", "viewFullPatients")).toBe(false);
    expect(can("doctor", "viewFullPatients")).toBe(true);
    expect(can("nurse", "viewFullPatients")).toBe(true);
    expect(can("staff", "viewFullPatients")).toBe(true);
  });

  it("exposes Analytics navigation only to doctors and nurses", () => {
    const analytics = NAV_ITEMS.find((item) => item.to === "/analytics");
    expect(analytics?.roles).toEqual(["doctor", "nurse"]);
    expect(analytics?.roles.includes("admin")).toBe(false);
    expect(analytics?.roles.includes("staff")).toBe(false);
  });
});
