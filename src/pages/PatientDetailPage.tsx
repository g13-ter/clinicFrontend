import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import PatientVisits from "../features/patients/PatientVisits";
import PatientMedicalHistory from "../features/patients/PatientMedicalHistory";
import PrintablePatientSummary from "../features/patients/PrintablePatientSummary";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { Patient, ClinicVisit, MedicalHistory } from "../utils/types";
import ClinicalProfileEditor from "../features/patients/ClinicalProfileEditor";
import { patientIdentifier, patientTypeLabel, patientTypeOf } from "../utils/patient";

function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can, role } = useAuth();
  const canViewMedicalHistory = can("viewMedicalHistory");
  const canCheckIn = can("checkInPatients");

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load independent data for the printable summary.
  const [printVisits, setPrintVisits] = useState<ClinicVisit[] | null>(null);
  const [printHistory, setPrintHistory] = useState<MedicalHistory[] | null>(null);
  const [printLoading, setPrintLoading] = useState(true);
  const [printError, setPrintError] = useState("");
  const requestedReturnTo = searchParams.get("returnTo");
  const safeReturnTo =
    requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : role === "doctor"
        ? "/dashboard?tab=records"
        : "/dashboard?view=students";

  useEffect(() => {
    api.get<Patient>(`/patients/${id}`)
      .then((r) => setPatient(r.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load student"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setPrintLoading(true);
    setPrintError("");
    Promise.all([
      api.getAll<ClinicVisit>(`/visits/patient/${id}`),
      canViewMedicalHistory
        ? api.getAll<MedicalHistory>(`/medical-history/patient/${id}`)
        : Promise.resolve(null),
    ])
      .then(([visitsResponse, historyResponse]) => {
        if (cancelled) return;
        setPrintVisits(visitsResponse.data);
        setPrintHistory(historyResponse?.data ?? null);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setPrintError(requestError instanceof Error
            ? requestError.message
            : "The complete printable record could not be loaded");
        }
      })
      .finally(() => {
        if (!cancelled) setPrintLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, canViewMedicalHistory]);

  if (loading) return <Layout><p className="text-gray-400 text-sm">Loading…</p></Layout>;
  if (error || !patient) return <Layout><p className="text-red-500 text-sm">{error || "Student not found"}</p></Layout>;

  return (
    <Layout>
      <div className="print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate(safeReturnTo)} className="text-sm text-blue-600 hover:underline inline-block">
            ← Back to Patient Records
          </button>
          <div className="flex flex-wrap gap-2">
            {canCheckIn && (
              <button
                onClick={() => navigate(`/patient-queue?patientId=${encodeURIComponent(patient._id)}`)}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
              Check In Patient
              </button>
            )}
            <button
              onClick={() => window.print()}
              disabled={printLoading || Boolean(printError) || printVisits === null}
              className="rounded border bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              {printLoading ? "Preparing Summary..." : "Print Summary"}
            </button>
          </div>
        </div>
        {printError && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Printing is disabled because the complete record could not be loaded: {printError}
          </p>
        )}

        <div className="mb-6 rounded bg-white p-4 shadow sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {patient.firstName} {patient.lastName}
            <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 align-middle text-xs font-semibold text-blue-700">{patientTypeLabel(patient)}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-3">
            <Field label={patientTypeOf(patient) === "student" ? "Student ID" : "Employee ID"} value={patientIdentifier(patient)} />
            <Field label="Age" value={String(patient.age)} />
            <Field label="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Not recorded"} />
            <Field label="Gender" value={patient.gender} />
            <Field label="Blood Type" value={patient.bloodType || "Not recorded"} />
            {patientTypeOf(patient) === "student" ? <>
              <Field label="Course" value={patient.course} />
              <Field label="Year Level" value={String(patient.yearLevel)} />
            </> : <>
              <Field label="Department" value={patient.department || "Not recorded"} />
              <Field label="Position" value={patient.position || "Not recorded"} />
            </>}
            <Field label="Contact" value={patient.contactNumber} />
            <Field label="Emergency Contact" value={patientTypeOf(patient) === "student" ? (patient.guardianName ? `${patient.guardianName}${patient.guardianContactNumber ? ` (${patient.guardianContactNumber})` : ""}` : "Not recorded") : (patient.emergencyContactName ? `${patient.emergencyContactName}${patient.emergencyContactNumber ? ` (${patient.emergencyContactNumber})` : ""}` : "Not recorded")} />
            <Field label="Health Conditions" value={patient.healthConditions || "None recorded"} />
            <Field label="Address" value={patient.address} className="sm:col-span-2 md:col-span-3" />
          </div>
        </div>

        {canViewMedicalHistory && (
          <div className="mb-6">
            <ClinicalProfileEditor
              patient={patient}
              mode={role === "doctor" ? "doctor" : "nurse"}
              onSaved={setPatient}
            />
          </div>
        )}

        {((patient.medicalAlerts?.allergies?.length ?? 0) > 0 ||
          (patient.medicalAlerts?.chronicConditions?.length ?? 0) > 0 ||
          (patient.medicalAlerts?.currentMedications?.length ?? 0) > 0 ||
          patient.medicalAlerts?.notes) && (
          <section className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4">
            <h3 className="font-bold text-red-800">Medical Alerts</h3>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Allergies" value={patient.medicalAlerts?.allergies?.join(", ") || "None recorded"} />
              <Field label="Chronic Conditions" value={patient.medicalAlerts?.chronicConditions?.join(", ") || "None recorded"} />
              <Field label="Current Medications" value={patient.medicalAlerts?.currentMedications?.join(", ") || "None recorded"} />
              <Field label="Alert Notes" value={patient.medicalAlerts?.notes || "None"} />
            </div>
          </section>
        )}

        <PatientVisits patientId={id!} />
        <PatientMedicalHistory patientId={id!} />
      </div>

      {printVisits !== null && !printError && (
        <div className="hidden print:block">
          <PrintablePatientSummary
            patient={patient}
            visits={printVisits}
            history={canViewMedicalHistory ? printHistory : null}
          />
        </div>
      )}
    </Layout>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="break-words font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default PatientDetailPage;
