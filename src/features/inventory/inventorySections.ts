export const INVENTORY_SECTION_OPTIONS = [
  "Tablet Form",
  "Nebulization",
  "Emergency Medications",
  "External Medications",
  "Topical Medications",
  "Non-Medication Treatments",
  "Medical Supplies",
  "Others",
] as const;

export interface SectionedInventoryItem {
  inventorySection?: string;
}

export function inventorySectionLabel(value?: string): string {
  return value?.trim() || "Uncategorized";
}

export function groupInventoryBySection<T extends SectionedInventoryItem>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const label = inventorySectionLabel(item.inventorySection);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  const preferredOrder = new Map<string, number>(
    INVENTORY_SECTION_OPTIONS.map((label, index) => [label, index]),
  );
  return [...groups.entries()]
    .sort(([left], [right]) => {
      const leftRank = preferredOrder.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = preferredOrder.get(right) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank || left.localeCompare(right);
    })
    .map(([label, sectionItems]) => ({ label, items: sectionItems }));
}
