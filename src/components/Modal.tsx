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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[24px] border border-blue-100 bg-white p-6 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)]">
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-white">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {children}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Modal;
