import { modules } from "../../data/landingData";
import { IconTile } from "./shared";

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-y border-slate-100 bg-white"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-y divide-slate-100 px-5 sm:px-8 md:grid-cols-3 lg:grid-cols-6 lg:divide-y-0 lg:px-12">
        {modules.map((module) => (
          <article
            key={module.title}
            className="group px-4 py-9 text-center sm:px-6"
          >
            <IconTile tone={module.tone}>
              {module.icon}
            </IconTile>

            <h2 className="mt-4 text-sm font-bold text-slate-900">
              {module.title}
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {module.description.split(".")[0]}.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}