import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DoctorWorkspaceTabs from "../components/DoctorWorkspaceTabs";
import type { Appointment, ClinicVisit, Medicine, Patient } from "../utils/types";
import { localDateKey } from "../utils/date";
import {
  activeFollowUps,
  buildMedicalHistoryPayload,
  buildVisitPayload,
  createEmptyConsultation,
  filterStudentRecords,
  patientDetails,
  todaysAppointments,
  type ConsultationForm,
} from "../features/clinical/clinicalWorkspaceModel";
import type { ReactNode } from "react";

type Tab = "appointments" | "records" | "consultation" | "followups";

const TABS: { id: Tab; label: string }[] = [
  { id: "appointments", label: "Appointments" },
  { id: "records", label: "Patient Records" },
  { id: "consultation", label: "New Consultation" },
  { id: "followups", label: "Follow-Ups" },
];

function PageFrame({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  return embedded ? <>{children}</> : <Layout>{children}</Layout>;
}

function ClinicalWorkspacePage({ embedded = false }: { embedded?: boolean }) {
  const { role, user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDoctor = role === "doctor";
  const requestedTab = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = TABS.some((tab) => tab.id === requestedTab)
    ? requestedTab!
    : "appointments";
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [form, setForm] = useState<ConsultationForm>(() => createEmptyConsultation({
    visitId: searchParams.get("visitId") ?? "",
    patientId: searchParams.get("patientId") ?? "",
    appointmentId: searchParams.get("appointmentId") ?? "",
    complaint: searchParams.get("complaint") ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchWorkspace = async () => {
    setLoadError("");
    try {
      const appointmentParams = new URLSearchParams({ limit: "200" });
      if (isDoctor && user?.id) appointmentParams.set("doctorId", user.id);

      const [patientResponse, appointmentResponse, medicineResponse] = await Promise.all([
        api.get<Patient[]>("/patients?limit=200"),
        api.get<Appointment[]>(`/appointments?${appointmentParams}`),
        isDoctor ? api.get<Medicine[]>("/medicines?limit=200") : Promise.resolve(null),
      ]);

      setPatients(patientResponse.data);
      setAppointments(appointmentResponse.data);
      setMedicines(medicineResponse?.data ?? []);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to load clinical workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, user?.id]);

  const changeTab = (tab: Tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    const visitId = searchParams.get("visitId");
    if (!visitId) return;

    api.get<ClinicVisit>(`/visits/${visitId}`)
      .then((response) => {
        const visit = response.data;
        const patientId =
          typeof visit.patientId === "object" ? visit.patientId._id : visit.patientId;
        const appointmentId = visit.appointmentId
          ? typeof visit.appointmentId === "object"
            ? visit.appointmentId._id
            : visit.appointmentId
          : searchParams.get("appointmentId") ?? "";

        setForm((current) => ({
          ...current,
          visitId: visit._id,
          patientId,
          appointmentId,
          complaint: visit.complaint ?? current.complaint,
          temperature: visit.temperature != null ? String(visit.temperature) : "",
          bloodPressure: visit.bloodPressure ?? "",
          pulseRate: visit.pulseRate != null ? String(visit.pulseRate) : "",
          respiratoryRate: visit.respiratoryRate != null ? String(visit.respiratoryRate) : "",
          heightCm: visit.heightCm != null ? String(visit.heightCm) : "",
          weightKg: visit.weightKg != null ? String(visit.weightKg) : "",
          assessment: visit.nursingAssessment ?? "",
          treatment: visit.nursingInterventions ?? visit.treatment ?? "",
          recommendations: visit.nursingRecommendations ?? "",
        }));
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Failed to load the clinic visit");
      });
  }, [searchParams]);

  const startConsultation = async (appointment?: Appointment, patient?: Patient) => {
    const appointmentPatient = appointment ? patientDetails(appointment.patientId) : null;
    const selectedPatient = patient ?? appointmentPatient;
    let visitId = appointment?.visitId ?? "";

    if (appointment && !visitId) {
      try {
        const response = await api.post<{ appointment: Appointment; visit: ClinicVisit }>(
          `/appointments/${appointment._id}/check-in`,
          {},
        );
        visitId = response.data.visit._id;
      } catch (error: unknown) {
        showToast(error instanceof Error ? error.message : "Check-in failed");
        return;
      }
    }

    if (visitId) {
      try {
        await api.put(`/visits/${visitId}/status`, { status: "in_consultation" });
      } catch (error: unknown) {
        showToast(error instanceof Error ? error.message : "Failed to start consultation");
        return;
      }
    }

    setForm(createEmptyConsultation({
      visitId,
      patientId: selectedPatient?._id ?? "",
      appointmentId: appointment?._id ?? "",
      complaint: appointment?.reason ?? "",
    }));
    setFormError("");
    changeTab("consultation");
  };

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleConsultation = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const visitPayload = buildVisitPayload(form, isDoctor);
      const visitResponse = form.visitId
        ? await api.put<ClinicVisit>(`/visits/${form.visitId}`, visitPayload)
        : await api.post<ClinicVisit>("/visits", visitPayload);

      const visitId = form.visitId || (visitResponse.data._id as string);
      setForm((current) => ({ ...current, visitId }));

      if (isDoctor) {
        await api.post("/medical-history", buildMedicalHistoryPayload(form, visitId));
      } else {
        await api.put(`/visits/${visitId}/status`, {
          status: "completed",
          closureOutcome: form.closureOutcome,
        });
      }

      const relatedWarnings: string[] = [];
      if (form.appointmentId) {
        try {
          await api.put(`/appointments/${form.appointmentId}/complete`, {});
        } catch {
          relatedWarnings.push("the original appointment was not marked complete");
        }
      }

      if (form.followUpDate) {
        try {
          await api.post("/appointments", {
            patientId: form.patientId,
            appointmentDate: `${form.followUpDate}T09:00:00`,
            reason: form.followUpReason || `Follow-up: ${form.complaint}`,
            notes: `Follow-up linked to clinic visit ${visitId}`,
            durationMinutes: 30,
            type: "follow_up",
            sourceVisitId: visitId,
          });
        } catch {
          relatedWarnings.push("the follow-up was not scheduled");
        }
      }

      showToast(
        relatedWarnings.length > 0
          ? `Consultation saved, but ${relatedWarnings.join(" and ")}.`
          : "Consultation saved successfully",
      );
      setForm(createEmptyConsultation());
      await fetchWorkspace();
      changeTab(form.followUpDate ? "followups" : "appointments");
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to save consultation");
    } finally {
      setSaving(false);
    }
  };

  const todayAppointments = todaysAppointments(appointments);
  const followUps = activeFollowUps(appointments);
  const filteredPatients = useMemo(() => {
    return filterStudentRecords(patients, recordSearch);
  }, [patients, recordSearch]);

  return (
    <PageFrame embedded={embedded}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        {!embedded && (
          <div>
            <p className="text-sm text-gray-500">{isDoctor ? "Doctor" : "Nurse"} workspace</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Clinical Care</h2>
          </div>
        )}

        {isDoctor && !embedded && <DoctorWorkspaceTabs active={activeTab} />}

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="h-72 animate-pulse rounded-xl bg-white shadow-sm" />
        ) : (
          <>
            {activeTab === "appointments" && (
              <AppointmentsTab
                appointments={todayAppointments}
                onStart={startConsultation}
              />
            )}
            {activeTab === "records" && (
              <StudentRecordsTab
                patients={filteredPatients}
                search={recordSearch}
                onSearch={setRecordSearch}
                onStart={(patient) => startConsultation(undefined, patient)}
              />
            )}
            {activeTab === "consultation" && (
              <ConsultationForm
                form={form}
                patients={patients}
                medicines={medicines}
                isDoctor={isDoctor}
                saving={saving}
                error={formError}
                onChange={updateForm}
                onSubmit={handleConsultation}
              />
            )}
            {activeTab === "followups" && (
              <FollowUpsTab
                appointments={followUps}
                onStart={startConsultation}
              />
            )}
          </>
        )}
      </div>
    </PageFrame>
  );
}

function AppointmentsTab({
  appointments,
  onStart,
}: {
  appointments: Appointment[];
  onStart: (appointment: Appointment) => void;
}) {
  return (
    <Panel title="Today's Appointments" subtitle={`Scheduled appointments for ${new Date().toLocaleDateString()}`}>
      {appointments.length === 0 ? (
        <EmptyState text="No appointments scheduled for today." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Student ID</th>
                <th className="px-3 py-3">Reason</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {appointments.map((appointment) => {
                const student = patientDetails(appointment.patientId);
                return (
                  <tr key={appointment._id}>
                    <td className="whitespace-nowrap px-3 py-4">
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-4">{student ? `${student.firstName} ${student.lastName}` : "Unknown student"}</td>
                    <td className="px-3 py-4 font-mono text-xs">{student?.studentId ?? "—"}</td>
                    <td className="px-3 py-4">{appointment.reason}</td>
                    <td className="px-3 py-4"><StatusBadge status={appointment.status} /></td>
                    <td className="px-3 py-4">
                      {appointment.status !== "completed" && (
                        <button onClick={() => onStart(appointment)} className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">
                          Start Consultation
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function StudentRecordsTab({
  patients,
  search,
  onSearch,
  onStart,
}: {
  patients: Patient[];
  search: string;
  onSearch: (value: string) => void;
  onStart: (patient: Patient) => void;
}) {
  return (
    <Panel title="Search Student Records" subtitle="Open a student profile or begin a consultation">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search by name or student ID..."
        className="input"
      />
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {patients.slice(0, 24).map((patient) => (
          <article key={patient._id} className="rounded-lg border p-4">
            <p className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
            <p className="mt-1 font-mono text-xs text-gray-500">{patient.studentId}</p>
            <p className="mt-2 text-sm text-gray-600">{patient.course} · Year {patient.yearLevel}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/patients/${patient._id}`} className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">
                View Record
              </Link>
              <button onClick={() => onStart(patient)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">
                New Consultation
              </button>
            </div>
          </article>
        ))}
      </div>
      {patients.length === 0 && <EmptyState text="No students match your search." />}
    </Panel>
  );
}

function ConsultationForm({
  form,
  patients,
  medicines,
  isDoctor,
  saving,
  error,
  onChange,
  onSubmit,
}: {
  form: ConsultationForm;
  patients: Patient[];
  medicines: Medicine[];
  isDoctor: boolean;
  saving: boolean;
  error: string;
  onChange: (field: keyof typeof form, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <Panel
      title="Record New Consultation"
      subtitle={isDoctor ? "Document diagnosis, treatment, and prescriptions" : "Document nursing assessment and interventions"}
    >
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Select Student" className="md:col-span-1 xl:col-span-2">
          <select required value={form.patientId} onChange={(event) => onChange("patientId", event.target.value)} className="input">
            <option value="">Choose student...</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.firstName} {patient.lastName} ({patient.studentId})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Visit Date">
          <input value={localDateKey()} disabled className="input bg-gray-50" />
        </Field>

        <Field label="Chief Complaint" className="md:col-span-2 xl:col-span-3">
          <textarea required rows={3} value={form.complaint} onChange={(event) => onChange("complaint", event.target.value)} className="input" placeholder="Describe the main reason for the visit..." />
        </Field>

        <Field label="Temperature (°C)">
          <input type="number" step="0.1" value={form.temperature} onChange={(event) => onChange("temperature", event.target.value)} className="input" />
        </Field>
        <Field label="Blood Pressure">
          <input value={form.bloodPressure} onChange={(event) => onChange("bloodPressure", event.target.value)} className="input" placeholder="120/80" />
        </Field>
        <Field label="Pulse Rate (bpm)">
          <input type="number" min={1} value={form.pulseRate} onChange={(event) => onChange("pulseRate", event.target.value)} className="input" />
        </Field>
        <Field label="Respiratory Rate">
          <input type="number" min={1} value={form.respiratoryRate} onChange={(event) => onChange("respiratoryRate", event.target.value)} className="input" />
        </Field>
        <Field label="Height (cm)">
          <input type="number" min={1} step="0.1" value={form.heightCm} onChange={(event) => onChange("heightCm", event.target.value)} className="input" />
        </Field>
        <Field label="Weight (kg)">
          <input type="number" min={1} step="0.1" value={form.weightKg} onChange={(event) => onChange("weightKg", event.target.value)} className="input" />
        </Field>

        {isDoctor ? (
          <Field label="Diagnosis" className="md:col-span-2 xl:col-span-3">
            <textarea required rows={2} value={form.diagnosis} onChange={(event) => onChange("diagnosis", event.target.value)} className="input" placeholder="Enter diagnosis..." />
          </Field>
        ) : (
          <Field label="Nursing Assessment" className="md:col-span-2 xl:col-span-3">
            <textarea required rows={2} value={form.assessment} onChange={(event) => onChange("assessment", event.target.value)} className="input" placeholder="Record observations and nursing assessment, not a physician diagnosis..." />
          </Field>
        )}

        <Field label={isDoctor ? "Treatment Plan" : "Nursing Interventions"} className="md:col-span-2 xl:col-span-3">
          <textarea required={isDoctor} rows={3} value={form.treatment} onChange={(event) => onChange("treatment", event.target.value)} className="input" placeholder="Describe treatment, interventions, and care provided..." />
        </Field>

        {!isDoctor && (
          <Field label="Recommendations / Home-care Advice" className="md:col-span-2 xl:col-span-3">
            <textarea rows={2} value={form.recommendations} onChange={(event) => onChange("recommendations", event.target.value)} className="input" />
          </Field>
        )}

        {isDoctor && (
          <>
            <Field label="Prescription from Inventory" className="md:col-span-2">
              <select value={form.medicineId} onChange={(event) => onChange("medicineId", event.target.value)} className="input">
                <option value="">No medicine selected</option>
                {medicines.filter((medicine) => medicine.quantity > 0).map((medicine) => (
                  <option key={medicine._id} value={medicine._id}>
                    {medicine.name} ({medicine.quantity} {medicine.unit} available)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input type="number" min={1} value={form.quantity} onChange={(event) => onChange("quantity", event.target.value)} className="input" disabled={!form.medicineId} />
            </Field>
            <Field label="Medication Instructions" className="md:col-span-2">
              <input value={form.instructions} onChange={(event) => onChange("instructions", event.target.value)} className="input" placeholder="e.g. Take one tablet every 8 hours" />
            </Field>
            <Field label="Laboratory Request">
              <input value={form.labRequest} onChange={(event) => onChange("labRequest", event.target.value)} className="input" placeholder="Optional" />
            </Field>
          </>
        )}

        {!isDoctor && (
          <Field label="Student Outcome">
            <select value={form.closureOutcome} onChange={(event) => onChange("closureOutcome", event.target.value)} className="input">
              <option value="returned_to_class">Returned to class</option>
              <option value="sent_home">Sent home</option>
              <option value="guardian_pickup">Guardian pickup</option>
            </select>
          </Field>
        )}

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 md:col-span-2 xl:col-span-3">
          <p className="text-sm font-semibold text-blue-900">Optional Follow-Up</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Follow-Up Date">
              <input type="date" min={localDateKey()} value={form.followUpDate} onChange={(event) => onChange("followUpDate", event.target.value)} className="input bg-white" />
            </Field>
            <Field label="Reason / Monitoring Instructions">
              <input value={form.followUpReason} onChange={(event) => onChange("followUpReason", event.target.value)} className="input bg-white" disabled={!form.followUpDate} />
            </Field>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 md:col-span-2 md:flex-row md:justify-end xl:col-span-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {saving ? "Saving Consultation..." : "Save Consultation"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function FollowUpsTab({
  appointments,
  onStart,
}: {
  appointments: Appointment[];
  onStart: (appointment: Appointment) => void;
}) {
  return (
    <Panel title="Scheduled Follow-Up Visits" subtitle="Students requiring monitoring or follow-up care">
      {appointments.length === 0 ? (
        <EmptyState text="No follow-up visits scheduled." />
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const student = patientDetails(appointment.patientId);
            return (
              <article key={appointment._id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">
                    {student ? `${student.firstName} ${student.lastName}` : "Unknown student"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{appointment.reason}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(appointment.appointmentDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
                {appointment.status !== "completed" && (
                  <button onClick={() => onStart(appointment)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                    Start Follow-Up
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const tones: Record<Appointment["status"], string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    checked_in: "bg-purple-50 text-purple-700",
    cancelled: "bg-red-50 text-red-700",
    completed: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tones[status]}`}>{status}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg bg-gray-50 py-10 text-center text-sm text-gray-500">{text}</div>;
}

export default ClinicalWorkspacePage;
