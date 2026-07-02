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

export interface Appointment {
  _id: string;
  patientId: Patient | string | null;
  appointmentDate: string;
  reason: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string;
}

export interface Medicine {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  lowStockThreshold: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "doctor" | "nurse" | "staff";
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

export interface AuditLog {
  _id: string;
  action: "create" | "update" | "delete" | "view";
  resource: string;
  resourceId: string;
  performedBy: { _id: string; name: string } | string;
  createdAt: string;
}
