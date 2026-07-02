import { useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";

function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.download("/reports/clinic-summary");
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clinic-summary.docx";
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("Report downloaded.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Reports</h2>

      <div className="bg-white rounded shadow p-6 max-w-md">
        <h3 className="font-medium text-gray-800 mb-1">Clinic Summary Report</h3>
        <p className="text-sm text-gray-500 mb-4">
          Downloads a Word document (.docx) summarizing clinic activity — patient counts,
          appointment statistics, medicine inventory, and visit records.
        </p>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

        <button
          onClick={handleDownload}
          disabled={loading}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Download Report"}
        </button>
      </div>
    </Layout>
  );
}

export default ReportsPage;
