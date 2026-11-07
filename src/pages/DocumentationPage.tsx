import { useAuth } from "../hooks/useAuth";
import AdminDocumentationPage from "./AdminDocumentationPage";
import DoctorDocumentationPage from "./DoctorDocumentationPage";
import NurseDocumentationPage from "./NurseDocumentationPage";
import StaffDocumentationPage from "./StaffDocumentationPage";
import SuperAdminDocumentationPage from "./SuperAdminDocumentationPage";

function DocumentationPage() {
  const { role } = useAuth();
  if (role === "doctor") return <DoctorDocumentationPage />;
  if (role === "nurse") return <NurseDocumentationPage />;
  if (role === "staff") return <StaffDocumentationPage />;
  if (role === "admin") return <AdminDocumentationPage />;
  return <SuperAdminDocumentationPage />;
}

export default DocumentationPage;
