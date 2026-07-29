import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { SystemSettings } from "../utils/types";
import ConfirmDialog from "../components/ConfirmDialog";

const defaultSettings: SystemSettings = {
  schoolYear: "",
  clinicOpenTime: "08:00",
  clinicCloseTime: "17:00",
  emailNotificationsEnabled: true,
  appointmentRemindersEnabled: true,
  stockAlertsEnabled: true,
};

function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [showRolloverConfirm, setShowRolloverConfirm] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveries, setDeliveries] = useState<Array<{
    _id: string;
    kind: string;
    recipient: string;
    status: string;
    attempts: number;
    sentAt?: string;
    lastError?: string;
  }>>([]);

  useEffect(() => {
    api
      .get<SystemSettings>("/system-settings")
      .then((response) => setSettings(response.data))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<typeof deliveries>("/notifications/delivery-history?limit=10")
      .then((response) => setDeliveries(response.data))
      .catch((requestError: unknown) => {
        setDeliveryError(requestError instanceof Error ? requestError.message : "Failed to load delivery history");
      });
  }, []);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const section = document.getElementById(window.location.hash.slice(1));
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSuccess("");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.put<SystemSettings>("/system-settings", settings);
      setSettings(response.data);
      setSuccess("System settings saved.");
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
        graduatingYearLevel: 4,
      });
      setSuccess(response.message);
      setShowRolloverConfirm(false);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "School-year rollover failed");
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-sm text-gray-500">Administration</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">System Settings</h2>
        </div>

        {loading ? (
          <div className="h-80 animate-pulse rounded-xl bg-white shadow-sm" />
        ) : (
          <form onSubmit={save} className="space-y-4">
            <SettingsSection
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
                  Promotes active students by one year and archives Year 4 students as graduated.
                  Previous clinic and medical records remain available.
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
            </SettingsSection>

            <SettingsSection
              id="operating-hours"
              title="Operating Hours"
              description="Define when the clinic normally accepts student visits."
            >
              <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Opening time
                  <input
                    type="time"
                    value={settings.clinicOpenTime}
                    onChange={(event) => update("clinicOpenTime", event.target.value)}
                    required
                    className="input mt-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Closing time
                  <input
                    type="time"
                    value={settings.clinicCloseTime}
                    onChange={(event) => update("clinicCloseTime", event.target.value)}
                    required
                    className="input mt-2"
                  />
                </label>
              </div>
            </SettingsSection>

            <SettingsSection
              id="notifications"
              title="Notifications"
              description="Choose which operational alerts the system should send."
            >
              <div className="space-y-3">
                <SettingToggle
                  label="Email notifications"
                  checked={settings.emailNotificationsEnabled}
                  onChange={(value) => update("emailNotificationsEnabled", value)}
                />
                <SettingToggle
                  label="Appointment reminders"
                  checked={settings.appointmentRemindersEnabled}
                  onChange={(value) => update("appointmentRemindersEnabled", value)}
                />
                <SettingToggle
                  label="Medicine stock alerts"
                  checked={settings.stockAlertsEnabled}
                  onChange={(value) => update("stockAlertsEnabled", value)}
                />
              </div>
              <div className="mt-5 overflow-x-auto">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Recent Email Delivery</p>
                <table className="w-full min-w-[620px] text-xs">
                  <thead className="border-b text-left text-gray-500">
                    <tr><th className="py-2">Type</th><th>Recipient</th><th>Status</th><th>Attempts</th><th>Details</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {deliveries.map((delivery) => (
                      <tr key={delivery._id}>
                        <td className="py-2">{delivery.kind.replaceAll("_", " ")}</td>
                        <td>{delivery.recipient}</td>
                        <td>{delivery.status}</td>
                        <td>{delivery.attempts}</td>
                        <td className="max-w-xs truncate">{delivery.lastError || (delivery.sentAt ? new Date(delivery.sentAt).toLocaleString() : "Queued")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deliveries.length === 0 && <p className="py-3 text-xs text-gray-400">No notification deliveries yet.</p>}
                {deliveryError && <p className="py-3 text-xs text-red-600">{deliveryError}</p>}
              </div>
            </SettingsSection>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}
      </div>
      {showRolloverConfirm && (
        <ConfirmDialog
          title="Run school-year rollover"
          message={
            <>
              Promote active students into <strong>{settings.schoolYear}</strong> and graduate
              students currently in Year 4 or above? Clinic and medical history will be preserved.
            </>
          }
          confirmLabel="Run Rollover"
          busy={advancing}
          onConfirm={advanceSchoolYear}
          onCancel={() => setShowRolloverConfirm(false)}
        />
      )}
    </Layout>
  );
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

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-blue-600"
      />
    </label>
  );
}

export default SettingsPage;
