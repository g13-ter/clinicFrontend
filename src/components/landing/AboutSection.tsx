import type { ReactNode } from "react";
import { CheckItem, SectionEyebrow } from "./shared";
import {
  AuditIcon,
  CalendarIcon,
  MedicineIcon,
  PatientsIcon,
  StaffIcon,
  VisitsIcon,
} from "../icons";

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
            Built around the school clinic workflow
          </SectionEyebrow>

          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">
            From patient check-in to follow-up care.
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600">
            SchoolCare connects the work your clinic team already does. Staff
            manage patient records, appointments, and check-in; nurses record
            triage and vital signs; doctors document consultations and next
            steps.
          </p>

          <ul className="mt-7 grid gap-4 text-sm font-semibold text-slate-700">
            <CheckItem>
              Patient profiles cover students, teachers, and school staff
            </CheckItem>

            <CheckItem>
              Appointments and walk-ins move through the clinic queue
            </CheckItem>

            <CheckItem>
              Medication requests connect nurse administration with inventory
            </CheckItem>
          </ul>
        </div>

        <ClinicWorkflowIllustration />
      </div>
    </section>
  );
}

/* =========================================================
   SCHOOL CLINIC WORKFLOW ILLUSTRATION
========================================================= */

function ClinicWorkflowIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-blue-200/60 via-white/30 to-cyan-100/70 blur-2xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_28px_80px_rgba(30,64,175,0.12)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
              SchoolCare clinic workflow
            </p>
            <h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
              From check-in to care plan
            </h3>
          </div>

          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700">
            Role-based workflow
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
              <PatientsIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                Patient record
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Students, teachers, and school staff
              </p>
            </div>
            <span className="ml-auto hidden rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex">
              Medical alerts & history
            </span>
          </div>
        </div>

        <div className="ml-10 h-6 border-l-2 border-dashed border-blue-200" />

        <div className="grid gap-3 sm:grid-cols-3">
          <WorkflowStep
            icon={<CalendarIcon className="h-5 w-5" />}
            tone="cyan"
            role="Staff"
            title="Check-in"
            description="Scheduled appointment or walk-in."
          />

          <WorkflowStep
            icon={<StaffIcon className="h-5 w-5" />}
            tone="blue"
            role="Nurse"
            title="Triage"
            description="Record vital signs and update the queue."
          />

          <WorkflowStep
            icon={<VisitsIcon className="h-5 w-5" />}
            tone="violet"
            role="Doctor"
            title="Consultation"
            description="Document treatment, referral, or follow-up."
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-rose-600 shadow-sm">
            <MedicineIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900">
              Optional medication workflow
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              The nurse completes safety checks; stock updates when medicine is dispensed.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-rose-700">
            Expiry-aware stock
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          <AuditIcon className="h-4 w-4 shrink-0 text-blue-600" />
          Important system actions are recorded in Audit Logs.
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({
  icon,
  tone,
  role,
  title,
  description,
}: {
  icon: ReactNode;
  tone: "cyan" | "blue" | "violet";
  role: string;
  title: string;
  description: string;
}) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
          {icon}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
          {role}
        </span>
      </div>
      <h4 className="mt-4 text-sm font-extrabold text-slate-900">{title}</h4>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}
