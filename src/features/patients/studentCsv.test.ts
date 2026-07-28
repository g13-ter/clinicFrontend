import { describe, expect, it } from "vitest";
import { parseStudentCsv } from "./studentCsv";

describe("student CSV import", () => {
  it("parses quoted fields and numeric values", () => {
    const rows = parseStudentCsv(
      "studentId,firstName,lastName,age,gender,course,yearLevel,contactNumber,address\n" +
      'S-1,Ana,Reyes,18,Female,BSIT,1,09170000000,"Manila, Philippines"',
    );
    expect(rows[0]).toMatchObject({ studentId: "S-1", age: 18, yearLevel: 1, address: "Manila, Philippines" });
  });

  it("rejects a file missing required columns", () => {
    expect(() => parseStudentCsv("studentId,firstName\nS-1,Ana")).toThrow(/Missing CSV columns/);
  });
});
