import { Link } from "react-router-dom";

type AdminSection = "analytics" | "inventory" | "management" | "reports";

const sections: { id: AdminSection; label: string; to: string }[] = [
  { id: "analytics", label: "Analytics", to: "/dashboard" },
  { id: "inventory", label: "Inventory", to: "/dashboard?section=inventory" },
  { id: "management", label: "Management", to: "/dashboard?section=management" },
  { id: "reports", label: "Reports", to: "/dashboard?section=reports" },
];

function AdminSectionTabs({ active }: { active: AdminSection }) {
  return (
    <nav aria-label="Admin sections" className="overflow-x-auto">
      <div className="flex w-fit min-w-max gap-1 rounded-xl bg-gray-200/70 p-1">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={section.to}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active === section.id
                ? "bg-white text-gray-950 shadow-sm"
                : "text-gray-700 hover:bg-white/70 hover:text-gray-950"
            }`}
          >
            {section.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default AdminSectionTabs;
