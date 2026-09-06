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
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const RolePermissionsPage = lazy(() => import("./pages/RolePermissionsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const TemporaryInfoPage = lazy(() => import("./pages/TemporaryInfoPage"));
const InventoryLabelsPage = lazy(() => import("./pages/InventoryLabelsPage"));

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
        <Route path="/change-password" element={<ProtectedRoute roles={USER_ROLES}><ChangePasswordPage /></ProtectedRoute>} />
        <Route
          path="/privacy"
          element={
            <TemporaryInfoPage
              title="Privacy Policy"
              description="The school clinic collects and uses student health information only to provide care, manage clinic operations, meet safety obligations, and maintain required records."
              details={[
                "Records may include identity and contact details, visit notes, vital signs, medical history, prescriptions, referrals, and inventory transactions linked to care.",
                "Access is limited by staff role and care assignment. Administrative users do not receive clinical content through audit logs.",
                "Information is retained under the school's approved records schedule and disclosed only when authorized, legally required, or necessary to protect life and health.",
                "Students or guardians may request access, correction, or privacy assistance through the school clinic or the school's Data Protection Officer using official school contact channels.",
                "Security incidents involving personal data should be reported immediately to the school administration or Data Protection Officer."
              ]}
            />
          }
        />
        <Route
          path="/terms"
          element={
            <TemporaryInfoPage
              title="Terms of Service"
              description="This system is restricted to authorized school clinic personnel performing approved duties. Use is logged and is subject to school policy."
              details={[
                "Users must protect their credentials, use only their own account, lock or sign out of unattended devices, and report suspected compromise promptly.",
                "Accessing records without a care, operational, or legal need; copying data to personal services; or altering records dishonestly is prohibited.",
                "Clinical decisions remain the responsibility of qualified personnel. The system supports documentation and workflow but does not replace professional judgment or emergency protocols.",
                "Accounts may be suspended and activity reviewed when misuse, excessive access, or a security incident is suspected.",
                "Acceptance is recorded by policy version. A revised version must be accepted before access resumes."
              ]}
            />
          }
        />
        <Route
          path="/license"
          element={
            <TemporaryInfoPage
              title="Licensing"
              description="The clinic application, school branding, configurations, and locally authored content are provided for authorized institutional use only unless a separate written license says otherwise."
              details={[
                "Do not redistribute, sell, sublicense, or publish the application or school data without written authorization from the rights holder and the school.",
                "Open-source packages bundled with the application remain governed by their respective license notices and attribution requirements.",
                "No license permits use of student or staff information outside approved school-clinic purposes.",
                "Requests concerning reuse, deployment at another institution, or third-party components should be directed through official school administration channels."
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
          path="/inventory-labels"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/inventory-labels"]}>
              <InventoryLabelsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/analytics"]}>
              <AnalyticsPage />
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
          path="/roles-permissions"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/roles-permissions"]}>
              <RolePermissionsPage />
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
          path="/profile"
          element={
            <ProtectedRoute roles={ROUTE_ACCESS["/profile"]}>
              <ProfilePage />
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
