import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const { can } = useAuth();
  const canViewMedicalHistory = can("viewMedicalHistory");

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetched here (in addition to the visits/history components fetching
  // their own copies for the on-screen tables) purely to feed the printable
  // summary below - keeping it self-contained means Print works even before
  // those sections have finished loading their own state.
  const [printVisits, setPrintVisits] = useState<ClinicVisit[]>([]);
  const [printHistory, setPrintHistory] = useState<MedicalHistory[] | null>(null);

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then((r) => setPatient(r.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load patient"))
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
  if (error || !patient) return <Layout><p className="text-red-500 text-sm">{error || "Patient not found"}</p></Layout>;

  return (
    <Layout>
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate("/patients")} className="text-sm text-blue-600 hover:underline inline-block">
            ← Back to Patients
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded border hover:bg-gray-200"
          >
            Print Summary
          </button>
        </div>

        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {patient.firstName} {patient.lastName}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Field label="Student ID" value={patient.studentId} />
            <Field label="Age" value={String(patient.age)} />
            <Field label="Gender" value={patient.gender} />
            <Field label="Course" value={patient.course} />
            <Field label="Year Level" value={String(patient.yearLevel)} />
            <Field label="Contact" value={patient.contactNumber} />
            <Field label="Address" value={patient.address} className="col-span-2 md:col-span-3" />
          </div>
        </div>

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
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default PatientDetailPage;