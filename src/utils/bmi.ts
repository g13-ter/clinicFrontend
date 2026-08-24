export type AdultBmiCategory = "Underweight" | "Normal weight" | "Overweight" | "Obese";

export function calculateBmi(
  heightCm: string | number | undefined,
  weightKg: string | number | undefined,
): number | null {
  const height = Number(heightCm);
  const weight = Number(weightKg);
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
    return null;
  }
  return Number((weight / ((height / 100) ** 2)).toFixed(1));
}

export function classifyAdultBmi(bmi: number): AdultBmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
