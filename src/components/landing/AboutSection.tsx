import { CheckItem, SectionEyebrow } from "./shared";
import { AuditIcon, CalendarIcon, PatientsIcon, VisitsIcon } from "../icons";

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
            Care that stays connected
          </SectionEyebrow>

          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">
            A clearer story of care for every student.
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600">
            SchoolCare replaces scattered paper files and disconnected
            spreadsheets with a dependable workflow for every clinic
            visit—from front-desk intake to follow-up care.
          </p>

          <ul className="mt-7 grid gap-4 text-sm font-semibold text-slate-700">
            <CheckItem>
              Relevant health history stays with the student record
            </CheckItem>

            <CheckItem>
              Visit notes and care plans build on previous visits
            </CheckItem>

            <CheckItem>
              Access follows each clinic role, with key changes traceable
            </CheckItem>
          </ul>
        </div>

        <ConnectedRecordIllustration />
      </div>
    </section>
  );
}

/* =========================================================
   CONNECTED STUDENT RECORD ILLUSTRATION
========================================================= */

function ConnectedRecordIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-blue-200/60 via-white/30 to-cyan-100/70 blur-2xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_28px_80px_rgba(30,64,175,0.12)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
              SchoolCare record
            </p>
            <h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
              One connected care story
            </h3>
          </div>

          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700">
            Sample view
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
              <PatientsIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                Student profile
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Essential details and health alerts
              </p>
            </div>
            <span className="ml-auto hidden rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex">
              Role protected
            </span>
          </div>
        </div>

        <div className="ml-10 h-6 border-l-2 border-dashed border-blue-200" />

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <VisitsIcon className="h-5 w-5" />
            </span>
            <h4 className="mt-4 text-sm font-extrabold text-slate-900">
              Visit history
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Triage, consultation, and treatment notes stay together.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <h4 className="mt-4 text-sm font-extrabold text-slate-900">
              Follow-up plan
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Appointments and next steps remain linked to the record.
            </p>
          </article>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          <AuditIcon className="h-4 w-4 shrink-0 text-blue-600" />
          Key updates can be reviewed in the audit history.
        </div>
      </div>
    </div>
  );
}
