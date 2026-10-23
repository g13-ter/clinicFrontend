import type { Patient } from "./types";

export type PatientType = "student" | "teacher" | "staff";
export type EducationLevel = "elementary" | "junior_high" | "senior_high" | "college";

export const patientTypeOf = (patient: Patient): PatientType => patient.patientType ?? "student";

export const educationLevelOf = (patient: Patient): EducationLevel => patient.educationLevel ?? "college";

export const educationLevelLabel = (level: EducationLevel): string =>
  level === "elementary"
    ? "Elementary"
    : level === "junior_high"
      ? "Junior High"
      : level === "senior_high"
        ? "Senior High"
        : "College";

export const academicLevelLabel = (patient: Patient): string =>
  educationLevelOf(patient) === "college" ? `Year ${patient.yearLevel}` : `Grade ${patient.yearLevel}`;

export const patientTypeLabel = (patient: Patient): string => {
  const type = patientTypeOf(patient);
  return type === "student" ? "Student" : type === "teacher" ? "Teacher" : "Staff";
};

export const patientIdentifier = (patient: Patient): string =>
  patientTypeOf(patient) === "student" ? patient.studentId : (patient.employeeId || patient.studentId);

export const patientAffiliation = (patient: Patient): string =>
  patientTypeOf(patient) === "student"
    ? educationLevelOf(patient) === "college"
      ? `${patient.course || "College"} · ${academicLevelLabel(patient)}`
      : `${educationLevelLabel(educationLevelOf(patient))} · ${academicLevelLabel(patient)}`
    : [patient.department, patient.position].filter(Boolean).join(" · ");
