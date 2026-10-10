import { useCallback, useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { AuditLog } from "../utils/types";
import Modal from "../components/Modal";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  deactivate: "bg-red-100 text-red-700",
  reactivate: "bg-emerald-100 text-emerald-700",
  view: "bg-gray-100 text-gray-600",
};

const emptyFilters = { search: "", resource: "", action: "", startDate: "", endDate: "" };

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const limit = 20;

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      Object.entries(appliedFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const res = await api.get<AuditLog[]>(`/audit-logs?${params}`);
      setLogs(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const totalPages = Math.ceil(total / limit);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

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
      <div className="mb-5"><p className="text-sm text-gray-500">Security and accountability</p><h2 className="mt-1 text-2xl font-bold text-gray-900">Audit Logs</h2></div>

      <form onSubmit={applyFilters} className="mb-5 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Actor, email, target, or ID" className="input xl:col-span-2" />
        <input value={filters.resource} onChange={(event) => setFilters({ ...filters, resource: event.target.value })} placeholder="Resource, e.g. User" className="input" />
        <select value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} className="input" aria-label="Filter by action"><option value="">All actions</option>{Object.keys(ACTION_COLORS).filter((action) => action !== "view").map((action) => <option key={action} value={action}>{action[0].toUpperCase() + action.slice(1)}</option>)}</select>
        <input type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} className="input" aria-label="Start date" />
        <input type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} className="input" aria-label="End date" />
        <div className="flex gap-2 md:col-span-2 xl:col-span-6"><button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Apply Filters</button><button type="button" onClick={clearFilters} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Clear</button></div>
      </form>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Resource</th>
                  <th className="text-left px-4 py-3">Performed By</th>
                  <th className="px-4 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">
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
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => setSelectedLog(log)} className="text-xs font-medium text-blue-600 hover:underline">View Details</button></td>
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
      {selectedLog && <AuditDetails log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </Layout>
  );
}

function AuditDetails({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const sections = [["Before", log.changes?.before], ["After", log.changes?.after]] as const;
  return <Modal title="Audit event details" onClose={onClose}>
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div><dt className="text-xs text-gray-500">Action</dt><dd className="font-medium capitalize">{log.action}</dd></div>
      <div><dt className="text-xs text-gray-500">Resource</dt><dd className="font-medium">{log.resource} #{log.resourceId}</dd></div>
      <div><dt className="text-xs text-gray-500">Time</dt><dd>{new Date(log.createdAt).toLocaleString()}</dd></div>
      <div><dt className="text-xs text-gray-500">Request</dt><dd className="font-mono text-xs">{[log.metadata?.method, log.metadata?.path].filter(Boolean).join(" ") || "Not recorded"}</dd></div>
    </dl>
    <div className="mt-5 space-y-4">{sections.map(([label, value]) => <section key={label}><h3 className="mb-2 text-sm font-semibold text-gray-800">{label}</h3>{value ? <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">{JSON.stringify(value, null, 2)}</pre> : <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">No {label.toLowerCase()} snapshot recorded.</p>}</section>)}</div>
  </Modal>;
}

export default AuditLogPage;
