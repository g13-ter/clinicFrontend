import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
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
          <Route
            path="*"
            element={
              <ProtectedRoute roles={USER_ROLES}>
                <NotFoundPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
