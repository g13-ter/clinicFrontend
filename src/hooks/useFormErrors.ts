import { useCallback, useState } from "react";
import { ApiError } from "../services/api";

export type FieldErrors = Record<string, string>;

/**
 * Centralizes how forms turn a failed save into feedback:
 *  - `fieldErrors[fieldName]` for inline, per-input messages (from the
 *    backend's Zod `{ field, message }[]` array)
 *  - `formError` for a short banner above the form (a single message when
 *    there's only one thing wrong, or a "fix the highlighted fields" nudge
 *    when there are several)
 *
 * Any field the backend flagged that doesn't correspond to a rendered
 * input (e.g. a nested array path) still ends up in `fieldErrors`, so
 * pages can surface it via `unmatchedFieldErrors` rather than lose it.
 */
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

  // Errors returned by the backend that don't map to any of the field
  // names a given form actually renders (e.g. "prescribedItems.0.quantity").
  // Pages pass in the field names they render inline; anything left over
  // is shown as a plain list so it's never silently dropped.
  const unmatchedFieldErrors = useCallback(
    (knownFields: string[]) =>
      Object.entries(fieldErrors).filter(([field]) => !knownFields.includes(field)),
    [fieldErrors]
  );

  return { formError, fieldErrors, applyError, reset, clearField, unmatchedFieldErrors };
}