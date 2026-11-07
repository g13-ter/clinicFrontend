import { Link } from "react-router-dom";

import {
  AuditIcon,
  PatientsIcon,
} from "../icons";

import {
  BrandMark,
  FooterLinks,
} from "./shared";
import type { ClinicProfile } from "../../utils/types";

const formatTime = (value: string): string => {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" })
    .format(new Date(2000, 0, 1, hour, minute));
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const formatWeeklySchedule = (clinicProfile: ClinicProfile): string[] => {
  if (!clinicProfile.weeklySchedule?.length) {
    return [`${clinicProfile.operatingDays}, ${formatTime(clinicProfile.clinicOpenTime)}–${formatTime(clinicProfile.clinicCloseTime)}`];
  }
  const entries = [...clinicProfile.weeklySchedule].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day));
  const groups: Array<{ first: string; last: string; openTime: string; closeTime: string }> = [];
  entries.forEach((entry) => {
    const current = groups.at(-1);
    const isNextDay = current && WEEKDAYS.indexOf(entry.day) === WEEKDAYS.indexOf(current.last as (typeof WEEKDAYS)[number]) + 1;
    if (current && isNextDay && current.openTime === entry.openTime && current.closeTime === entry.closeTime) {
      current.last = entry.day;
    } else {
      groups.push({ first: entry.day, last: entry.day, openTime: entry.openTime, closeTime: entry.closeTime });
    }
  });
  return groups.map((group) => {
    const days = group.first === group.last ? group.first : `${group.first}–${group.last}`;
    return `${days}, ${formatTime(group.openTime)}–${formatTime(group.closeTime)}`;
  });
};

export default function ContactSection({ clinicProfile }: { clinicProfile: ClinicProfile | null }) {
  const address = clinicProfile
    ? [clinicProfile.buildingLocation, clinicProfile.floorRoom].filter(Boolean).join(", ")
    : "Clinic information is temporarily unavailable";
  const scheduleLines = clinicProfile
    ? formatWeeklySchedule(clinicProfile)
    : ["Please contact the school office for clinic hours"];
  const schedule = scheduleLines.join("; ");
  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-white py-24"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* =================================================
            CTA BANNER
        ================================================= */}
        <div className="cta-care-banner relative overflow-hidden rounded-[28px] text-white shadow-2xl shadow-blue-900/20">
          <div className="cta-care-mesh absolute inset-0" />

          <div className="cta-care-wave cta-care-wave-top" />

          <div className="cta-care-wave cta-care-wave-bottom" />

          <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#071d4d]/80" />

          <div className="relative z-10 grid min-h-[430px] items-center lg:grid-cols-[1.08fr_0.92fr]">
            {/* LEFT CONTENT */}
            <div className="px-7 pb-8 pt-12 sm:px-12 lg:px-16 lg:py-16">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100">
                School clinic appointments
              </p>

              <h2 className="mt-4 max-w-[560px] text-4xl font-black leading-[1.06] tracking-[-0.035em] sm:text-5xl">
                Need to book a clinic appointment?
              </h2>

              <p className="mt-5 max-w-[520px] text-sm leading-6 text-blue-100 sm:text-base sm:leading-7">
                Contact the school clinic by phone, email, or in person.
                Have your Student ID, preferred schedule, and reason for
                the visit ready.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Sign In

                  <span aria-hidden="true">
                    →
                  </span>
                </Link>

                <a
                  href="#contact-details"
                  className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Contact the Clinic
                </a>
              </div>
            </div>

            {/* =================================================
                NURSE IMAGE AREA
            ================================================= */}
            <div className="relative min-h-[330px] self-stretch lg:min-h-[430px]">
              {/* HALO */}
              <div className="cta-nurse-halo" />

              <div className="absolute bottom-4 left-1/2 h-16 w-72 -translate-x-1/2 rounded-full bg-[#071d4d]/25 blur-xl" />

              <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full border border-white/15" />

              <div className="absolute bottom-[3.5rem] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border border-cyan-200/15" />

              {/* HEARTBEAT LINE */}
              <svg
                viewBox="0 0 520 100"
                className="absolute left-0 right-0 top-[43%] w-full text-cyan-200/20"
                aria-hidden="true"
              >
                <path
                  d="M0 56h92l18-24 20 48 24-72 28 48h64l16-22 22 44 22-22h214"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* DECORATIVE PLUS */}
              <span
                className="absolute right-[10%] top-11 text-5xl font-light text-cyan-100/20"
                aria-hidden="true"
              >
                +
              </span>

              <span
                className="absolute left-[11%] top-[24%] text-7xl font-light text-white/10"
                aria-hidden="true"
              >
                +
              </span>

              {/* FLOATING CARD LEFT */}
              <div className="absolute left-0 top-20 z-30 hidden items-center gap-2.5 rounded-xl border border-white/20 bg-white/15 p-3 shadow-xl backdrop-blur-md xl:flex">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-cyan-100">
                  <PatientsIcon className="h-4 w-4" />
                </span>

                <span>
                  <span className="block text-[8px] text-blue-100">
                    Student Care
                  </span>

                  <b className="mt-0.5 block text-xs">
                    Connected
                  </b>
                </span>
              </div>

              {/* FLOATING CARD RIGHT */}
              <div className="absolute bottom-20 right-5 z-30 hidden items-center gap-2.5 rounded-xl border border-white/20 bg-white/15 p-3 shadow-xl backdrop-blur-md xl:flex">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-emerald-200">
                  <AuditIcon className="h-4 w-4" />
                </span>

                <span>
                  <span className="block text-[8px] text-blue-100">
                    Secure Records
                  </span>

                  <b className="mt-0.5 block text-xs">
                    Protected
                  </b>
                </span>
              </div>

              {/* NURSE IMAGE */}
              <img
                src="/assets/schoolcare-nurse.png"
                alt="School clinic nurse holding a tablet"
                width="1024"
                height="1536"
                loading="lazy"
                className="absolute bottom-0 left-1/2 z-20 h-[350px] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-[0_20px_30px_rgba(7,29,77,0.3)] sm:h-[390px] lg:h-[440px]"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            FOOTER CONTENT
        ================================================= */}
        <div className="mt-16 grid gap-10 border-b border-slate-200 pb-14 md:grid-cols-[1.1fr_0.7fr_0.7fr_1.5fr]">
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-3">
              <BrandMark />

              <span className="text-lg font-extrabold">
                SchoolCare
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
              A connected clinic management system designed around
              safer, faster student care.
            </p>
          </div>

          {/* PLATFORM LINKS */}
          <FooterLinks
            title="Platform"
            links={[
              ["Features", "#features"],
              ["Modules", "#modules"],
              ["How it works", "#about"],
            ]}
          />

          {/* ACCESS LINKS */}
          <FooterLinks
            title="Access"
            links={[
              ["Sign in", "/login"],
            ]}
          />

          {/* =================================================
              CONTACT DETAILS
          ================================================= */}
          <div
            id="contact-details"
            className="scroll-mt-24"
          >
            <h3 className="text-sm font-extrabold text-slate-950">
              {clinicProfile?.clinicName ?? "School Clinic"}
            </h3>

            <address className="mt-4 space-y-2 text-sm not-italic leading-6 text-slate-500">
              <p>{address}</p>

              {scheduleLines.map((line) => <p key={line}>{line}</p>)}

              <p>
                <span className="font-semibold text-slate-700">
                  Phone:
                </span>{" "}

                <a
                  href={clinicProfile ? `tel:${clinicProfile.phoneNumber.replace(/[^+\d]/g, "")}` : undefined}
                  className="font-medium text-blue-600 transition hover:text-blue-700"
                >
                  {clinicProfile?.phoneNumber ?? "Unavailable"}
                </a>
              </p>

              <p>
                <span className="font-semibold text-slate-700">
                  Email:
                </span>{" "}

                <a
                  href={clinicProfile ? `mailto:${clinicProfile.emailAddress}` : undefined}
                  className="break-all font-medium text-blue-600 transition hover:text-blue-700"
                >
                  {clinicProfile?.emailAddress ?? "Unavailable"}
                </a>
              </p>
            </address>

            {/* APPOINTMENT GUIDE */}
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
              <h4 className="font-bold text-slate-950">
                How to book an appointment
              </h4>

              <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-6">
                <li>
                  Call {clinicProfile?.phoneNumber ?? "the clinic"}, email {clinicProfile?.emailAddress ?? "the clinic"}, or visit {address} during {schedule}.
                </li>

                <li>
                  Provide your Student ID, preferred date and time,
                  and reason for the visit.
                </li>

                <li>
                  Make sure your student record has a valid email address.
                </li>
              </ol>

              <p className="mt-3 text-xs leading-5 text-blue-800">
                The system emails you when the appointment is scheduled,
                confirmed by the doctor, rescheduled, cancelled, and when
                a reminder is due.
              </p>
            </div>

            {/* EMERGENCY NOTE */}
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
              <strong>
                Emergency:
              </strong>{" "}
              Proceed directly to {address} or call {clinicProfile?.phoneNumber ?? "the school emergency number"}.
              Do not use appointment messaging for urgent cases.
            </p>
          </div>
        </div>

        {/* =================================================
            COPYRIGHT
        ================================================= */}
        <div className="flex flex-col gap-2 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SchoolCare. School Clinic
            Management System.
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <a
              href="/privacy"
              className="transition hover:text-blue-600"
            >
              Privacy Policy
            </a>

            <span>
              |
            </span>

            <a
              href="/terms"
              className="transition hover:text-blue-600"
            >
              Terms of Service
            </a>

            <span>
              |
            </span>

            <a
              href="/license"
              className="transition hover:text-blue-600"
            >
              Licensing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
