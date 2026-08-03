import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import PatientVisits from "../features/patients/PatientVisits";
import PatientMedicalHistory from "../features/patients/PatientMedicalHistory";
import PrintablePatientSummary from "../features/patients/PrintablePatientSummary";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { Patient, ClinicVisit, MedicalHistory } from "../utils/types";

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
  const [printVisits, setPrintVisits] = useState<ClinicVisit[]>([]);
  const [printHistory, setPrintHistory] = useState<MedicalHistory[] | null>(null);
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
    api.get<ClinicVisit[]>(`/visits/patient/${id}`).then((r) => setPrintVisits(r.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!canViewMedicalHistory) return;
    api
      .get<MedicalHistory[]>(`/medical-history/patient/${id}`)
      .then((r) => setPrintHistory(r.data))
      .catch(() => {});
  }, [id, canViewMedicalHistory]);

  if (loading) return <Layout><p className="text-gray-400 text-sm">Loading…</p></Layout>;
  if (error || !patient) return <Layout><p className="text-red-500 text-sm">{error || "Student not found"}</p></Layout>;

  return (
    <Layout>
      <div className="print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate(safeReturnTo)} className="text-sm text-blue-600 hover:underline inline-block">
            ← Back to Student Records
          </button>
          <div className="flex flex-wrap gap-2">
            {canCheckIn && (
              <button
                onClick={() => navigate(`/patient-queue?patientId=${encodeURIComponent(patient._id)}`)}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Check In Student
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="rounded border bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              Print Summary
            </button>
          </div>
        </div>

        <div className="mb-6 rounded bg-white p-4 shadow sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {patient.firstName} {patient.lastName}
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-3">
            <Field label="Student ID" value={patient.studentId} />
            <Field label="Age" value={String(patient.age)} />
            <Field label="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Not recorded"} />
            <Field label="Gender" value={patient.gender} />
            <Field label="Blood Type" value={patient.bloodType || "Not recorded"} />
            <Field label="Course" value={patient.course} />
            <Field label="Year Level" value={String(patient.yearLevel)} />
            <Field label="Contact" value={patient.contactNumber} />
            <Field label="Guardian Emergency Contact" value={patient.guardianName ? `${patient.guardianName}${patient.guardianContactNumber ? ` (${patient.guardianContactNumber})` : ""}` : "Not recorded"} />
            <Field label="Health Conditions" value={patient.healthConditions || "None recorded"} />
            <Field label="Address" value={patient.address} className="sm:col-span-2 md:col-span-3" />
          </div>
        </div>

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

        {patient.consents && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900">Consent Status</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <ConsentBadge label="Treatment" granted={patient.consents.treatment} />
              <ConsentBadge label="Medicine" granted={patient.consents.medicineAdministration} />
              <ConsentBadge label="Data Privacy" granted={patient.consents.dataPrivacy} />
            </div>
          </section>
        )}

        <PatientVisits patientId={id!} />
        <PatientMedicalHistory patientId={id!} />
      </div>

      <div className="hidden print:block">
        <PrintablePatientSummary
          patient={patient}
          visits={printVisits}
          history={canViewMedicalHistory ? printHistory ?? [] : null}
        />
      </div>
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

function ConsentBadge({ label, granted }: { label: string; granted: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 font-medium ${
      granted ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
    }`}>
      {label}: {granted ? "Granted" : "Not granted"}
    </span>
  );
}

export default PatientDetailPage;
