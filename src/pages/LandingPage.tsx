import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Unified patient care",
    description: "Bring appointments, visits, and medical history into one calm workspace.",
  },
  {
    title: "Smarter operations",
    description: "Track medicines, purchase requests, and team approvals with confidence.",
  },
  {
    title: "Clear reporting",
    description: "Monitor performance and maintain audit-ready visibility at every step.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-[0.2em] text-sky-300 uppercase">SCMS</p>
            <p className="text-sm text-slate-400">Clinic management platform</p>
          </div>
          <Link
            to="/login"
            className="rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/20"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-200">
              Trusted by modern care teams
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Care that feels calm, clear, and connected.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Support every patient touchpoint with a polished experience for scheduling, clinical operations,
              and leadership visibility.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
              >
                Explore the platform
              </Link>
              <a
                href="#features"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                See what's included
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Today's overview</p>
                  <p className="mt-1 text-2xl font-semibold text-white">24 active visits</p>
                </div>
                <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
                  +12% this week
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ["Appointments", "8 scheduled"],
                  ["Patients in queue", "6 waiting"],
                  ["Pending requests", "3 approvals"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-slate-800/80 px-4 py-3">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;