import Modal from "./Modal";
import PatientDetailPage from "../pages/PatientDetailPage";

function PatientRecordModal({
  patientId,
  onClose,
}: {
  patientId: string | null;
  onClose: () => void;
}) {
  if (!patientId) return null;

  return (
    <Modal title="Patient Record" size="wide" onClose={onClose}>
      <PatientDetailPage patientId={patientId} embedded />
    </Modal>
  );
}

export default PatientRecordModal;
