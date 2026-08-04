import { Link } from "react-router-dom";

type TemporaryInfoPageProps = {
  title: string;
  description: string;
  details: string[];
};

function TemporaryInfoPage({ title, description, details }: TemporaryInfoPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-800 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Temporary page</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>

        <div className="mt-8 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">What this page contains</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {details.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            Back to home
          </Link>
          <span className="text-sm text-slate-500">This content is temporary and can be replaced later.</span>
        </div>
      </div>
    </div>
  );
}

export default TemporaryInfoPage;
