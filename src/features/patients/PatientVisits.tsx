import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { getCurrentRole } from "../../utils/auth";
import { useFormErrors } from "../../hooks/useFormErrors";
import Modal from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { FieldError, UnmatchedFieldErrors } from "../../components/FieldError";
import type { ClinicVisit } from "../../utils/types";

const empty = {
  complaint: "",
  treatment: "",
  notes: "",
  bloodPressure: "",
  temperature: "",
  pulseRate: "",
  respiratoryRate: "",
  heightCm: "",
  weightKg: "",
  nursingAssessment: "",
  nursingInterventions: "",
  nursingRecommendations: "",
  clinicProtocolReference: "",
};

const FORM_FIELDS = ["patientId", ...Object.keys(empty)];

type Form = typeof empty;

function PatientVisits({ patientId }: { patientId: string }) {
  const canEdit = getCurrentRole() === "nurse";
  const { showToast } = useToast();

  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<ClinicVisit | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const { formError, fieldErrors, applyError, reset: resetFormErrors, clearField, unmatchedFieldErrors } =
    useFormErrors();

  const reload = useCallback(() => {
    setLoadError("");
    return api.get<ClinicVisit[]>(`/visits/patient/${patientId}`)
      .then((response) => setVisits(response.data))
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Failed to load visit history");
      });
  }, [patientId]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const openCreate = () => { setEditing(null); setForm(empty); resetFormErrors(); setOpen(true); };
  const openEdit = (v: ClinicVisit) => {
    setEditing(v);
    setForm({
      complaint: v.complaint,
      treatment: v.treatment ?? "",
      notes: v.notes ?? "",
      bloodPressure: v.bloodPressure ?? "",
      temperature: v.temperature != null ? String(v.temperature) : "",
      pulseRate: v.pulseRate != null ? String(v.pulseRate) : "",
      respiratoryRate: v.respiratoryRate != null ? String(v.respiratoryRate) : "",
      heightCm: v.heightCm != null ? String(v.heightCm) : "",
      weightKg: v.weightKg != null ? String(v.weightKg) : "",
      nursingAssessment: v.nursingAssessment ?? "",
      nursingInterventions: v.nursingInterventions ?? "",
      nursingRecommendations: v.nursingRecommendations ?? "",
      clinicProtocolReference: v.clinicProtocolReference ?? "",
    });
    resetFormErrors();
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    resetFormErrors();
    const body: Record<string, unknown> = {
      complaint: form.complaint,
      treatment: form.treatment || undefined,
      notes: form.notes || undefined,
      bloodPressure: form.bloodPressure || undefined,
      temperature: form.temperature ? Number(form.temperature) : undefined,
      pulseRate: form.pulseRate ? Number(form.pulseRate) : undefined,
      respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      nursingAssessment: form.nursingAssessment || undefined,
      nursingInterventions: form.nursingInterventions || undefined,
      nursingRecommendations: form.nursingRecommendations || undefined,
      clinicProtocolReference: form.clinicProtocolReference || undefined,
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
      applyError(err, "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const f = (k: keyof Form, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    clearField(k);
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-700">Clinic Visits</h3>
        {canEdit && (
          <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700">
            + Add Visit
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
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="w-full min-w-[680px] text-sm">
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
        <Modal title={editing ? "Edit Visit" : "New Visit"} onClose={() => setOpen(false)} closeDisabled={saving}>
          {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
          <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Complaint *</label>
              <input
                value={form.complaint}
                onChange={(e) => f("complaint", e.target.value)}
                required
                className={`input ${fieldErrors.complaint ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.complaint} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Treatment</label>
              <input
                value={form.treatment}
                onChange={(e) => f("treatment", e.target.value)}
                className={`input ${fieldErrors.treatment ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.treatment} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
              <input
                placeholder="e.g. 120/80"
                value={form.bloodPressure}
                onChange={(e) => f("bloodPressure", e.target.value)}
                className={`input ${fieldErrors.bloodPressure ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.bloodPressure} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={form.temperature}
                onChange={(e) => f("temperature", e.target.value)}
                className={`input ${fieldErrors.temperature ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.temperature} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Respiratory Rate</label>
              <input type="number" min={1} value={form.respiratoryRate} onChange={(e) => f("respiratoryRate", e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pulse Rate</label>
              <input type="number" min={1} value={form.pulseRate} onChange={(e) => f("pulseRate", e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height (cm)</label>
              <input type="number" min={1} step="0.1" value={form.heightCm} onChange={(e) => f("heightCm", e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
              <input type="number" min={1} step="0.1" value={form.weightKg} onChange={(e) => f("weightKg", e.target.value)} className="input" />
            </div>
            <div className="mt-1 border-t pt-3 sm:col-span-2">
              <p className="text-xs font-semibold text-sky-700 mb-2">Nursing Assessment — not a physician diagnosis</p>
              <label className="block text-xs text-gray-500 mb-1">Nursing Assessment</label>
              <textarea rows={2} value={form.nursingAssessment} onChange={(e) => f("nursingAssessment", e.target.value)} className="input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Nursing Interventions Performed</label>
              <textarea rows={2} value={form.nursingInterventions} onChange={(e) => f("nursingInterventions", e.target.value)} className="input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Recommendations / Home-care Advice</label>
              <textarea rows={2} value={form.nursingRecommendations} onChange={(e) => f("nursingRecommendations", e.target.value)} className="input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Approved Clinic Protocol Reference</label>
              <input value={form.clinicProtocolReference} onChange={(e) => f("clinicProtocolReference", e.target.value)} placeholder="Required for OTC medicine recommendations" className="input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => f("notes", e.target.value)}
                className={`input ${fieldErrors.notes ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.notes} />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
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
