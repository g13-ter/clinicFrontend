// Inline message shown directly under a single form input.
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

// Show backend errors that do not map to rendered inputs.
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
