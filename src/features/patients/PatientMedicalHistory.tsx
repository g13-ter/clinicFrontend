import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import type { MedicalHistory } from "../../utils/types";

const empty = { diagnosis: "", prescription: "", familyHistory: "", allergies: "" };
const FIELDS = [
  { key: "diagnosis", label: "Diagnosis" },
  { key: "prescription", label: "Prescription" },
  { key: "familyHistory", label: "Family History" },
  { key: "allergies", label: "Allergies" },
] as const;

type Form = typeof empty;

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

  const reload = () =>
    api.get(`/medical-history/patient/${patientId}`).then((r) => setHistory(r.data)).catch(() => {});

  useEffect(() => {
    if (!canView) { setLoading(false); return; }
    reload().finally(() => setLoading(false));
  }, [patientId]);

  if (!canView) return null;

  const openCreate = () => { setEditing(null); setForm(empty); setError(""); setOpen(true); };
  const openEdit = (h: MedicalHistory) => {
    setEditing(h);
    setForm({
      diagnosis: h.diagnosis ?? "",
      prescription: h.prescription ?? "",
      familyHistory: h.familyHistory ?? "",
      allergies: h.allergies ?? "",
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body: Record<string, unknown> = { ...form };
    if (!editing) body.patientId = patientId;
    try {
      const res = editing
        ? await api.put(`/medical-history/${editing._id}`, body)
        : await api.post("/medical-history", body);
      showToast(res.message);
      setOpen(false);
      reload();
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
                <th className="text-left px-4 py-3">Allergies</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No history recorded.</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(h.dateRecorded).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{h.diagnosis || "—"}</td>
                    <td className="px-4 py-3">{h.prescription || "—"}</td>
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
            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
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