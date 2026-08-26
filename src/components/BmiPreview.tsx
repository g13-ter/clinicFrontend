import { ageInMonths, calculateBmi, classifyAdultBmi, classifyPediatricBmi, type AdultBmiCategory } from "../utils/bmi";

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
  gender,
  dateOfBirth,
  className = "",
}: {
  heightCm: string | number | undefined;
  weightKg: string | number | undefined;
  age?: number;
  gender?: string;
  dateOfBirth?: string;
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
    const months = dateOfBirth ? ageInMonths(dateOfBirth) : age * 12;
    const pediatric = months === null ? null : classifyPediatricBmi(bmi, months, gender ?? "");
    return (
      <div className={`rounded-lg border border-violet-200 bg-violet-50 p-3 text-violet-900 ${className}`} aria-live="polite">
        <p className="text-sm font-semibold">BMI-for-age: {bmi}{pediatric ? ` · ${pediatric.category} (${pediatric.percentile}th percentile)` : " · Pediatric result unavailable"}</p>
        <p className="mt-1 text-xs opacity-80">
          {months !== null && months < 24
            ? "BMI-for-age classification is not validated below age 2; use the appropriate infant growth standard."
            : pediatric ? "Calculated from CDC BMI-for-age reference data using age and sex." : "A valid date/age and sex are required for pediatric classification."}
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
