import { CheckItem, SectionEyebrow } from "./shared";
import AdminDashboardMock from "./previews/AdminDashboardMock";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-20 overflow-hidden bg-slate-50/70 py-24"
    >
      {/* BACKGROUND DECORATIONS */}
      <div className="landing-curve landing-curve-about" />
      <div className="landing-circle landing-circle-about" />

      <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12">
        {/* LEFT CONTENT */}
        <div>
          <SectionEyebrow>
            All-in-one clinic workspace
          </SectionEyebrow>

          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">
            Everything your care team needs, in one dashboard.
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600">
            SchoolCare replaces scattered paper files and disconnected
            spreadsheets with a dependable workflow for every clinic
            visit—from front-desk intake to follow-up care.
          </p>

          <ul className="mt-7 grid gap-4 text-sm font-semibold text-slate-700">
            <CheckItem>
              Live clinic queue and emergency escalation
            </CheckItem>

            <CheckItem>
              Medical history that stays with the student
            </CheckItem>

            <CheckItem>
              Expiry-aware medicine dispensing and stock alerts
            </CheckItem>

            <CheckItem>
              Role-specific workspaces for staff, nurses, doctors, and admins
            </CheckItem>
          </ul>
        </div>

        {/* ADMIN DASHBOARD PREVIEW */}
        <LargeDashboardPreview />
      </div>
    </section>
  );
}

/* =========================================================
   LARGE DASHBOARD PREVIEW
========================================================= */

function LargeDashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-[6px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20">
      <AdminDashboardMock />
    </div>
  );
}