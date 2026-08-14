import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { NAV_ITEMS } from "../config/permissions";
import {
  AuditIcon,
  CalendarIcon,
  CloseIcon,
  DashboardIcon,
  MedicineIcon,
  MenuIcon,
  PatientsIcon,
  ReportsIcon,
  StaffIcon,
  VisitsIcon,
} from "../components/icons";

const modules = [
  {
    title: "Patient Records",
    description: "Secure health profiles, medical alerts, consent, immunizations, and complete visit history.",
    icon: <PatientsIcon />,
    tone: "blue",
  },
  {
    title: "Appointments & Queue",
    description: "Schedule clinic visits, check in walk-ins, prioritize emergencies, and manage waiting patients.",
    icon: <CalendarIcon />,
    tone: "cyan",
  },
  {
    title: "Clinical Care",
    description: "Record triage, vitals, consultations, diagnoses, treatments, referrals, and follow-ups.",
    icon: <VisitsIcon />,
    tone: "violet",
  },
  {
    title: "Medicine Inventory",
    description: "Track batches, expiry dates, low stock, dispensing, suppliers, and purchase requests.",
    icon: <MedicineIcon />,
    tone: "rose",
  },
  {
    title: "Reports & Analytics",
    description: "Understand clinic demand, common complaints, waiting times, medicine use, and trends.",
    icon: <ReportsIcon />,
    tone: "amber",
  },
  {
    title: "Users & Audit Logs",
    description: "Control role-based access and keep a traceable record of important system activity.",
    icon: <AuditIcon />,
    tone: "emerald",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Register",
    text: "Create or find the patient's secure clinic record.",
    icon: <PatientsIcon />,
    tone: "blue",
  },
  {
    number: "02",
    title: "Assess",
    text: "Check in, capture vitals, and identify urgent cases.",
    icon: <CalendarIcon />,
    tone: "emerald",
  },
  {
    number: "03",
    title: "Provide Care",
    text: "Document consultation, treatment, medicine, or referral.",
    icon: <VisitsIcon />,
    tone: "violet",
  },
  {
    number: "04",
    title: "Monitor",
    text: "Follow up, review trends, and generate clinic reports.",
    icon: <ReportsIcon />,
    tone: "amber",
  },
] as const;

type ClinicRole = "admin" | "doctor" | "nurse" | "staff";

const navigationFor = (role: ClinicRole): string[] =>
  NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => item.label);

const roleWorkspaces: Record<ClinicRole, {
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  navigation: string[];
  features: string[];
  metrics: [string, string, string][];
  icon: ReactNode;
}> = {
  admin: {
    label: "Admin",
    eyebrow: "Admin Dashboard",
    title: "User management and administrative oversight.",
    description: "Admins view patient records, manage clinic accounts, review medicine purchase requests, audit activity, and maintain system settings.",
    navigation: navigationFor("admin"),
    features: ["Management", "Purchase Requests"],
    metrics: [["14", "Total Patients", "Active patient records"], ["13", "Active Users", "Available doctors, nurses, and staff"]],
    icon: <DashboardIcon />,
  },
  doctor: {
    label: "Doctor",
    eyebrow: "Doctor Dashboard",
    title: "Consultation and physician care.",
    description: "Doctors manage consultations and appointments, review medical history, issue certificates, and view patient-filtered analytics and reports.",
    navigation: navigationFor("doctor"),
    features: ["Appointments", "Patient Visits", "Patient Records", "Consultations", "Analytics", "Reports"],
    metrics: [["0", "Today's Appointments", "Scheduled today"], ["2", "Patients Waiting", "In the clinic queue"], ["0", "Consultations Today", "Started or completed"], ["0", "Emergency Cases", "Recorded today"]],
    icon: <VisitsIcon />,
  },
  nurse: {
    label: "Nurse",
    eyebrow: "Nurse Dashboard",
    title: "Triage, queue, and inventory care.",
    description: "Nurses manage patient records and check-ins, record triage and vitals, view doctor consultations and medicine instructions, maintain inventory, and view analytics and reports.",
    navigation: navigationFor("nurse"),
    features: ["Patients", "Patient Visits", "Appointments", "Inventory", "Analytics", "Reports"],
    metrics: [["0", "Today's Appointments", "Scheduled today"], ["2", "Patients Waiting", "In the clinic queue"], ["0", "Consultations Today", "Started or completed"], ["0", "Emergency Cases", "Recorded today"]],
    icon: <StaffIcon />,
  },
  staff: {
    label: "Staff",
    eyebrow: "Staff Dashboard",
    title: "Patient intake and appointments.",
    description: "Staff maintain patient information, schedule appointments, check in patients, and monitor visit progress without access to Analytics or Reports.",
    navigation: navigationFor("staff"),
    features: ["Patients", "Patient Visits", "Appointments", "Notifications"],
    metrics: [["14", "Total Patients", "Active patient records"], ["0", "Visits Today", "Recorded today"], ["2", "Patients Waiting", "In the clinic queue"], ["0", "Pending Appointments", "Awaiting confirmation"]],
    icon: <CalendarIcon />,
  },
};

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<ClinicRole>("admin");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "SchoolCare | School Clinic Management System";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center px-5 sm:px-8 lg:px-12">
          <a href="#home" onClick={closeMenu} className="flex items-center gap-3" aria-label="SchoolCare home">
            <BrandMark />
            <span className="leading-none">
              <span className="block text-lg font-extrabold tracking-tight">SchoolCare</span>
              <span className="mt-1 block text-[10px] font-medium tracking-wide text-slate-500">Clinic Management System</span>
            </span>
          </a>

          <nav aria-label="Primary navigation" className="mx-auto hidden items-center gap-9 lg:flex">
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#modules">Modules</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <Link to="/login" className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              Login
            </Link>
            <Link to="/login" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto rounded-lg border border-slate-200 p-2.5 text-slate-700 lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {menuOpen && (
          <nav aria-label="Mobile navigation" className="border-t border-slate-100 bg-white px-5 py-5 shadow-xl lg:hidden">
            <div className="mx-auto grid max-w-[1440px] gap-1">
              {["home", "features", "modules", "about", "contact"].map((item) => (
                <a key={item} href={`#${item}`} onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-semibold capitalize text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                  {item}
                </a>
              ))}
              <Link to="/login" className="mt-3 rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">
                Login to SchoolCare
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section id="home" className="landing-hero relative scroll-mt-20 overflow-hidden pt-[72px]">
          <div className="landing-orb -left-32 top-24 h-72 w-72 bg-blue-400/35" />
          <div className="landing-orb left-[34%] top-28 h-40 w-40 bg-cyan-300/20" />
          <div className="landing-orb right-16 top-24 h-72 w-72 bg-indigo-300/20" />
          <div className="landing-curve landing-curve-left" />
          <div className="landing-curve landing-curve-center" />
          <div className="landing-curve landing-curve-right" />
          <div className="landing-circle landing-circle-left" />
          <div className="landing-circle landing-circle-right" />
          <div className="mx-auto grid min-h-[740px] max-w-[1536px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12 lg:py-24">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-2 text-xs font-semibold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Smart. Secure. Built for school clinics.
              </span>
              <h1 className="mt-7 text-5xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[68px]">
                School Clinic
                <span className="mt-1 block text-blue-600">Management System</span>
              </h1>
              <p className="mt-6 text-xl font-medium text-slate-600">Better care. A healthier school community.</p>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-500">
                Bring patient records, appointments, consultations, medicine inventory, referrals, and reports together in one secure clinic workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                  Get Started <span aria-hidden="true">→</span>
                </Link>
                <a href="#about" className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] text-blue-600">▶</span>
                  Explore the System
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-500">
                <TrustItem>Role-based access</TrustItem>
                <TrustItem>Complete audit trail</TrustItem>
                <TrustItem>Built for care teams</TrustItem>
              </div>
            </div>

            <div className="relative z-10 min-w-0 lg:translate-x-3">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-y border-slate-100 bg-white">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-y divide-slate-100 px-5 sm:px-8 md:grid-cols-3 lg:grid-cols-6 lg:divide-y-0 lg:px-12">
            {modules.map((module) => (
              <article key={module.title} className="group px-4 py-9 text-center sm:px-6">
                <IconTile tone={module.tone}>{module.icon}</IconTile>
                <h2 className="mt-4 text-sm font-bold text-slate-900">{module.title}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-500">{module.description.split(".")[0]}.</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="relative scroll-mt-20 overflow-hidden bg-slate-50/70 py-24">
          <div className="landing-curve landing-curve-about" />
          <div className="landing-circle landing-circle-about" />
          <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12">
            <div>
              <SectionEyebrow>All-in-one clinic workspace</SectionEyebrow>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">Everything your care team needs, in one dashboard.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                SchoolCare replaces scattered paper files and disconnected spreadsheets with a dependable workflow for every clinic visit—from front-desk intake to follow-up care.
              </p>
              <ul className="mt-7 grid gap-4 text-sm font-semibold text-slate-700">
                <CheckItem>Live clinic queue and emergency escalation</CheckItem>
                <CheckItem>Medical history that stays with the student</CheckItem>
                <CheckItem>Expiry-aware medicine dispensing and stock alerts</CheckItem>
                <CheckItem>Role-specific workspaces for staff, nurses, doctors, and admins</CheckItem>
              </ul>
            </div>
            <LargeDashboardPreview />
          </div>
        </section>

        <section id="modules" className="scroll-mt-20 bg-white py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Connected modules</SectionEyebrow>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">One system for the entire clinic</h2>
              <p className="mt-4 leading-7 text-slate-600">Each module supports the next step in the student care journey, so information stays complete and easy to find.</p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <article key={module.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5">
                  <IconTile tone={module.tone}>{module.icon}</IconTile>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-950">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <RoleShowcase activeRole={activeRole} onChange={setActiveRole} />

        <section className="bg-[#f4f8ff] py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="text-center">
              <SectionEyebrow>Student care workflow</SectionEyebrow>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">How SchoolCare works</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">A clear, connected process helps the clinic respond faster while keeping every record accurate.</p>
            </div>
            <div className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
              <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-gradient-to-r from-blue-300 via-violet-300 to-amber-300 md:block" />
              {steps.map((step) => (
                <article key={step.number} className="relative text-center">
                  <div className={`step-icon step-${step.tone}`}>{step.icon}</div>
                  <span className={`step-number step-${step.tone}`}>{step.number}</span>
                  <h3 className="mt-4 text-base font-extrabold text-slate-950">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 text-slate-600">{step.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm md:grid-cols-4">
              <Metric value="4" label="Role-based workspaces" />
              <Metric value="24/7" label="Secure record access" />
              <Metric value="FEFO" label="Expiry-aware inventory" />
              <Metric value="100%" label="Traceable key actions" />
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 bg-white py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="cta-care-banner relative overflow-hidden rounded-[28px] text-white shadow-2xl shadow-blue-900/20">
              <div className="cta-care-mesh absolute inset-0" />
              <div className="cta-care-wave cta-care-wave-top" />
              <div className="cta-care-wave cta-care-wave-bottom" />
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#071d4d]/80" />

              <div className="relative z-10 grid min-h-[430px] items-center lg:grid-cols-[1.08fr_0.92fr]">
                <div className="px-7 pb-8 pt-12 sm:px-12 lg:px-16 lg:py-16">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100">School clinic appointments</p>
                  <h2 className="mt-4 max-w-[560px] text-4xl font-black leading-[1.06] tracking-[-0.035em] sm:text-5xl">
                    Need to book a clinic appointment?
                  </h2>
                  <p className="mt-5 max-w-[520px] text-sm leading-6 text-blue-100 sm:text-base sm:leading-7">
                    Contact the school clinic by phone, email, or in person. Have your Student ID, preferred schedule, and reason for the visit ready.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link to="/login" className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50">
                      Staff Login <span aria-hidden="true">→</span>
                    </Link>
                    <a href="#contact-details" className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                      Contact the Clinic
                    </a>
                  </div>
                </div>

                <div className="relative min-h-[330px] self-stretch lg:min-h-[430px]">
                  <div className="cta-nurse-halo" />
                  <div className="absolute bottom-4 left-1/2 h-16 w-72 -translate-x-1/2 rounded-full bg-[#071d4d]/25 blur-xl" />
                  <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full border border-white/15" />
                  <div className="absolute bottom-[3.5rem] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border border-cyan-200/15" />
                  <svg viewBox="0 0 520 100" className="absolute left-0 right-0 top-[43%] w-full text-cyan-200/20" aria-hidden="true">
                    <path d="M0 56h92l18-24 20 48 24-72 28 48h64l16-22 22 44 22-22h214" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="absolute right-[10%] top-11 text-5xl font-light text-cyan-100/20" aria-hidden="true">+</span>
                  <span className="absolute left-[11%] top-[24%] text-7xl font-light text-white/10" aria-hidden="true">+</span>

                  <div className="absolute left-0 top-20 z-30 hidden items-center gap-2.5 rounded-xl border border-white/20 bg-white/15 p-3 shadow-xl backdrop-blur-md xl:flex">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-cyan-100"><PatientsIcon className="h-4 w-4" /></span>
                    <span><span className="block text-[8px] text-blue-100">Student Care</span><b className="mt-0.5 block text-xs">Connected</b></span>
                  </div>
                  <div className="absolute bottom-20 right-5 z-30 hidden items-center gap-2.5 rounded-xl border border-white/20 bg-white/15 p-3 shadow-xl backdrop-blur-md xl:flex">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-emerald-200"><AuditIcon className="h-4 w-4" /></span>
                    <span><span className="block text-[8px] text-blue-100">Secure Records</span><b className="mt-0.5 block text-xs">Protected</b></span>
                  </div>
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

            <div className="mt-16 grid gap-10 border-b border-slate-200 pb-14 md:grid-cols-[1.1fr_0.7fr_0.7fr_1.5fr]">
              <div>
                <div className="flex items-center gap-3"><BrandMark /><span className="text-lg font-extrabold">SchoolCare</span></div>
                <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">A connected clinic management system designed around safer, faster student care.</p>
              </div>
              <FooterLinks title="Platform" links={[["Features", "#features"], ["Modules", "#modules"], ["How it works", "#about"]]} />
              <FooterLinks title="Access" links={[["Staff login", "/login"], ["Clinic dashboard", "/login"], ["System access", "/login"]]} />
              <div id="contact-details" className="scroll-mt-24">
                <h3 className="text-sm font-extrabold text-slate-950">School Health Clinic</h3>
                <address className="mt-4 space-y-2 text-sm not-italic leading-6 text-slate-500">
                  <p>Main Building, Ground Floor, Room 101</p>
                  <p>Monday–Friday, 8:00 AM–5:00 PM</p>
                  <p>
                    <span className="font-semibold text-slate-700">Phone:</span>{" "}
                    <a href="tel:+639123456789" className="font-medium text-blue-600 transition hover:text-blue-700">
                      0912 345 6789
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Email:</span>{" "}
                    <a href="mailto:clinic@yourschool.edu.ph" className="break-all font-medium text-blue-600 transition hover:text-blue-700">
                      clinic@yourschool.edu.ph
                    </a>
                  </p>
                </address>
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                  <h4 className="font-bold text-slate-950">How to book an appointment</h4>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-6">
                    <li>Contact the clinic or visit Room 101 during clinic hours.</li>
                    <li>Provide your Student ID, preferred date and time, and reason for the visit.</li>
                    <li>Make sure your student record has a valid email address.</li>
                  </ol>
                  <p className="mt-3 text-xs leading-5 text-blue-800">
                    The system emails you when the appointment is scheduled, confirmed by the doctor, rescheduled, cancelled, and when a reminder is due.
                  </p>
                </div>
                <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                  <strong>Emergency:</strong> Proceed directly to the clinic or call the school emergency number. Do not use appointment messaging for urgent cases.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} SchoolCare. School Clinic Management System.</p>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <a href="/privacy" className="transition hover:text-blue-600">Privacy Policy</a>
                <span>|</span>
                <a href="/terms" className="transition hover:text-blue-600">Terms of Service</a>
                <span>|</span>
                <a href="/license" className="transition hover:text-blue-600">Licensing</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function BrandMark() {
  return <BrandLogo className="h-11 w-11 drop-shadow-[0_7px_10px_rgba(37,99,235,0.22)]" />;
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="relative py-6 text-sm font-semibold text-slate-600 transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-blue-600 after:transition hover:text-blue-700 hover:after:scale-x-100">{children}</a>;
}

function TrustItem({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600">✓</span>{children}</span>;
}

const iconTones = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

function IconTile({ tone, children }: { tone: keyof typeof iconTones; children: ReactNode }) {
  return <span className={`mx-auto grid h-11 w-11 place-items-center rounded-xl transition group-hover:scale-110 ${iconTones[tone]}`}>{children}</span>;
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">{children}</p>;
}

function CheckItem({ children }: { children: ReactNode }) {
  return <li className="flex items-start gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-600">✓</span>{children}</li>;
}

function RoleShowcase({ activeRole, onChange }: { activeRole: ClinicRole; onChange: (role: ClinicRole) => void }) {
  const activeWorkspace = roleWorkspaces[activeRole];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/80 to-[#f4f8ff] py-28 text-slate-950">
      <div className="landing-curve landing-curve-role-left" />
      <div className="landing-curve landing-curve-role-right" />
      <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full border border-blue-200/50 bg-cyan-200/20 blur-2xl" />

      <div className="relative z-10 mx-auto grid max-w-[1536px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.64fr_1.36fr] lg:px-12">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Designed around your team</p>
          <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">A focused workspace for every clinic role.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Each team member sees the tools they need, while role-based access keeps sensitive patient information appropriately protected.</p>

          <div role="tablist" aria-label="Clinic roles" className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-xl">
            {(Object.keys(roleWorkspaces) as ClinicRole[]).map((role) => {
              const item = roleWorkspaces[role];
              const selected = role === activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="role-workspace-panel"
                  onClick={() => onChange(role)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${selected ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "border-slate-200 bg-white/80 text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"}`}
                >
                  <span className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-7 rounded-2xl border border-blue-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">{activeWorkspace.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{activeWorkspace.description}</p>
            <p className="mt-4 text-xs font-bold text-slate-900">Pages this role can access</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeWorkspace.navigation.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Least-privilege access</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-400" />Shared clinical history</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400" />Auditable actions</span>
          </div>
        </div>

        <div id="role-workspace-panel" role="tabpanel" className="relative">
          <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-blue-300/30 via-white/20 to-cyan-200/20 blur-2xl" />
          <RoleDashboardPreview role={activeRole} />
        </div>
      </div>
    </section>
  );
}

function RoleDashboardPreview({ role }: { role: ClinicRole }) {
  const workspace = roleWorkspaces[role];
  const users: Record<ClinicRole, [string, string]> = {
    admin: ["Admin User", "admin@clinic.com"],
    doctor: ["doc1", "doc1@clinic.com"],
    nurse: ["nurse", "nurse@clinic.com"],
    staff: ["staff", "staff@clinic.com"],
  };
  const [name, email] = users[role];
  const showSearch = role !== "doctor";

  return (
    <article className="relative min-h-[560px] overflow-hidden rounded-[24px] border border-white bg-[#f8fafc] text-slate-950 shadow-[0_28px_70px_rgba(30,64,175,0.16)] ring-1 ring-blue-100/80">
      <div className="flex h-16 items-center border-b border-slate-200 bg-white px-4 sm:px-5">
        <BrandLogo className="mr-3 h-9 w-9" />
        <div className="leading-tight"><p className="text-[11px] font-extrabold sm:text-sm">School Clinic Management</p><p className="mt-1 text-[8px] capitalize text-slate-400 sm:text-[9px]">{role} dashboard</p></div>
        {showSearch && <div className="ml-auto hidden h-8 w-[34%] items-center rounded-md border border-slate-200 px-3 text-[8px] text-slate-400 sm:flex">Search patients...<span className="ml-auto">⌕</span></div>}
        <div className={`${showSearch ? "ml-3" : "ml-auto"} hidden text-right xs:block sm:block`}><p className="text-[9px] font-bold sm:text-[10px]">{name}</p><p className="text-[7px] text-slate-400 sm:text-[8px]">{email}</p></div>
        <span className="ml-3 rounded-lg border border-slate-200 px-3 py-2 text-[8px] font-bold text-slate-600 sm:text-[9px]">Logout</span>
      </div>

      <div className="grid min-h-[496px] sm:grid-cols-[142px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-3 sm:block">
          <p className="px-2 py-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
          {workspace.navigation.map((item, index) => <div key={item} className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[8px] font-semibold ${index === 0 ? "bg-blue-600 text-white" : "text-slate-600"}`}><span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{previewNavigationIcon(item)}</span>{item}</div>)}
        </aside>
        <RoleDashboardBody role={role} />
      </div>
    </article>
  );
}

function RoleDashboardBody({ role }: { role: ClinicRole }) {
  const workspace = roleWorkspaces[role];
  const activeTab = role === "staff" || role === "nurse" ? 1 : 0;
  const metricIcons: ReactNode[] = role === "admin"
    ? [<PatientsIcon />, <StaffIcon />]
    : role === "staff"
      ? [<PatientsIcon />, <VisitsIcon />, <StaffIcon />, <CalendarIcon />]
      : [<CalendarIcon />, <PatientsIcon />, <VisitsIcon />, <VisitsIcon />];
  const metricTones = role === "admin"
    ? (["blue", "purple"] as const)
    : (["blue", role === "staff" ? "green" : "orange", role === "staff" ? "purple" : "green", role === "staff" ? "orange" : "red"] as const);

  return (
    <div className="min-w-0 p-3 sm:p-5">
      <h3 className="text-base font-semibold tracking-tight sm:text-xl">{workspace.eyebrow}</h3>
      <div className={`mt-3 grid grid-cols-2 gap-2 ${role === "admin" ? "" : "xl:grid-cols-4"}`}>
        {workspace.metrics.map(([value, label, caption], index) => <RoleMetricCard key={label} value={value} label={label} caption={caption} icon={metricIcons[index]} tone={metricTones[index]} />)}
      </div>

      <div className="mt-3 flex overflow-hidden rounded-lg border border-slate-200 bg-white text-[8px] font-semibold text-slate-600 sm:text-[9px]">
        {workspace.features.map((feature, index) => (
          <span key={feature} className={`relative whitespace-nowrap px-3 py-2.5 sm:px-4 ${index === activeTab ? "border-b-2 border-blue-600 bg-blue-50 text-blue-600" : ""}`}>
            {feature}
          </span>
        ))}
      </div>

      {role === "admin" ? <RoleAdminManagement /> : role === "doctor" ? <RoleDoctorContent /> : role === "nurse" ? <RoleNurseContent /> : <RoleStaffContent />}
    </div>
  );
}

function RoleMetricCard({ value, label, caption, icon, tone }: { value: string; label: string; caption: string; icon: ReactNode; tone: "blue" | "green" | "purple" | "orange" | "red" }) {
  const tones = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", purple: "bg-violet-50 text-violet-600", orange: "bg-orange-50 text-orange-600", red: "bg-red-50 text-red-600" };
  return <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><p className="truncate text-[7px] font-semibold text-slate-600 sm:text-[8px]">{label}</p><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5 ${tones[tone]}`}>{icon}</span></div><p className="mt-2 text-lg font-medium">{value}</p><p className="mt-1 truncate text-[6px] text-slate-400 sm:text-[7px]">{caption}</p></div>;
}

function RoleNurseContent() {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between"><div><p className="text-[11px] font-bold">Patient Records</p><p className="mt-1 text-[8px] text-slate-400">Find a patient, review the record, or start a clinic visit.</p></div><span className="rounded-md bg-blue-600 px-3 py-2 text-[8px] font-semibold text-white">+ Register Patient</span></div>
      <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[8px] text-blue-800"><b>Clinic workflow:</b> find the patient, select Check In, then record vitals from the queue.</div>
      <div className="mt-3 flex gap-2"><div className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-[8px] text-slate-400">Search name, student ID, or employee ID...</div><span className="rounded-md border border-slate-300 bg-white px-3 py-2 text-[8px]">All Patients</span></div>
      <PreviewTable headers={["ID", "Name", "Patient Type", "School Details", "Actions"]} rows={[["STU-001", "Sample Student", "Student", "BSIT — Yr 2", "View  Check In"], ["EMP-014", "Sample Teacher", "Teacher", "Science Department", "View  Check In"], ["EMP-021", "Sample Employee", "Staff", "Administration", "View  Check In"]]} />
    </div>
  );
}

function RoleDoctorContent() {
  return <><div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><p className="text-[11px] font-bold">Today's Appointments</p><p className="mt-1 text-[8px] text-slate-400">Confirm pending appointments, then start the consultation when the patient is ready.</p></div><p className="py-10 text-center text-[9px] text-slate-400">No appointments scheduled for today.</p></div><div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-[11px] font-bold shadow-sm">Recent Consultations</div></>;
}

function RoleStaffContent() {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between"><div><p className="text-[11px] font-bold">Patient Visits</p><p className="mt-1 text-[8px] text-slate-400">Check in patients and monitor their progress through the clinic queue.</p><p className="mt-2 text-[8px] text-slate-500">2 waiting for nurse triage · 0 ready for doctor</p></div><span className="rounded-md bg-blue-600 px-3 py-2 text-[8px] font-semibold text-white">+ Register Visit</span></div>
      <PreviewTable headers={["Patient", "Type", "Arrived", "Vitals", "Status"]} rows={[["Sample Teacher", "Teacher", "03:32 PM", "Not yet recorded", "In Consultation"], ["Sample Student", "Student", "02:02 PM", "Not yet recorded", "Waiting for Triage"]]} />
    </div>
  );
}

function PreviewTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="mt-3 overflow-hidden rounded-md border border-slate-200"><div className="grid bg-slate-50" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>{headers.map((header) => <span key={header} className="truncate px-3 py-2 text-[7px] font-bold uppercase text-slate-500">{header}</span>)}</div>{rows.map((row, rowIndex) => <div key={rowIndex} className="grid border-t border-slate-100" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>{row.map((cell, index) => <span key={`${rowIndex}-${index}`} className={`truncate px-3 py-2 text-[7px] ${index === 0 || index === row.length - 1 ? "font-semibold text-blue-600" : "text-slate-500"}`}>{cell}</span>)}</div>)}</div>;
}

function RoleAdminManagement() {
  return <div className="mt-4"><div className="flex items-end justify-between"><div><p className="text-[8px] text-slate-400">Patients and clinic accounts</p><p className="mt-1 text-[13px] font-bold">Management</p></div><span className="rounded-md bg-blue-600 px-3 py-2 text-[8px] font-semibold text-white">+ Add Clinic User</span></div><div className="mt-3 grid grid-cols-3 gap-2"><PreviewManagementCard label="Patients" value="14" action="Manage Patients" /><PreviewManagementCard label="Doctors" value="6" action="Manage Doctors" /><PreviewManagementCard label="Nurses and Staff" value="13" action="Manage Staff" /></div></div>;
}

function PreviewManagementCard({ label, value, action }: { label: string; value: string; action: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><p className="truncate text-[9px] font-semibold">{label}</p><p className="mt-4 text-xl font-bold">{value}</p><p className="mt-4 rounded-md bg-slate-950 px-2 py-2 text-center text-[7px] font-semibold text-white">{action}</p></div>;
}

function previewNavigationIcon(item: string) {
  if (item === "Dashboard") return <DashboardIcon />;
  if (item === "Audit Log" || item === "Audit Logs" || item === "System Settings") return <AuditIcon />;
  if (item === "Patients" || item === "Patient Visits") return <PatientsIcon />;
  if (item === "Appointments") return <CalendarIcon />;
  if (item === "Inventory" || item === "Purchase Requests") return <MedicineIcon />;
  if (item === "Reports" || item === "Analytics") return <ReportsIcon />;
  if (item === "User Management" || item === "Roles & Permissions" || item === "Profile") return <StaffIcon />;
  return <VisitsIcon />;
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-[900px] pb-8 xl:pr-28">
      <div className="hero-dashboard-curve hero-dashboard-curve-back" />
      <div className="hero-dashboard-curve hero-dashboard-curve-front" />
      <div className="pointer-events-none absolute -inset-5 right-20 rounded-[36px] bg-gradient-to-br from-blue-100/70 via-white/20 to-indigo-100/60 blur-xl" />
      <div className="hero-dashboard-screen landing-dashboard-frame relative z-10 overflow-hidden border border-white bg-white shadow-[0_32px_90px_rgba(30,64,175,0.2),0_2px_12px_rgba(15,23,42,0.1)] ring-1 ring-blue-100/90">
        <AdminDashboardMock />
      </div>
      <HeroStatusRail />
    </div>
  );
}

function HeroStatusRail() {
  return (
    <div className="relative z-20 mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:absolute xl:right-0 xl:top-8 xl:mt-0 xl:w-[158px] xl:grid-cols-1 xl:gap-3">
      <HeroStatusCard label="Purchase Requests" value="3" note="Pending review" icon={<MedicineIcon />} tone="rose" />
      <HeroStatusCard label="Clinic Users" value="13" note="Active accounts" icon={<StaffIcon />} tone="emerald" />
      <HeroStatusCard label="Patient Records" value="14" note="Active patients" icon={<PatientsIcon />} tone="blue" />
      <HeroStatusCard label="Audit Logging" value="Enabled" note="Activity protected" icon={<AuditIcon />} tone="violet" />
    </div>
  );
}

function HeroStatusCard({ label, value, note, icon, tone }: { label: string; value: string; note: string; icon: ReactNode; tone: "rose" | "emerald" | "blue" | "violet" }) {
  const tones = {
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  };
  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white bg-white/95 p-2.5 shadow-[0_12px_30px_rgba(30,64,175,0.14)] ring-1 ring-slate-100 backdrop-blur-xl xl:p-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 [&>svg]:h-4 [&>svg]:w-4 ${tones[tone]}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-[7px] font-medium text-slate-400 xl:text-[8px]">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-black tracking-tight text-slate-900">{value}</span>
        <span className="block truncate text-[6px] font-medium text-emerald-600 xl:text-[7px]">{note}</span>
      </span>
    </article>
  );
}

function LargeDashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-[6px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20">
      <AdminDashboardMock />
    </div>
  );
}

function AdminDashboardMock() {
  return (
    <div className="bg-[#f7faff] text-[#0f1930]">
      <div className="flex h-12 items-center border-b border-slate-200 bg-white px-3 sm:h-14 sm:px-4">
        <BrandLogo className="h-8 w-8" />
        <div className="ml-2 leading-tight">
          <p className="text-[9px] font-extrabold sm:text-[11px]">School Clinic Management</p>
          <p className="text-[7px] text-slate-400 sm:text-[8px]">Admin Dashboard</p>
        </div>
        <div className="ml-auto hidden h-7 w-[31%] items-center rounded border border-slate-200 px-2 text-[8px] text-slate-400 sm:flex">Search patients...<span className="ml-auto">⌕</span></div>
        <div className="ml-3 text-right"><p className="text-[9px] font-bold sm:text-[10px]">Admin User</p><p className="text-[7px] text-slate-400 sm:text-[8px]">admin@clinic.com</p></div>
        <span className="ml-2 rounded-md border border-slate-200 px-2 py-1 text-[8px]">Logout</span>
      </div>

      <div className="grid min-h-[410px] grid-cols-[82px_1fr] sm:grid-cols-[120px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-2 sm:p-3">
          <p className="px-2 py-2 text-[7px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[8px]">Navigation</p>
          <div className="mt-1 flex items-center gap-2 rounded-md bg-blue-600 px-2 py-2 text-[8px] font-semibold text-white sm:text-[9px]"><DashboardIcon className="h-3.5 w-3.5" />Dashboard</div>
          <div className="mt-1 flex items-center gap-2 px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]"><PatientsIcon className="h-3.5 w-3.5" />Patients</div>
          <div className="mt-1 flex items-center gap-2 px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]"><MedicineIcon className="h-3.5 w-3.5" />Purchase Requests</div>
          <div className="mt-1 flex items-center gap-2 px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]"><StaffIcon className="h-3.5 w-3.5" />User Management</div>
          <div className="mt-1 flex items-center gap-2 px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]"><AuditIcon className="h-3.5 w-3.5" />Audit Logs</div>
          <div className="mt-1 flex items-center gap-2 px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]"><AuditIcon className="h-3.5 w-3.5" />System Settings</div>
        </aside>

        <div className="min-w-0 p-3 sm:p-5">
          <h3 className="text-sm font-bold tracking-tight sm:text-base">Admin Dashboard</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <AdminStat label="Total Patients" value="14" caption="Active patient records" icon={<PatientsIcon />} tone="blue" />
            <AdminStat label="Active Users" value="13" caption="Available doctors, nurses, and staff" icon={<StaffIcon />} tone="violet" />
          </div>
          <div className="mt-3 flex rounded-lg border border-slate-200 bg-white text-[8px] font-semibold text-slate-600 sm:text-[9px]">
            <span className="border-b-2 border-blue-600 bg-blue-50 px-3 py-2 text-blue-600">Management</span><span className="px-3 py-2">Purchase Requests</span>
          </div>
          <div className="mt-4 flex items-end justify-between"><div><p className="text-[7px] text-slate-400">Patients and clinic accounts</p><p className="mt-1 text-[12px] font-bold">Management</p></div><span className="rounded-md bg-blue-600 px-3 py-2 text-[7px] font-semibold text-white">+ Add Clinic User</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <PreviewManagementCard label="Patients" value="14" action="Manage Patients" />
            <PreviewManagementCard label="Doctors" value="6" action="Manage Doctors" />
            <PreviewManagementCard label="Nurses and Staff" value="13" action="Manage Staff" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStat({ label, value, caption, icon, tone }: { label: string; value: string; caption: string; icon: ReactNode; tone: "blue" | "emerald" | "violet" | "orange" }) {
  const tones = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600", orange: "bg-orange-50 text-orange-600" };
  return <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-2 shadow-[0_3px_10px_rgba(15,23,42,0.07)] sm:p-3"><div className="flex items-start justify-between gap-1"><p className="truncate text-[7px] font-semibold text-slate-700 sm:text-[8px]">{label}</p><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5 ${tones[tone]}`}>{icon}</span></div><p className="mt-2 text-base font-semibold sm:text-lg">{value}</p><p className="truncate text-[6px] text-slate-500 sm:text-[7px]">{caption}</p></div>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="bg-white px-5 py-8 text-center"><p className="text-3xl font-black tracking-tight text-blue-600">{value}</p><p className="mt-2 text-xs font-semibold text-slate-500">{label}</p></div>;
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
      <ul className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("/") ? (
              <Link to={href} className="text-sm text-slate-500 transition hover:text-blue-600">
                {label}
              </Link>
            ) : (
              <a href={href} className="text-sm text-slate-500 transition hover:text-blue-600">
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LandingPage;
