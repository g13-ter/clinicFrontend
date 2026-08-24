import { calculateBmi, classifyAdultBmi, type AdultBmiCategory } from "../utils/bmi";

const CATEGORY_STYLES: Record<AdultBmiCategory, string> = {
  Underweight: "border-sky-200 bg-sky-50 text-sky-900",
  "Normal weight": "border-emerald-200 bg-emerald-50 text-emerald-900",
  Overweight: "border-amber-200 bg-amber-50 text-amber-900",
  Obese: "border-orange-200 bg-orange-50 text-orange-900",
};

export function BmiPreview({
  heightCm,
  weightKg,
  age,
  className = "",
}: {
  heightCm: string | number | undefined;
  weightKg: string | number | undefined;
  age?: number;
  className?: string;
}) {
  const bmi = calculateBmi(heightCm, weightKg);
  if (bmi === null) return null;
  if (age === undefined) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900 ${className}`} aria-live="polite">
        <p className="text-sm font-semibold">BMI: {bmi}</p>
        <p className="mt-1 text-xs opacity-80">Patient age is required to select the appropriate BMI classification standard.</p>
      </div>
    );
  }
  if (age < 18) {
    return (
      <div className={`rounded-lg border border-violet-200 bg-violet-50 p-3 text-violet-900 ${className}`} aria-live="polite">
        <p className="text-sm font-semibold">BMI: {bmi} · Pediatric BMI-for-age assessment</p>
        <p className="mt-1 text-xs opacity-80">
          Adult categories do not apply. Determine the category using an age- and sex-specific BMI percentile.
        </p>
      </div>
    );
  }
  const category = classifyAdultBmi(bmi);

  return (
    <div className={`rounded-lg border p-3 ${CATEGORY_STYLES[category]} ${className}`} aria-live="polite">
      <p className="text-sm font-semibold">BMI: {bmi} · {category}</p>
      <p className="mt-1 text-xs opacity-80">
        Adult BMI uses height and weight only; age is not part of the formula.
      </p>
    </div>
  );
}
