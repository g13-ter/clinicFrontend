import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
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
    title: "Student Records",
    description: "Secure health profiles, medical alerts, consent, immunizations, and complete visit history.",
    icon: <PatientsIcon />,
    tone: "blue",
  },
  {
    title: "Appointments & Queue",
    description: "Schedule clinic visits, check in walk-ins, prioritize emergencies, and manage waiting students.",
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
    text: "Create or find the student's secure clinic record.",
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
    title: "Administration, analytics, and oversight.",
    description: "Admins use Analytics, Inventory, Management, and Reports from the dashboard, with separate access to the system Audit Log.",
    navigation: ["Dashboard", "Audit Log"],
    features: ["Analytics", "Inventory", "Management", "Reports"],
    metrics: [["9", "Total Students", "Active student records"], ["0", "Clinic Visits Today", "Recorded today"], ["3", "Active Doctor / Nurse", "Currently available"], ["42", "Pending Appointments", "Awaiting confirmation"]],
    icon: <DashboardIcon />,
  },
  doctor: {
    label: "Doctor",
    eyebrow: "Doctor Dashboard",
    title: "Consultation and physician care.",
    description: "Doctors manage the clinic queue, save physician consultations, update medical history, generate consultation certificates, and review medicine inventory.",
    navigation: ["Dashboard", "Clinical Care", "Students", "Student Queue", "Appointments", "Inventory"],
    features: ["Appointments", "Student Visits", "Patient Records", "New Consultation", "Follow-Ups"],
    metrics: [["0", "Today's Appointments", "Scheduled today"], ["2", "Students Waiting", "In the clinic queue"], ["0", "Consultations Today", "Started or completed"], ["0", "Emergency Cases", "Recorded today"]],
    icon: <VisitsIcon />,
  },
  nurse: {
    label: "Nurse",
    eyebrow: "Nurse Dashboard",
    title: "Triage, queue, and inventory care.",
    description: "Nurses edit student records, check in students, manage the queue, record vitals, maintain medicines, submit purchase requests, and view reports.",
    navigation: ["Dashboard", "Clinical Care", "Students", "Student Queue", "Appointments", "Inventory", "Purchase Requests", "Reports"],
    features: ["Students", "Student Visits", "Appointments", "Inventory", "Notifications"],
    metrics: [["0", "Today's Appointments", "Scheduled today"], ["2", "Students Waiting", "In the clinic queue"], ["0", "Consultations Today", "Started or completed"], ["0", "Emergency Cases", "Recorded today"]],
    icon: <StaffIcon />,
  },
  staff: {
    label: "Staff",
    eyebrow: "Staff Dashboard",
    title: "Student intake and appointments.",
    description: "Staff edit student records, manage appointments, select doctors, check in students, and work with the student queue using basic student data.",
    navigation: ["Dashboard", "Students", "Student Queue", "Appointments"],
    features: ["Students", "Student Visits", "Appointments", "Notifications"],
    metrics: [["9", "Total Students", "Active student records"], ["0", "Visits Today", "Recorded today"], ["2", "Students Waiting", "In the clinic queue"], ["42", "Pending Appointments", "Awaiting confirmation"]],
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
              <p className="mt-6 text-xl font-medium text-slate-600">Better care. Healthier students.</p>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-500">
                Bring student records, appointments, consultations, medicine inventory, referrals, and reports together in one secure clinic workspace.
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
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100">Ready to improve student care?</p>
                  <h2 className="mt-4 max-w-[560px] text-4xl font-black leading-[1.06] tracking-[-0.035em] sm:text-5xl">
                    Ready to modernize your school clinic?
                  </h2>
                  <p className="mt-5 max-w-[520px] text-sm leading-6 text-blue-100 sm:text-base sm:leading-7">
                    Give your clinic team one secure place to coordinate care, protect student records, and make informed decisions.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link to="/login" className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50">
                      Get Started Now <span aria-hidden="true">→</span>
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

            <div className="mt-16 grid gap-10 border-b border-slate-200 pb-14 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
              <div>
                <div className="flex items-center gap-3"><BrandMark /><span className="text-lg font-extrabold">SchoolCare</span></div>
                <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">A connected clinic management system designed around safer, faster student care.</p>
              </div>
              <FooterLinks title="Platform" links={[["Features", "#features"], ["Modules", "#modules"], ["How it works", "#about"]]} />
              <FooterLinks title="Access" links={[["Staff login", "/login"], ["Clinic dashboard", "/login"], ["System access", "/login"]]} />
              <div id="contact-details">
                <h3 className="text-sm font-extrabold text-slate-950">Contact</h3>
                <p className="mt-4 text-sm leading-6 text-slate-500">For account access or system assistance, contact your school clinic administrator.</p>
                <a
                  href="https://benedictocollegeclinic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-bold text-blue-600 transition hover:text-blue-700"
                >
                  School Clinic Office
                </a>
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
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Each team member sees the tools they need, while role-based access keeps sensitive student information appropriately protected.</p>

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
        {showSearch && <div className="ml-auto hidden h-8 w-[34%] items-center rounded-md border border-slate-200 px-3 text-[8px] text-slate-400 sm:flex">Search students...<span className="ml-auto">⌕</span></div>}
        <div className={`${showSearch ? "ml-3" : "ml-auto"} hidden text-right xs:block sm:block`}><p className="text-[9px] font-bold sm:text-[10px]">{name}</p><p className="text-[7px] text-slate-400 sm:text-[8px]">{email}</p></div>
        <span className="ml-3 rounded-lg border border-slate-200 px-3 py-2 text-[8px] font-bold text-slate-600 sm:text-[9px]">Logout</span>
      </div>

      <div className={role === "admin" ? "grid min-h-[496px] sm:grid-cols-[130px_1fr]" : "min-h-[496px]"}>
        {role === "admin" && (
          <aside className="hidden border-r border-slate-200 bg-white p-3 sm:block">
            <p className="px-2 py-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
            {workspace.navigation.map((item, index) => <div key={item} className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[9px] font-semibold ${index === 0 ? "bg-blue-600 text-white" : "text-slate-600"}`}><span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{index === 0 ? <DashboardIcon /> : <AuditIcon />}</span>{item}</div>)}
          </aside>
        )}
        <RoleDashboardBody role={role} />
      </div>
    </article>
  );
}

function RoleDashboardBody({ role }: { role: ClinicRole }) {
  const workspace = roleWorkspaces[role];
  const activeTab = role === "staff" ? 1 : 0;
  const metricIcons: ReactNode[] = role === "admin"
    ? [<PatientsIcon />, <VisitsIcon />, <StaffIcon />, <CalendarIcon />]
    : role === "staff"
      ? [<PatientsIcon />, <VisitsIcon />, <StaffIcon />, <CalendarIcon />]
      : [<CalendarIcon />, <PatientsIcon />, <VisitsIcon />, <VisitsIcon />];
  const metricTones = ["blue", role === "admin" || role === "staff" ? "green" : "orange", role === "admin" || role === "staff" ? "purple" : "green", role === "admin" || role === "staff" ? "orange" : "red"] as const;

  return (
    <div className="min-w-0 p-3 sm:p-5">
      <h3 className="text-base font-semibold tracking-tight sm:text-xl">{workspace.eyebrow}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {workspace.metrics.map(([value, label, caption], index) => <RoleMetricCard key={label} value={value} label={label} caption={caption} icon={metricIcons[index]} tone={metricTones[index]} />)}
      </div>

      <div className="mt-3 flex overflow-hidden rounded-lg border border-slate-200 bg-white text-[8px] font-semibold text-slate-600 sm:text-[9px]">
        {workspace.features.map((feature, index) => (
          <span key={feature} className={`relative whitespace-nowrap px-3 py-2.5 sm:px-4 ${index === activeTab ? "border-b-2 border-blue-600 bg-blue-50 text-blue-600" : ""}`}>
            {feature}{feature === "Notifications" && role === "nurse" && <b className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[7px] text-white">2</b>}
          </span>
        ))}
      </div>

      {role === "admin" ? <RoleAdminAnalytics /> : role === "doctor" ? <RoleDoctorContent /> : role === "nurse" ? <RoleNurseContent /> : <RoleStaffContent />}
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
      <div className="flex items-start justify-between"><div><p className="text-[11px] font-bold">Student Records</p><p className="mt-1 text-[8px] text-slate-400">Find a student, review the record, or start a clinic visit.</p></div><span className="rounded-md bg-blue-600 px-3 py-2 text-[8px] font-semibold text-white">+ Register Student</span></div>
      <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[8px] text-blue-800"><b>Clinic workflow:</b> find the student, select Check In, then record vitals from the queue.</div>
      <div className="mt-3 flex gap-2"><div className="w-52 rounded-md border border-slate-300 px-3 py-2 text-[8px] text-slate-400">Search by name or student ID...</div><span className="rounded-md bg-slate-100 px-3 py-2 text-[8px]">Search</span></div>
      <PreviewTable headers={["Student ID", "Name", "Course / Year", "Gender", "Actions"]} rows={[["TEST-001", "TEST Patient", "BSIT — Yr 3", "Male", "View Record  Check In"], ["1234", "Sample Student", "BSIT — Yr 2", "Male", "View Record  Check In"]]} />
    </div>
  );
}

function RoleDoctorContent() {
  return <><div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><p className="text-[11px] font-bold">Today's Appointments</p><p className="mt-1 text-[8px] text-slate-400">Confirm pending appointments, then start the consultation when the student is ready.</p></div><p className="py-10 text-center text-[9px] text-slate-400">No appointments scheduled for today.</p></div><div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-[11px] font-bold shadow-sm">Recent Consultations</div></>;
}

function RoleStaffContent() {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between"><div><p className="text-[11px] font-bold">Student Visits</p><p className="mt-1 text-[8px] text-slate-400">Check in, triage, and move students through the clinic.</p><p className="mt-2 text-[8px] text-slate-500">2 waiting for triage · 0 ready for doctor</p></div><span className="rounded-md bg-blue-600 px-3 py-2 text-[8px] font-semibold text-white">+ Register Visit</span></div>
      <PreviewTable headers={["Student", "Arrived", "Complaint", "Vitals", "Status"]} rows={[["TEST Patient (2024)", "03:32 PM", "—", "Vitals not yet recorded", "In Consultation"], ["Sample Student (1234)", "02:02 PM", "—", "Vitals not yet recorded", "Waiting for Nurse Triage"]]} />
    </div>
  );
}

function PreviewTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="mt-3 overflow-hidden rounded-md border border-slate-200"><div className="grid bg-slate-50" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>{headers.map((header) => <span key={header} className="truncate px-3 py-2 text-[7px] font-bold uppercase text-slate-500">{header}</span>)}</div>{rows.map((row, rowIndex) => <div key={rowIndex} className="grid border-t border-slate-100" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>{row.map((cell, index) => <span key={`${rowIndex}-${index}`} className={`truncate px-3 py-2 text-[7px] ${index === 0 || index === row.length - 1 ? "font-semibold text-blue-600" : "text-slate-500"}`}>{cell}</span>)}</div>)}</div>;
}

function RoleAdminAnalytics() {
  const bars = [2, 2, 2, 12, 76, 2];
  return <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold">Most Common Complaints</p><p className="mt-1 text-[7px] text-slate-400">Based on recorded clinic visits</p><div className="mt-4 flex items-center justify-center gap-4"><div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: "conic-gradient(#2563eb 0 27%,#14b8a6 27% 54%,#f59e0b 54% 72%,#f97316 72% 90%,#8b5cf6 90%)" }}><div className="grid h-12 w-12 place-items-center rounded-full bg-white text-center"><span><b className="block text-sm">11</b><small className="text-[5px] text-slate-400">recorded visits</small></span></div></div><div className="hidden space-y-2 xl:block">{[["Fever", "27%"], ["Headache", "27%"], ["Mild Fever", "18%"], ["Nosebleed", "18%"], ["Other", "9%"]].map(([label, value]) => <div key={label} className="flex w-28 text-[7px] text-slate-500"><span>{label}</span><b className="ml-auto text-slate-700">{value}</b></div>)}</div></div></div><div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold">Monthly Clinic Visits</p><p className="mt-1 text-[7px] text-slate-400">Last six months</p><div className="mt-4 flex h-32 items-end gap-2 border-b border-l border-slate-200 px-2">{bars.map((height, index) => <span key={index} className="flex-1 rounded-t-sm bg-blue-500" style={{ height: `${height}%` }} />)}</div></div></div>;
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
      <HeroStatusCard label="Pending Appointments" value="42" note="Awaiting confirmation" icon={<CalendarIcon />} tone="rose" />
      <HeroStatusCard label="Inventory Alerts" value="3" note="Needs attention" icon={<MedicineIcon />} tone="emerald" />
      <HeroStatusCard label="Student Records" value="9" note="Active students" icon={<PatientsIcon />} tone="blue" />
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
  const bars = [3, 3, 3, 14, 78, 3];
  return (
    <div className="bg-[#f7faff] text-[#0f1930]">
      <div className="flex h-12 items-center border-b border-slate-200 bg-white px-3 sm:h-14 sm:px-4">
        <BrandLogo className="h-8 w-8" />
        <div className="ml-2 leading-tight">
          <p className="text-[9px] font-extrabold sm:text-[11px]">School Clinic Management</p>
          <p className="text-[7px] text-slate-400 sm:text-[8px]">Admin Dashboard</p>
        </div>
        <div className="ml-auto hidden h-7 w-[31%] items-center rounded border border-slate-200 px-2 text-[8px] text-slate-400 sm:flex">Search students...<span className="ml-auto">⌕</span></div>
        <div className="ml-3 text-right"><p className="text-[9px] font-bold sm:text-[10px]">Admin User</p><p className="text-[7px] text-slate-400 sm:text-[8px]">admin@clinic.com</p></div>
        <span className="ml-2 rounded-md border border-slate-200 px-2 py-1 text-[8px]">Logout</span>
      </div>

      <div className="grid min-h-[410px] grid-cols-[82px_1fr] sm:grid-cols-[120px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-2 sm:p-3">
          <p className="px-2 py-2 text-[7px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[8px]">Navigation</p>
          <div className="mt-1 flex items-center gap-2 rounded-md bg-blue-600 px-2 py-2 text-[8px] font-semibold text-white sm:text-[9px]"><DashboardIcon className="h-3.5 w-3.5" />Dashboard</div>
          <div className="mt-1 flex items-center gap-2 px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]"><AuditIcon className="h-3.5 w-3.5" />Audit Log</div>
        </aside>

        <div className="min-w-0 p-3 sm:p-5">
          <h3 className="text-sm font-bold tracking-tight sm:text-base">Admin Dashboard</h3>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <AdminStat label="Total Students" value="9" caption="Active student records" icon={<PatientsIcon />} tone="blue" />
            <AdminStat label="Clinic Visits Today" value="0" caption="Recorded today" icon={<VisitsIcon />} tone="emerald" />
            <AdminStat label="Active Doctor / Nurse" value="3" caption="Currently available" icon={<StaffIcon />} tone="violet" />
            <AdminStat label="Pending Appointments" value="42" caption="Awaiting confirmation" icon={<CalendarIcon />} tone="orange" />
          </div>
          <div className="mt-3 flex rounded-lg border border-slate-200 bg-white text-[8px] font-semibold text-slate-600 sm:text-[9px]">
            <span className="border-b-2 border-blue-600 bg-blue-50 px-3 py-2 text-blue-600">Analytics</span><span className="px-3 py-2">Inventory</span><span className="px-3 py-2">Management</span><span className="px-3 py-2">Reports</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_3px_10px_rgba(15,23,42,0.06)]">
              <p className="text-[9px] font-bold sm:text-[11px]">Most Common Complaints</p><p className="mt-0.5 text-[7px] text-slate-400">Based on recorded clinic visits</p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full sm:h-28 sm:w-28" style={{ background: "conic-gradient(#2563eb 0 27%, #14b8a6 27% 54%, #f59e0b 54% 72%, #f97316 72% 90%, #8b5cf6 90%)" }}><div className="grid h-12 w-12 place-items-center rounded-full bg-white text-center sm:h-14 sm:w-14"><span><b className="block text-xs sm:text-sm">11</b><small className="text-[6px] text-slate-400">recorded visits</small></span></div></div>
                <div className="hidden min-w-0 flex-1 space-y-2 lg:block">{[["Fever", "27%", "bg-blue-600"], ["Headache", "27%", "bg-teal-500"], ["Mild Fever", "18%", "bg-amber-500"], ["Nosebleed", "18%", "bg-orange-500"], ["Other", "9%", "bg-violet-500"]].map(([name, percent, color]) => <div key={name} className="flex items-center gap-2 text-[7px] sm:text-[8px]"><span className={`h-1.5 w-1.5 rounded-full ${color}`} /><span className="truncate text-slate-500">{name}</span><span className="ml-auto font-semibold">{percent}</span></div>)}</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_3px_10px_rgba(15,23,42,0.06)]">
              <p className="text-[9px] font-bold sm:text-[11px]">Monthly Clinic Visits</p><p className="mt-0.5 text-[7px] text-slate-400">Last six months</p>
              <div className="mt-4 flex h-[126px] items-end gap-2 border-b border-l border-slate-200 px-2 sm:gap-3">{bars.map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><div className="w-full rounded-t-sm bg-blue-500" style={{ height: `${height}%` }} /></div>)}</div>
              <div className="mt-1 grid grid-cols-6 text-center text-[6px] text-slate-400 sm:text-[7px]"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div>
            </div>
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
