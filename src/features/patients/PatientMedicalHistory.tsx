import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import type { MedicalHistory, Medicine } from "../../utils/types";

const empty = { diagnosis: "", prescription: "", familyHistory: "", allergies: "" };
const FIELDS = [
  { key: "diagnosis", label: "Diagnosis" },
  { key: "prescription", label: "Prescription (general notes)" },
  { key: "familyHistory", label: "Family History" },
  { key: "allergies", label: "Allergies" },
] as const;

type Form = typeof empty;

interface PrescribedItemRow {
  medicineId: string;
  quantity: string;
  instructions: string;
}

const emptyRow = (): PrescribedItemRow => ({ medicineId: "", quantity: "", instructions: "" });

function PatientMedicalHistory({ patientId }: { patientId: string }) {
  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can("editMedicalHistory");
  const canView = can("viewMedicalHistory");

  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MedicalHistory | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Only in-stock medicines are offerable - a doctor can't prescribe what
  // the system doesn't actually have. Only fetched when this user can
  // actually create entries (only doctors do).
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescribedRows, setPrescribedRows] = useState<PrescribedItemRow[]>([]);

  const reload = () =>
    api.get(`/medical-history/patient/${patientId}`).then((r) => setHistory(r.data)).catch(() => {});

  useEffect(() => {
    if (!canView) { setLoading(false); return; }
    reload().finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (!canEdit) return;
    api.get<Medicine[]>("/medicines?limit=200").then((res) => setMedicines(res.data)).catch(() => {});
  }, [canEdit]);

  if (!canView) return null;

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setPrescribedRows([]);
    setError("");
    setOpen(true);
  };

  const openEdit = (h: MedicalHistory) => {
    setEditing(h);
    setForm({
      diagnosis: h.diagnosis ?? "",
      prescription: h.prescription ?? "",
      familyHistory: h.familyHistory ?? "",
      allergies: h.allergies ?? "",
    });
    // Prescribed items are only settable at creation time - the backend
    // deducts stock once, at creation, and doesn't support editing them
    // afterward (that would require re-validating/re-deducting stock in
    // a way that's easy to get wrong). Past items still display below,
    // read-only, in the table.
    setPrescribedRows([]);
    setError("");
    setOpen(true);
  };

  const medicineById = (id: string) => medicines.find((m) => m._id === id);

  const addRow = () => setPrescribedRows((rows) => [...rows, emptyRow()]);
  const removeRow = (i: number) => setPrescribedRows((rows) => rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<PrescribedItemRow>) =>
    setPrescribedRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // Client-side check so a doctor gets instant feedback, before even
  // submitting - the backend re-validates this regardless, since stock
  // could change between page load and submit.
  const rowExceedsStock = (row: PrescribedItemRow): boolean => {
    if (!row.medicineId || !row.quantity) return false;
    const med = medicineById(row.medicineId);
    if (!med) return false;
    return Number(row.quantity) > med.quantity;
  };

  const hasInvalidRows = prescribedRows.some(
    (r) => (r.medicineId && !r.quantity) || rowExceedsStock(r)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body: Record<string, unknown> = { ...form };
    if (!editing) {
      body.patientId = patientId;
      const items = prescribedRows
        .filter((r) => r.medicineId && r.quantity)
        .map((r) => ({
          medicineId: r.medicineId,
          quantity: Number(r.quantity),
          ...(r.instructions ? { instructions: r.instructions } : {}),
        }));
      if (items.length > 0) body.prescribedItems = items;
    }
    try {
      const res = editing
        ? await api.put(`/medical-history/${editing._id}`, body)
        : await api.post("/medical-history", body);
      showToast(res.message);
      setOpen(false);
      reload();
      if (!editing && prescribedRows.length > 0) {
        // Stock changed - refresh the dropdown data for next time.
        api.get<Medicine[]>("/medicines?limit=200").then((r) => setMedicines(r.data)).catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-700">Medical History</h3>
        {canEdit && (
          <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700">
            + Add Entry
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Diagnosis</th>
                <th className="text-left px-4 py-3">Prescription</th>
                <th className="text-left px-4 py-3">Dispensed from Inventory</th>
                <th className="text-left px-4 py-3">Allergies</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400">No history recorded.</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(h.dateRecorded).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{h.diagnosis || "—"}</td>
                    <td className="px-4 py-3">{h.prescription || "—"}</td>
                    <td className="px-4 py-3">
                      {h.prescribedItems && h.prescribedItems.length > 0 ? (
                        <ul className="space-y-0.5">
                          {h.prescribedItems.map((item, i) => (
                            <li key={i}>
                              {item.medicineName} × {item.quantity} {item.unit}
                              {item.instructions ? (
                                <span className="text-gray-400"> — {item.instructions}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{h.allergies || "—"}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(h)} className="text-gray-500 hover:underline text-xs">Edit</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title={editing ? "Edit History" : "New History Entry"} onClose={() => setOpen(false)}>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <textarea
                  rows={2}
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="input"
                />
              </div>
            ))}

            {!editing && (
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs text-gray-500">
                    Prescribe from Inventory (deducts stock immediately)
                  </label>
                  <button
                    type="button"
                    onClick={addRow}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                {prescribedRows.length === 0 && (
                  <p className="text-xs text-gray-400 mb-2">No inventory items prescribed yet.</p>
                )}

                <div className="flex flex-col gap-2">
                  {prescribedRows.map((row, i) => {
                    const med = medicineById(row.medicineId);
                    const exceeds = rowExceedsStock(row);
                    return (
                      <div key={i} className="border rounded p-2 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <select
                            value={row.medicineId}
                            onChange={(e) => updateRow(i, { medicineId: e.target.value })}
                            className="input flex-1 text-sm"
                          >
                            <option value="">Select medicine…</option>
                            {medicines
                              .filter((m) => m.quantity > 0)
                              .map((m) => (
                                <option key={m._id} value={m._id}>
                                  {m.name} ({m.quantity} {m.unit} in stock)
                                </option>
                              ))}
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={med?.quantity}
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={(e) => updateRow(i, { quantity: e.target.value })}
                            className="input w-20 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(i)}
                            className="text-red-500 text-xs px-2"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          placeholder="Instructions (e.g. Take 1 tablet every 6 hours)"
                          value={row.instructions}
                          onChange={(e) => updateRow(i, { instructions: e.target.value })}
                          className="input text-sm"
                        />
                        {exceeds && (
                          <p className="text-red-500 text-xs">
                            Only {med?.quantity} {med?.unit} available - reduce quantity.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button
                type="submit"
                disabled={saving || hasInvalidRows}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

export default PatientMedicalHistory;