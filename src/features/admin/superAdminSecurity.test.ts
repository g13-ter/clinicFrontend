import { describe, expect, it } from "vitest";
import { requiresAdministrativeStepUp } from "./superAdminSecurity";

describe("administrative step-up policy", () => {
  it("requires confirmation for both administrative roles", () => {
    expect(requiresAdministrativeStepUp("superadmin")).toBe(true);
    expect(requiresAdministrativeStepUp("admin")).toBe(true);
  });

  it("does not request administrative confirmation from clinic roles", () => {
    expect(requiresAdministrativeStepUp("doctor")).toBe(false);
    expect(requiresAdministrativeStepUp("nurse")).toBe(false);
    expect(requiresAdministrativeStepUp(null)).toBe(false);
  });
});
