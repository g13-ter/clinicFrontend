import { clinicDateKey } from "./date";

export type AnalyticsPeriod = "year" | "month" | "week" | "day" | "custom";

export type AnalyticsFilterPreference = {
  period: AnalyticsPeriod;
  date: string;
  start: string;
  end: string;
};

const LEGACY_STORAGE_KEY = "schoolcare.analyticsPeriod";
const STORAGE_KEY = "schoolcare.analyticsFilter";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const ANALYTICS_FILTER_UPDATED_EVENT = "schoolcare:analytics-filter-updated";

const isPeriod = (value: unknown): value is AnalyticsPeriod =>
  value === "year" || value === "month" || value === "week" || value === "day" || value === "custom";

export const getSavedAnalyticsFilter = (): AnalyticsFilterPreference => {
  const today = clinicDateKey();
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<AnalyticsFilterPreference> | null;
    if (value && isPeriod(value.period)) {
      return {
        period: value.period,
        date: DATE_PATTERN.test(value.date ?? "") ? value.date! : today,
        start: DATE_PATTERN.test(value.start ?? "") ? value.start! : today,
        end: DATE_PATTERN.test(value.end ?? "") ? value.end! : today,
      };
    }
  } catch {
    // Ignore invalid local preferences and use safe defaults.
  }
  const legacyPeriod = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  return { period: isPeriod(legacyPeriod) ? legacyPeriod : "month", date: today, start: today, end: today };
};

export const saveAnalyticsFilter = (filter: AnalyticsFilterPreference): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  window.localStorage.setItem(LEGACY_STORAGE_KEY, filter.period);
  window.dispatchEvent(new CustomEvent(ANALYTICS_FILTER_UPDATED_EVENT, { detail: filter }));
};

export const getSavedAnalyticsPeriod = (): AnalyticsPeriod => {
  return getSavedAnalyticsFilter().period;
};

export const saveAnalyticsPeriod = (period: AnalyticsPeriod): void => {
  saveAnalyticsFilter({ ...getSavedAnalyticsFilter(), period });
};
