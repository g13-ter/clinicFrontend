/** Shared role type — must match backend JWT payload and User schema. */
export type UserRole = "admin" | "doctor" | "nurse" | "staff";

export const USER_ROLES: readonly UserRole[] = ["admin", "doctor", "nurse", "staff"];

export const ROUTE_ACCESS: Record<string, readonly UserRole[]> = {
  "/dashboard": ["admin", "doctor", "nurse", "staff"],
  "/clinical-workspace": ["doctor", "nurse"],
  "/patients": ["admin", "doctor", "nurse", "staff"],
  "/patients/:id": ["staff", "doctor", "nurse"],
  "/patient-queue": ["staff", "doctor", "nurse"],
  "/appointments": ["doctor", "nurse", "staff"],
  "/medicines": ["admin", "doctor", "nurse"],
  "/purchase-requests": ["admin", "nurse"],
  "/users": ["admin"],
  "/reports": ["admin", "nurse"],
  "/audit-log": ["admin"],
  "/settings": ["admin"],
};

export const NAV_ITEMS: { to: string; label: string; roles: readonly UserRole[] }[] = [
  { to: "/dashboard", label: "Dashboard", roles: ROUTE_ACCESS["/dashboard"] },
  { to: "/clinical-workspace", label: "Clinical Care", roles: ROUTE_ACCESS["/clinical-workspace"] },
  { to: "/patients", label: "Students", roles: ROUTE_ACCESS["/patients"] },
  { to: "/patient-queue", label: "Student Queue", roles: ROUTE_ACCESS["/patient-queue"] },
  { to: "/appointments", label: "Appointments", roles: ROUTE_ACCESS["/appointments"] },
  { to: "/medicines", label: "Inventory", roles: ROUTE_ACCESS["/medicines"] },
  { to: "/purchase-requests", label: "Purchase Requests", roles: ROUTE_ACCESS["/purchase-requests"] },
  { to: "/users", label: "Users", roles: ROUTE_ACCESS["/users"] },
  { to: "/reports", label: "Reports", roles: ROUTE_ACCESS["/reports"] },
  { to: "/audit-log", label: "Audit Log", roles: ROUTE_ACCESS["/audit-log"] },
  { to: "/settings", label: "Settings", roles: ROUTE_ACCESS["/settings"] },
];

/** UI capabilities derived from the backend RBAC model. */
export const CAPABILITIES = {
  manageAppointments: ["staff", "nurse"] as const satisfies readonly UserRole[],
  editPatients: ["staff", "nurse"] as const satisfies readonly UserRole[],
  viewFullPatients: ["staff", "admin", "doctor", "nurse"] as const satisfies readonly UserRole[],
  // Staff may browse basic student data without viewing full records.
  searchPatients: ["admin", "doctor", "nurse", "staff"] as const satisfies readonly UserRole[],
  viewMedicines: ["admin", "doctor", "nurse"] as const satisfies readonly UserRole[],
  viewVisits: ["admin", "doctor", "nurse"] as const satisfies readonly UserRole[],
  checkInPatients: ["staff", "nurse"] as const satisfies readonly UserRole[],
  manageQueue: ["nurse", "doctor"] as const satisfies readonly UserRole[],
  recordVitals: ["nurse"] as const satisfies readonly UserRole[],
  savePhysicianConsultation: ["doctor"] as const satisfies readonly UserRole[],
  generateConsultationCertificate: ["doctor"] as const satisfies readonly UserRole[],
  editMedicines: ["nurse"] as const satisfies readonly UserRole[],
  editMedicalHistory: ["doctor"] as const satisfies readonly UserRole[],
  viewMedicalHistory: ["doctor", "nurse"] as const satisfies readonly UserRole[],
  submitPurchaseRequest: ["nurse"] as const satisfies readonly UserRole[],
  reviewPurchaseRequest: ["admin"] as const satisfies readonly UserRole[],
  viewPurchaseRequests: ["admin", "nurse"] as const satisfies readonly UserRole[],
  selectDoctorForAppointment: ["staff", "nurse", "admin"] as const satisfies readonly UserRole[],
  manageDoctorSchedule: ["admin"] as const satisfies readonly UserRole[],
} as const;

export type Capability = keyof typeof CAPABILITIES;

export const hasRole = (
  role: UserRole | null | undefined,
  allowed: readonly UserRole[]
): role is UserRole => role !== null && role !== undefined && allowed.includes(role);

export const can = (role: UserRole | null | undefined, capability: Capability): boolean =>
  hasRole(role, CAPABILITIES[capability]);

/** Patient list endpoint for appointment booking dropdowns. */
export const patientsListPath = (role: UserRole | null | undefined): string | null => {
  if (hasRole(role, ["staff"])) return "/patients/basic";
  if (hasRole(role, CAPABILITIES.manageAppointments)) return "/patients?limit=200";
  return null;
};
