import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageFrame from "../components/PageFrame";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DoctorWorkspaceTabs from "../components/DoctorWorkspaceTabs";
import type {
  Appointment,
  ClinicVisit,
  LatestPatientVitals,
  MedicalHistory,
  Medicine,
  Patient,
} from "../utils/types";
import { localDateKey } from "../utils/date";
import { reportFilename, saveBlobDownload } from "../utils/download";
import { notifyClinicAnalyticsUpdated } from "../utils/clinicEvents";
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
import ClinicalProfileEditor from "../features/patients/ClinicalProfileEditor";
import { EmptyState, Panel, StatusBadge } from "../components/ui";
import { patientAffiliation, patientIdentifier, patientTypeLabel } from "../utils/patient";
import { BmiPreview } from "../components/BmiPreview";
import SearchablePatientSelect from "../components/SearchablePatientSelect";
import PatientRecordModal from "../components/PatientRecordModal";

type Tab = "appointments" | "records" | "consultation" | "followups";

const TABS: { id: Tab; label: string }[] = [
  { id: "appointments", label: "Appointments" },
  { id: "records", label: "Patient Records" },
  { id: "consultation", label: "New Consultation" },
  { id: "followups", label: "Follow-Ups" },
];

const CONSULTATION_DRAFT_PREFIX = "clinic-consultation-draft";

const loadLatestPatientVitals = async (patientId: string): Promise<LatestPatientVitals | null> => {
  try {
    return (await api.get<LatestPatientVitals | null>(
      `/visits/patient/${patientId}/latest-vitals`,
    )).data;
  } catch {
    return null;
  }
};

function ClinicalWorkspacePage({ embedded = false }: { embedded?: boolean }) {
  const { role, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
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
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);
  const [form, setForm] = useState<ConsultationForm>(() => createEmptyConsultation({
    visitId: searchParams.get("visitId") ?? "",
    patientId: searchParams.get("patientId") ?? "",
    appointmentId: searchParams.get("appointmentId") ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [formError, setFormError] = useState("");
  const [prefilledHeightRecordedAt, setPrefilledHeightRecordedAt] = useState<string | null>(null);
  const [prefilledWeightRecordedAt, setPrefilledWeightRecordedAt] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState("");
  const draftHydrated = useRef(false);
  const draftKey = `${CONSULTATION_DRAFT_PREFIX}:${user?.id ?? "anonymous"}`;

  useEffect(() => {
    if (!user?.id || draftHydrated.current) return;
    const hasLinkedRecord = Boolean(
      searchParams.get("visitId") ||
      searchParams.get("patientId") ||
      searchParams.get("appointmentId"),
    );
    draftHydrated.current = true;
    if (hasLinkedRecord) return;

    try {
      const stored = sessionStorage.getItem(draftKey);
      if (!stored) return;
      const draft = JSON.parse(stored) as { form?: ConsultationForm };
      if (draft.form?.patientId) {
        setForm(draft.form);
        setDraftStatus("Draft restored");
      }
    } catch {
      sessionStorage.removeItem(draftKey);
    }
  }, [draftKey, searchParams, user?.id]);

  useEffect(() => {
    if (!user?.id || !draftHydrated.current) return;
    const hasContent = Boolean(form.patientId || form.complaint || form.diagnosis || form.assessment || form.treatment);
    if (!hasContent) {
      sessionStorage.removeItem(draftKey);
      setDraftStatus("");
      return;
    }

    setDraftStatus("Saving draft…");
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem(draftKey, JSON.stringify({ form, savedAt: new Date().toISOString() }));
      setDraftStatus("Draft saved");
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [draftKey, form, user?.id]);

  useEffect(() => {
    const warnAboutDraft = (event: BeforeUnloadEvent) => {
      if (!draftStatus || saving) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnAboutDraft);
    return () => window.removeEventListener("beforeunload", warnAboutDraft);
  }, [draftStatus, saving]);

  const fetchWorkspace = async () => {
    setLoadError("");
    try {
      const appointmentParams = new URLSearchParams();
      if (isDoctor && user?.id) appointmentParams.set("doctorId", user.id);

      const [patientResponse, appointmentResponse, medicineResponse] = await Promise.all([
        api.getAll<Patient>("/patients"),
        api.getAll<Appointment>(`/appointments?${appointmentParams}`),
        api.getAll<Medicine>("/medicines/prescription-search"),
      ]);

      setPatients(patientResponse.data);
      setAppointments(appointmentResponse.data);
      setMedicines(medicineResponse.data);
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
      .then(async (response) => {
        const visit = response.data;
        const patientId =
          typeof visit.patientId === "object" ? visit.patientId._id : visit.patientId;
        const latestVitals = !isDoctor && (visit.heightCm == null || visit.weightKg == null)
          ? await loadLatestPatientVitals(patientId)
          : null;
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
          heightCm: visit.heightCm != null
            ? String(visit.heightCm)
            : latestVitals?.heightCm != null ? String(latestVitals.heightCm) : "",
          weightKg: visit.weightKg != null
            ? String(visit.weightKg)
            : latestVitals?.weightKg != null ? String(latestVitals.weightKg) : "",
          assessment: visit.nursingAssessment ?? "",
          treatment: visit.nursingInterventions ?? visit.treatment ?? "",
          recommendations: visit.nursingRecommendations ?? "",
        }));
        setPrefilledHeightRecordedAt(
          visit.heightCm == null ? latestVitals?.heightRecordedAt ?? null : null,
        );
        setPrefilledWeightRecordedAt(
          visit.weightKg == null ? latestVitals?.weightRecordedAt ?? null : null,
        );
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Failed to load the clinic visit");
      });
  }, [isDoctor, searchParams]);

  const startConsultation = async (appointment?: Appointment, patient?: Patient) => {
    const appointmentPatient = appointment ? patientDetails(appointment.patientId) : null;
    const selectedPatient = patient ?? appointmentPatient;
    const linkedVisit =
      appointment?.visitId && typeof appointment.visitId === "object"
        ? appointment.visitId
        : null;
    let visitId =
      typeof appointment?.visitId === "string"
        ? appointment.visitId
        : linkedVisit?._id ?? "";
    let currentVisit: ClinicVisit | null = null;

    if (appointment && !visitId) {
      if (isDoctor) {
        showToast("Waiting for nurse check-in and triage before consultation", "warning");
        return;
      }
      try {
        const response = await api.post<{ appointment: Appointment; visit: ClinicVisit }>(
          `/appointments/${appointment._id}/check-in`,
          {},
        );
        visitId = response.data.visit._id;
        currentVisit = response.data.visit;
      } catch (error: unknown) {
        showToast(error instanceof Error ? error.message : "Check-in failed", "error");
        return;
      }
    }

    if (visitId) {
      try {
        currentVisit = (await api.get<ClinicVisit>(`/visits/${visitId}`)).data;
        if (isDoctor && !currentVisit.readyForDoctor) {
          showToast("A nurse must record triage and mark the student ready first", "warning");
          return;
        }
        if (isDoctor) {
          await api.put(`/visits/${visitId}/status`, { status: "in_consultation" });
        }
      } catch (error: unknown) {
        showToast(error instanceof Error ? error.message : "Failed to start consultation", "error");
        return;
      }
    }

    const currentVisitPatientId = currentVisit?.patientId
      ? typeof currentVisit.patientId === "object"
        ? currentVisit.patientId._id
        : currentVisit.patientId
      : "";
    const currentPatientId = selectedPatient?._id ?? currentVisitPatientId;
    const latestVitals = !isDoctor &&
      (currentVisit?.heightCm == null || currentVisit?.weightKg == null) &&
      currentPatientId
      ? await loadLatestPatientVitals(currentPatientId)
      : null;

    setForm(createEmptyConsultation({
      visitId,
      patientId: currentPatientId,
      appointmentId: appointment?._id ?? "",
      complaint: currentVisit?.complaint ?? appointment?.reason ?? "",
      temperature: currentVisit?.temperature != null ? String(currentVisit.temperature) : "",
      bloodPressure: currentVisit?.bloodPressure ?? "",
      pulseRate: currentVisit?.pulseRate != null ? String(currentVisit.pulseRate) : "",
      respiratoryRate:
        currentVisit?.respiratoryRate != null ? String(currentVisit.respiratoryRate) : "",
      heightCm: currentVisit?.heightCm != null
        ? String(currentVisit.heightCm)
        : latestVitals?.heightCm != null ? String(latestVitals.heightCm) : "",
      weightKg: currentVisit?.weightKg != null
        ? String(currentVisit.weightKg)
        : latestVitals?.weightKg != null ? String(latestVitals.weightKg) : "",
      assessment: currentVisit?.nursingAssessment ?? "",
      recommendations: currentVisit?.nursingRecommendations ?? "",
    }));
    setPrefilledHeightRecordedAt(
      currentVisit?.heightCm == null ? latestVitals?.heightRecordedAt ?? null : null,
    );
    setPrefilledWeightRecordedAt(
      currentVisit?.weightKg == null ? latestVitals?.weightRecordedAt ?? null : null,
    );
    setFormError("");
    changeTab("consultation");
  };

  const updateForm = (field: keyof typeof form, value: string) => {
    if (field === "heightCm") setPrefilledHeightRecordedAt(null);
    if (field === "weightKg") setPrefilledWeightRecordedAt(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleProfileSaved = (updatedPatient: Patient) => {
    setPatients((current) => current.map((patient) =>
      patient._id === updatedPatient._id ? updatedPatient : patient
    ));
  };

  const handleConsultation = async (event: React.FormEvent) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const shouldGenerateCertificate =
      isDoctor && submitter?.value === "save-and-generate-certificate";
    setSaving(true);
    setGeneratingCertificate(shouldGenerateCertificate);
    setFormError("");

    try {
      const relatedWarnings: string[] = [];
      const visitPayload = buildVisitPayload(form, isDoctor);
      const visitResponse = form.visitId
        ? await api.put<ClinicVisit>(`/visits/${form.visitId}`, visitPayload)
        : await api.post<ClinicVisit>("/visits", visitPayload);

      const visitId = form.visitId || (visitResponse.data._id as string);
      setForm((current) => ({ ...current, visitId }));

      let savedHistory: MedicalHistory | null = null;
      let nurseMedicationClaimed = false;
      const nurseMedicationOrder = !isDoctor && Boolean(form.medicineId);
      if (isDoctor || nurseMedicationOrder) {
        const historyResponse = await api.post<MedicalHistory>(
          "/medical-history",
          buildMedicalHistoryPayload(form, visitId, nurseMedicationOrder),
        );
        savedHistory = historyResponse.data;
        if (nurseMedicationOrder) {
          try {
            await api.post(`/medical-history/${savedHistory._id}/claim`, {});
            nurseMedicationClaimed = true;
          } catch {
            relatedWarnings.push("the medication order still needs to be accepted");
          }
        }
      } else {
        await api.put(`/visits/${visitId}/status`, {
          status: "completed",
          closureOutcome: form.closureOutcome,
        });
      }

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

      if (shouldGenerateCertificate && savedHistory) {
        try {
          const certificate = await api.download(
            `/medical-history/${savedHistory._id}/certificate`,
          );
          if (!certificate.ok) {
            const payload = await certificate.json().catch(() => null) as
              | { message?: string }
              | null;
            throw new Error(payload?.message || "Certificate generation failed");
          }
          const blob = await certificate.blob();
          saveBlobDownload(
            blob,
            reportFilename(
              certificate.headers.get("Content-Disposition"),
              `Consultation_Certificate_${form.patientId}.docx`,
            ),
          );
        } catch {
          relatedWarnings.push("the certificate could not be downloaded");
        }
      }

      const recordLabel = isDoctor
        ? "Consultation"
        : form.medicineId
          ? "Nursing assessment and medication order"
          : "Nursing assessment";
      notifyClinicAnalyticsUpdated();
      showToast(
        relatedWarnings.length > 0
          ? `${recordLabel} saved, but ${relatedWarnings.join(" and ")}.`
          : shouldGenerateCertificate
            ? "Consultation saved and certificate generated"
            : `${recordLabel} saved successfully`,
      );
      sessionStorage.removeItem(draftKey);
      setDraftStatus("");
      setPrefilledHeightRecordedAt(null);
      setPrefilledWeightRecordedAt(null);
      setForm(createEmptyConsultation());
      await fetchWorkspace();
      if (nurseMedicationOrder && savedHistory) {
        const medicationParams = new URLSearchParams({
          view: "medications",
          order: savedHistory._id,
        });
        if (nurseMedicationClaimed) medicationParams.set("review", "1");
        navigate(`/dashboard?${medicationParams}`);
      } else {
        changeTab(form.followUpDate ? "followups" : "appointments");
      }
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : `Failed to save ${isDoctor ? "consultation" : "nursing assessment"}`,
      );
    } finally {
      setSaving(false);
      setGeneratingCertificate(false);
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
                isDoctor={isDoctor}
                onStart={startConsultation}
              />
            )}
            {activeTab === "records" && (
              <StudentRecordsTab
                patients={filteredPatients}
                search={recordSearch}
                onSearch={setRecordSearch}
                onView={(patient) => setViewingPatientId(patient._id)}
              />
            )}
            {activeTab === "consultation" && (
              !form.visitId ? (
                <Panel
                  title={isDoctor ? "Select a Triaged Patient" : "Check In a Patient First"}
                  subtitle={isDoctor
                    ? "Physician consultations begin after the nurse records vitals and marks the patient ready"
                    : "Nursing assessments must be linked to an active clinic visit"}
                >
                  <div className="rounded-lg bg-sky-50 p-5 text-sm text-sky-900">
                    Open <Link
                      to={embedded
                        ? isDoctor ? "/dashboard?tab=visits" : "/dashboard?view=visits"
                        : "/patient-queue"}
                      className="font-semibold underline"
                    >Patient Visits</Link>
                    {isDoctor
                      ? " and select a patient marked ready for the doctor."
                      : " to check in the patient before recording an assessment."}
                  </div>
                </Panel>
              ) : (
                <ConsultationForm
                  form={form}
                  patients={patients}
                  medicines={medicines}
                  isDoctor={isDoctor}
                  saving={saving}
                  generatingCertificate={generatingCertificate}
                  error={formError}
                  draftStatus={draftStatus}
                  prefilledHeightRecordedAt={prefilledHeightRecordedAt}
                  prefilledWeightRecordedAt={prefilledWeightRecordedAt}
                  onChange={updateForm}
                  onSubmit={handleConsultation}
                  onProfileSaved={handleProfileSaved}
                  onViewPatient={() => form.patientId && setViewingPatientId(form.patientId)}
                />
              )
            )}
            {activeTab === "followups" && (
              <FollowUpsTab
                appointments={followUps}
                onStart={startConsultation}
              />
            )}
          </>
        )}

        <PatientRecordModal
          patientId={viewingPatientId}
          onClose={() => setViewingPatientId(null)}
        />
      </div>
    </PageFrame>
  );
}

function AppointmentsTab({
  appointments,
  isDoctor,
  onStart,
}: {
  appointments: Appointment[];
  isDoctor: boolean;
  onStart: (appointment: Appointment) => void;
}) {
  return (
    <Panel title="Today's Appointments" subtitle={`Scheduled appointments for ${new Date().toLocaleDateString()}`}>
      {appointments.length === 0 ? (
        <EmptyState text="No appointments scheduled for today." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {appointments.map((appointment) => {
              const student = patientDetails(appointment.patientId);
              const linkedVisit = appointment.visitId && typeof appointment.visitId === "object" ? appointment.visitId : null;
              const awaitingNurse = isDoctor && (!appointment.visitId || (linkedVisit && !linkedVisit.readyForDoctor));
              return (
                <article key={appointment._id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-950">{student ? `${student.firstName} ${student.lastName}` : "Unknown patient"}</p>
                      <p className="mt-1 font-mono text-xs text-gray-500">{student ? `${patientIdentifier(student)} · ${patientTypeLabel(student)}` : "—"}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 text-sm">
                    <dt className="text-gray-500">Time</dt>
                    <dd>{new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</dd>
                    <dt className="text-gray-500">Reason</dt>
                    <dd>{appointment.reason}</dd>
                  </dl>
                  {appointment.status !== "completed" && (
                    awaitingNurse ? (
                      <p className="mt-4 text-xs font-medium text-amber-700">{!appointment.visitId ? "Awaiting nurse check-in" : "Awaiting nurse triage"}</p>
                    ) : (
                      <button onClick={() => onStart(appointment)} className="mt-4 min-h-11 w-full rounded-lg border px-3 text-sm font-medium hover:bg-gray-50">
                        {isDoctor ? "Start Consultation" : "Start Assessment"}
                      </button>
                    )
                  )}
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Today&apos;s clinic appointments</caption>
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Patient</th>
                <th className="px-3 py-3">Patient ID</th>
                <th className="px-3 py-3">Reason</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {appointments.map((appointment) => {
                const student = patientDetails(appointment.patientId);
                const linkedVisit =
                  appointment.visitId && typeof appointment.visitId === "object"
                    ? appointment.visitId
                    : null;
                const awaitingNurse =
                  isDoctor &&
                  (!appointment.visitId || (linkedVisit && !linkedVisit.readyForDoctor));
                return (
                  <tr key={appointment._id}>
                    <td className="whitespace-nowrap px-3 py-4">
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-4">{student ? `${student.firstName} ${student.lastName}` : "Unknown patient"}</td>
                    <td className="px-3 py-4 font-mono text-xs">{student ? `${patientIdentifier(student)} · ${patientTypeLabel(student)}` : "—"}</td>
                    <td className="px-3 py-4">{appointment.reason}</td>
                    <td className="px-3 py-4"><StatusBadge status={appointment.status} /></td>
                    <td className="px-3 py-4">
                      {appointment.status !== "completed" && awaitingNurse ? (
                        <span className="text-xs font-medium text-amber-700">
                          {!appointment.visitId
                            ? "Awaiting nurse check-in"
                            : "Awaiting nurse triage"}
                        </span>
                      ) : appointment.status !== "completed" ? (
                        <button onClick={() => onStart(appointment)} className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">
                          {isDoctor ? "Start Consultation" : "Start Assessment"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </Panel>
  );
}

function StudentRecordsTab({
  patients,
  search,
  onSearch,
  onView,
}: {
  patients: Patient[];
  search: string;
  onSearch: (value: string) => void;
  onView: (patient: Patient) => void;
}) {
  return (
    <Panel
      title="Search Patient Records"
      subtitle="Review the patient’s clinic record"
    >
      <input
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search by name, ID, type, department, or position..."
        className="input"
      />
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {patients.slice(0, 24).map((patient) => (
          <article key={patient._id} className="rounded-lg border p-4">
            <p className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
            <p className="mt-1 font-mono text-xs text-gray-500">{patientIdentifier(patient)}</p>
            <p className="mt-2 text-sm text-gray-600"><span className="font-semibold">{patientTypeLabel(patient)}</span> · {patientAffiliation(patient)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onView(patient)} className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">
                View Record
              </button>
            </div>
          </article>
        ))}
      </div>
      {patients.length === 0 && <EmptyState text="No patients match your search." />}
    </Panel>
  );
}

function ConsultationForm({
  form,
  patients,
  medicines,
  isDoctor,
  saving,
  generatingCertificate,
  error,
  draftStatus,
  prefilledHeightRecordedAt,
  prefilledWeightRecordedAt,
  onChange,
  onSubmit,
  onProfileSaved,
  onViewPatient,
}: {
  form: ConsultationForm;
  patients: Patient[];
  medicines: Medicine[];
  isDoctor: boolean;
  saving: boolean;
  generatingCertificate: boolean;
  error: string;
  draftStatus: string;
  prefilledHeightRecordedAt: string | null;
  prefilledWeightRecordedAt: string | null;
  onChange: (field: keyof typeof form, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onProfileSaved: (patient: Patient) => void;
  onViewPatient: () => void;
}) {
  const selectedPatient = patients.find((patient) => patient._id === form.patientId);
  const persistentAllergies = selectedPatient?.medicalAlerts?.allergies ?? [];
  const chronicConditions = selectedPatient?.medicalAlerts?.chronicConditions ?? [];
  const currentMedications = selectedPatient?.medicalAlerts?.currentMedications ?? [];
  return (
    <Panel
      title={isDoctor ? "Record New Consultation" : "Record New Nursing Assessment"}
      subtitle={isDoctor ? "Document diagnosis, treatment, and prescriptions" : "Document nursing care and order medication when no doctor is available"}
    >
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="mb-4 flex min-h-6 justify-end" aria-live="polite">
        {draftStatus && <span className="text-xs font-medium text-emerald-700">{draftStatus}</span>}
      </div>
      {selectedPatient && (
        <div className="sticky top-0 z-10 mb-4 flex flex-col gap-3 rounded-xl border border-blue-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-950">{selectedPatient.firstName} {selectedPatient.lastName}</p>
            <p className="mt-0.5 text-xs text-gray-600">
              {patientIdentifier(selectedPatient)} · {patientTypeLabel(selectedPatient)} · {patientAffiliation(selectedPatient)}
            </p>
          </div>
          <button type="button" onClick={onViewPatient} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
            View full record
          </button>
        </div>
      )}
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Select Patient" className="md:col-span-1 xl:col-span-2">
          <SearchablePatientSelect
            patients={patients}
            value={form.patientId}
            onChange={(patientId) => onChange("patientId", patientId)}
          />
        </Field>
        <Field label="Visit Date">
          <input value={localDateKey()} disabled className="input bg-gray-50" />
        </Field>

        {selectedPatient && (persistentAllergies.length > 0 || chronicConditions.length > 0 || currentMedications.length > 0) && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm text-red-900 md:col-span-2 xl:col-span-3">
            <p className="font-bold">Medical alerts</p>
            {persistentAllergies.length > 0 && <p className="mt-1"><strong>Allergies:</strong> {persistentAllergies.join(", ")}</p>}
            {chronicConditions.length > 0 && <p className="mt-1"><strong>Chronic conditions:</strong> {chronicConditions.join(", ")}</p>}
            {currentMedications.length > 0 && <p className="mt-1"><strong>Current medications:</strong> {currentMedications.join(", ")}</p>}
          </div>
        )}

        {selectedPatient && (
          <ClinicalProfileEditor
            patient={selectedPatient}
            mode={isDoctor ? "doctor" : "nurse"}
            onSaved={onProfileSaved}
          />
        )}

        <Field label="Chief Complaint" className="md:col-span-2 xl:col-span-3">
          <textarea required rows={3} value={form.complaint} onChange={(event) => onChange("complaint", event.target.value)} className="input" placeholder="Describe the main reason for the visit..." />
        </Field>

        {isDoctor && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 md:col-span-2 xl:col-span-3">
            Vitals are recorded by the nurse during triage. These fields are locked and available to the physician for review only.
          </div>
        )}

        <Field label="Temperature (°C)">
          <input type="number" step="0.1" value={form.temperature} onChange={(event) => onChange("temperature", event.target.value)} disabled={isDoctor} className={`input ${isDoctor ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""}`} />
        </Field>
        <Field label="Blood Pressure">
          <input value={form.bloodPressure} onChange={(event) => onChange("bloodPressure", event.target.value)} disabled={isDoctor} className={`input ${isDoctor ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""}`} placeholder="120/80" />
        </Field>
        <Field label="Pulse Rate (bpm)">
          <input type="number" min={1} value={form.pulseRate} onChange={(event) => onChange("pulseRate", event.target.value)} disabled={isDoctor} className={`input ${isDoctor ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""}`} />
        </Field>
        <Field label="Respiratory Rate">
          <input type="number" min={1} value={form.respiratoryRate} onChange={(event) => onChange("respiratoryRate", event.target.value)} disabled={isDoctor} className={`input ${isDoctor ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""}`} />
        </Field>
        <Field label="Height (cm)">
          <input type="number" min={30} max={250} step="0.1" value={form.heightCm} onChange={(event) => onChange("heightCm", event.target.value)} disabled={isDoctor} className={`input ${isDoctor ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""}`} />
          {prefilledHeightRecordedAt && !isDoctor && (
            <p className="mt-1 text-xs text-blue-700">
              Prefilled from {new Date(prefilledHeightRecordedAt).toLocaleDateString()}. Confirm or update it.
            </p>
          )}
        </Field>
        <Field label="Weight (kg)">
          <input type="number" min={1} max={500} step="0.1" value={form.weightKg} onChange={(event) => onChange("weightKg", event.target.value)} disabled={isDoctor} className={`input ${isDoctor ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""}`} />
          {prefilledWeightRecordedAt && !isDoctor && (
            <p className="mt-1 text-xs text-blue-700">
              Prefilled from {new Date(prefilledWeightRecordedAt).toLocaleDateString()}. Confirm or update it.
            </p>
          )}
        </Field>
        <BmiPreview heightCm={form.heightCm} weightKg={form.weightKg} age={selectedPatient?.age} gender={selectedPatient?.gender} dateOfBirth={selectedPatient?.dateOfBirth} className="md:col-span-2 xl:col-span-3" />

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

        {!isDoctor && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2 xl:col-span-3">
            When no doctor is available, you may create a medication order here. The order is recorded under your nurse account and must still pass the medication safety check before it is given.
          </div>
        )}

        <>
            <Field label={isDoctor ? "Prescription from Inventory" : "Medicine to Prescribe / Give"} className="md:col-span-2">
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
          </>

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
          {isDoctor && (
            <button
              type="submit"
              value="save-and-generate-certificate"
              disabled={saving}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 md:flex-1"
            >
              {generatingCertificate ? "Saving & Generating..." : "Save & Generate Certificate"}
            </button>
          )}
          <button
            type="submit"
            value="save"
            disabled={saving}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50 ${
              isDoctor
                ? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
          >
            {saving && !generatingCertificate
              ? `Saving ${isDoctor ? "Consultation" : "Assessment"}...`
              : `Save ${isDoctor ? "Consultation" : "Assessment"}`}
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
    <Panel title="Scheduled Follow-Up Visits" subtitle="Patients requiring monitoring or follow-up care">
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

export default ClinicalWorkspacePage;
