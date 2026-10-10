import { useEffect, useRef, useState } from "react";

interface TermsAgreementModalProps {
  busy: boolean;
  error: string;
  onAccept: () => void;
  onDecline: () => void;
  reviewOnly?: boolean;
}

export function TermsAgreementModal({
  busy,
  error,
  onAccept,
  onDecline,
  reviewOnly = false,
}: TermsAgreementModalProps) {
  const [agreed, setAgreed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">School Clinic Management System</p>
          <h1 id="terms-title" ref={headingRef} tabIndex={-1} className="mt-1 text-2xl font-black text-slate-950 outline-none">
            Terms and Agreement
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {reviewOnly ? "Review the terms you previously accepted." : "Please review and accept these terms before continuing to your dashboard."}
          </p>
        </header>

        <div className="overflow-y-auto px-6 py-5 text-sm leading-6 text-slate-700 sm:px-8">
          <p>By logging into and using the School Clinic Management System, you acknowledge that you have read, understood, and agreed to comply with these Terms and Agreement.</p>

          <TermsSection title="1. Acceptance of Terms">
            By logging into the system, you agree to be bound by these Terms and Agreement. If you do not agree with any part of these terms, you should not access or use the system.
          </TermsSection>
          <TermsSection title="2. User Responsibilities">
            Users are responsible for maintaining the confidentiality of their login credentials. You agree not to share your username or password with anyone and to use the system only for authorized school clinic purposes.
          </TermsSection>
          <TermsSection title="3. Privacy and Confidentiality">
            The system collects and processes personal and medical information solely for providing school healthcare services and managing clinic records. Access to confidential information is restricted to authorized personnel based on their assigned roles. All users must maintain the confidentiality of any information they access through the system.
          </TermsSection>
          <TermsSection title="4. Data Security">
            Reasonable security measures are implemented to protect user information from unauthorized access, alteration, disclosure, or destruction. Users must immediately report any suspected security breach or unauthorized access to the system administrator.
          </TermsSection>
          <TermsSection title="5. Prohibited Activities">
            <p>Users must not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Share their login credentials with others.</li>
              <li>Access records without proper authorization.</li>
              <li>Modify, delete, or misuse information without permission.</li>
              <li>Attempt to interfere with or compromise the security of the system.</li>
              <li>Use the system for any unlawful or unauthorized purpose.</li>
            </ul>
          </TermsSection>
          <TermsSection title="6. System Availability">
            The system may be temporarily unavailable due to maintenance, updates, or unforeseen technical issues. The school will make reasonable efforts to restore services as quickly as possible.
          </TermsSection>
          <TermsSection title="7. Suspension or Termination of Access">
            The school reserves the right to suspend or terminate a user’s access if they violate these Terms and Agreement or engage in unauthorized activities.
          </TermsSection>
          <TermsSection title="8. Changes to the Terms">
            The school may revise these Terms and Agreement at any time. Continued use of the system after changes have been published constitutes acceptance of the updated terms.
          </TermsSection>
          <TermsSection title="9. Governing Law">
            These Terms and Agreement shall be governed by the laws of the Republic of the Philippines, including the Data Privacy Act of 2012 (Republic Act No. 10173).
          </TermsSection>
          <TermsSection title="User Agreement">
            By selecting “I Agree” and logging into the School Clinic Management System, I confirm that I have read, understood, and agreed to these Terms and Agreement. I understand that my personal and medical information may be collected, processed, and securely stored for legitimate school clinic purposes. I agree to use the system responsibly, protect the confidentiality of my login credentials, and comply with all applicable school policies and Philippine laws. I understand that violating these terms may result in the suspension or termination of my access to the system.
          </TermsSection>
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
          {!reviewOnly && <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={agreed}
              disabled={busy}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>I have read and agree to the Terms and Agreement.</span>
          </label>}
          {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" disabled={busy} onClick={onDecline} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60">
              {reviewOnly ? "Close" : "Decline"}
            </button>
            {!reviewOnly && <button type="button" disabled={!agreed || busy} onClick={onAccept} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Saving..." : "I Agree"}
            </button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <div className="mt-1">{children}</div>
    </section>
  );
}
