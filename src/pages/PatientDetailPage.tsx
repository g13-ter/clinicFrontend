import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import PatientVisits from "../features/patients/PatientVisits";
import PatientMedicalHistory from "../features/patients/PatientMedicalHistory";
import { api } from "../services/api";
import type { Patient } from "../utils/types";

function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then((r) => setPatient(r.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load patient"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><p className="text-gray-400 text-sm">Loading…</p></Layout>;
  if (error || !patient) return <Layout><p className="text-red-500 text-sm">{error || "Patient not found"}</p></Layout>;

  return (
    <Layout>
      <button onClick={() => navigate("/patients")} className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Patients
      </button>

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
