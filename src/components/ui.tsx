import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">{text}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = {
    unassigned: "bg-orange-50 text-orange-700",
    pending: "bg-amber-50 text-amber-700",
    needs_reassignment: "bg-red-50 text-red-700",
    confirmed: "bg-blue-50 text-blue-700",
    checked_in: "bg-purple-50 text-purple-700",
    cancelled: "bg-red-50 text-red-700",
    completed: "bg-emerald-50 text-emerald-700",
  }[status] ?? "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tone}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
