import { useState } from "react";
import PageFrame from "../components/PageFrame";
import {
  MedicineIcon,
  ReportsIcon,
  VisitsIcon,
} from "../components/icons";
import { api } from "../services/api";
import { reportFilename, saveBlobDownload } from "../utils/download";
import { useEffect } from "react";
import type { InventoryLabel, MedicationInventoryReportRow } from "../utils/types";
import Modal from "../components/Modal";

type CsvReportType =
  | "inventory-current"
  | "inventory-movements"
  | "inventory-batches"
  | "inventory-reorder"
  | "medication-consumption"
  | "medication-usage-details"
  | "medication-inventory"
  | "inventory-stock"
  | "inventory-usage"
  | "inventory-expiry"
  | "disease-trends"
  | "vaccination-status";

const dateKey = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const today = (): string => dateKey(new Date());

const startOfMonth = (): string => {
  const now = new Date();
  return dateKey(new Date(now.getFullYear(), now.getMonth(), 1));
};

function ReportsPage({ embedded = false }: { embedded?: boolean }) {
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [patientType, setPatientType] = useState("all");
  const [activeDownload, setActiveDownload] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [labels, setLabels] = useState<InventoryLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [includeEmptyLabels, setIncludeEmptyLabels] = useState(true);
  const [preview, setPreview] = useState<MedicationInventoryReportRow[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const rangeInvalid = new Date(startDate) > new Date(endDate);

  useEffect(() => {
    api.get<InventoryLabel[]>("/inventory-labels")
      .then((response) => {
        setLabels(response.data);
        setSelectedLabels(response.data.map((label) => label.name));
      })
      .catch(() => {});
  }, []);

  const monthlyReportParams = () => {
    const params = new URLSearchParams({ startDate, endDate, includeEmpty: String(includeEmptyLabels) });
    if (selectedLabels.length === 0 && labels.length > 0) params.set("labels", "__none__");
    else if (selectedLabels.length !== labels.length) params.set("labels", selectedLabels.join(","));
    return params;
  };

  const download = async (path: string, fallbackName: string, action: string) => {
    setActiveDownload(action);
    setError("");
    setSuccess("");
    try {
      const response = await api.download(path);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Report generation failed");
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("The server generated an empty report. Please try again.");
      }
      const filename = reportFilename(
        response.headers.get("Content-Disposition"),
        fallbackName,
      );
      saveBlobDownload(blob, filename);
      setSuccess("Report downloaded successfully.");
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Report generation failed");
    } finally {
      setActiveDownload("");
    }
  };

  type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

  const reportRange = (period: ReportPeriod): { start: string; end: string } => {
    const now = new Date();
    let from = new Date(now);
    if (period === "weekly") from.setDate(now.getDate() - 6);
    if (period === "monthly") from = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "yearly") from = new Date(now.getFullYear(), 0, 1);
    return { start: dateKey(from), end: dateKey(now) };
  };

  const applyPeriod = (period: ReportPeriod) => {
    const range = reportRange(period);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const downloadVisitReport = (period: ReportPeriod) => {
    const { start, end } = reportRange(period);
    const params = new URLSearchParams({ startDate: start, endDate: end, period, patientType });
    void download(
      `/reports/clinic-summary?${params}`,
      `Clinic_${period}_report_${end}.docx`,
      `visit-${period}`,
    );
  };

  const downloadAnnualMedicationReport = () => {
    void download(
      "/reports/annual-medication",
      "Annual_Medication_Report.xls",
      "annual-medication",
    );
  };

  const downloadMonthlyMedicationInventory = () => {
    if (rangeInvalid) return;
    const params = monthlyReportParams();
    void download(
      `/reports/monthly-medication-inventory?${params}`,
      `Monthly_Medication_Inventory_${startDate}_to_${endDate}.xls`,
      "monthly-medication-inventory",
    );
  };

  const previewMonthlyMedicationInventory = async () => {
    if (rangeInvalid) return;
    setPreviewLoading(true);
    try {
      const response = await api.get<MedicationInventoryReportRow[]>(`/reports/monthly-medication-inventory/preview?${monthlyReportParams()}`);
      setPreview(response.data);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Report preview failed");
    } finally { setPreviewLoading(false); }
  };

  const downloadCsv = (type: CsvReportType, label: string) => {
    if (rangeInvalid) return;
    const params = new URLSearchParams({ startDate, endDate, patientType });
    void download(
      `/reports/export/${type}?${params}`,
      `${label}_${startDate}_to_${endDate}.csv`,
      type,
    );
  };

  const downloadHealthSummary = () => {
    if (rangeInvalid) return;
    const params = new URLSearchParams({ startDate, endDate, patientType });
    void download(
      `/reports/clinic-summary?${params}`,
      `Health_Summary_${startDate}_to_${endDate}.docx`,
      "health-summary",
    );
  };

  return (
    <PageFrame embedded={embedded}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-gray-500">Reporting period</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Clinic Reports</h2>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap justify-end gap-2">
              <PeriodButton label="Today" onClick={() => applyPeriod("daily")} />
              <PeriodButton label="Last 7 Days" onClick={() => applyPeriod("weekly")} />
              <PeriodButton label="This Month" onClick={() => applyPeriod("monthly")} />
              <PeriodButton label="This Year" onClick={() => applyPeriod("yearly")} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-gray-600">
                Patient type
                <select value={patientType} onChange={(event) => setPatientType(event.target.value)} className="input mt-1">
                  <option value="all">All</option>
                  <option value="student">Students</option>
                  <option value="employees">Teachers &amp; Staff</option>
                  <option value="teacher">Teachers</option>
                  <option value="staff">Staff</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600">
                Start date
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="input mt-1"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                End date
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="input mt-1"
                />
              </label>
            </div>
          </div>
        </div>

        {rangeInvalid && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Start date must be before the end date.
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ReportCard
            icon={<ReportsIcon />}
            title="Visit Reports"
            description="Generate detailed reports from recorded clinic visits."
          >
            <ActionButton label="Daily Report" loading={activeDownload === "visit-daily"} onClick={() => downloadVisitReport("daily")} />
            <ActionButton label="Weekly Report" loading={activeDownload === "visit-weekly"} onClick={() => downloadVisitReport("weekly")} />
            <ActionButton label="Monthly Report" loading={activeDownload === "visit-monthly"} onClick={() => downloadVisitReport("monthly")} />
            <ActionButton label="Yearly Report" loading={activeDownload === "visit-yearly"} onClick={() => downloadVisitReport("yearly")} />
          </ReportCard>

          <ReportCard
            icon={<MedicineIcon />}
            title="Inventory Reports"
            description="Monitor current stock, movements, batch expiry, and items that need reordering."
          >
            <ActionButton label="Current Stock" loading={activeDownload === "inventory-current"} onClick={() => downloadCsv("inventory-current", "Current_Stock")} />
            <ActionButton label="Stock Movement (Selected Period)" loading={activeDownload === "inventory-movements"} onClick={() => downloadCsv("inventory-movements", "Stock_Movement")} />
            <ActionButton label="Expiry and Batch" loading={activeDownload === "inventory-batches"} onClick={() => downloadCsv("inventory-batches", "Expiry_and_Batch")} />
            <ActionButton label="Reorder Recommendations" loading={activeDownload === "inventory-reorder"} onClick={() => downloadCsv("inventory-reorder", "Reorder_Report")} />
          </ReportCard>

          <ReportCard
            icon={<MedicineIcon />}
            title="Medication Reports"
            description="Review medication consumption, patient-level dispensing records, and a print-ready monthly inventory form."
          >
            {labels.length > 0 && <div className="mb-2 rounded-lg border bg-slate-50 p-3 text-left"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold uppercase text-gray-600">Labels included</span><button type="button" onClick={() => setSelectedLabels(selectedLabels.length === labels.length ? [] : labels.map((label) => label.name))} className="text-xs text-blue-700">{selectedLabels.length === labels.length ? "Clear all" : "Select all"}</button></div><div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">{labels.map((label) => <label key={label._id} className="flex items-center gap-1.5 rounded-full border bg-white px-2 py-1 text-xs"><input type="checkbox" checked={selectedLabels.includes(label.name)} onChange={(event) => setSelectedLabels((current) => event.target.checked ? [...current, label.name] : current.filter((name) => name !== label.name))} /><span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />{label.name}</label>)}</div><label className="mt-3 flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={includeEmptyLabels} onChange={(event) => setIncludeEmptyLabels(event.target.checked)} />Include empty label sections</label></div>}
            <ActionButton label="Preview Monthly Inventory Form" loading={previewLoading} onClick={() => void previewMonthlyMedicationInventory()} />
            <ActionButton label="Monthly Inventory Form (Excel / Print)" loading={activeDownload === "monthly-medication-inventory"} onClick={downloadMonthlyMedicationInventory} />
            <ActionButton label="Medication Report (Selected Period)" loading={activeDownload === "medication-inventory"} onClick={() => downloadCsv("medication-inventory", "Medication_Report")} />
            <ActionButton label="Consumption Summary (Selected Period)" loading={activeDownload === "medication-consumption"} onClick={() => downloadCsv("medication-consumption", "Medication_Consumption")} />
            <ActionButton label="Usage Details (Selected Period)" loading={activeDownload === "medication-usage-details"} onClick={() => downloadCsv("medication-usage-details", "Medication_Usage_Details")} />
            <ActionButton
              label="Annual Medication Report"
              loading={activeDownload === "annual-medication"}
              onClick={downloadAnnualMedicationReport}
            />
          </ReportCard>

          <ReportCard
            icon={<VisitsIcon />}
            title="Health Analytics"
            description="Analyze health trends by student, teacher, staff, or all patient types."
          >
            <ActionButton label="Disease Trends" loading={activeDownload === "disease-trends"} onClick={() => downloadCsv("disease-trends", "Disease_Trends")} />
            <ActionButton label="Vaccination Status" loading={activeDownload === "vaccination-status"} onClick={() => downloadCsv("vaccination-status", "Vaccination_Status")} />
            <ActionButton label="Health Summary" loading={activeDownload === "health-summary"} onClick={downloadHealthSummary} />
          </ReportCard>

        </section>
        {preview && <Modal title="Monthly Inventory Report Preview" onClose={() => setPreview(null)}><div className="max-h-[65vh] overflow-auto"><table className="w-full min-w-[650px] border-collapse text-xs"><thead><tr>{["Label", "Medication", "Received", "Prescribed", "Remaining", "Expiration", "Remarks"].map((heading) => <th key={heading} className="border bg-gray-100 p-2 text-left">{heading}</th>)}</tr></thead><tbody>{preview.map((row) => <tr key={`${row.inventorySection}-${row.name}`}><td className="border p-2 font-medium">{row.inventorySection}</td><td className="border p-2">{row.name}</td><td className="border p-2">{row.dateReceived ? new Date(row.dateReceived).toLocaleDateString() : "—"}</td><td className="border p-2">{row.totalPrescribed}</td><td className="border p-2">{row.remainingStock} {row.unit}</td><td className="border p-2">{row.expirationDate ? new Date(row.expirationDate).toLocaleDateString() : "—"}</td><td className="border p-2">{row.remarks}</td></tr>)}</tbody></table>{preview.length === 0 && <p className="p-6 text-center text-gray-500">No items match the selected labels and period.</p>}</div></Modal>}
      </div>
    </PageFrame>
  );
}

function ReportCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-800">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="mt-5 text-sm text-gray-500">{description}</p>
      <div className="mt-4 grid gap-2">{children}</div>
    </article>
  );
}

function ActionButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
    >
      {loading ? "Generating..." : label}
    </button>
  );
}

function PeriodButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50"
    >
      {label}
    </button>
  );
}

export default ReportsPage;
