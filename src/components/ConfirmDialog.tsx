import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  /** Red confirm button for destructive actions (delete, cancel); blue otherwise. Defaults to true. */
  danger?: boolean;
  /** Disables both buttons and swaps the confirm label while the action is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Shared confirmation dialog for destructive actions.
function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} closeDisabled={busy}>
      <div className="text-sm text-gray-600 mb-5">{message}</div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`px-4 py-2 text-sm rounded text-white disabled:opacity-50 ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {busy ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
