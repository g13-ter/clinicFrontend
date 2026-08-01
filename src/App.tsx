import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import PatientQueuePage from "./pages/PatientQueuePage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MedicinesPage from "./pages/MedicinesPage";
import PurchaseRequestsPage from "./pages/PurchaseRequestsPage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogPage from "./pages/AuditLogPage";
import ClinicalWorkspacePage from "./pages/ClinicalWorkspacePage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROUTE_ACCESS, USER_ROLES } from "./config/permissions";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PatientsPage = lazy(() => import("./pages/PatientsPage"));
const PatientDetailPage = lazy(() => import("./pages/PatientDetailPage"));
const PatientQueuePage = lazy(() => import("./pages/PatientQueuePage"));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const MedicinesPage = lazy(() => import("./pages/MedicinesPage"));
const PurchaseRequestsPage = lazy(() => import("./pages/PurchaseRequestsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));
const ClinicalWorkspacePage = lazy(() => import("./pages/ClinicalWorkspacePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500"
      role="status"
      aria-live="polite"
    >
      Loading clinic workspace...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/dashboard"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clinical-workspace"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/clinical-workspace"]}>
              <ClinicalWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/patients"]}>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/patients/:id"]}>
              <PatientDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-queue"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/patient-queue"]}>
              <PatientQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/appointments"]}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medicines"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/medicines"]}>
              <MedicinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-requests"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/purchase-requests"]}>
              <PurchaseRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/users"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/reports"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/audit-log"]}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/settings"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
