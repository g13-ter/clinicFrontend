import { Link } from "react-router-dom";

import { TrustItem } from "./shared";
import HeroDashboardPreview from "./previews/HeroDashboardPreview";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="landing-hero relative scroll-mt-20 overflow-hidden pt-[72px]"
    >
      {/* BACKGROUND DECORATIONS */}
      <div className="landing-orb -left-32 top-24 h-72 w-72 bg-blue-400/35" />
      <div className="landing-orb left-[34%] top-28 h-40 w-40 bg-cyan-300/20" />
      <div className="landing-orb right-16 top-24 h-72 w-72 bg-indigo-300/20" />

      <div className="landing-curve landing-curve-left" />
      <div className="landing-curve landing-curve-center" />
      <div className="landing-curve landing-curve-right" />

      <div className="landing-circle landing-circle-left" />
      <div className="landing-circle landing-circle-right" />

      {/* MAIN HERO CONTENT */}
      <div className="mx-auto grid min-h-[740px] max-w-[1536px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12 lg:py-24">
        {/* LEFT CONTENT */}
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-2 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Smart. Secure. Built for school clinics.
          </span>

          <h1 className="mt-7 text-5xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[68px]">
            School Clinic

            <span className="mt-1 block text-blue-600">
              Management System
            </span>
          </h1>

          <p className="mt-6 text-xl font-medium text-slate-600">
            Better care. A healthier school community.
          </p>

          <p className="mt-4 max-w-lg text-base leading-7 text-slate-500">
            Bring patient records, appointments, consultations,
            medicine inventory, referrals, and reports together
            in one secure clinic workspace.
          </p>

          {/* ACTION BUTTONS */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Sign In to Portal
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#about"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] text-blue-600">
                ▶
              </span>

              Explore the System
            </a>
          </div>

          {/* TRUST ITEMS */}
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-500">
            <TrustItem>
              Role-based access
            </TrustItem>

            <TrustItem>
              Complete audit trail
            </TrustItem>

            <TrustItem>
              Built for care teams
            </TrustItem>
          </div>
        </div>

        {/* RIGHT ADMIN DASHBOARD PREVIEW */}
        <div className="relative z-10 min-w-0 lg:translate-x-3">
          <HeroDashboardPreview />
        </div>
      </div>
    </section>
  );
}
