import { describe, expect, it } from "vitest";
import type { Patient } from "./types";
import { patientAffiliation, patientIdentifier, patientTypeLabel, patientTypeOf } from "./patient";

const base = {
  _id: "1", firstName: "Alex", lastName: "Cruz", age: 20, gender: "Male",
  contactNumber: "09170000000", address: "School", isActive: true,
} as Patient;

describe("patient display helpers", () => {
  it("keeps legacy records backward compatible as students", () => {
    const patient = { ...base, studentId: "S-1", course: "BSIT", yearLevel: 2 };
    expect(patientTypeOf(patient)).toBe("student");
    expect(patientIdentifier(patient)).toBe("S-1");
    expect(patientAffiliation(patient)).toBe("BSIT · Year 2");
  });

  it("uses employee information for teachers and staff", () => {
    const patient = { ...base, patientType: "teacher", studentId: "E-1", employeeId: "E-1", department: "Science", position: "Teacher II" } as Patient;
    expect(patientTypeLabel(patient)).toBe("Teacher");
    expect(patientIdentifier(patient)).toBe("E-1");
    expect(patientAffiliation(patient)).toBe("Science · Teacher II");
  });

  it("shows grade level without a college course for basic education", () => {
    const patient = {
      ...base,
      studentId: "JHS-1",
      educationLevel: "junior_high",
      yearLevel: 8,
    } as Patient;
    expect(patientAffiliation(patient)).toBe("Junior High · Grade 8");
  });
});
