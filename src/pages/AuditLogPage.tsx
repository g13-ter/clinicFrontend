import { useCallback, useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { AuditLog } from "../utils/types";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  deactivate: "bg-red-100 text-red-700",
  reactivate: "bg-emerald-100 text-emerald-700",
  view: "bg-gray-100 text-gray-600",
};

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 20;

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<AuditLog[]>(`/audit-logs?page=${p}&limit=${limit}`);
      setLogs(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const totalPages = Math.ceil(total / limit);

  const performer = (log: AuditLog) => {
    if (log.actorSnapshot) {
      return {
        name: log.actorSnapshot.name,
        email: log.actorSnapshot.email,
        role: log.actorSnapshot.role,
        former: typeof log.performedBy === "string",
        userId: log.actorSnapshot.userId,
      };
    }
    if (typeof log.performedBy === "object") {
      return {
        name: log.performedBy.name,
        email: log.performedBy.email,
        role: log.performedBy.role,
        former: false,
        userId: log.performedBy._id,
      };
    }
    return {
      name: "Former account",
      email: "",
      role: "unknown",
      former: true,
      userId: log.performedBy,
    };
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
                  logs.map((log) => {
                    const actor = performer(log);
                    return (
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
                      <td className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{actor.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {actor.email || `Account ID: ${actor.userId}`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                              {actor.role}
                            </span>
                            {actor.former && (
                              <span className="text-[11px] font-medium text-amber-700">
                                Former account
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    );
                  })
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
