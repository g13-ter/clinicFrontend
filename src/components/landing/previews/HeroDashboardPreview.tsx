import type { ReactNode } from "react";

import {
  AuditIcon,
  MedicineIcon,
  PatientsIcon,
  StaffIcon,
} from "../../icons";

import AdminDashboardMock from "./AdminDashboardMock";

/* =========================================================
   HERO DASHBOARD PREVIEW
========================================================= */

export default function HeroDashboardPreview() {
  return (
    <div className="relative mx-auto max-w-[900px] pb-8 xl:pr-28">
      {/* BACKGROUND CURVES */}
      <div className="hero-dashboard-curve hero-dashboard-curve-back" />
      <div className="hero-dashboard-curve hero-dashboard-curve-front" />

      {/* SOFT GLOW */}
      <div className="pointer-events-none absolute -inset-5 right-20 rounded-[36px] bg-gradient-to-br from-blue-100/70 via-white/20 to-indigo-100/60 blur-xl" />

      {/* ADMIN DASHBOARD */}
      <div className="hero-dashboard-screen landing-dashboard-frame relative z-10 overflow-hidden border border-white bg-white shadow-[0_32px_90px_rgba(30,64,175,0.2),0_2px_12px_rgba(15,23,42,0.1)] ring-1 ring-blue-100/90">
        <AdminDashboardMock />
      </div>

      {/* FLOATING CARDS */}
      <HeroStatusRail />
    </div>
  );
}

/* =========================================================
   FLOATING STATUS CARDS
========================================================= */

function HeroStatusRail() {
  return (
    <div className="relative z-20 mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:absolute xl:right-0 xl:top-8 xl:mt-0 xl:w-[158px] xl:grid-cols-1 xl:gap-3">
      <HeroStatusCard
        label="Purchase Requests"
        value="3"
        note="Pending review"
        icon={<MedicineIcon />}
        tone="rose"
      />

      <HeroStatusCard
        label="Clinic Users"
        value="15"
        note="Active accounts"
        icon={<StaffIcon />}
        tone="emerald"
      />

      <HeroStatusCard
        label="Patient Records"
        value="18"
        note="Active patients"
        icon={<PatientsIcon />}
        tone="blue"
      />

      <HeroStatusCard
        label="Audit Logging"
        value="Enabled"
        note="Activity protected"
        icon={<AuditIcon />}
        tone="violet"
      />
    </div>
  );
}

/* =========================================================
   STATUS CARD
========================================================= */

type StatusTone =
  | "rose"
  | "emerald"
  | "blue"
  | "violet";

function HeroStatusCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone: StatusTone;
}) {
  const tones: Record<StatusTone, string> = {
    rose:
      "bg-rose-50 text-rose-600 ring-rose-100",

    emerald:
      "bg-emerald-50 text-emerald-600 ring-emerald-100",

    blue:
      "bg-blue-50 text-blue-600 ring-blue-100",

    violet:
      "bg-violet-50 text-violet-600 ring-violet-100",
  };

  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white bg-white/95 p-2.5 shadow-[0_12px_30px_rgba(30,64,175,0.14)] ring-1 ring-slate-100 backdrop-blur-xl xl:p-3">
      {/* ICON */}
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 [&>svg]:h-4 [&>svg]:w-4 ${tones[tone]}`}
      >
        {icon}
      </span>

      {/* CONTENT */}
      <span className="min-w-0">
        <span className="block truncate text-[7px] font-medium text-slate-400 xl:text-[8px]">
          {label}
        </span>

        <span className="mt-0.5 block truncate text-sm font-black tracking-tight text-slate-900">
          {value}
        </span>

        <span className="block truncate text-[6px] font-medium text-emerald-600 xl:text-[7px]">
          {note}
        </span>
      </span>
    </article>
  );
}