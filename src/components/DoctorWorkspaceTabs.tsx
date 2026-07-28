import { Link } from "react-router-dom";

export type DoctorWorkspaceTab = "appointments" | "records" | "consultation" | "followups";

const tabs: { id: DoctorWorkspaceTab; label: string; to: string }[] = [
  { id: "appointments", label: "Appointments", to: "/dashboard" },
  { id: "records", label: "Patient Records", to: "/dashboard?tab=records" },
  { id: "consultation", label: "New Consultation", to: "/dashboard?tab=consultation" },
  { id: "followups", label: "Follow-Ups", to: "/dashboard?tab=followups" },
];

function DoctorWorkspaceTabs({ active }: { active: DoctorWorkspaceTab }) {
  return (
    <nav aria-label="Doctor workspace" className="overflow-x-auto">
      <div className="flex w-fit min-w-max gap-1 rounded-2xl bg-gray-200/70 p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={active === tab.id ? "page" : undefined}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? "bg-white text-gray-950 shadow-sm"
                : "text-gray-700 hover:bg-white/70 hover:text-gray-950"
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
