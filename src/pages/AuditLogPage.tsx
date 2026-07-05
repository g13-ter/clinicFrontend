import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { AuditLog } from "../utils/types";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  view: "bg-gray-100 text-gray-600",
};

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 20;

  const fetchLogs = async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/audit-logs?page=${p}&limit=${limit}`);
      setLogs(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const performerName = (p: AuditLog["performedBy"]) => {
    if (p == null) return "Deleted user";
    if (typeof p === "object") return p.name;
    return p;
  };

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Audit Log</h2>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Resource</th>
                  <th className="text-left px-4 py-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date(log.createdAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.resource}
                        <span className="text-gray-400 text-xs ml-1 font-mono">
                          #{log.resourceId.slice(-6)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{performerName(log.performedBy)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2 mt-4 items-center text-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

export default AuditLogPage;
