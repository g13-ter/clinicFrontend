// Inline message shown directly under a single form input.
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

// Fallback for backend field errors that don't correspond to any input
// actually rendered on the form (e.g. a nested array path like
// "prescribedItems.0.quantity"), so they're never silently dropped.
export function UnmatchedFieldErrors({ errors }: { errors: [string, string][] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="text-red-500 text-xs mb-3 list-disc list-inside">
      {errors.map(([field, message]) => (
        <li key={field}>{message}</li>
      ))}
    </ul>
  );
}