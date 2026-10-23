import { modules } from "../../data/landingData";
import { IconTile, SectionEyebrow } from "./shared";

export default function ModulesSection() {
  return (
    <section
      id="modules"
      className="scroll-mt-20 bg-white py-24"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>
            Connected modules
          </SectionEyebrow>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            One system for the entire clinic
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Each module supports the next step in the student care
            journey, so information stays complete and easy to find.
          </p>
        </div>

        {/* MODULE CARDS */}
        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <article
              key={module.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
            >
              <IconTile tone={module.tone}>
                {module.icon}
              </IconTile>

              <h3 className="mt-5 text-lg font-extrabold text-slate-950">
                {module.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {module.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}