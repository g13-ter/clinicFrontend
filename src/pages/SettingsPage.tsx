import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { ClinicScheduleDay, SystemSettings } from "../utils/types";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../hooks/useAuth";
import { getSavedAnalyticsFilter, saveAnalyticsFilter, type AnalyticsFilterPreference, type AnalyticsPeriod } from "../utils/analyticsFilter";

const defaultSettings: SystemSettings = {
  schoolYear: "",
  clinicName: "",
  buildingLocation: "",
  floorRoom: "",
  operatingDays: "",
  clinicOpenTime: "08:00",
  clinicCloseTime: "17:00",
  weeklySchedule: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
    day: day as ClinicScheduleDay["day"], openTime: "08:00", closeTime: "17:00",
  })),
  phoneNumber: "",
  emailAddress: "",
  emailNotificationsEnabled: true,
  appointmentRemindersEnabled: true,
  stockAlertsEnabled: true,
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function SettingsPage({ embedded = false }: { embedded?: boolean }) {
  const { role } = useAuth();
  const isNurse = role === "nurse";
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [analyticsFilter, setAnalyticsFilter] = useState(getSavedAnalyticsFilter);
  const [nurseTab, setNurseTab] = useState<"analytics" | "clinic">("analytics");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [showRolloverConfirm, setShowRolloverConfirm] = useState(false);

  useEffect(() => {
    api
      .get<SystemSettings>(isNurse ? "/system-settings/clinic-profile" : "/system-settings")
      .then((response) => setSettings((current) => ({ ...current, ...response.data })))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, [isNurse]);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const section = document.getElementById(window.location.hash.slice(1));
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSuccess("");
  };

  const updateAnalyticsFilter = (next: AnalyticsFilterPreference) => {
    setAnalyticsFilter(next);
    saveAnalyticsFilter(next);
    setSuccess("");
  };

  const toggleOperatingDay = (day: string) => {
    const typedDay = day as ClinicScheduleDay["day"];
    const exists = settings.weeklySchedule.some((entry) => entry.day === typedDay);
    const next = exists
      ? settings.weeklySchedule.filter((entry) => entry.day !== typedDay)
      : [...settings.weeklySchedule, { day: typedDay, openTime: "08:00", closeTime: "17:00" }];
    updateWeeklySchedule(next);
  };

  const updateWeeklySchedule = (schedule: ClinicScheduleDay[]) => {
    const sorted = [...schedule].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day));
    const first = sorted[0];
    setSettings((current) => ({
      ...current,
      weeklySchedule: sorted,
      operatingDays: formatOperatingDays(sorted.map((entry) => entry.day)),
      clinicOpenTime: first?.openTime ?? current.clinicOpenTime,
      clinicCloseTime: first?.closeTime ?? current.clinicCloseTime,
    }));
    setSuccess("");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (isNurse && nurseTab === "analytics") {
        saveAnalyticsFilter(analyticsFilter);
        setSuccess("Analytics filter saved. It will be used when you open Clinic Analytics.");
        return;
      }
      if (isNurse && !settings.operatingDays.trim()) throw new Error("Select at least one clinic operating day.");
      const clinicProfile = {
        clinicName: settings.clinicName,
        buildingLocation: settings.buildingLocation,
        floorRoom: settings.floorRoom,
        operatingDays: settings.operatingDays,
        clinicOpenTime: settings.clinicOpenTime,
        clinicCloseTime: settings.clinicCloseTime,
        weeklySchedule: settings.weeklySchedule,
        phoneNumber: settings.phoneNumber,
        emailAddress: settings.emailAddress,
      };
      const response = await api.put<SystemSettings>(
        isNurse ? "/system-settings/clinic-profile" : "/system-settings",
        isNurse ? clinicProfile : settings,
      );
      setSettings((current) => ({ ...current, ...response.data }));
      setSuccess(isNurse ? "Clinic information saved." : "System settings saved.");
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const advanceSchoolYear = async () => {
    setAdvancing(true);
    setError("");
    try {
      const response = await api.post("/patients/school-year/advance", {
        schoolYear: settings.schoolYear,
      });
      setSuccess(response.message);
      setShowRolloverConfirm(false);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "School-year rollover failed");
    } finally {
      setAdvancing(false);
    }
  };

  const content = (
    <>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-sm text-gray-500">{isNurse ? "Nurse workspace" : "Administration"}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{isNurse ? "Nurse Settings" : "System Settings"}</h2>
        </div>

        {isNurse && (
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Nurse settings">
            <button
              type="button"
              role="tab"
              aria-selected={nurseTab === "analytics"}
              onClick={() => { setNurseTab("analytics"); setError(""); setSuccess(""); }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${nurseTab === "analytics" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Analytics Filters
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={nurseTab === "clinic"}
              onClick={() => { setNurseTab("clinic"); setError(""); setSuccess(""); }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${nurseTab === "clinic" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Clinic Information
            </button>
          </div>
        )}

        {loading ? (
          <div className="h-80 animate-pulse rounded-xl bg-white shadow-sm" />
        ) : (
          <form onSubmit={save} className="space-y-4">
            {isNurse && nurseTab === "analytics" && <SettingsSection
              id="analytics-filter"
              title="Analytics Filters"
              description="Choose the default reporting period and date used when Clinic Analytics opens."
            >
              <div className={`grid grid-cols-1 gap-4 ${analyticsFilter.period === "custom" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                <label className="text-sm font-medium text-gray-700">
                  Period
                <select
                  value={analyticsFilter.period}
                  onChange={(event) => {
                    updateAnalyticsFilter({ ...analyticsFilter, period: event.target.value as AnalyticsPeriod });
                  }}
                  className="input mt-2"
                >
                  <option value="year">Year</option>
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                  <option value="day">Day</option>
                  <option value="custom">Custom date range</option>
                </select>
                </label>
                <AnalyticsPeriodInput filter={analyticsFilter} onChange={updateAnalyticsFilter} />
              </div>
            </SettingsSection>}

            {!isNurse && <SettingsSection
              id="school-year"
              title="School Year"
              description="Set the active academic year used by clinic operations."
            >
              <label className="block max-w-sm text-sm font-medium text-gray-700">
                Active school year
                <input
                  value={settings.schoolYear}
                  onChange={(event) => update("schoolYear", event.target.value)}
                  placeholder="2026-2027"
                  pattern="\d{4}-\d{4}"
                  required
                  className="input mt-2"
                />
              </label>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">School-year rollover</p>
                <p className="mt-1 text-xs text-amber-800">
                  Promotes students below their final level. Final-level students stay active and
                  are marked For Completion Review for an Admin decision; they are not graduated automatically.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRolloverConfirm(true)}
                  disabled={advancing || !settings.schoolYear}
                  className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-900 disabled:opacity-50"
                >
                  {advancing ? "Processing..." : "Run School-Year Rollover"}
                </button>
              </div>
            </SettingsSection>}

            {isNurse && nurseTab === "clinic" && <SettingsSection
              id="operating-hours"
              title="Clinic Schedule & Contact"
              description="This information is the single source used by the public landing page and Contact section."
            >
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">Clinic name<input value={settings.clinicName} onChange={(event) => update("clinicName", event.target.value)} required className="input mt-2" /></label>
                <label className="text-sm font-medium text-gray-700">Building / location<input value={settings.buildingLocation} onChange={(event) => update("buildingLocation", event.target.value)} required className="input mt-2" /></label>
                <label className="text-sm font-medium text-gray-700">Floor / room<input value={settings.floorRoom} onChange={(event) => update("floorRoom", event.target.value)} required className="input mt-2" /></label>
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-gray-700">Operating days</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const selected = settings.weeklySchedule.some((entry) => entry.day === day);
                    return <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleOperatingDay(day)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50"}`}
                    >
                      {day.slice(0, 3)}
                    </button>;
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">Displayed schedule: {settings.operatingDays || "No operating days selected"}</p>
              </fieldset>
              <div className="mt-5 space-y-2">
                <div className="hidden grid-cols-[1fr_1fr_1fr] gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                  <span>Day</span><span>Opening time</span><span>Closing time</span>
                </div>
                {settings.weeklySchedule.map((entry) => (
                  <div key={entry.day} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_1fr] sm:items-center">
                    <span className="text-sm font-semibold text-gray-800">{entry.day}</span>
                    <label className="text-xs font-medium text-gray-500 sm:text-transparent">
                      Opening time
                      <input
                        type="time"
                        value={entry.openTime}
                        onChange={(event) => updateWeeklySchedule(settings.weeklySchedule.map((item) => item.day === entry.day ? { ...item, openTime: event.target.value } : item))}
                        required
                        className="input mt-1 text-sm text-gray-800"
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-500 sm:text-transparent">
                      Closing time
                      <input
                        type="time"
                        min={entry.openTime}
                        value={entry.closeTime}
                        onChange={(event) => updateWeeklySchedule(settings.weeklySchedule.map((item) => item.day === entry.day ? { ...item, closeTime: event.target.value } : item))}
                        required
                        className="input mt-1 text-sm text-gray-800"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">Phone number<input type="tel" value={settings.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} required className="input mt-2" /></label>
                <label className="text-sm font-medium text-gray-700">Email address<input type="email" value={settings.emailAddress} onChange={(event) => update("emailAddress", event.target.value)} required className="input mt-2" /></label>
              </div>
            </SettingsSection>}

            {!isNurse && <SettingsSection
              id="administration-tools"
              title="Administration Tools"
              description="Quick access to account management, approvals, security activity, and your administrator profile."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AdminToolLink to="/dashboard?section=management" title="User Management" description="Manage patients and clinic staff accounts." />
                {role === "admin" && (
                  <AdminToolLink to="/dashboard?section=purchase-requests" title="Purchase Requests" description="Review and process medicine requests." />
                )}
                <AdminToolLink to="/audit-log" title="Audit Logs" description="Review administrative and security activity." />
                <AdminToolLink to="/profile" title="Profile & Security" description="Update your name, email, and password." />
              </div>
            </SettingsSection>}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : isNurse && nurseTab === "analytics" ? "Save Analytics Filter" : isNurse ? "Save Clinic Information" : "Save Settings"}
            </button>
          </form>
        )}
      </div>
      {showRolloverConfirm && (
        <ConfirmDialog
          title="Run school-year rollover"
          message={
            <>
              Promote active students into <strong>{settings.schoolYear}</strong>? Completion uses
              Grade 6 for Elementary, Grade 10 for Junior High, Grade 12 for Senior High, and each
              college student&apos;s configured program length. Students at those levels will be marked
              <strong> For Completion Review</strong>; they will not be automatically graduated. Clinic and
              medical history will be preserved.
            </>
          }
          confirmLabel="Run Rollover"
          busy={advancing}
          onConfirm={advanceSchoolYear}
          onCancel={() => setShowRolloverConfirm(false)}
        />
      )}
    </>
  );
  return embedded ? content : <Layout>{content}</Layout>;
}

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function formatOperatingDays(days: readonly string[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return days[0];
  const indexes = days.map((day) => WEEKDAYS.indexOf(day as (typeof WEEKDAYS)[number]));
  const consecutive = indexes.every((index, position) => position === 0 || index === indexes[position - 1] + 1);
  return consecutive ? `${days[0]}–${days.at(-1)}` : days.join(", ");
}

function AnalyticsPeriodInput({
  filter,
  onChange,
}: {
  filter: AnalyticsFilterPreference;
  onChange: (filter: AnalyticsFilterPreference) => void;
}) {
  const setDate = (date: string) => onChange({ ...filter, date });
  if (filter.period === "custom") {
    return <>
      <label className="text-sm font-medium text-gray-700">
        From
        <input type="date" value={filter.start} max={filter.end} onChange={(event) => onChange({ ...filter, start: event.target.value })} required className="input mt-2" />
      </label>
      <label className="text-sm font-medium text-gray-700">
        To
        <input type="date" value={filter.end} min={filter.start} onChange={(event) => onChange({ ...filter, end: event.target.value })} required className="input mt-2" />
      </label>
    </>;
  }
  if (filter.period === "year") {
    return <label className="text-sm font-medium text-gray-700">
      Year
      <input type="number" min="2000" max="2100" value={filter.date.slice(0, 4)} onChange={(event) => setDate(`${event.target.value}-01-01`)} required className="input mt-2" />
    </label>;
  }
  if (filter.period === "month") {
    return <label className="text-sm font-medium text-gray-700">
      Month
      <input type="month" value={filter.date.slice(0, 7)} onChange={(event) => setDate(`${event.target.value}-01`)} required className="input mt-2" />
    </label>;
  }
  if (filter.period === "week") {
    return <label className="text-sm font-medium text-gray-700">
      Week
      <input type="week" value={dateToIsoWeek(filter.date)} onChange={(event) => setDate(isoWeekToDate(event.target.value))} required className="input mt-2" />
    </label>;
  }
  return <label className="text-sm font-medium text-gray-700">
    Day
    <input type="date" value={filter.date} onChange={(event) => setDate(event.target.value)} required className="input mt-2" />
  </label>;
}

function dateToIsoWeek(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function isoWeekToDate(value: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() || 7) - 1) + ((week - 1) * 7));
  return monday.toISOString().slice(0, 10);
}

function AdminToolLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link to={to} className="group rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{title}</h4>
        <span aria-hidden="true" className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600">→</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </Link>
  );
}

export default SettingsPage;
