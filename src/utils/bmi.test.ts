import { describe, expect, it } from "vitest";
import { ageInMonths, calculateBmi, classifyAdultBmi, classifyPediatricBmi } from "./bmi";

describe("BMI utilities", () => {
  it("calculates BMI from centimeters and kilograms", () => {
    expect(calculateBmi(170, 65)).toBe(22.5);
    expect(calculateBmi("170", "65")).toBe(22.5);
  });

  it("requires positive height and weight", () => {
    expect(calculateBmi("", 65)).toBeNull();
    expect(calculateBmi(170, 0)).toBeNull();
  });

  it.each([
    [18.4, "Underweight"],
    [18.5, "Normal weight"],
    [24.9, "Normal weight"],
    [25, "Overweight"],
    [29.9, "Overweight"],
    [30, "Obese"],
  ] as const)("classifies %s as %s", (bmi, category) => {
    expect(classifyAdultBmi(bmi)).toBe(category);
  });

  it("calculates age in complete months", () => {
    expect(ageInMonths("2016-02-20", new Date("2026-08-25T00:00:00"))).toBe(126);
  });

  it("uses age and sex for pediatric BMI-for-age results", () => {
    const result = classifyPediatricBmi(21.2, 114, "Female");
    expect(result?.category).toBe("Overweight");
    expect(result?.percentile).toBeGreaterThan(90);
    expect(result?.percentile).toBeLessThan(95);
  });

  it("does not apply the CDC pediatric chart below age two", () => {
    expect(classifyPediatricBmi(17, 18, "Male")).toBeNull();
  });
});
