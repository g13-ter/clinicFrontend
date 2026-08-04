import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROUTE_ACCESS, USER_ROLES } from "./config/permissions";

const LandingPage = lazy(() => import("./pages/LandingPage"));
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
const TemporaryInfoPage = lazy(() => import("./pages/TemporaryInfoPage"));

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/privacy"
          element={
            <TemporaryInfoPage
              title="Privacy Policy"
              description="This privacy policy page is currently being prepared for the clinic platform."
              details={[
                "This placeholder content will be replaced with the official policy text.",
                "It is intended to provide a temporary route for the footer link.",
                "You can update the wording once the final policy is ready."
              ]}
            />
          }
        />
        <Route
          path="/terms"
          element={
            <TemporaryInfoPage
              title="Terms of Service"
              description="These terms of service are currently being drafted for the clinic system."
              details={[
                "This page serves as a temporary placeholder for the footer navigation.",
                "It will be replaced with the final legal terms once approved.",
                "The content is meant to keep the route functional during development."
              ]}
            />
          }
        />
        <Route
          path="/license"
          element={
            <TemporaryInfoPage
              title="Licensing"
              description="This licensing page is currently a temporary placeholder for the clinic platform."
              details={[
                "The licensing information will be finalized later.",
                "This route is now available for the footer link.",
                "You can add the official license terms when they are ready."
              ]}
            />
          }
        />
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
