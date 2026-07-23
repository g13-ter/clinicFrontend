// These mirror the JSON shapes returned by the API.
// Backend Mongoose models use ObjectId/Document — these are the plain REST equivalents.

export interface Patient {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  course: string;
  yearLevel: number;
  contactNumber: string;
  email?: string;
  address: string;
  isActive: boolean;
}

export interface ClinicVisit {
  _id: string;
  patientId: string;
  complaint: string;
  treatment: string;
  notes: string;
  visitDate: string;
  bloodPressure: string;
  temperature: number;
  pulseRate: number;
  isActive: boolean;
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
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string;
  reminderSent?: boolean;
}

export type MedicineStatus = "Available" | "Low Stock" | "Out of Stock" | "Expired";

export interface Medicine {
  _id: string;
  name: string;
  category?: string;
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
  role: "admin" | "doctor" | "nurse" | "staff";
  isAvailable?: boolean;
  scheduleNotes?: string;
}

export interface MedicalHistory {
  _id: string;
  patientId: string;
  diagnosis: string;
  prescription: string;
  familyHistory: string;
  allergies: string;
  dateRecorded: string;
}

export type PurchaseRequestStatus = "pending" | "approved" | "rejected";

export interface PurchaseRequest {
  _id: string;
  medicineId: { _id: string; name: string; unit: string } | string;
  itemName: string;
  quantityRequested: number;
  reason: string;
  status: PurchaseRequestStatus;
  requestedBy: { _id: string; name: string; role: string } | string;
  reviewedBy?: { _id: string; name: string; role: string } | string | null;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: "create" | "update" | "delete" | "view";
  resource: string;
  resourceId: string;
  performedBy: { _id: string; name: string } | string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  usersByRole: { doctor: number; nurse: number; staff: number; admin: number };
  todaysAppointments: number;
  waitingPatients: number;
  monthlyConsultations: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  pendingPurchaseRequests: number;
  recentActivity: {
    action: string;
    resource: string;
    resourceId: string;
    performedBy: { _id: string; name: string; role: string } | string | null;
    createdAt: string;
  }[];
}