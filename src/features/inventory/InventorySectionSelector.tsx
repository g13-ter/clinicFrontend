import { useEffect, useMemo, useState } from "react";
import { INVENTORY_SECTION_OPTIONS } from "./inventorySections";
import { api } from "../../services/api";
import type { InventoryLabel } from "../../utils/types";

const NEW_LABEL_VALUE = "__add_new_inventory_label__";

export default function InventorySectionSelector({
  value,
  onChange,
  existingLabels = [],
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  existingLabels?: Array<string | undefined>;
  error?: boolean;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [managedLabels, setManagedLabels] = useState<string[]>([]);
  useEffect(() => {
    api.get<InventoryLabel[]>("/inventory-labels")
      .then((response) => setManagedLabels(response.data.map((label) => label.name)))
      .catch(() => {});
  }, []);
  const options = useMemo(
    () => [...new Set([
      ...INVENTORY_SECTION_OPTIONS,
      ...managedLabels,
      ...existingLabels.map((label) => label?.trim()).filter((label): label is string => Boolean(label)),
      ...(value.trim() ? [value.trim()] : []),
    ])],
    [existingLabels, managedLabels, value],
  );

  return (
    <div className="space-y-2">
      <select
        value={addingCustom ? NEW_LABEL_VALUE : value}
        onChange={(event) => {
          if (event.target.value === NEW_LABEL_VALUE) {
            setAddingCustom(true);
            onChange("");
          } else {
            setAddingCustom(false);
            onChange(event.target.value);
          }
        }}
        className={`input ${error ? "input-error" : ""}`}
      >
        <option value="">Select a label...</option>
        {options.map((label) => <option key={label} value={label}>{label}</option>)}
        <option value={NEW_LABEL_VALUE}>+ Add new label...</option>
      </select>
      {addingCustom && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Enter the new label name"
            maxLength={80}
            className={`input ${error ? "input-error" : ""}`}
          />
          <button
            type="button"
            onClick={() => {
              setAddingCustom(false);
              onChange("");
            }}
            className="rounded-lg border px-3 text-xs text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
      <p className="text-xs text-gray-400">
        Select an existing report section or create a custom label.
      </p>
    </div>
  );
}
