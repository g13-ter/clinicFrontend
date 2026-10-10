import type { ClinicRole } from "../../data/landingData";
import { roleWorkspaces } from "../../data/landingData";

import RoleDashboardPreview from "./previews/RoleDashboardPreview";

type RoleShowcaseProps = {
  activeRole: ClinicRole;
  onChange: (role: ClinicRole) => void;
};

export default function RoleShowcase({
  activeRole,
  onChange,
}: RoleShowcaseProps) {
  const activeWorkspace = roleWorkspaces[activeRole];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/80 to-[#f4f8ff] py-28 text-slate-950 [overflow-anchor:none]">
      {/* BACKGROUND DECORATIONS */}
      <div className="landing-curve landing-curve-role-left" />
      <div className="landing-curve landing-curve-role-right" />

      <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl" />

      <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full border border-blue-200/50 bg-cyan-200/20 blur-2xl" />

      <div className="relative z-10 mx-auto grid max-w-[1536px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.64fr_1.36fr] lg:px-12">
        {/* LEFT SIDE */}
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">
            Designed around your team
          </p>

          <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
            A focused workspace for every clinic role.
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Each team member sees the tools they need, while role-based
            access keeps sensitive patient information appropriately protected.
          </p>

          {/* ROLE BUTTONS */}
          <div
            role="tablist"
            aria-label="Clinic roles"
            className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-xl"
          >
            {(Object.keys(roleWorkspaces) as ClinicRole[]).map((role) => {
              const item = roleWorkspaces[role];
              const selected = role === activeRole;

              return (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="role-workspace-panel"
                  onClick={() => onChange(role)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    selected
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "border-slate-200 bg-white/80 text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="[&>svg]:h-4 [&>svg]:w-4">
                    {item.icon}
                  </span>

                  {item.label}
                </button>
              );
            })}
          </div>

          {/* ROLE DESCRIPTION */}
          <div className="mt-7 min-h-[21rem] rounded-2xl border border-blue-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:min-h-[15rem] lg:min-h-[18rem] xl:min-h-[15rem]">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
              {activeWorkspace.title}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activeWorkspace.description}
            </p>

            <p className="mt-4 text-xs font-bold text-slate-900">
              Pages this role can access
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {activeWorkspace.pages.map((page) => (
                <span
                  key={page}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>

          {/* ACCESS NOTES */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Least-privilege access
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Shared clinical history
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              Auditable actions
            </span>
          </div>
        </div>

        {/* RIGHT SIDE - ROLE DASHBOARD PREVIEW */}
        <div
          id="role-workspace-panel"
          role="tabpanel"
          className="relative"
        >
          <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-blue-300/30 via-white/20 to-cyan-200/20 blur-2xl" />

          <div key={activeRole} className="landing-role-preview">
            <RoleDashboardPreview role={activeRole} />
          </div>
        </div>
      </div>
    </section>
  );
}
