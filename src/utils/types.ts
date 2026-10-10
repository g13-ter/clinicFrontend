// Plain REST equivalents of the backend models.

export interface Patient {
  _id: string;
  patientType?: "student" | "teacher" | "staff";
  educationLevel?: "elementary" | "junior_high" | "senior_high" | "college";
  studentId: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  course?: string;
  yearLevel: number;
  programDurationYears?: number;
  department?: string;
  position?: string;
  contactNumber: string;
  email?: string;
  address: string;
  dateOfBirth?: string;
  bloodType?: string;
  guardianName?: string;
  guardianContactNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  healthConditions?: string;
  familyHistory?: string;
  pastMedicalHistory?: string;
  medicalAlerts?: {
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: string[];
    notes?: string;
  };
  clinicalProfileUpdatedBy?: { _id: string; name: string; role: string } | string;
  clinicalProfileVerifiedBy?: { _id: string; name: string; role: string } | string;
  clinicalProfileVerifiedAt?: string;
  schoolYear?: string;
  enrollmentStatus?: "active" | "completion_pending" | "extended" | "graduated" | "transferred";
  completionReviewDecision?: "graduated" | "retained" | "extended" | "transferred";
  completionReviewNotes?: string;
  completionReviewedAt?: string;
  completionReviewedBy?: string;
  immunizations?: { vaccine: string; dateAdministered?: string; notes?: string }[];
  isActive: boolean;
}

export interface ClinicVisit {
  _id: string;
  patientId: Patient | string;
  appointmentId?: Appointment | string | null;
  assignedDoctorId?: Doctor | string | null;
  complaint: string;
  treatment: string;
  notes: string;
  visitDate: string;
  bloodPressure: string;
  temperature: number;
  pulseRate: number;
  respiratoryRate?: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  nursingAssessment?: string;
  consultationFindings?: string;
  nursingInterventions?: string;
  nursingRecommendations?: string;
  clinicProtocolReference?: string;
  readyForDoctor?: boolean;
  status?: "triage" | "ready_for_doctor" | "in_consultation" | "paused" | "completed" | "cancelled" | "referred";
  referralFacility?: string;
  referralReason?: string;
  referralOutcome?: string;
  isEmergency?: boolean;
  emergencyDetails?: string;
  guardianNotifiedAt?: string;
  closedAt?: string;
  isActive: boolean;
}

export interface LatestPatientVitals {
  heightCm?: number;
  heightRecordedAt?: string;
  weightKg?: number;
  weightRecordedAt?: string;
}

export interface Doctor {
  _id: string;
  name: string;
  email: string;
  isAvailable?: boolean;
  scheduleNotes?: string;
}

export interface Appointment {
  _id: string;
  patientId: Patient | string | null;
  doctorId?: Doctor | string | null;
  appointmentDate: string;
  reason: string;
  cancellationReason?: string;
  declineReason?: string;
  status: "unassigned" | "pending" | "confirmed" | "needs_reassignment" | "checked_in" | "cancelled" | "completed";
  notes: string;
  reminderSent?: boolean;
  durationMinutes?: number;
  type?: "regular" | "follow_up";
  sourceVisitId?: string;
  visitId?: string | Pick<ClinicVisit, "_id" | "status" | "readyForDoctor">;
  checkedInAt?: string;
}

export type MedicineStatus = "Available" | "Low Stock" | "Out of Stock" | "Expired";

export interface Medicine {
  _id: string;
  name: string;
  category?: string;
  inventorySection?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  lowStockThreshold: number;
  supplier?: string;
  dateReceived?: string;
  isLowStock?: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  status?: MedicineStatus;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "doctor" | "nurse" | "staff";
  isActive: boolean;
  mustChangePassword?: boolean;
  deactivatedAt?: string;
  deactivatedBy?: string | { _id: string; name: string; email?: string; role?: string };
  isAvailable?: boolean;
  scheduleNotes?: string;
}

export interface PrescribedItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unit: string;
  instructions?: string;
  route?: string;
  scheduledTime?: string;
}

export interface MedicalHistory {
  _id: string;
  patientId: string;
  diagnosis: string;
  prescription: string;
  prescribedItems?: PrescribedItem[];
  medicationStatus?: "pending" | "accepted" | "dispensing" | "dispensed" | "not_given" | "cancelled";
  medicationClaimedBy?: { _id: string; name: string; role: string } | string;
  medicationClaimedAt?: string;
  medicationDispensedBy?: { _id: string; name: string; role: string } | string;
  medicationDispensedAt?: string;
  medicationAdministrationNotes?: string;
  medicationNotGivenReason?: string;
  medicationNotGivenNotes?: string;
  medicationAdverseReaction?: string;
  medicationAdverseReactionAt?: string;
  familyHistory: string;
  allergies: string;
  dateRecorded: string;
}

export type PurchaseRequestStatus = "pending" | "approved" | "ordered" | "received" | "rejected" | "cancelled";

export interface PurchaseRequest {
  _id: string;
  medicineId?: { _id: string; name: string; unit: string } | string | null;
  requestType?: "restock" | "new_item";
  itemName: string;
  unit?: string;
  category?: string;
  inventorySection?: string;
  quantityRequested: number;
  reason: string;
  status: PurchaseRequestStatus;
  requestedBy: { _id: string; name: string; role: string } | string;
  reviewedBy?: { _id: string; name: string; role: string } | string | null;
  reviewNotes?: string;
  reviewedAt?: string;
  orderedAt?: string;
  receivedAt?: string;
  supplier?: string;
  estimatedCost?: number;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: "create" | "update" | "delete" | "deactivate" | "reactivate" | "view";
  resource: string;
  resourceId: string;
  performedBy:
    | { _id: string; name: string; email: string; role: string }
    | string;
  actorSnapshot?: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: { method?: string; path?: string };
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalPatients: number;
  patientsByType: { student: number; teacher: number; staff: number };
  usersByRole: { doctor: number; nurse: number; staff: number; admin: number };
  todaysAppointments: number;
  todayVisits: number;
  consultationsToday: number;
  emergencyCasesToday: number;
  pendingAppointments: number;
  waitingPatients: number;
  monthlyConsultations: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  pendingPurchaseRequests: number;
  activeUsers: {
    id: string;
    name: string;
    email: string;
    role: "doctor" | "nurse" | "staff";
    scheduleNotes?: string;
  }[];
  commonComplaints: { label: string; count: number }[];
  monthlyVisits: { key: string; month: string; visits: number }[];
  analyticsPatientType: "all" | "student" | "teacher" | "staff";
  analyticsTotalVisits: number;
  analyticsVisitBreakdown: { student: number; teacher: number; staff: number };
  bmiRecordedCount: number;
  bmiBreakdown: { underweight: number; normalWeight: number; overweight: number; obese: number };
  recentCases: {
    id: string;
    date: string;
    student: { id: string; name: string; studentId: string; patientType: "student" | "teacher" | "staff" } | null;
    complaint: string;
    assessment: string;
    treatment: string;
    provider: { id: string; name: string; role: "doctor" | "nurse" } | null;
  }[];
  recentActivity: {
    action: string;
    resource: string;
    resourceId: string;
    performedBy: { _id: string; name: string; role: string } | string | null;
    createdAt: string;
  }[];
}

export interface SystemSettings {
  schoolYear: string;
  clinicName: string;
  buildingLocation: string;
  floorRoom: string;
  operatingDays: string;
  clinicOpenTime: string;
  clinicCloseTime: string;
  weeklySchedule: ClinicScheduleDay[];
  phoneNumber: string;
  emailAddress: string;
  emailNotificationsEnabled: boolean;
  appointmentRemindersEnabled: boolean;
  stockAlertsEnabled: boolean;
}

export interface ClinicScheduleDay {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  openTime: string;
  closeTime: string;
}

export type ClinicProfile = Pick<SystemSettings,
  "clinicName" | "buildingLocation" | "floorRoom" | "operatingDays" |
  "clinicOpenTime" | "clinicCloseTime" | "weeklySchedule" | "phoneNumber" | "emailAddress"
>;

export interface InventoryLabel {
  _id: string;
  name: string;
  description?: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  itemCount: number;
}

export interface MedicationInventoryReportRow {
  name: string;
  inventorySection: string;
  dateReceived?: string | null;
  totalPrescribed: number;
  remainingStock: number;
  unit: string;
  expirationDate?: string | null;
  remarks: string;
}

export interface InventoryLabelActivity {
  _id: string;
  action: string;
  resource: string;
  resourceId: string;
  actorSnapshot?: { name?: string; role?: string };
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  createdAt: string;
}

export interface InAppNotification {
  _id: string;
  kind: "appointment_assigned" | "appointment_reassigned" | "appointment_rescheduled" | "appointment_cancelled" | "visit_ready" | "emergency" | "medication_order";
  title: string;
  message: string;
  link: string;
  resourceType: "Appointment" | "ClinicVisit" | "MedicalHistory";
  resourceId: string;
  readAt?: string;
  createdAt: string;
}

export interface InventoryBatch {
  _id: string;
  medicineId: string;
  batchNumber: string;
  quantityReceived: number;
  quantityRemaining: number;
  expiryDate?: string;
  supplier?: string;
  receivedAt: string;
  notes?: string;
}
