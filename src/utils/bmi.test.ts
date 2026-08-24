import { describe, expect, it } from "vitest";
import { calculateBmi, classifyAdultBmi } from "./bmi";

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
});
