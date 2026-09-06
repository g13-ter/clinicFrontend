import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useFormErrors } from "../../hooks/useFormErrors";
import Modal from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { FieldError, UnmatchedFieldErrors } from "../../components/FieldError";
import type { MedicalHistory, Medicine } from "../../utils/types";

const empty = { diagnosis: "", prescription: "" };
const FIELDS = [
  { key: "diagnosis", label: "Diagnosis" },
  { key: "prescription", label: "Prescription (general notes)" },
] as const;
const FORM_FIELDS = ["patientId", ...FIELDS.map((f) => f.key)];

type Form = typeof empty;

interface PrescribedItemRow {
  medicineId: string;
  quantity: string;
  instructions: string;
  route: string;
  scheduledTime: string;
}

const emptyRow = (): PrescribedItemRow => ({
  medicineId: "",
  quantity: "",
  instructions: "",
  route: "Oral",
  scheduledTime: "",
});

function PatientMedicalHistory({ patientId }: { patientId: string }) {
  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can("editMedicalHistory");
  const canView = can("viewMedicalHistory");

  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [medicineLoadError, setMedicineLoadError] = useState("");
  const [editing, setEditing] = useState<MedicalHistory | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const { formError, fieldErrors, applyError, reset: resetFormErrors, clearField, unmatchedFieldErrors } =
    useFormErrors();

  // Only doctors need the list of medicines available to prescribe.
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescribedRows, setPrescribedRows] = useState<PrescribedItemRow[]>([]);

  const reload = useCallback(() => {
    setLoadError("");
    return api.getAll<MedicalHistory>(`/medical-history/patient/${patientId}`)
      .then((response) => setHistory(response.data))
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Failed to load medical history");
      });
  }, [patientId]);

  useEffect(() => {
    if (!canView) return;
    reload().finally(() => setLoading(false));
  }, [canView, reload]);

  useEffect(() => {
    if (!canEdit) return;
    api.getAll<Medicine>("/medicines")
      .then((res) => setMedicines(res.data))
      .catch((error: unknown) => {
        setMedicineLoadError(error instanceof Error ? error.message : "Failed to load medicines");
      });
  }, [canEdit]);

  if (!canView) return null;

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setPrescribedRows([]);
    resetFormErrors();
    setOpen(true);
  };

  const openEdit = (h: MedicalHistory) => {
    setEditing(h);
    setForm({
      diagnosis: h.diagnosis ?? "",
      prescription: h.prescription ?? "",
    });
    // Prescribed items are immutable after the medication order is created.
    setPrescribedRows([]);
    resetFormErrors();
    setOpen(true);
  };

  const medicineById = (id: string) => medicines.find((m) => m._id === id);

  const addRow = () => setPrescribedRows((rows) => [...rows, emptyRow()]);
  const removeRow = (i: number) => setPrescribedRows((rows) => rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<PrescribedItemRow>) =>
    setPrescribedRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // Give immediate feedback; the backend revalidates current stock.
  const rowExceedsStock = (row: PrescribedItemRow): boolean => {
    if (!row.medicineId || !row.quantity) return false;
    const med = medicineById(row.medicineId);
    if (!med) return false;
    return Number(row.quantity) > med.quantity;
  };

  const hasInvalidRows = prescribedRows.some(
    (r) => (r.medicineId && (!r.quantity || !r.route || !r.scheduledTime)) || rowExceedsStock(r)
  );

  // Map indexed backend errors to their prescription rows.
  const rowFieldError = (i: number, key: keyof PrescribedItemRow) =>
    fieldErrors[`prescribedItems.${i}.${key}`];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    resetFormErrors();
    const body: Record<string, unknown> = { ...form };
    if (!editing) {
      body.patientId = patientId;
      const items = prescribedRows
        .filter((r) => r.medicineId && r.quantity)
        .map((r) => ({
          medicineId: r.medicineId,
          quantity: Number(r.quantity),
          ...(r.instructions ? { instructions: r.instructions } : {}),
          route: r.route,
          scheduledTime: r.scheduledTime,
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
        // Refresh available stock.
        api.getAll<Medicine>("/medicines").then((r) => setMedicines(r.data)).catch(() => {});
      }
    } catch (err: unknown) {
      applyError(err, "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearField(key);
  };

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-700">Medical History</h3>
        {canEdit && (
          <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700">
            + Add Entry
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {history.length === 0 ? (
              <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">No history recorded.</p>
            ) : history.map((entry) => (
              <article key={entry._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{new Date(entry.dateRecorded).toLocaleDateString()}</p>
                    <p className="mt-1 font-semibold text-gray-950">{entry.diagnosis || "No diagnosis recorded"}</p>
                  </div>
                  {canEdit && <button onClick={() => openEdit(entry)} className="min-h-11 px-2 text-sm font-medium text-blue-700">Edit</button>}
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div><dt className="font-medium text-gray-500">Prescription</dt><dd className="mt-1 text-gray-800">{entry.prescription || "—"}</dd></div>
                  <div>
                    <dt className="font-medium text-gray-500">Medication Request</dt>
                    <dd className="mt-1 text-gray-800">
                      {entry.prescribedItems?.length ? entry.prescribedItems.map((item) => `${item.medicineName} × ${item.quantity} ${item.unit} (${item.route || "route not specified"}; ${item.scheduledTime || "time not specified"})`).join(", ") : "—"}
                      {entry.medicationStatus && <span className="ml-2 text-xs font-semibold uppercase text-blue-700">{entry.medicationStatus}</span>}
                      {entry.medicationNotGivenNotes && <p className="mt-1 text-xs text-red-700">Not given: {entry.medicationNotGivenNotes}</p>}
                      {entry.medicationAdverseReaction && <p className="mt-1 text-xs font-medium text-red-700">Adverse reaction: {entry.medicationAdverseReaction}</p>}
                    </dd>
                  </div>
                  <div><dt className="font-medium text-gray-500">Allergies</dt><dd className="mt-1 text-gray-800">{entry.allergies || "—"}</dd></div>
                  <div><dt className="font-medium text-gray-500">Family history</dt><dd className="mt-1 text-gray-800">{entry.familyHistory || "—"}</dd></div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded bg-white shadow md:block">
          <table className="w-full min-w-[900px] text-sm">
            <caption className="sr-only">Student medical history</caption>
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Diagnosis</th>
                <th className="text-left px-4 py-3">Prescription</th>
                <th className="text-left px-4 py-3">Medication Request</th>
                <th className="text-left px-4 py-3">Allergies</th>
                <th className="text-left px-4 py-3">Family History</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">No history recorded.</td></tr>
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
                              <span className="block text-xs text-gray-500">{item.route || "Route not specified"} · {item.scheduledTime || "Time not specified"}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "—"
                      )}
                      {h.medicationStatus && (
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          h.medicationStatus === "dispensed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {h.medicationStatus}
                        </span>
                      )}
                      {h.medicationNotGivenNotes && <p className="mt-1 text-xs text-red-700">Not given: {h.medicationNotGivenNotes}</p>}
                      {h.medicationAdverseReaction && <p className="mt-1 text-xs font-medium text-red-700">Adverse reaction: {h.medicationAdverseReaction}</p>}
                    </td>
                    <td className="px-4 py-3">{h.allergies || "—"}</td>
                    <td className="px-4 py-3">{h.familyHistory || "—"}</td>
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
        </>
      )}

      {open && (
        <Modal title={editing ? "Edit History" : "New History Entry"} onClose={() => setOpen(false)} closeDisabled={saving}>
          {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
          {medicineLoadError && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Medicine inventory could not be loaded. Clinical notes can still be saved, but prescription items are unavailable.
            </p>
          )}
          <UnmatchedFieldErrors
            errors={unmatchedFieldErrors(FORM_FIELDS).filter(
              ([field]) => !field.startsWith("prescribedItems.")
            )}
          />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <textarea
                  rows={2}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className={`input ${fieldErrors[key] ? "input-error" : ""}`}
                />
                <FieldError message={fieldErrors[key]} />
              </div>
            ))}

            {!editing && (
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs text-gray-500">
                    Prescribe from Inventory (nurse confirms before stock is deducted)
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
                    const medicineIdError = rowFieldError(i, "medicineId");
                    const quantityError = rowFieldError(i, "quantity");
                    const instructionsError = rowFieldError(i, "instructions");
                    const routeError = rowFieldError(i, "route");
                    const scheduledTimeError = rowFieldError(i, "scheduledTime");
                    return (
                      <div key={i} className="border rounded p-2 flex flex-col gap-2">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <div className="flex-1">
                            <select
                              value={row.medicineId}
                              onChange={(e) => {
                                updateRow(i, { medicineId: e.target.value });
                                clearField(`prescribedItems.${i}.medicineId`);
                              }}
                              className={`input text-sm ${medicineIdError ? "input-error" : ""}`}
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
                            <FieldError message={medicineIdError} />
                          </div>
                          <div className="sm:w-20">
                            <input
                              type="number"
                              min={1}
                              max={med?.quantity}
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) => {
                                updateRow(i, { quantity: e.target.value });
                                clearField(`prescribedItems.${i}.quantity`);
                              }}
                              className={`input text-sm ${quantityError ? "input-error" : ""}`}
                            />
                            <FieldError message={quantityError} />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRow(i)}
                            className="self-start px-2 py-2 text-xs text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          placeholder="Instructions (e.g. Take 1 tablet every 6 hours)"
                          value={row.instructions}
                          onChange={(e) => {
                            updateRow(i, { instructions: e.target.value });
                            clearField(`prescribedItems.${i}.instructions`);
                          }}
                          className={`input text-sm ${instructionsError ? "input-error" : ""}`}
                        />
                        <FieldError message={instructionsError} />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <select
                              value={row.route}
                              onChange={(e) => {
                                updateRow(i, { route: e.target.value });
                                clearField(`prescribedItems.${i}.route`);
                              }}
                              className={`input text-sm ${routeError ? "input-error" : ""}`}
                            >
                              <option value="Oral">Oral</option>
                              <option value="Nebulization">Nebulization</option>
                              <option value="Topical">Topical</option>
                              <option value="Ophthalmic">Eye / ophthalmic</option>
                              <option value="Inhalation">Inhalation</option>
                              <option value="Other">Other</option>
                            </select>
                            <FieldError message={routeError} />
                          </div>
                          <div>
                            <input
                              value={row.scheduledTime}
                              onChange={(e) => {
                                updateRow(i, { scheduledTime: e.target.value });
                                clearField(`prescribedItems.${i}.scheduledTime`);
                              }}
                              placeholder="Time/frequency (e.g. now or 1:00 PM)"
                              className={`input text-sm ${scheduledTimeError ? "input-error" : ""}`}
                            />
                            <FieldError message={scheduledTimeError} />
                          </div>
                        </div>
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

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
