import type { Appointment, Patient } from "../../utils/types";
import { localDateKey } from "../../utils/date";

export interface ConsultationForm {
  visitId: string;
  patientId: string;
  appointmentId: string;
  complaint: string;
  temperature: string;
  bloodPressure: string;
  pulseRate: string;
  respiratoryRate: string;
  heightCm: string;
  weightKg: string;
  diagnosis: string;
  assessment: string;
  treatment: string;
  recommendations: string;
  labRequest: string;
  medicineId: string;
  quantity: string;
  instructions: string;
  followUpDate: string;
  followUpReason: string;
  closureOutcome: string;
}

export function createEmptyConsultation(
  initial: Partial<ConsultationForm> = {},
): ConsultationForm {
  return {
    visitId: "",
    patientId: "",
    appointmentId: "",
    complaint: "",
    temperature: "",
    bloodPressure: "",
    pulseRate: "",
    respiratoryRate: "",
    heightCm: "",
    weightKg: "",
    diagnosis: "",
    assessment: "",
    treatment: "",
    recommendations: "",
    labRequest: "",
    medicineId: "",
    quantity: "",
    instructions: "",
    followUpDate: "",
    followUpReason: "",
    closureOutcome: "returned_to_class",
    ...initial,
  };
}

const optionalNumber = (value: string): number | undefined =>
  value ? Number(value) : undefined;

export function buildVisitPayload(form: ConsultationForm, isDoctor: boolean) {
  return {
    patientId: form.patientId,
    complaint: form.complaint,
    treatment: form.treatment || undefined,
    ...(!isDoctor
      ? {
          bloodPressure: form.bloodPressure || undefined,
          temperature: optionalNumber(form.temperature),
          pulseRate: optionalNumber(form.pulseRate),
          respiratoryRate: optionalNumber(form.respiratoryRate),
          heightCm: optionalNumber(form.heightCm),
          weightKg: optionalNumber(form.weightKg),
        }
      : {}),
    consultationFindings: isDoctor ? form.diagnosis || undefined : undefined,
    nursingAssessment: !isDoctor ? form.assessment || undefined : undefined,
    nursingInterventions: !isDoctor ? form.treatment || undefined : undefined,
    nursingRecommendations: !isDoctor ? form.recommendations || undefined : undefined,
  };
}

export function buildMedicalHistoryPayload(form: ConsultationForm, visitId: string) {
  const prescribedItems =
    form.medicineId && form.quantity
      ? [{
          medicineId: form.medicineId,
          quantity: Number(form.quantity),
          ...(form.instructions ? { instructions: form.instructions } : {}),
        }]
      : undefined;

  return {
    patientId: form.patientId,
    visitId,
    diagnosis: form.diagnosis || undefined,
    prescription: form.treatment || undefined,
    prescribedItems,
    labRequest: form.labRequest || undefined,
  };
}

export function patientDetails(value: Appointment["patientId"]): Patient | null {
  return value && typeof value === "object" ? value : null;
}

export function todaysAppointments(appointments: Appointment[], date = new Date()): Appointment[] {
  const today = localDateKey(date);
  return appointments.filter(
    (appointment) =>
      localDateKey(new Date(appointment.appointmentDate)) === today &&
      appointment.type !== "follow_up" &&
      appointment.status !== "cancelled",
  );
}

export function activeFollowUps(appointments: Appointment[]): Appointment[] {
  return appointments.filter(
    (appointment) => appointment.type === "follow_up" && appointment.status !== "cancelled",
  );
}

export function filterStudentRecords(patients: Patient[], search: string): Patient[] {
  const query = search.trim().toLowerCase();
  if (!query) return patients;
  return patients.filter((patient) =>
    `${patient.firstName} ${patient.lastName} ${patient.studentId}`
      .toLowerCase()
      .includes(query),
  );
}
