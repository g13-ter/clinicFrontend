import { steps } from "../../data/landingData";
import { Metric, SectionEyebrow } from "./shared";

export default function WorkflowSection() {
  return (
    <section className="bg-[#f4f8ff] py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* SECTION HEADER */}
        <div className="text-center">
          <SectionEyebrow>
            Student care workflow
          </SectionEyebrow>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            How SchoolCare works
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            A clear, connected process helps the clinic respond faster
            while keeping every record accurate.
          </p>
        </div>

        {/* WORKFLOW STEPS */}
        <div className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          {/* CONNECTING LINE */}
          <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-gradient-to-r from-blue-300 via-violet-300 to-amber-300 md:block" />

          {steps.map((step) => (
            <article
              key={step.number}
              className="relative text-center"
            >
              {/* ICON */}
              <div
                className={`step-icon step-${step.tone}`}
              >
                {step.icon}
              </div>

              {/* NUMBER */}
              <span
                className={`step-number step-${step.tone}`}
              >
                {step.number}
              </span>

              {/* TITLE */}
              <h3 className="mt-4 text-base font-extrabold text-slate-950">
                {step.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 text-slate-600">
                {step.text}
              </p>
            </article>
          ))}
        </div>

        {/* SYSTEM METRICS */}
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm md:grid-cols-4">
          <Metric
            value="4"
            label="Role-based workspaces"
          />

          <Metric
            value="24/7"
            label="Secure record access"
          />

          <Metric
            value="FEFO"
            label="Expiry-aware inventory"
          />

          <Metric
            value="100%"
            label="Traceable key actions"
          />
        </div>
      </div>
    </section>
  );
}