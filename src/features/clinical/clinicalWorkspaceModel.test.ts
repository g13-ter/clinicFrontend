import { describe, expect, it } from "vitest";
import {
  activeFollowUps,
  buildMedicalHistoryPayload,
  buildVisitPayload,
  createEmptyConsultation,
  filterStudentRecords,
  todaysAppointments,
} from "./clinicalWorkspaceModel";
import type { Appointment, Patient } from "../../utils/types";

describe("clinical workspace model", () => {
  it("keeps doctor diagnosis separate from nursing assessment", () => {
    const form = createEmptyConsultation({
      patientId: "student-1",
      complaint: "Headache",
      diagnosis: "Tension headache",
      assessment: "Pain score 4",
      temperature: "37.2",
    });

    expect(buildVisitPayload(form, true)).toEqual(expect.objectContaining({
      consultationFindings: "Tension headache",
      nursingAssessment: undefined,
    }));
    expect(buildVisitPayload(form, true)).not.toHaveProperty("temperature");
    expect(buildVisitPayload(form, true)).not.toHaveProperty("respiratoryRate");
    expect(buildVisitPayload(form, true)).not.toHaveProperty("heightCm");
    expect(buildVisitPayload(form, true)).not.toHaveProperty("weightKg");
    expect(buildVisitPayload(form, false)).toMatchObject({
      consultationFindings: undefined,
      nursingAssessment: "Pain score 4",
    });
  });

  it("creates a stock-linked prescription only when medicine and quantity exist", () => {
    const form = createEmptyConsultation({
      patientId: "student-1",
      medicineId: "medicine-1",
      quantity: "2",
      instructions: "After meals",
    });

    expect(buildMedicalHistoryPayload(form, "visit-1").prescribedItems).toEqual([
      { medicineId: "medicine-1", quantity: 2, instructions: "After meals" },
    ]);
  });

  it("separates today's appointments, follow-ups, and searchable students", () => {
    const regular = {
      _id: "a1",
      patientId: null,
      appointmentDate: "2026-07-28T09:00:00",
      reason: "Checkup",
      status: "pending",
      notes: "",
      type: "regular",
    } satisfies Appointment;
    const followUp = {
      ...regular,
      _id: "a2",
      type: "follow_up",
    } satisfies Appointment;
    const student = {
      _id: "p1",
      studentId: "STU-001",
      firstName: "Ana",
      lastName: "Reyes",
      age: 18,
      gender: "Female",
      course: "BSIT",
      yearLevel: 1,
      contactNumber: "09000000000",
      address: "Campus",
      isActive: true,
    } satisfies Patient;

    expect(todaysAppointments([regular, followUp], new Date(2026, 6, 28))).toEqual([regular]);
    expect(activeFollowUps([regular, followUp])).toEqual([followUp]);
    expect(filterStudentRecords([student], "stu-001")).toEqual([student]);
  });
});
