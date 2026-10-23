import { useCallback, useState } from "react";
import { ApiError } from "../services/api";

export type FieldErrors = Record<string, string>;

/** Maps API validation failures to form-level and field-level errors. */
export function useFormErrors() {
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const applyError = useCallback((err: unknown, fallback = "Something went wrong") => {
    if (err instanceof ApiError && err.errors && err.errors.length > 0) {
      const map: FieldErrors = {};
      for (const { field, message } of err.errors) {
        if (field && !(field in map)) map[field] = message;
      }
      setFieldErrors(map);
      setFormError(
        err.errors.length > 1 ? "Please fix the highlighted fields below." : err.errors[0].message
      );
      return;
    }
    setFieldErrors({});
    setFormError(err instanceof Error ? err.message : fallback);
  }, []);

  const reset = useCallback(() => {
    setFormError("");
    setFieldErrors({});
  }, []);

  const clearField = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Preserve backend errors that do not map to rendered fields.
  const unmatchedFieldErrors = useCallback(
    (knownFields: string[]) =>
      Object.entries(fieldErrors).filter(([field]) => !knownFields.includes(field)),
    [fieldErrors]
  );

  return { formError, fieldErrors, applyError, reset, clearField, unmatchedFieldErrors };
}
