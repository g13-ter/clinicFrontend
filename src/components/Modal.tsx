import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Modal({
  title,
  onClose,
  children,
  closeDisabled = false,
  size = "default",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  closeDisabled?: boolean;
  size?: "default" | "wide";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled, onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabledRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto rounded-lg bg-white p-4 shadow-xl outline-none sm:max-h-[calc(100dvh-3rem)] sm:p-6 ${
          size === "wide" ? "max-w-6xl" : "max-w-lg"
        }`}
      >
        <h3 id={titleId} className="mb-4 pr-8 text-base font-semibold">{title}</h3>
        {children}
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="absolute right-4 top-4 text-lg leading-none text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Close ${title}`}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Modal;
