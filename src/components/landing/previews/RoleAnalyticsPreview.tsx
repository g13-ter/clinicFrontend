const complaints = [
  {
    label: "Headache",
    value: "33%",
    tone: "bg-blue-600",
  },
  {
    label: "Fever",
    value: "20%",
    tone: "bg-teal-500",
  },
  {
    label: "Test",
    value: "20%",
    tone: "bg-amber-500",
  },
  {
    label: "Headache And Mild Fever",
    value: "13%",
    tone: "bg-orange-500",
  },
  {
    label: "Nosebleed",
    value: "13%",
    tone: "bg-violet-500",
  },
];

const monthlyVisits = [
  {
    month: "Mar",
    value: 2,
  },
  {
    month: "Apr",
    value: 2,
  },
  {
    month: "May",
    value: 2,
  },
  {
    month: "Jun",
    value: 12,
  },
  {
    month: "Jul",
    value: 82,
  },
  {
    month: "Aug",
    value: 57,
  },
];

const bmiCategories = [
  { label: "Underweight", value: "13%", tone: "bg-sky-500" },
  { label: "Normal weight", value: "53%", tone: "bg-emerald-500" },
  { label: "Overweight", value: "20%", tone: "bg-amber-500" },
  { label: "Obese", value: "14%", tone: "bg-orange-500" },
];

export default function RoleAnalyticsPreview() {
  return (
    <div className="mt-5">
      {/* HEADER */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold">
            Clinic Analytics
          </p>

          <p className="mt-0.5 text-[7px] text-slate-400">
            Trends from recorded clinic activity
          </p>
        </div>

        {/* PATIENT TYPE FILTER */}
        <div className="hidden w-40 sm:block">
          <p className="mb-1 text-right text-[6px] text-slate-500">
            Patient type
          </p>

          <div className="rounded-md border border-slate-300 bg-white px-3 py-2 text-[7px] text-slate-600">
            All patients

            <span className="float-right">
              ⌄
            </span>
          </div>
        </div>
      </div>

      {/* GRAPHS */}
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ComplaintsChart />

        <BmiAnalyticsChart />

        <MonthlyVisitsChart />
      </div>
    </div>
  );
}

/* =========================================================
   BMI ANALYTICS
========================================================= */

function BmiAnalyticsChart() {
  return (
    <div className="min-h-[170px] rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-[9px] font-medium">Adult BMI Categories</p>
      <p className="mt-1 text-[6px] text-slate-400">Recorded BMI screening results, age 18+</p>

      <div className="mt-3 flex items-center justify-center gap-4 sm:justify-start">
        <div
          className="relative h-[112px] w-[112px] shrink-0 rounded-full"
          style={{ background: "conic-gradient(#0ea5e9 0 13%, #10b981 13% 66%, #f59e0b 66% 86%, #f97316 86% 100%)" }}
        >
          <div className="absolute inset-[26px] grid place-items-center rounded-full bg-white text-center">
            <span>
              <b className="block text-[15px] leading-none">15</b>
              <span className="mt-1 block whitespace-nowrap text-[5px] text-slate-400">recorded BMIs</span>
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {bmiCategories.map((category) => (
            <div key={category.label} className="grid grid-cols-[7px_1fr_auto] items-center gap-2 text-[6px] sm:text-[7px]">
              <span className={`h-1.5 w-1.5 rounded-full ${category.tone}`} />
              <span className="truncate text-slate-600">{category.label}</span>
              <span className="text-slate-700">{category.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MOST COMMON COMPLAINTS
========================================================= */

function ComplaintsChart() {
  return (
    <div className="min-h-[170px] rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-[9px] font-medium">
        Most Common Complaints
      </p>

      <p className="mt-1 text-[6px] text-slate-400">
        Based on filtered clinic visits
      </p>

      <div className="mt-3 flex items-center justify-center gap-5 sm:justify-start">
        {/* DONUT GRAPH */}
        <div
          className="relative h-[112px] w-[112px] shrink-0 rounded-full"
          style={{
            background:
              "conic-gradient(" +
              "#2563eb 0 33%, " +
              "#14b8a6 33% 53%, " +
              "#f59e0b 53% 73%, " +
              "#f97316 73% 86%, " +
              "#8b5cf6 86% 100%" +
              ")",
          }}
        >
          <div className="absolute inset-[26px] grid place-items-center rounded-full bg-white text-center">
            <span>
              <b className="block text-[15px] leading-none">
                15
              </b>

              <span className="mt-1 block whitespace-nowrap text-[5px] text-slate-400">
                recorded visits
              </span>
            </span>
          </div>
        </div>

        {/* LEGEND */}
        <div className="min-w-0 flex-1 space-y-2">
          {complaints.map((complaint) => (
            <div
              key={complaint.label}
              className="grid grid-cols-[7px_1fr_auto] items-center gap-2 text-[6px] sm:text-[7px]"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${complaint.tone}`}
              />

              <span className="truncate text-slate-600">
                {complaint.label}
              </span>

              <span className="text-slate-700">
                {complaint.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MONTHLY VISITS BAR GRAPH
========================================================= */

function MonthlyVisitsChart() {
  return (
    <div className="min-h-[170px] rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-[9px] font-medium">
        Monthly Clinic Visits
      </p>

      <p className="mt-1 text-[6px] text-slate-400">
        Last six months, filtered by patient type
      </p>

      {/* BARS */}
      <div className="mt-4 flex h-[116px] items-end gap-2 border-b border-slate-200 px-2">
        {monthlyVisits.map((item) => (
          <div
            key={item.month}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <div
              className="w-full rounded-t-[3px] bg-blue-500"
              style={{
                height: `${Math.max(
                  item.value,
                  2,
                )}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* MONTH LABELS */}
      <div className="mt-1 grid grid-cols-6 text-center text-[5px] text-slate-500">
        {monthlyVisits.map((item) => (
          <span key={item.month}>
            {item.month}
          </span>
        ))}
      </div>
    </div>
  );
}
