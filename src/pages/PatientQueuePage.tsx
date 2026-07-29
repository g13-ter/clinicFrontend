import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../hooks/useToast";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import { patientsListPath } from "../config/permissions";
import type { ClinicVisit, Patient } from "../utils/types";
import { reportFilename, saveBlobDownload } from "../utils/download";
import type { ReactNode } from "react";

// Clinic-wide queue of open visits sorted by arrival time.
const POLL_INTERVAL_MS = 15000;

const emptyCheckInForm = {
  patientId: "",
  complaint: "",
  bloodPressure: "",
  temperature: "",
  pulseRate: "",
  isEmergency: false,
  emergencyDetails: "",
};
const CHECKIN_FORM_FIELDS = Object.keys(emptyCheckInForm);

const emptyVitalsForm = {
  complaint: "",
  treatment: "",
  notes: "",
  bloodPressure: "",
  temperature: "",
  pulseRate: "",
  respiratoryRate: "",
  heightCm: "",
  weightKg: "",
};
const VITALS_FORM_FIELDS = Object.keys(emptyVitalsForm);

function patientLabel(p: ClinicVisit["patientId"]): string {
  if (p && typeof p === "object") return `${p.firstName} ${p.lastName} (${p.studentId})`;
  return "Unknown Student";
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

function hasRecordedVitals(v: ClinicVisit): boolean {
  return Boolean(v.bloodPressure || v.temperature != null || v.pulseRate != null);
}

function hasCompleteCoreVitals(v: ClinicVisit): boolean {
  return Boolean(v.bloodPressure && v.temperature != null && v.pulseRate != null);
}

function PageFrame({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  return embedded ? <>{children}</> : <Layout>{children}</Layout>;
}

function PatientQueuePage({ embedded = false }: { embedded?: boolean }) {
  const { role, can } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canManage = can("manageQueue");
  const canCheckIn = can("checkInPatients");
  const canRecordVitals = can("recordVitals");
  const requestedPatientId = searchParams.get("patientId") ?? "";
  const requestedEmergencyId = searchParams.get("emergency") ?? "";
  const emergencyFocusToken = searchParams.get("focus") ?? "";
  const handledEmergencyFocus = useRef("");

  const [queue, setQueue] = useState<ClinicVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);

  const [showCheckIn, setShowCheckIn] = useState(canCheckIn && Boolean(requestedPatientId));
  const [checkInForm, setCheckInForm] = useState({
    ...emptyCheckInForm,
    patientId: requestedPatientId,
  });
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
  const [statusTarget, setStatusTarget] = useState<{
    visit: ClinicVisit;
    status: "completed" | "cancelled" | "referred";
  } | null>(null);
  const [statusForm, setStatusForm] = useState({
    referralFacility: "",
    referralReason: "",
    closureOutcome: "",
  });
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const fetchQueue = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError("");
    try {
      const res = await api.get<ClinicVisit[]>("/visits/queue");
      setQueue(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load student queue");
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
    if (!canCheckIn) return;
    const path = patientsListPath(role);
    if (!path) return;
    api.get<Patient[]>(path)
      .then((res) => setPatients(res.data))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load students");
      });
  }, [canCheckIn, role]);

  const openCheckIn = (patientId = "") => {
    setCheckInForm({ ...emptyCheckInForm, patientId });
    resetCheckInErrors();
    setShowCheckIn(true);
  };

  const ci = (k: keyof typeof emptyCheckInForm, v: string | boolean) => {
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
        isEmergency: checkInForm.isEmergency,
        emergencyDetails: checkInForm.emergencyDetails || undefined,
        ...(role === "nurse"
          ? {
              bloodPressure: checkInForm.bloodPressure || undefined,
              temperature: checkInForm.temperature
                ? Number(checkInForm.temperature)
                : undefined,
              pulseRate: checkInForm.pulseRate
                ? Number(checkInForm.pulseRate)
                : undefined,
            }
          : {}),
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

  const openVitals = useCallback((v: ClinicVisit) => {
    setVitalsTarget(v);
    setVitalsForm({
      complaint: v.complaint,
      treatment: v.treatment ?? "",
      notes: v.notes ?? "",
      bloodPressure: v.bloodPressure ?? "",
      temperature: v.temperature != null ? String(v.temperature) : "",
      pulseRate: v.pulseRate != null ? String(v.pulseRate) : "",
      respiratoryRate: v.respiratoryRate != null ? String(v.respiratoryRate) : "",
      heightCm: v.heightCm != null ? String(v.heightCm) : "",
      weightKg: v.weightKg != null ? String(v.weightKg) : "",
    });
    resetVitalsErrors();
  }, [resetVitalsErrors]);

  useEffect(() => {
    if (!requestedEmergencyId || queue.length === 0) return;
    const focusKey = `${requestedEmergencyId}:${emergencyFocusToken}`;
    if (handledEmergencyFocus.current === focusKey) return;

    const visit = queue.find((item) => item._id === requestedEmergencyId);
    if (!visit) return;
    handledEmergencyFocus.current = focusKey;

    const elementId = window.matchMedia("(min-width: 768px)").matches
      ? `visit-desktop-${visit._id}`
      : `visit-mobile-${visit._id}`;
    window.requestAnimationFrame(() => {
      const target = document.getElementById(elementId);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });

    if (role === "nurse" && !visit.readyForDoctor && visit.status === "triage") {
      openVitals(visit);
    }
  }, [emergencyFocusToken, openVitals, queue, requestedEmergencyId, role]);

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
        respiratoryRate: vitalsForm.respiratoryRate
          ? Number(vitalsForm.respiratoryRate)
          : undefined,
        heightCm: vitalsForm.heightCm ? Number(vitalsForm.heightCm) : undefined,
        weightKg: vitalsForm.weightKg ? Number(vitalsForm.weightKg) : undefined,
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

  const handleStatus = async (
    v: ClinicVisit,
    status: "in_consultation" | "paused" | "completed" | "cancelled" | "referred",
    details: Record<string, string> = {},
  ) => {
    const body: Record<string, string> = { status, ...details };
    try {
      const res = await api.put(`/visits/${v._id}/status`, body);
      showToast(res.message);
      if (status === "referred") {
        const referral = await api.download(`/visits/${v._id}/referral-form`);
        if (referral.ok) {
          const blob = await referral.blob();
          saveBlobDownload(
            blob,
            reportFilename(referral.headers.get("Content-Disposition"), `Referral_${v._id}.docx`),
          );
        }
      }
      setStatusTarget(null);
      fetchQueue(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update visit status");
    }
  };

  const openStatusWorkflow = (
    visit: ClinicVisit,
    status: "completed" | "cancelled" | "referred",
  ) => {
    setStatusTarget({ visit, status });
    setStatusForm({
      referralFacility: "",
      referralReason: "",
      closureOutcome: status === "cancelled" ? "cancelled" : "",
    });
    setStatusError("");
  };

  const submitStatusWorkflow = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!statusTarget) return;
    setSavingStatus(true);
    setStatusError("");
    try {
      await handleStatus(statusTarget.visit, statusTarget.status, statusForm);
    } catch {
      // handleStatus presents request failures; this keeps the modal usable.
    } finally {
      setSavingStatus(false);
    }
  };

  const openConsultation = async (visit: ClinicVisit) => {
    if (!visit.patientId || typeof visit.patientId !== "object") return;
    try {
      if (visit.status !== "in_consultation") {
        await api.put(`/visits/${visit._id}/status`, { status: "in_consultation" });
      }
      const params = new URLSearchParams({
        tab: "consultation",
        visitId: visit._id,
        patientId: visit.patientId._id,
        complaint: visit.complaint,
      });
      if (visit.appointmentId) {
        params.set(
          "appointmentId",
          typeof visit.appointmentId === "object" ? visit.appointmentId._id : visit.appointmentId,
        );
      }
      navigate(`/clinical-workspace?${params}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to start consultation");
    }
  };

  const waitingCount = queue.filter((v) => !v.readyForDoctor).length;
  const readyCount = queue.filter((v) => v.status === "ready_for_doctor" || v.readyForDoctor).length;
  const renderQueueActions = (v: ClinicVisit) => {
    if (!canManage) return null;
    return (
      <>
        {canRecordVitals && (
          <button onClick={() => openVitals(v)} className="text-xs text-gray-600 hover:underline">
            {hasRecordedVitals(v) ? "Edit Vitals" : "Record Vitals"}
          </button>
        )}
        {canRecordVitals && !v.readyForDoctor && (
          <button
            onClick={() => handleMarkReady(v)}
            disabled={!hasCompleteCoreVitals(v)}
            title={
              hasCompleteCoreVitals(v)
                ? "Send this triaged visit to the doctor"
                : "Record blood pressure, temperature, and pulse rate first"
            }
            className="text-xs text-green-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            Ready for Doctor
          </button>
        )}
        {v.readyForDoctor && v.status !== "in_consultation" && (
          <button onClick={() => openConsultation(v)} className="text-xs text-blue-600 hover:underline">
            Start Consultation
          </button>
        )}
        {v.status === "in_consultation" && (
          <>
            <button onClick={() => openConsultation(v)} className="text-xs text-blue-600 hover:underline">Open Consultation</button>
            <button onClick={() => handleStatus(v, "paused")} className="text-xs text-amber-600 hover:underline">Pause</button>
            <button onClick={() => openStatusWorkflow(v, "completed")} className="text-xs text-green-600 hover:underline">Complete</button>
            <button onClick={() => openStatusWorkflow(v, "referred")} className="text-xs text-red-600 hover:underline">Refer</button>
          </>
        )}
        {v.status === "paused" && (
          <>
            <button onClick={() => handleStatus(v, "in_consultation")} className="text-xs text-blue-600 hover:underline">Resume</button>
            <button onClick={() => openStatusWorkflow(v, "cancelled")} className="text-xs text-red-600 hover:underline">Cancel</button>
          </>
        )}
      </>
    );
  };

  return (
    <PageFrame embedded={embedded}>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {embedded ? "Student Visits" : "Student Queue"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Check in, triage, and move students through the clinic.
          </p>
        </div>
        {canCheckIn && (
          <button
            onClick={() => openCheckIn()}
            className="self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:self-auto"
          >
            + Register Visit
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
        <>
          <div className="space-y-3 md:hidden">
            {queue.length === 0 ? (
              <div className="rounded-lg bg-white py-8 text-center text-sm text-gray-400 shadow">
                Queue is empty.
              </div>
            ) : (
              queue.map((v) => {
                const link = patientLink(v.patientId);
                return (
                  <article
                    key={v._id}
                    id={`visit-mobile-${v._id}`}
                    tabIndex={-1}
                    className={`rounded-lg border-l-4 bg-white p-4 shadow ${
                      requestedEmergencyId === v._id
                        ? "border-red-600 ring-2 ring-red-500"
                        : v.readyForDoctor
                          ? "border-l-green-500"
                          : "border-l-amber-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 font-medium">
                        {link ? (
                          <Link to={link} className="break-words text-blue-600 hover:underline">
                            {patientLabel(v.patientId)}
                          </Link>
                        ) : patientLabel(v.patientId)}
                        {v.isEmergency && (
                          <span className="ml-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Emergency
                          </span>
                        )}
                        <p className="mt-1 text-xs font-normal text-gray-400">
                          Arrived {new Date(v.visitDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
                        v.status === "in_consultation" ? "bg-blue-100 text-blue-700" : v.readyForDoctor ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {v.status === "in_consultation" ? "In Consultation" : v.readyForDoctor ? "Ready for Doctor" : "Triage"}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-3 border-t pt-3 text-sm">
                      <div>
                        <dt className="text-xs text-gray-400">Complaint</dt>
                        <dd className="break-words text-gray-700">{v.complaint}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-400">Vitals</dt>
                        <dd className="break-words text-gray-700">{vitalsSummary(v)}</dd>
                      </div>
                    </dl>
                    {canManage && (
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3">
                        {renderQueueActions(v)}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className={`hidden overflow-x-auto rounded-lg bg-white md:block ${
            embedded ? "border border-slate-200" : "shadow"
          }`}>
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Student</th>
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
                    <tr
                      key={v._id}
                      id={`visit-desktop-${v._id}`}
                      tabIndex={-1}
                      className={`transition-colors hover:bg-blue-50/40 ${
                        requestedEmergencyId === v._id
                          ? "bg-red-50 ring-2 ring-inset ring-red-500"
                          : v.readyForDoctor
                            ? ""
                            : "bg-amber-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {link ? (
                          <Link to={link} className="text-blue-600 hover:underline">
                            {patientLabel(v.patientId)}
                          </Link>
                        ) : (
                          patientLabel(v.patientId)
                        )}
                        {v.isEmergency && (
                          <span className="ml-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Emergency
                          </span>
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
                            v.status === "in_consultation" ? "bg-blue-100 text-blue-700" : v.readyForDoctor ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {v.status === "in_consultation" ? "In Consultation" : v.readyForDoctor ? "Ready for Doctor" : "Waiting for Nurse Triage"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3 whitespace-nowrap">
                          {renderQueueActions(v)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </>
      )}

      {showCheckIn && (
        <Modal title="Check In Student" onClose={() => setShowCheckIn(false)} closeDisabled={checkingIn}>
          {checkInFormError && <p className="text-red-500 text-sm mb-3">{checkInFormError}</p>}
          <UnmatchedFieldErrors errors={unmatchedCheckInErrors(CHECKIN_FORM_FIELDS)} />
          <form onSubmit={handleCheckIn} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Student *</label>
              <select
                value={checkInForm.patientId}
                onChange={(e) => ci("patientId", e.target.value)}
                required
                className={`input w-full ${checkInFieldErrors.patientId ? "input-error" : ""}`}
              >
                <option value="">Select a student…</option>
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
            {role === "nurse" && (
              <>
                <p className="-mt-1 text-xs text-gray-400">
                  Vitals are optional here—you can check the student in now and record them during triage.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
                <input
                  placeholder="e.g. 120/80"
                  pattern="\d{2,3}/\d{2,3}"
                  title="Use systolic/diastolic format, for example 120/80"
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
                  min={30}
                  max={45}
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
                  min={30}
                  max={250}
                  value={checkInForm.pulseRate}
                  onChange={(e) => ci("pulseRate", e.target.value)}
                  className={`input w-full ${checkInFieldErrors.pulseRate ? "input-error" : ""}`}
                />
                <FieldError message={checkInFieldErrors.pulseRate} />
              </div>
                </div>
              </>
            )}
            <label className="flex items-center gap-2 text-sm text-red-700">
              <input type="checkbox" checked={checkInForm.isEmergency} onChange={(e) => ci("isEmergency", e.target.checked)} />
              Emergency case
            </label>
            {checkInForm.isEmergency && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Emergency Details</label>
                <textarea value={checkInForm.emergencyDetails} onChange={(e) => ci("emergencyDetails", e.target.value)} className="input w-full" rows={2} />
              </div>
            )}
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
        <Modal
          title={`${hasRecordedVitals(vitalsTarget) ? "Edit" : "Record"} Vitals: ${patientLabel(vitalsTarget.patientId)}`}
          onClose={() => setVitalsTarget(null)}
          closeDisabled={savingVitals}
        >
          {vitalsFormError && <p className="text-red-500 text-sm mb-3">{vitalsFormError}</p>}
          <UnmatchedFieldErrors errors={unmatchedVitalsErrors(VITALS_FORM_FIELDS)} />
          <form onSubmit={handleSaveVitals} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Complaint *</label>
              <input
                value={vitalsForm.complaint}
                onChange={(e) => vf("complaint", e.target.value)}
                required
                className={`input ${vitalsFieldErrors.complaint ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.complaint} />
            </div>
            <div className="sm:col-span-2">
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
                pattern="\d{2,3}/\d{2,3}"
                title="Use systolic/diastolic format, for example 120/80"
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
                min={30}
                max={45}
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
                min={30}
                max={250}
                value={vitalsForm.pulseRate}
                onChange={(e) => vf("pulseRate", e.target.value)}
                className={`input ${vitalsFieldErrors.pulseRate ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.pulseRate} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Respiratory Rate</label>
              <input
                type="number"
                min={5}
                max={80}
                value={vitalsForm.respiratoryRate}
                onChange={(e) => vf("respiratoryRate", e.target.value)}
                className={`input ${vitalsFieldErrors.respiratoryRate ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.respiratoryRate} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height (cm)</label>
              <input
                type="number"
                min={30}
                max={250}
                step="0.1"
                value={vitalsForm.heightCm}
                onChange={(e) => vf("heightCm", e.target.value)}
                className={`input ${vitalsFieldErrors.heightCm ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.heightCm} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
              <input
                type="number"
                min={1}
                max={500}
                step="0.1"
                value={vitalsForm.weightKg}
                onChange={(e) => vf("weightKg", e.target.value)}
                className={`input ${vitalsFieldErrors.weightKg ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.weightKg} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                rows={2}
                value={vitalsForm.notes}
                onChange={(e) => vf("notes", e.target.value)}
                className={`input ${vitalsFieldErrors.notes ? "input-error" : ""}`}
              />
              <FieldError message={vitalsFieldErrors.notes} />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
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
                {savingVitals ? "Saving…" : "Save Vitals"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {statusTarget && (
        <Modal
          title={
            statusTarget.status === "referred"
              ? "Refer Student"
              : statusTarget.status === "completed"
                ? "Complete Visit"
                : "Cancel Visit"
          }
          onClose={() => setStatusTarget(null)}
          closeDisabled={savingStatus}
        >
          <form onSubmit={submitStatusWorkflow} className="space-y-4">
            <p className="text-sm text-gray-600">
              {patientLabel(statusTarget.visit.patientId)}
            </p>
            {statusError && <p className="text-sm text-red-600">{statusError}</p>}
            {statusTarget.status === "referred" && (
              <>
                <label className="block text-xs font-medium text-gray-600">
                  Referral facility *
                  <input
                    value={statusForm.referralFacility}
                    onChange={(event) => setStatusForm((current) => ({
                      ...current,
                      referralFacility: event.target.value,
                    }))}
                    required
                    placeholder="Hospital or health facility"
                    className="input mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Clinical reason for referral *
                  <textarea
                    value={statusForm.referralReason}
                    onChange={(event) => setStatusForm((current) => ({
                      ...current,
                      referralReason: event.target.value,
                    }))}
                    required
                    rows={3}
                    className="input mt-1"
                  />
                </label>
              </>
            )}
            {statusTarget.status === "completed" && (
              <label className="block text-xs font-medium text-gray-600">
                Student disposition *
                <select
                  value={statusForm.closureOutcome}
                  onChange={(event) => setStatusForm((current) => ({
                    ...current,
                    closureOutcome: event.target.value,
                  }))}
                  required
                  className="input mt-1"
                >
                  <option value="">Select an outcome</option>
                  <option value="returned_to_class">Returned to class</option>
                  <option value="sent_home">Sent home</option>
                  <option value="guardian_pickup">Guardian pickup</option>
                </select>
              </label>
            )}
            {statusTarget.status === "cancelled" && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                This removes the visit from the active queue. The visit remains in the audit history.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStatusTarget(null)} className="rounded-lg border px-4 py-2 text-sm">
                Go Back
              </button>
              <button
                type="submit"
                disabled={savingStatus}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {savingStatus ? "Saving..." : "Confirm"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageFrame>
  );
}

export default PatientQueuePage;
