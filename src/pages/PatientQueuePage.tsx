import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../components/Toast";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import { patientsListPath } from "../config/permissions";
import type { ClinicVisit, Patient } from "../utils/types";

// Nurse checks a patient in; the queue then shows every visit that's
// still open (isActive: true), across ALL patients, sorted by arrival
// time - this is the clinic-wide "who's here right now" view. It
// complements PatientVisits.tsx (that one's the per-patient history
// buried inside a specific patient's page).
const POLL_INTERVAL_MS = 15000;

const emptyCheckInForm = {
  patientId: "",
  complaint: "",
  bloodPressure: "",
  temperature: "",
  pulseRate: "",
};
const CHECKIN_FORM_FIELDS = Object.keys(emptyCheckInForm);

const emptyVitalsForm = {
  complaint: "",
  treatment: "",
  notes: "",
  bloodPressure: "",
  temperature: "",
  pulseRate: "",
};
const VITALS_FORM_FIELDS = Object.keys(emptyVitalsForm);

function patientLabel(p: ClinicVisit["patientId"]): string {
  if (p && typeof p === "object") return `${p.firstName} ${p.lastName} (${p.studentId})`;
  return "Unknown Patient";
}

function patientLink(p: ClinicVisit["patientId"]): string | null {
  if (p && typeof p === "object") return `/patients/${p._id}`;
  return null;
}

function vitalsSummary(v: ClinicVisit): string {
  return (
    [
      v.temperature && `${v.temperature}°C`,
      v.bloodPressure && `BP: ${v.bloodPressure}`,
      v.pulseRate && `PR: ${v.pulseRate}`,
    ]
      .filter(Boolean)
      .join(" · ") || "Vitals not yet recorded"
  );
}

function PatientQueuePage() {
  const { role, can } = useAuth();
  const { showToast } = useToast();
  const canManage = can("manageQueue");

  const [queue, setQueue] = useState<ClinicVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInForm, setCheckInForm] = useState(emptyCheckInForm);
  const {
    formError: checkInFormError,
    fieldErrors: checkInFieldErrors,
    applyError: applyCheckInError,
    reset: resetCheckInErrors,
    clearField: clearCheckInField,
    unmatchedFieldErrors: unmatchedCheckInErrors,
  } = useFormErrors();
  const [checkingIn, setCheckingIn] = useState(false);

  const [vitalsTarget, setVitalsTarget] = useState<ClinicVisit | null>(null);
  const [vitalsForm, setVitalsForm] = useState(emptyVitalsForm);
  const {
    formError: vitalsFormError,
    fieldErrors: vitalsFieldErrors,
    applyError: applyVitalsError,
    reset: resetVitalsErrors,
    clearField: clearVitalsField,
    unmatchedFieldErrors: unmatchedVitalsErrors,
  } = useFormErrors();
  const [savingVitals, setSavingVitals] = useState(false);

  const fetchQueue = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError("");
    try {
      const res = await api.get<ClinicVisit[]>("/visits/queue");
      setQueue(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patient queue");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue(true);
    const interval = setInterval(() => fetchQueue(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  useEffect(() => {
    if (!canManage) return;
    const path = patientsListPath(role);
    if (!path) return;
    api.get<Patient[]>(path).then((res) => setPatients(res.data)).catch(() => {});
  }, [canManage, role]);

  const openCheckIn = () => {
    setCheckInForm(emptyCheckInForm);
    resetCheckInErrors();
    setShowCheckIn(true);
  };

  const ci = (k: keyof typeof emptyCheckInForm, v: string) => {
    setCheckInForm((prev) => ({ ...prev, [k]: v }));
    clearCheckInField(k);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingIn(true);
    resetCheckInErrors();
    try {
      const res = await api.post("/visits", {
        patientId: checkInForm.patientId,
        complaint: checkInForm.complaint,
        bloodPressure: checkInForm.bloodPressure || undefined,
        temperature: checkInForm.temperature ? Number(checkInForm.temperature) : undefined,
        pulseRate: checkInForm.pulseRate ? Number(checkInForm.pulseRate) : undefined,
      });
      showToast(res.message);
      setShowCheckIn(false);
      fetchQueue(false);
    } catch (err: unknown) {
      applyCheckInError(err, "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  const openVitals = (v: ClinicVisit) => {
    setVitalsTarget(v);
    setVitalsForm({
      complaint: v.complaint,
      treatment: v.treatment ?? "",
      notes: v.notes ?? "",
      bloodPressure: v.bloodPressure ?? "",
      temperature: v.temperature != null ? String(v.temperature) : "",
      pulseRate: v.pulseRate != null ? String(v.pulseRate) : "",
    });
    resetVitalsErrors();
  };

  const vf = (k: keyof typeof emptyVitalsForm, v: string) => {
    setVitalsForm((prev) => ({ ...prev, [k]: v }));
    clearVitalsField(k);
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsTarget) return;
    setSavingVitals(true);
    resetVitalsErrors();
    try {
      const res = await api.put(`/visits/${vitalsTarget._id}`, {
        complaint: vitalsForm.complaint,
        treatment: vitalsForm.treatment || undefined,
        notes: vitalsForm.notes || undefined,
        bloodPressure: vitalsForm.bloodPressure || undefined,
        temperature: vitalsForm.temperature ? Number(vitalsForm.temperature) : undefined,
        pulseRate: vitalsForm.pulseRate ? Number(vitalsForm.pulseRate) : undefined,
      });
      showToast(res.message);
      setVitalsTarget(null);
      fetchQueue(false);
    } catch (err: unknown) {
      applyVitalsError(err, "Save failed");
    } finally {
      setSavingVitals(false);
    }
  };

  const handleMarkReady = async (v: ClinicVisit) => {
    try {
      const res = await api.put(`/visits/${v._id}/ready`, {});
      showToast(res.message);
      fetchQueue(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const waitingCount = queue.filter((v) => !v.readyForDoctor).length;
  const readyCount = queue.filter((v) => v.readyForDoctor).length;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-700">Patient Queue</h2>
        {canManage && (
          <button
            onClick={openCheckIn}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            + Check In Patient
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {queue.length === 0
          ? "No one currently in the clinic."
          : `${waitingCount} waiting for triage · ${readyCount} ready for doctor`}
      </p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Arrived</th>
                <th className="text-left px-4 py-3">Complaint</th>
                <th className="text-left px-4 py-3">Vitals</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    Queue is empty.
                  </td>
                </tr>
              ) : (
                queue.map((v) => {
                  const link = patientLink(v.patientId);
                  return (
                    <tr key={v._id} className={`hover:bg-gray-50 ${v.readyForDoctor ? "" : "bg-amber-50"}`}>
                      <td className="px-4 py-3 font-medium">
                        {link ? (
                          <Link to={link} className="text-blue-600 hover:underline">
                            {patientLabel(v.patientId)}
                          </Link>
                        ) : (
                          patientLabel(v.patientId)
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(v.visitDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">{v.complaint}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{vitalsSummary(v)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            v.readyForDoctor ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {v.readyForDoctor ? "Ready for Doctor" : "Waiting for Triage"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canManage && (
                          <>
                            <button
                              onClick={() => openVitals(v)}
                              className="text-gray-500 hover:underline text-xs mr-3"
                            >
                              Vitals
                            </button>
                            {!v.readyForDoctor && (
                              <button
                                onClick={() => handleMarkReady(v)}
                                className="text-green-600 hover:underline text-xs"
                              >
                                Mark Ready
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCheckIn && (
        <Modal title="Check In Patient" onClose={() => setShowCheckIn(false)}>
          {checkInFormError && <p className="text-red-500 text-sm mb-3">{checkInFormError}</p>}
          <UnmatchedFieldErrors errors={unmatchedCheckInErrors(CHECKIN_FORM_FIELDS)} />
          <form onSubmit={handleCheckIn} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Patient *</label>
              <select
                value={checkInForm.patientId}
                onChange={(e) => ci("patientId", e.target.value)}
                required
                className={`input w-full ${checkInFieldErrors.patientId ? "input-error" : ""}`}
              >
                <option value="">Select a patient…</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName} ({p.studentId})
                  </option>
                ))}
              </select>
              <FieldError message={checkInFieldErrors.patientId} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chief Complaint *</label>
              <input
                value={checkInForm.complaint}
                onChange={(e) => ci("complaint", e.target.value)}
                required
                className={`input w-full ${checkInFieldErrors.complaint ? "input-error" : ""}`}
              />
              <FieldError message={checkInFieldErrors.complaint} />
            </div>
            <p className="text-xs text-gray-400 -mt-1">
              Vitals are optional here — you can check the patient in now and record vitals in a moment,
              or fill them in below right away.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
                <input
                  placeholder="e.g. 120/80"
                  value={checkInForm.bloodPressure}
                  onChange={(e) => ci("bloodPressure", e.target.value)}
                  className={`input w-full ${checkInFieldErrors.bloodPressure ? "input-error" : ""}`}
                />
                <FieldError message={checkInFieldErrors.bloodPressure} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={checkInForm.temperature}
                  onChange={(e) => ci("temperature", e.target.value)}
                  className={`input w-full ${checkInFieldErrors.temperature ? "input-error" : ""}`}
                />
                <FieldError message={checkInFieldErrors.temperature} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pulse</label>
                <input
                  type="number"
                  value={checkInForm.pulseRate}
                  onChange={(e) => ci("pulseRate", e.target.value)}
                  className={`input w-full ${checkInFieldErrors.pulseRate ? "input-error" : ""}`}
                />
                <FieldError message={checkInFieldErrors.pulseRate} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowCheckIn(false)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={checkingIn}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {checkingIn ? "Checking in…" : "Check In"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {vitalsTarget && (
        <Modal title={`Vitals: ${patientLabel(vitalsTarget.patientId)}`} onClose={() => setVitalsTarget(null)}>
          {vitalsFormError && <p className="text-red-500 text-sm mb-3">{vitalsFormError}</p>}
          <UnmatchedFieldErrors errors={unmatchedVitalsErrors(VITALS_FORM_FIELDS)} />
          <form onSubmit={handleSaveVitals} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Complaint *</label>
              <input
                value={vitalsForm.complaint}
                onChange={(e) => vf("complaint", e.target.value)}
                required
                className={`input ${vitalsFieldErrors.complaint ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.complaint} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Treatment Given</label>
              <input
                value={vitalsForm.treatment}
                onChange={(e) => vf("treatment", e.target.value)}
                className={`input ${vitalsFieldErrors.treatment ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.treatment} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
              <input
                placeholder="e.g. 120/80"
                value={vitalsForm.bloodPressure}
                onChange={(e) => vf("bloodPressure", e.target.value)}
                className={`input ${vitalsFieldErrors.bloodPressure ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.bloodPressure} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitalsForm.temperature}
                onChange={(e) => vf("temperature", e.target.value)}
                className={`input ${vitalsFieldErrors.temperature ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.temperature} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pulse Rate</label>
              <input
                type="number"
                value={vitalsForm.pulseRate}
                onChange={(e) => vf("pulseRate", e.target.value)}
                className={`input ${vitalsFieldErrors.pulseRate ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.pulseRate} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                rows={2}
                value={vitalsForm.notes}
                onChange={(e) => vf("notes", e.target.value)}
                className={`input ${vitalsFieldErrors.notes ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.notes} />
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setVitalsTarget(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingVitals}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {savingVitals ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

export default PatientQueuePage;