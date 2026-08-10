import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { AuditLog, User } from "../utils/types";
import { AuditIcon, StaffIcon } from "../components/icons";

function SuperAdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getAll<User>("/users"),
      api.get<AuditLog[]>("/audit-logs?limit=20"),
    ])
      .then(([usersResponse, logsResponse]) => {
        setUsers(usersResponse.data);
        setLogs(logsResponse.data);
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load system administration data");
      });
  }, []);

  const active = users.filter((user) => user.isActive).length;
  const inactive = users.length - active;
  const administrators = users.filter((user) => user.role === "admin" || user.role === "superadmin").length;
  const inactiveAdministrators = users.filter((user) => !user.isActive && (user.role === "admin" || user.role === "superadmin"));
  const failedAttempts = logs.filter((log) => log.changes?.after?.successful === false);
  const privilegedLogs = logs.filter((log) => log.resource === "User" || log.resource === "SystemSettings").slice(0, 6);

  return (
    <Layout>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div>
          <p className="text-sm text-gray-500">System administration</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">Manage accounts, administrative access, permissions, audit history, and system settings.</p>
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Accounts" value={users.length} detail="All system users" />
          <SummaryCard label="Active Accounts" value={active} detail="Can currently sign in" />
          <SummaryCard label="Inactive Accounts" value={inactive} detail="Access has been revoked" />
          <SummaryCard label="Administrators" value={administrators} detail="Super Admin and Admin accounts" />
        </section>

        {(inactiveAdministrators.length > 0 || failedAttempts.length > 0) && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-semibold text-amber-950">Requires Attention</h2><p className="mt-1 text-sm text-amber-800">Review account and security events that may require action.</p></div>
              <Link to="/audit-log" className="text-sm font-semibold text-amber-900 hover:underline">Review audit logs</Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {inactiveAdministrators.length > 0 && <AttentionItem value={inactiveAdministrators.length} label="Inactive administrator accounts" />}
              {failedAttempts.length > 0 && <AttentionItem value={failedAttempts.length} label="Failed privileged actions in recent activity" />}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Administration</h2>
            <p className="mt-1 text-sm text-gray-500">System-level account and access controls.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuickLink to="/users" label="User Management" detail="Create, edit, activate, or deactivate accounts" icon={<StaffIcon />} />
              <QuickLink to="/roles-permissions" label="Roles & Permissions" detail="Review and assign protected roles" icon={<AuditIcon />} />
              <QuickLink to="/audit-log" label="Audit Logs" detail="Review privileged and failed actions" icon={<AuditIcon />} />
              <QuickLink to="/settings" label="System Settings" detail="Configure system-wide behavior" icon={<AuditIcon />} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-semibold text-gray-900">Recent Privileged Activity</h2><p className="mt-1 text-sm text-gray-500">Latest account and settings changes.</p></div>
              <Link to="/audit-log" className="text-sm font-medium text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="mt-4 divide-y divide-gray-100">
              {privilegedLogs.map((log) => (
                <div key={log._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 truncate text-gray-700"><strong className="capitalize">{log.action}</strong> {log.resource}<span className="ml-1 text-xs text-gray-400">by {auditActorName(log)}</span></span>
                  <time className="shrink-0 text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</time>
                </div>
              ))}
              {privilegedLogs.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No privileged activity recorded.</p>}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-gray-600">{label}</p><p className="mt-3 text-3xl font-bold text-gray-900">{value}</p><p className="mt-1 text-xs text-gray-400">{detail}</p></article>;
}

function AttentionItem({ value, label }: { value: number; label: string }) {
  return <div className="rounded-lg border border-amber-200 bg-white/80 px-4 py-3"><span className="text-xl font-bold text-amber-950">{value}</span><span className="ml-2 text-sm text-amber-900">{label}</span></div>;
}

function auditActorName(log: AuditLog): string {
  if (log.actorSnapshot?.name) return log.actorSnapshot.name;
  return typeof log.performedBy === "object" ? log.performedBy.name : "Former account";
}

function QuickLink({ to, label, detail, icon }: { to: string; label: string; detail: string; icon: React.ReactNode }) {
  return <Link to={to} className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50/50"><span className="text-blue-600">{icon}</span><span className="mt-3 block text-sm font-semibold text-gray-900">{label}</span><span className="mt-1 block text-xs leading-5 text-gray-500">{detail}</span></Link>;
}

export default SuperAdminDashboardPage;
