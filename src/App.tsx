import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MedicinesPage from "./pages/MedicinesPage";
import PurchaseRequestsPage from "./pages/PurchaseRequestsPage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogPage from "./pages/AuditLogPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROUTE_ACCESS } from "./config/permissions";

function App() {
  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;