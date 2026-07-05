import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { getCurrentRole } from "../../utils/auth";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import type { ClinicVisit } from "../../utils/types";

const empty = {
  complaint: "",
  treatment: "",
  notes: "",
  bloodPressure: "",
  temperature: "",
  pulseRate: "",
};

type Form = typeof empty;

function PatientVisits({ patientId }: { patientId: string }) {
  const canEdit = getCurrentRole() === "nurse";
  const { showToast } = useToast();

  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ClinicVisit | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = () =>
    api.get(`/visits/patient/${patientId}`).then((r) => setVisits(r.data)).catch(() => {});

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [patientId]);

  const openCreate = () => { setEditing(null); setForm(empty); setError(""); setOpen(true); };
  const openEdit = (v: ClinicVisit) => {
    setEditing(v);
    setForm({
      complaint: v.complaint,
      treatment: v.treatment ?? "",
      notes: v.notes ?? "",
      bloodPressure: v.bloodPressure ?? "",
      temperature: v.temperature != null ? String(v.temperature) : "",
      pulseRate: v.pulseRate != null ? String(v.pulseRate) : "",
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body: Record<string, unknown> = {
      complaint: form.complaint,
      treatment: form.treatment || undefined,
      notes: form.notes || undefined,
      bloodPressure: form.bloodPressure || undefined,
      temperature: form.temperature ? Number(form.temperature) : undefined,
      pulseRate: form.pulseRate ? Number(form.pulseRate) : undefined,
    };
    if (!editing) body.patientId = patientId;
    try {
      const res = editing
        ? await api.put(`/visits/${editing._id}`, body)
        : await api.post("/visits", body);
      showToast(res.message);
      setOpen(false);
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const f = (k: keyof Form, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-700">Clinic Visits</h3>
        {canEdit && (
          <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700">
            + Add Visit
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
                <th className="text-left px-4 py-3">Complaint</th>
                <th className="text-left px-4 py-3">Treatment</th>
                <th className="text-left px-4 py-3">Vitals</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visits.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No visits recorded.</td></tr>
              ) : (
                visits.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(v.visitDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{v.complaint}</td>
                    <td className="px-4 py-3">{v.treatment || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {[
                        v.temperature && `${v.temperature}°C`,
                        v.bloodPressure && `BP: ${v.bloodPressure}`,
                        v.pulseRate && `PR: ${v.pulseRate}`,
                      ].filter(Boolean).join(" · ") || "—"}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(v)} className="text-gray-500 hover:underline text-xs">Edit</button>
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
        <Modal title={editing ? "Edit Visit" : "New Visit"} onClose={() => setOpen(false)}>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Complaint *</label>
              <input value={form.complaint} onChange={(e) => f("complaint", e.target.value)} required className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Treatment</label>
              <input value={form.treatment} onChange={(e) => f("treatment", e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
              <input placeholder="e.g. 120/80" value={form.bloodPressure} onChange={(e) => f("bloodPressure", e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Temperature (°C)</label>
              <input type="number" step="0.1" value={form.temperature} onChange={(e) => f("temperature", e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pulse Rate</label>
              <input type="number" value={form.pulseRate} onChange={(e) => f("pulseRate", e.target.value)} className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => f("notes", e.target.value)} className="input" />
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-1">
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

export default PatientVisits;