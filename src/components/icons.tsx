type IconProps = { className?: string };

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function FilledIcon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ClinicLogoIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="6" fill="#1e6fa8" />
      <rect x="17" y="8" width="6" height="24" rx="1" fill="white" />
      <rect x="8" y="17" width="24" height="6" rx="1" fill="white" />
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <FilledIcon className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </FilledIcon>
  );
}

export function PatientsIcon({ className }: IconProps) {
  return (
    <FilledIcon className={className}>
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
    </FilledIcon>
  );
}

export function VisitsIcon({ className }: IconProps) {
  return (
    <FilledIcon className={className}>
      <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 20c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
    </FilledIcon>
  );
}

export function MedicineIcon({ className }: IconProps) {
  return (
    <FilledIcon className={className}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
    </FilledIcon>
  );
}

export function StaffIcon({ className }: IconProps) {
  return (
    <FilledIcon className={className}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </FilledIcon>
  );
}

export function ReportsIcon({ className }: IconProps) {
  return (
    <FilledIcon className={className}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
    </FilledIcon>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <FilledIcon className={className}>
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </FilledIcon>
  );
}

export function AuditIcon({ className }: IconProps) {
  return <SettingsIcon className={className} />;
}

export function SearchIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0" />
    </Icon>
  );
}

export function ChevronRightIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function PlusIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

export function CalendarIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </Icon>
  );
}

export function ReferralIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="M15.41 6.51l-6.82 3.98" />
    </Icon>
  );
}

export function StethoscopeIcon({ className = "w-8 h-8" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#e74c3c" d="M24 8c-6 0-10 4-10 10v6c0 3 2 5 5 5h2v8c0 4 3 7 7 7s7-3 7-7v-8h2c3 0 5-2 5-5v-6c0-6-4-10-10-10h-8z" opacity="0.15" />
      <path fill="none" stroke="#2c3e50" strokeWidth="2.5" d="M14 18v6c0 4 3 7 7 7" />
      <circle cx="34" cy="34" r="6" fill="none" stroke="#3498db" strokeWidth="2.5" />
      <path fill="none" stroke="#3498db" strokeWidth="2.5" d="M28 25v5a6 6 0 0 0 6 6" />
      <path fill="#e74c3c" d="M22 14c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4z" />
    </svg>
  );
}

export function StudentStatIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="8" y="28" width="20" height="14" rx="2" fill="#8e44ad" opacity="0.2" />
      <circle cx="18" cy="14" r="6" fill="#f39c12" />
      <path fill="#2c3e50" d="M10 24c0-4 4-7 8-7s8 3 8 7v4H10v-4z" />
      <rect x="30" y="12" width="10" height="14" rx="1" fill="#3498db" opacity="0.3" />
      <path fill="#3498db" d="M32 14h6v2h-6zm0 4h6v2h-6zm0 4h4v2h-4z" />
    </svg>
  );
}

export function MedicineStatIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="10" y="8" width="14" height="22" rx="3" fill="#e74c3c" opacity="0.85" />
      <rect x="12" y="10" width="10" height="6" rx="1" fill="white" opacity="0.5" />
      <ellipse cx="34" cy="30" rx="8" ry="5" fill="#f1c40f" />
      <ellipse cx="34" cy="24" rx="8" ry="5" fill="#e67e22" />
      <circle cx="34" cy="18" r="4" fill="#fff" stroke="#e67e22" strokeWidth="2" />
    </svg>
  );
}

export function EmergencyStatIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#e74c3c" d="M24 4 6 40h36L24 4z" opacity="0.2" />
      <path fill="#e74c3c" d="M24 10 12 36h24L24 10z" />
      <rect x="22" y="18" width="4" height="10" rx="1" fill="white" />
      <rect x="19" y="21" width="10" height="4" rx="1" fill="white" />
    </svg>
  );
}

export function ReferralStatIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="14" cy="24" r="8" fill="#3498db" opacity="0.3" />
      <circle cx="34" cy="14" r="6" fill="#2ecc71" opacity="0.4" />
      <circle cx="34" cy="34" r="6" fill="#f39c12" opacity="0.4" />
      <path fill="none" stroke="#2c3e50" strokeWidth="2" d="M20 22h12M30 16l4 4-4 4M30 28l4-4-4-4" />
    </svg>
  );
}
