import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { UserRole } from "../config/permissions";

interface RolePolicy {
  role: UserRole;
  capabilities: string[];
}

function RolePermissionsPage() {
  const [policies, setPolicies] = useState<RolePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<RolePolicy[]>("/users/role-permissions")
      .then((response) => setPolicies(response.data))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load role permissions");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <p className="text-sm text-gray-500">Administrative access</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-2 text-sm text-gray-500">This matrix comes directly from the backend policy enforced on protected operations.</p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-5" aria-label="Loading role permissions">
              {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded bg-gray-100" />)}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Role</th><th className="px-5 py-3">Enforced capabilities</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {policies.map((policy) => (
                  <tr key={policy.role}>
                    <td className="px-5 py-4 align-top font-semibold text-gray-900">{roleLabel(policy.role)}</td>
                    <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{policy.capabilities.map((capability) => <span key={capability} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{capabilityLabel(capability)}</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Only a Super Admin can create or modify Admin and Super Admin accounts. Those changes require current-password confirmation.</p>
      </div>
    </Layout>
  );
}

const roleLabel = (role: UserRole): string =>
  role === "superadmin" ? "Super Admin" : role[0].toUpperCase() + role.slice(1);

const capabilityLabel = (capability: string): string =>
  capability
    .replace(".", " · ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export default RolePermissionsPage;
