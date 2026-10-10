import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import type { DashboardStats } from "../../utils/types";
import { normalizeDashboardStats, type AnalyticsPatientType } from "./useDashboardData";
import { CLINIC_ANALYTICS_UPDATED_EVENT } from "../../utils/clinicEvents";
import { clinicDateKey } from "../../utils/date";
import { ANALYTICS_FILTER_UPDATED_EVENT, getSavedAnalyticsFilter, type AnalyticsPeriod } from "../../utils/analyticsFilter";

const CHART_COLORS = ["#2563eb", "#14b8a6", "#f59e0b", "#f97316", "#8b5cf6"];

export default function ClinicAnalytics({
  showVisitCounts = false,
  description = "Trends from recorded clinic activity",
}: {
  showVisitCounts?: boolean;
  description?: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedFilter, setSavedFilter] = useState(getSavedAnalyticsFilter);
  const requestedType = searchParams.get("patientType");
  const patientType: AnalyticsPatientType =
    requestedType === "student" || requestedType === "teacher" || requestedType === "staff"
      ? requestedType
      : "all";
  const period = savedFilter.period;
  const selectedDate = savedFilter.date ?? clinicDateKey();
  const customStart = savedFilter.start ?? selectedDate;
  const customEnd = savedFilter.end ?? selectedDate;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshSavedFilter = () => setSavedFilter(getSavedAnalyticsFilter());
    window.addEventListener(ANALYTICS_FILTER_UPDATED_EVENT, refreshSavedFilter);
    return () => window.removeEventListener(ANALYTICS_FILTER_UPDATED_EVENT, refreshSavedFilter);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAnalytics = () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ patientType, period, date: selectedDate });
      if (period === "custom") {
        params.set("start", customStart);
        params.set("end", customEnd);
      }
      api.get<Partial<DashboardStats>>(`/dashboard/analytics?${params}`)
        .then((response) => {
          if (!cancelled) setStats(normalizeDashboardStats(response.data));
        })
        .catch((requestError: unknown) => {
          if (!cancelled) {
            setError(requestError instanceof Error ? requestError.message : "Analytics could not be loaded");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    loadAnalytics();
    window.addEventListener(CLINIC_ANALYTICS_UPDATED_EVENT, loadAnalytics);
    return () => {
      cancelled = true;
      window.removeEventListener(CLINIC_ANALYTICS_UPDATED_EVENT, loadAnalytics);
    };
  }, [patientType, period, selectedDate, customStart, customEnd]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  return (
    <section aria-labelledby="clinic-analytics-title" className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="clinic-analytics-title" className="text-xl font-semibold tracking-tight text-slate-900">
            Clinic Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="w-full sm:ml-auto sm:w-auto">
          <FilterSelect label="Patient type" value={patientType} onChange={(value) => setFilter("patientType", value)} options={[
            ["all", "All patients"], ["student", "Students"], ["teacher", "Teachers"], ["staff", "Staff"],
          ]} />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && !stats ? (
        <AnalyticsSkeleton showVisitCounts={showVisitCounts} />
      ) : stats ? (
        <div className={loading ? "space-y-4 opacity-60" : "space-y-4"} aria-busy={loading}>
          {showVisitCounts && (
            <div className={`grid gap-3 ${patientType === "all" ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
              <AnalyticsCount label={patientType === "all" ? "All visits" : `${typeLabel(patientType)} visits`} value={stats.analyticsTotalVisits} tone="slate" />
              {patientType === "all" && (
                <>
                  <AnalyticsCount label="Student visits" value={stats.analyticsVisitBreakdown.student} tone="blue" />
                  <AnalyticsCount label="Teacher visits" value={stats.analyticsVisitBreakdown.teacher} tone="emerald" />
                  <AnalyticsCount label="Staff visits" value={stats.analyticsVisitBreakdown.staff} tone="amber" />
                </>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <CommonComplaintsChart items={stats.commonComplaints} />
            <BmiDistributionChart breakdown={stats.bmiBreakdown} recordedCount={stats.bmiRecordedCount} />
            <MonthlyVisitsChart items={stats.monthlyVisits} period={period} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function typeLabel(type: AnalyticsPatientType): string {
  return type === "student" ? "Student" : type === "teacher" ? "Teacher" : type === "staff" ? "Staff" : "All";
}

function AnalyticsCount({ label, value, tone }: { label: string; value: number; tone: "slate" | "blue" | "emerald" | "amber" }) {
  const tones = { slate: "border-slate-200 bg-slate-50 text-slate-900", blue: "border-blue-200 bg-blue-50 text-blue-900", emerald: "border-emerald-200 bg-emerald-50 text-emerald-900", amber: "border-amber-200 bg-amber-50 text-amber-900" };
  return <article className={`rounded-xl border p-4 ${tones[tone]}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></article>;
}

function CommonComplaintsChart({ items }: { items: DashboardStats["commonComplaints"] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  let current = 0;
  const segments = items.map((item, index) => {
    const start = current;
    current += total > 0 ? (item.count / total) * 100 : 0;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${current}%`;
  });
  const background = total > 0 ? `conic-gradient(${segments.join(", ")})` : "#e5e7eb";
  return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 className="font-semibold text-gray-900">Most Common Complaints</h3><p className="mt-1 text-xs text-gray-500">Based on filtered clinic visits</p>
    {items.length === 0 ? <EmptyChart label="No clinic complaints recorded for this patient type." /> : <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background }} aria-label="Common complaints chart"><div className="absolute inset-10 flex items-center justify-center rounded-full bg-white text-center"><div><p className="text-2xl font-bold text-gray-900">{total}</p><p className="text-[11px] text-gray-500">recorded visits</p></div></div></div>
      <div className="grid w-full gap-3 sm:max-w-xs">{items.map((item, index) => <div key={item.label} className="flex items-center gap-3 text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /><span className="min-w-0 flex-1 truncate text-gray-700">{item.label}</span><span className="font-medium text-gray-900">{Math.round((item.count / total) * 100)}%</span></div>)}</div>
    </div>}
  </article>;
}

function MonthlyVisitsChart({ items, period }: { items: DashboardStats["monthlyVisits"]; period: AnalyticsPeriod }) {
  const max = Math.max(...items.map((item) => item.visits), 1);
  const labelStep = Math.max(1, Math.ceil(items.length / 7));
  return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 className="font-semibold text-gray-900">Clinic Visits</h3>
    <p className="mt-1 text-xs text-gray-500">Visits in the selected {period === "custom" ? "date range" : period}</p>
    <div className="mt-5 flex h-52 items-end gap-1 overflow-x-auto border-b border-l border-gray-200 px-3 pt-7">
      {items.map((item, index) => {
        const showLabel = index % labelStep === 0 || index === items.length - 1;
        return <div key={item.key} className="flex h-full min-w-3 flex-1 flex-col justify-end" title={`${item.month}: ${item.visits} visit${item.visits === 1 ? "" : "s"}`}>
          <div className="flex min-h-0 flex-1 items-end">
            <div
              className="group relative w-full rounded-t bg-blue-500 transition-colors hover:bg-blue-600"
              style={{ height: item.visits > 0 ? `${Math.max((item.visits / max) * 100, 5)}%` : "2px" }}
              aria-label={`${item.month}: ${item.visits} visits`}
            >
              <span className="absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">{item.visits}</span>
            </div>
          </div>
          <div className="h-10 pt-2 text-center text-[10px] leading-tight text-gray-500">{showLabel ? item.month : ""}</div>
        </div>;
      })}
    </div>
  </article>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="text-xs font-semibold text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="input mt-1 w-full min-w-36 bg-white text-sm font-normal">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function BmiDistributionChart({ breakdown, recordedCount }: { breakdown: DashboardStats["bmiBreakdown"]; recordedCount: number }) {
  const categories = [
    { key: "underweight", label: "Underweight", value: breakdown.underweight, color: "#0ea5e9" },
    { key: "normal", label: "Normal weight", value: breakdown.normalWeight, color: "#10b981" },
    { key: "overweight", label: "Overweight", value: breakdown.overweight, color: "#f59e0b" },
    { key: "obese", label: "Obese", value: breakdown.obese, color: "#f97316" },
  ];
  let current = 0;
  const segments = categories.map((category) => {
    const start = current;
    current += recordedCount > 0 ? (category.value / recordedCount) * 100 : 0;
    return `${category.color} ${start}% ${current}%`;
  });
  const background = recordedCount > 0 ? `conic-gradient(${segments.join(", ")})` : "#e5e7eb";

  return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 className="font-semibold text-gray-900">Adult BMI Categories</h3>
    <p className="mt-1 text-xs text-gray-500">Standard BMI ranges for patients age 18 and older.</p>
    {recordedCount === 0 ? <EmptyChart label="No adult visits with both height and weight recorded for this patient type." /> : <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background }} role="img" aria-label={`BMI categories for ${recordedCount} adult visits`}><div className="absolute inset-10 flex items-center justify-center rounded-full bg-white text-center"><div><p className="text-2xl font-bold text-gray-900">{recordedCount}</p><p className="text-[11px] leading-tight text-gray-500">recorded BMIs</p></div></div></div>
      <div className="grid w-full gap-3 sm:max-w-xs">{categories.map((category) => <div key={category.key} className="flex items-center gap-3 text-sm"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><span className="min-w-0 flex-1 text-gray-700">{category.label}</span><span className="w-10 text-right font-semibold text-gray-900">{Math.round((category.value / recordedCount) * 100)}%</span></div>)}</div>
    </div>}
  </article>;
}

function EmptyChart({ label }: { label: string }) {
  return <div className="mt-6 flex h-48 items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-sm text-gray-500">{label}</div>;
}

function AnalyticsSkeleton({ showVisitCounts }: { showVisitCounts: boolean }) {
  return <div className="animate-pulse space-y-4">{showVisitCounts && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-xl bg-slate-100" />)}</div>}<div className="grid gap-4 xl:grid-cols-3"><div className="h-72 rounded-xl bg-slate-100" /><div className="h-72 rounded-xl bg-slate-100" /><div className="h-72 rounded-xl bg-slate-100" /></div></div>;
}
