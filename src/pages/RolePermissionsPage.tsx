import Layout from "../layout/Layout";

const rolePolicies = [
  ["Super Admin", "All account management, Admin management, roles, audit logs, and system settings"],
  ["Admin", "Clinic user management, purchase-request review, audit logs, and permitted settings"],
  ["Doctor", "Appointments, physician consultations, medical records, follow-ups, and reports"],
  ["Nurse", "Triage, vitals, student records, inventory, purchase requests, and reports"],
  ["Staff", "Basic student records, appointment scheduling, check-in, and queue monitoring"],
] as const;

function RolePermissionsPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <p className="text-sm text-gray-500">Administrative access</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-2 text-sm text-gray-500">Assign roles from User Management. These permissions are enforced by the backend on every request.</p>
        </div>
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Role</th><th className="px-5 py-3">System Access</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rolePolicies.map(([role, access]) => <tr key={role}><td className="px-5 py-4 font-semibold text-gray-900">{role}</td><td className="px-5 py-4 leading-6 text-gray-600">{access}</td></tr>)}
            </tbody>
          </table>
        </section>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Only a Super Admin can create or modify Admin and Super Admin accounts.</p>
      </div>
    </Layout>
  );
}

export default RolePermissionsPage;
