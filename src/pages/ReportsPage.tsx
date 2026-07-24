import { useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";

function defaultStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function ReportsPage() {
  const [startDate, setStartDate] = useState(defaultStartOfMonth());
  const [endDate, setEndDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await api.download(`/reports/clinic-summary?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Clinic_Report_${startDate}_to_${endDate}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("Report downloaded.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: "thisMonth" | "last7" | "last30" | "thisYear") => {
    const now = new Date();
    if (preset === "thisMonth") {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
      setEndDate(todayStr());
    } else if (preset === "last7") {
      setStartDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setEndDate(todayStr());
    } else if (preset === "last30") {
      setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setEndDate(todayStr());
    } else {
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10));
      setEndDate(todayStr());
    }
  };

  const rangeInvalid = startDate && endDate && new Date(startDate) > new Date(endDate);

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Reports</h2>

      <div className="bg-white rounded shadow p-6 max-w-lg">
        <h3 className="font-medium text-gray-800 mb-1">Clinic Summary Report</h3>
        <p className="text-sm text-gray-500 mb-4">
          Downloads a Word document (.docx) built from live system data for the period you choose below —
          attendance, common complaints, appointments, consultations, and inventory status.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              { key: "thisMonth", label: "This Month" },
              { key: "last7", label: "Last 7 Days" },
              { key: "last30", label: "Last 30 Days" },
              { key: "thisYear", label: "This Year" },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="input w-full"
            />
          </div>
        </div>

        {rangeInvalid && (
          <p className="text-red-500 text-sm mb-3">Start date must be before end date.</p>
        )}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

        <button
          onClick={handleDownload}
          disabled={loading || !startDate || !endDate || !!rangeInvalid}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Download Report"}
        </button>
      </div>
    </Layout>
  );
}

export default ReportsPage;