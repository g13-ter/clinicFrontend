// Reusable modal shell used across all form dialogs.
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6">
        <h3 id="modal-title" className="mb-4 pr-8 text-base font-semibold">{title}</h3>
        {children}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-lg leading-none text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Modal;
