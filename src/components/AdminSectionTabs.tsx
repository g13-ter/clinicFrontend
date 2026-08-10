import { Link } from "react-router-dom";

export type AdminSection = "management" | "purchase-requests";

const sections: { id: AdminSection; label: string; to: string }[] = [
  { id: "management", label: "Management", to: "/dashboard?section=management" },
  { id: "purchase-requests", label: "Purchase Requests", to: "/dashboard?section=purchase-requests" },
];

function AdminSectionTabs({ active }: { active: AdminSection }) {
  return (
    <nav aria-label="Admin sections" className="overflow-x-auto">
      <div className="flex min-w-max rounded-xl border border-slate-200 bg-white px-2">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={section.to}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              active === section.id
                ? "border-blue-600 bg-blue-50/70 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
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
