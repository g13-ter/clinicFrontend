import { Link } from "react-router-dom";

export type DoctorWorkspaceTab =
  | "appointments"
  | "visits"
  | "records"
  | "consultation"
  | "followups";

const tabs: { id: DoctorWorkspaceTab; label: string; to: string }[] = [
  { id: "appointments", label: "Appointments", to: "/dashboard" },
  { id: "visits", label: "Student Visits", to: "/dashboard?tab=visits" },
  { id: "records", label: "Patient Records", to: "/dashboard?tab=records" },
  { id: "consultation", label: "New Consultation", to: "/dashboard?tab=consultation" },
  { id: "followups", label: "Follow-Ups", to: "/dashboard?tab=followups" },
];

function DoctorWorkspaceTabs({ active }: { active: DoctorWorkspaceTab }) {
  return (
    <nav aria-label="Doctor workspace" className="overflow-x-auto">
      <div className="flex min-w-max rounded-xl border border-slate-200 bg-white px-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={active === tab.id ? "page" : undefined}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-blue-600 bg-blue-50/70 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default DoctorWorkspaceTabs;
