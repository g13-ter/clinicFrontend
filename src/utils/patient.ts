import type { Patient } from "./types";

export type PatientType = "student" | "teacher" | "staff";

export const patientTypeOf = (patient: Patient): PatientType => patient.patientType ?? "student";

export const patientTypeLabel = (patient: Patient): string => {
  const type = patientTypeOf(patient);
  return type === "student" ? "Student" : type === "teacher" ? "Teacher" : "Staff";
};

export const patientIdentifier = (patient: Patient): string =>
  patientTypeOf(patient) === "student" ? patient.studentId : (patient.employeeId || patient.studentId);

export const patientAffiliation = (patient: Patient): string =>
  patientTypeOf(patient) === "student"
    ? `${patient.course} · Year ${patient.yearLevel}`
    : [patient.department, patient.position].filter(Boolean).join(" · ");
