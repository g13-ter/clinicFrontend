import type { ReactNode } from "react";

import {
  AuditIcon,
  CalendarIcon,
  DashboardIcon,
  MedicineIcon,
  PatientsIcon,
  ReportsIcon,
  StaffIcon,
  VisitsIcon,
} from "../components/icons";

export type ClinicRole =
  | "admin"
  | "doctor"
  | "nurse"
  | "staff";

export type RoleWorkspace = {
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  navigation: string[];
  pages: string[];
  features: string[];
  metrics: [string, string, string][];
  icon: ReactNode;
};

/* =========================================================
   LANDING PAGE MODULES
========================================================= */

export const modules = [
  {
    title: "Patient Records",
    description:
      "Secure health profiles, medical alerts, consent, immunizations, and complete visit history.",
    icon: <PatientsIcon />,
    tone: "blue",
  },
  {
    title: "Appointments & Queue",
    description:
      "Schedule clinic visits, check in walk-ins, prioritize emergencies, and manage waiting patients.",
    icon: <CalendarIcon />,
    tone: "cyan",
  },
  {
    title: "Clinical Care",
    description:
      "Record triage, vitals, consultations, diagnoses, treatments, referrals, and follow-ups.",
    icon: <VisitsIcon />,
    tone: "violet",
  },
  {
    title: "Medicine Inventory",
    description:
      "Track batches, expiry dates, low stock, dispensing, suppliers, and purchase requests.",
    icon: <MedicineIcon />,
    tone: "rose",
  },
  {
    title: "Reports & Analytics",
    description:
      "Understand clinic demand, common complaints, waiting times, medicine use, and trends.",
    icon: <ReportsIcon />,
    tone: "amber",
  },
  {
    title: "Users & Audit Logs",
    description:
      "Control role-based access and keep a traceable record of important system activity.",
    icon: <AuditIcon />,
    tone: "emerald",
  },
] as const;

/* =========================================================
   HOW SCHOOLCARE WORKS
========================================================= */

export const steps = [
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

/* =========================================================
   ROLE WORKSPACES
========================================================= */

export const roleWorkspaces: Record<
  ClinicRole,
  RoleWorkspace
> = {
  /* =========================
     ADMIN
  ========================= */

  admin: {
    label: "Admin",

    eyebrow: "Admin Dashboard",

    title:
      "User management and administrative oversight.",

    description:
      "Admins manage clinic accounts, review medicine purchase requests, monitor audit activity, configure clinic settings, and maintain their account profile.",

    // Actual sidebar
    navigation: [
      "Dashboard",
      "Audit Logs",
      "Settings",
      "Profile",
    ],

    // Pages shown in "Pages this role can access"
    pages: [
      "Dashboard",
      "User Management",
      "Purchase Requests",
      "Audit Logs",
      "Settings",
      "Profile",
    ],

    // Dashboard tabs
    features: [
      "Management",
      "Purchase Requests",
    ],

    metrics: [
      [
        "18",
        "Total Patients",
        "18 students · 0 teachers · 0 staff",
      ],
      [
        "15",
        "Active Users",
        "Available doctors, nurses, and staff",
      ],
    ],

    icon: <DashboardIcon />,
  },

  /* =========================
     DOCTOR
  ========================= */

  doctor: {
    label: "Doctor",

    eyebrow: "Doctor Dashboard",

    title:
      "Consultation and physician care.",

    description:
      "Doctors review clinic analytics, manage appointments and patient visits, access patient records, handle follow-ups, and generate clinical reports.",

    // Doctor has no sidebar in landing preview
    navigation: [],

    pages: [
      "Dashboard",
      "Appointments",
      "Patient Visits",
      "Patient Records",
      "Follow-Ups",
      "Reports",
      "Notifications",
    ],

    features: [
      "Appointments",
      "Patient Visits",
      "Patient Records",
      "Follow-Ups",
      "Reports",
      "Notifications",
    ],

    metrics: [
      [
        "0",
        "Today's Appointments",
        "Scheduled today",
      ],
      [
        "3",
        "Patients Waiting",
        "All patient types in the clinic queue",
      ],
      [
        "1",
        "Consultations Today",
        "Started or completed",
      ],
      [
        "0",
        "Emergency Cases",
        "Recorded today",
      ],
    ],

    icon: <VisitsIcon />,
  },

  /* =========================
     NURSE
  ========================= */

  nurse: {
    label: "Nurse",

    eyebrow: "Nurse Dashboard",

    title:
      "Triage, patient care, and inventory management.",

    description:
      "Nurses review clinic analytics, manage patient records and visits, record triage and vitals, manage appointments and inventory, handle medication requests, and generate reports.",

    // Nurse has no sidebar in landing preview
    navigation: [],

    pages: [
      "Dashboard",
      "Patients",
      "Patient Visits",
      "Appointments",
      "Inventory",
      "Medication Requests",
      "Reports",
      "Notifications",
      "Settings",
    ],

    features: [
      "Patients",
      "Patient Visits",
      "Appointments",
      "Inventory",
      "Medication Requests",
      "Reports",
      "Notifications",
      "Settings",
    ],

    metrics: [
      [
        "0",
        "Today's Appointments",
        "Scheduled today",
      ],
      [
        "3",
        "Patients Waiting",
        "All patient types in the clinic queue",
      ],
      [
        "1",
        "Consultations Today",
        "Started or completed",
      ],
      [
        "0",
        "Emergency Cases",
        "Recorded today",
      ],
    ],

    icon: <StaffIcon />,
  },

  /* =========================
     STAFF
  ========================= */

  staff: {
    label: "Staff",

    eyebrow: "Staff Dashboard",

    title:
      "Patient intake and appointments.",

    description:
      "Staff maintain basic patient information, schedule appointments, check in patients, and monitor visit progress without access to Analytics or Reports.",

    // Staff has no sidebar in landing preview
    navigation: [],

    pages: [
      "Dashboard",
      "Patients",
      "Patient Visits",
      "Appointments",
      "Notifications",
    ],

    features: [
      "Patients",
      "Patient Visits",
      "Appointments",
      "Notifications",
    ],

    metrics: [
      [
        "18",
        "Total Patients",
        "18 students · 0 teachers · 0 staff",
      ],
      [
        "4",
        "Visits Today",
        "Recorded today",
      ],
      [
        "3",
        "Patients Waiting",
        "All patient types in the clinic queue",
      ],
      [
        "64",
        "Pending Appointments",
        "Awaiting confirmation",
      ],
    ],

    icon: <CalendarIcon />,
  },
};
