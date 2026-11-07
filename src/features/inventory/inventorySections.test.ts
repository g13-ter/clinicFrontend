import { describe, expect, it } from "vitest";
import { groupInventoryBySection, inventorySectionLabel } from "./inventorySections";

describe("inventory sections", () => {
  it("groups standard and custom labels in display order", () => {
    const tablet = { name: "Paracetamol", inventorySection: "Tablet Form" };
    const emergency = { name: "Captopril", inventorySection: "Emergency Medications" };
    const treatment = { name: "Oxygen inhalation", inventorySection: "Non-Medication Treatments" };
    const other = { name: "Glucose strip", inventorySection: "Others" };
    const custom = { name: "Ice pack", inventorySection: "Cold Storage" };

    expect(groupInventoryBySection([custom, other, treatment, emergency, tablet])).toEqual([
      { label: "Tablet Form", items: [tablet] },
      { label: "Emergency Medications", items: [emergency] },
      { label: "Non-Medication Treatments", items: [treatment] },
      { label: "Others", items: [other] },
      { label: "Cold Storage", items: [custom] },
    ]);
  });

  it("uses an uncategorized label for empty values", () => {
    expect(inventorySectionLabel("  ")).toBe("Uncategorized");
  });
});
