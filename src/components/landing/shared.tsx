import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { BrandLogo } from "../BrandLogo";

/* =========================================================
   BRAND MARK
========================================================= */

export function BrandMark() {
  return (
    <BrandLogo className="h-11 w-11 drop-shadow-[0_7px_10px_rgba(37,99,235,0.22)]" />
  );
}

/* =========================================================
   NAVIGATION LINK
========================================================= */

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="relative py-6 text-sm font-semibold text-slate-600 transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-blue-600 after:transition hover:text-blue-700 hover:after:scale-x-100"
    >
      {children}
    </a>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

export function TrustItem({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600">
        ✓
      </span>

      {children}
    </span>
  );
}

/* =========================================================
   ICON TILE
========================================================= */

const iconTones = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

export type IconTone = keyof typeof iconTones;

export function IconTile({
  tone,
  children,
}: {
  tone: IconTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`mx-auto grid h-11 w-11 place-items-center rounded-xl transition group-hover:scale-110 ${iconTones[tone]}`}
    >
      {children}
    </span>
  );
}

/* =========================================================
   SECTION EYEBROW
========================================================= */

export function SectionEyebrow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
      {children}
    </p>
  );
}

/* =========================================================
   CHECK ITEM
========================================================= */

export function CheckItem({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-600">
        ✓
      </span>

      <span>
        {children}
      </span>
    </li>
  );
}

/* =========================================================
   METRIC
========================================================= */

export function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white px-5 py-8 text-center">
      <p className="text-3xl font-black tracking-tight text-blue-600">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   FOOTER LINKS
========================================================= */

export function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-slate-950">
        {title}
      </h3>

      <ul className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <li key={`${label}-${href}`}>
            {href.startsWith("/") ? (
              <Link
                to={href}
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                {label}
              </Link>
            ) : (
              <a
                href={href}
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}