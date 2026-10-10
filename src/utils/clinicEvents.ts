export const CLINIC_ANALYTICS_UPDATED_EVENT = "clinic-analytics-updated";

export function notifyClinicAnalyticsUpdated(): void {
  window.dispatchEvent(new Event(CLINIC_ANALYTICS_UPDATED_EVENT));
}
