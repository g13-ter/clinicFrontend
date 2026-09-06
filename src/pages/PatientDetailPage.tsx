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
import { academicLevelLabel, educationLevelLabel, educationLevelOf, patientIdentifier, patientTypeLabel, patientTypeOf } from "../utils/patient";

function PatientDetailPage({
  patientId,
  embedded = false,
}: {
  patientId?: string;
  embedded?: boolean;
} = {}) {
  const { id: routePatientId } = useParams<{ id: string }>();
  const id = patientId ?? routePatientId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can, role } = useAuth();
  const canViewMedicalHistory = can("viewMedicalHistory");
  const canCheckIn = can("checkInPatients");

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Print data is loaded on demand so the visible record components remain the
  // only consumers fetching visits and history during normal viewing.
  const [printVisits, setPrintVisits] = useState<ClinicVisit[] | null>(null);
  const [printHistory, setPrintHistory] = useState<MedicalHistory[] | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [printError, setPrintError] = useState("");
  const [printRequested, setPrintRequested] = useState(false);
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

  const handlePrint = async () => {
    if (printLoading || !id) return;
    setPrintLoading(true);
    setPrintError("");
    try {
      const [visitsResponse, historyResponse] = await Promise.all([
        api.getAll<ClinicVisit>(`/visits/patient/${id}`),
        canViewMedicalHistory
          ? api.getAll<MedicalHistory>(`/medical-history/patient/${id}`)
          : Promise.resolve(null),
      ]);
      setPrintVisits(visitsResponse.data);
      setPrintHistory(historyResponse?.data ?? null);
      setPrintRequested(true);
    } catch (requestError: unknown) {
      setPrintError(requestError instanceof Error
        ? requestError.message
        : "The complete printable record could not be loaded");
    } finally {
      setPrintLoading(false);
    }
  };

  useEffect(() => {
    if (!printRequested || printVisits === null) return;
    const frame = window.requestAnimationFrame(() => {
      window.print();
      setPrintRequested(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [printRequested, printVisits, printHistory]);

  if (loading) {
    const loadingContent = <p className="py-12 text-center text-sm text-gray-400">Loading…</p>;
    return embedded ? loadingContent : <Layout>{loadingContent}</Layout>;
  }
  if (error || !patient) {
    const errorContent = <p className="py-12 text-center text-sm text-red-500">{error || "Patient not found"}</p>;
    return embedded ? errorContent : <Layout>{errorContent}</Layout>;
  }

  const content = (
    <>
      <div className="print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {!embedded && (
            <button onClick={() => navigate(safeReturnTo)} className="inline-block text-sm text-blue-600 hover:underline">
              ← Back to Patient Records
            </button>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {canCheckIn && (
              <button
                onClick={() => navigate(
                  embedded
                    ? `/dashboard?view=visits&patientId=${encodeURIComponent(patient._id)}`
                    : `/patient-queue?patientId=${encodeURIComponent(patient._id)}`,
                )}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
              Check In Patient
              </button>
            )}
            <button
              onClick={handlePrint}
              disabled={printLoading}
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
              <Field label="Education Level" value={educationLevelLabel(educationLevelOf(patient))} />
              {educationLevelOf(patient) === "college" && <Field label="Course" value={patient.course || "Not recorded"} />}
              <Field label={educationLevelOf(patient) === "college" ? "Year Level" : "Grade Level"} value={academicLevelLabel(patient)} />
              {educationLevelOf(patient) === "college" && <Field label="Program Length" value={`${patient.programDurationYears ?? 4} years`} />}
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

        <PatientVisits patientId={id!} patientAge={patient.age} patientGender={patient.gender} patientDateOfBirth={patient.dateOfBirth} />
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
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
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
