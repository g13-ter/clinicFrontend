import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "../components/Modal";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import type { MedicalHistory, Patient, User } from "../utils/types";
import PatientRecordModal from "../components/PatientRecordModal";
import { patientAffiliation } from "../utils/patient";

type MedicationOrder = Omit<MedicalHistory, "patientId"> & {
  patientId: Patient;
  recordedBy?: Pick<User, "_id" | "name" | "role"> | string;
};

const NOT_GIVEN_REASONS = [
  ["student_refused", "Student refused"],
  ["allergy_concern", "Allergy or safety concern"],
  ["insufficient_stock", "Insufficient usable stock"],
  ["clarification_required", "Doctor clarification required"],
  ["doctor_cancelled", "Doctor cancelled order"],
  ["other", "Other"],
] as const;

function personName(value: MedicationOrder["recordedBy"] | MedicalHistory["medicationClaimedBy"]): string {
  return value && typeof value === "object" ? value.name : "Clinic provider";
}

function alerts(patient: Patient): string {
  const values = [
    ...(patient.medicalAlerts?.allergies ?? []).map((item) => `Allergy: ${item}`),
    ...(patient.medicalAlerts?.chronicConditions ?? []).map((item) => `Condition: ${item}`),
    ...(patient.medicalAlerts?.currentMedications ?? []).map((item) => `Current medicine: ${item}`),
  ];
  if (patient.medicalAlerts?.notes) values.push(patient.medicalAlerts.notes);
  return values.join("; ") || "No medical alerts recorded";
}

export default function MedicationOrdersPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const requestedOrderId = searchParams.get("order") ?? "";
  const shouldOpenReview = searchParams.get("review") === "1";
  const openedRequestedOrder = useRef("");
  const [orders, setOrders] = useState<MedicationOrder[]>([]);
  const [recent, setRecent] = useState<MedicationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [administering, setAdministering] = useState<MedicationOrder | null>(null);
  const [notGiving, setNotGiving] = useState<MedicationOrder | null>(null);
  const [reacting, setReacting] = useState<MedicationOrder | null>(null);
  const [checks, setChecks] = useState([false, false, false, false]);
  const [notes, setNotes] = useState("");
  const [notGivenReason, setNotGivenReason] = useState("student_refused");
  const [reaction, setReaction] = useState("");
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);

  const reload = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [openResponse, recentResponse] = await Promise.all([
        api.get<MedicationOrder[]>("/medical-history/medication-orders/open"),
        api.get<MedicationOrder[]>("/medical-history/medication-orders/recent"),
      ]);
      setOrders(openResponse.data);
      setRecent(recentResponse.data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Medication requests could not be loaded");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(true), 10_000);
    const onVisible = () => document.visibilityState === "visible" && void reload(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const claim = async (order: MedicationOrder) => {
    setBusyId(order._id);
    try {
      await api.post(`/medical-history/${order._id}/claim`, {});
      await reload(true);
      setChecks([false, false, false, false]);
      setNotes("");
      setAdministering({ ...order, medicationStatus: "accepted", medicationClaimedBy: user?.id });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not accept medication request", "error");
      await reload(true);
    } finally {
      setBusyId("");
    }
  };

  const administer = async () => {
    if (!administering || checks.some((checked) => !checked)) return;
    setBusyId(administering._id);
    try {
      const response = await api.post(`/medical-history/${administering._id}/dispense`, {
        confirmedIdentity: true,
        confirmedMedication: true,
        confirmedAllergies: true,
        confirmedRouteTime: true,
        ...(notes.trim() ? { administrationNotes: notes.trim() } : {}),
      });
      showToast(response.message);
      setAdministering(null);
      await reload(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Administration could not be recorded", "error");
    } finally {
      setBusyId("");
    }
  };

  const markNotGiven = async () => {
    if (!notGiving || notes.trim().length < 3) return;
    setBusyId(notGiving._id);
    try {
      const response = await api.post(`/medical-history/${notGiving._id}/not-given`, {
        reason: notGivenReason,
        notes: notes.trim(),
      });
      showToast(response.message);
      setNotGiving(null);
      setAdministering(null);
      await reload(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not update request", "error");
    } finally {
      setBusyId("");
    }
  };

  const reportReaction = async () => {
    if (!reacting || reaction.trim().length < 3) return;
    setBusyId(reacting._id);
    try {
      const response = await api.post(`/medical-history/${reacting._id}/adverse-reaction`, { details: reaction.trim() });
      showToast(response.message);
      setReacting(null);
      setReaction("");
      await reload(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not record adverse reaction", "error");
    } finally {
      setBusyId("");
    }
  };

  const ownedByCurrentNurse = (order: MedicationOrder) =>
    typeof order.medicationClaimedBy === "string"
      ? order.medicationClaimedBy === user?.id
      : order.medicationClaimedBy?._id === user?.id;

  useEffect(() => {
    if (!shouldOpenReview || !requestedOrderId || openedRequestedOrder.current === requestedOrderId) return;
    const requestedOrder = orders.find((order) => order._id === requestedOrderId);
    const claimedByCurrentNurse = requestedOrder && (
      typeof requestedOrder.medicationClaimedBy === "string"
        ? requestedOrder.medicationClaimedBy === user?.id
        : requestedOrder.medicationClaimedBy?._id === user?.id
    );
    if (!requestedOrder || requestedOrder.medicationStatus !== "accepted" || !claimedByCurrentNurse) return;
    openedRequestedOrder.current = requestedOrderId;
    setChecks([false, false, false, false]);
    setNotes("");
    setAdministering(requestedOrder);
  }, [orders, requestedOrderId, shouldOpenReview, user?.id]);

  return (
    <section className={embedded ? "space-y-5" : "mx-auto max-w-6xl space-y-5 p-4 sm:p-6"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Medication Requests</h2>
          <p className="mt-1 text-sm text-slate-500">Doctor or covering-nurse orders waiting for safety review and administration.</p>
        </div>
        <button type="button" onClick={() => void reload()} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Refresh</button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading medication requests...</p> : orders.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">No medication requests are waiting.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => {
            const mine = ownedByCurrentNurse(order);
            const claimed = order.medicationStatus === "accepted";
            return (
              <article key={order._id} className={`rounded-xl border bg-white p-4 shadow-sm ${requestedOrderId === order._id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button type="button" onClick={() => setViewingPatientId(order.patientId._id)} className="text-left font-semibold text-blue-700 hover:underline">
                      {order.patientId.firstName} {order.patientId.lastName}
                    </button>
                    <p className="text-xs text-gray-500">{order.patientId.studentId} · {patientAffiliation(order.patientId)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claimed ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"}`}>
                    {claimed ? "Accepted" : "Waiting"}
                  </span>
                </div>
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-900">
                  <span className="font-semibold">Safety alerts:</span> {alerts(order.patientId)}
                </div>
                <ul className="mt-3 divide-y rounded-lg border text-sm">
                  {order.prescribedItems?.map((item, index) => (
                    <li key={`${item.medicineId}-${index}`} className="p-3">
                      <p className="font-semibold">{item.medicineName} — {item.quantity} {item.unit}</p>
                      {item.instructions && <p className="mt-1 text-gray-600">Instructions: {item.instructions}</p>}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-gray-500">Ordered by {personName(order.recordedBy)} · {new Date(order.dateRecorded).toLocaleString()}</p>
                {claimed && !mine && <p className="mt-3 text-sm font-medium text-violet-700">Being handled by {personName(order.medicationClaimedBy)}</p>}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setViewingPatientId(order.patientId._id)} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">View Student Record</button>
                  {!claimed && <button type="button" disabled={busyId === order._id} onClick={() => void claim(order)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busyId === order._id ? "Accepting..." : "Accept Request"}</button>}
                  {claimed && mine && <button type="button" onClick={() => { setChecks([false, false, false, false]); setNotes(""); setAdministering(order); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Review & Give Medication</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {recent.length > 0 && <section className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold">Administered in the last 24 hours</h3>
        <div className="mt-3 divide-y">
          {recent.map((order) => <div key={order._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm"><span className="font-medium">{order.patientId.firstName} {order.patientId.lastName}</span> — {order.prescribedItems?.map((item) => item.medicineName).join(", ")}<p className="text-xs text-gray-500">{order.medicationDispensedAt ? new Date(order.medicationDispensedAt).toLocaleString() : ""}{order.medicationAdverseReaction ? ` · Reaction: ${order.medicationAdverseReaction}` : ""}</p></div>
            <button type="button" onClick={() => { setReacting(order); setReaction(order.medicationAdverseReaction ?? ""); }} className="self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50">Record Adverse Reaction</button>
          </div>)}
        </div>
      </section>}

      {administering && <Modal title="Medication Safety Check" onClose={() => setAdministering(null)} closeDisabled={busyId === administering._id}>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-3"><p className="font-semibold">{administering.patientId.firstName} {administering.patientId.lastName}</p><p>{administering.patientId.studentId}</p></div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900"><strong>Alerts:</strong> {alerts(administering.patientId)}</div>
          <ul className="rounded-lg border p-3">{administering.prescribedItems?.map((item, index) => <li key={index} className="mb-2 last:mb-0"><strong>{item.medicineName}: {item.quantity} {item.unit}</strong>{item.instructions ? <><br />{item.instructions}</> : null}</li>)}</ul>
          {[
            "I matched the student using name and student ID.",
            "I matched the medication and prescribed dose.",
            "I reviewed allergies, conditions, and current medications.",
            "I reviewed the medication instructions before administration.",
          ].map((label, index) => <label key={label} className="flex gap-3 rounded-lg border p-3"><input type="checkbox" checked={checks[index]} onChange={(event) => setChecks((current) => current.map((value, i) => i === index ? event.target.checked : value))} /><span>{label}</span></label>)}
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="input" placeholder="Administration notes (optional)" />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setNotGiving(administering); setNotes(""); }} className="rounded-lg border border-red-200 px-4 py-2 text-red-700">Not Given / Needs Review</button><button type="button" disabled={checks.some((checked) => !checked) || busyId === administering._id} onClick={() => void administer()} className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50">{busyId === administering._id ? "Recording..." : "Confirm Medication Given"}</button></div>
        </div>
      </Modal>}

      {notGiving && <Modal title="Medication Not Given" onClose={() => setNotGiving(null)} closeDisabled={busyId === notGiving._id}><div className="space-y-3"><select value={notGivenReason} onChange={(event) => setNotGivenReason(event.target.value)} className="input">{NOT_GIVEN_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="input" placeholder="Explain what happened or what the doctor needs to clarify" /><button type="button" disabled={notes.trim().length < 3 || busyId === notGiving._id} onClick={() => void markNotGiven()} className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-50">Save as Not Given</button></div></Modal>}

      {reacting && <Modal title="Record Adverse Reaction" onClose={() => setReacting(null)} closeDisabled={busyId === reacting._id}><div className="space-y-3"><p className="text-sm text-gray-600">Describe the observed symptoms and immediate action taken. Follow the clinic emergency protocol when urgent.</p><textarea value={reaction} onChange={(event) => setReaction(event.target.value)} rows={5} className="input" placeholder="Reaction details and action taken" /><button type="button" disabled={reaction.trim().length < 3 || busyId === reacting._id} onClick={() => void reportReaction()} className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-50">Record Reaction</button></div></Modal>}
      <PatientRecordModal patientId={viewingPatientId} onClose={() => setViewingPatientId(null)} />
    </section>
  );
}
