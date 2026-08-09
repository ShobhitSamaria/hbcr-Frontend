/**
 * Per-form validation context. Holds the current error map keyed by field
 * label and exposes helpers to set / clear / re-validate.
 *
 * The error map is plain React state (not a ref) so consumers re-render
 * when errors appear or disappear. The orchestrator writes the map during
 * step transitions; the Field / SelectField components read it to display
 * the red border + message.
 *
 * The context is intentionally separate from `formState` because the form
 * state mutates on every keystroke and we don't want to re-render the whole
 * form on each character — only on error changes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ErrorMap = Record<string, string>;

export type ValidationApi = {
  errors: ErrorMap;
  /** Replace all errors with a new map. */
  setErrors: (next: ErrorMap) => void;
  /** Set a single error. */
  setError: (label: string, message: string) => void;
  /** Clear errors for a list of labels. */
  clearErrors: (labels: string[]) => void;
  /** Clear every error. */
  clearAll: () => void;
  /** Set of labels that have been "touched" (used to gate display). */
  touched: Set<string>;
  markTouched: (label: string) => void;
  markAllTouched: (labels: string[]) => void;
  resetTouched: () => void;
  /**
   * Optional list of labels that the consumer wants to highlight even if
   * untouched — typically set right after a step transition so users see
   * what's wrong without having to focus each field.
   */
  forceShow: Set<string>;
  forceShowLabels: (labels: string[]) => void;
  clearForceShow: () => void;
};

const Ctx = createContext<ValidationApi | null>(null);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [errors, setErrorsState] = useState<ErrorMap>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [forceShow, setForceShow] = useState<Set<string>>(new Set());

  const setErrors = useCallback((next: ErrorMap) => {
    setErrorsState(next);
    setForceShow(new Set(Object.keys(next)));
  }, []);

  const setError = useCallback((label: string, message: string) => {
    setErrorsState((prev) => ({ ...prev, [label]: message }));
    setForceShow((prev) => {
      if (prev.has(label)) return prev;
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  }, []);

  const clearErrors = useCallback((labels: string[]) => {
    setErrorsState((prev) => {
      let changed = false;
      const next: ErrorMap = { ...prev };
      for (const l of labels) {
        if (l in next) {
          delete next[l];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setForceShow((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const l of labels) {
        if (next.delete(l)) changed = true;
      }
      return changed ? next : prev;
    });
  }, []);

  const clearAll = useCallback(() => {
    setErrorsState({});
    setForceShow(new Set());
  }, []);

  const markTouched = useCallback((label: string) => {
    setTouched((prev) => {
      if (prev.has(label)) return prev;
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  }, []);

  const markAllTouched = useCallback((labels: string[]) => {
    setTouched((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const l of labels) {
        if (!next.has(l)) {
          next.add(l);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const resetTouched = useCallback(() => {
    setTouched(new Set());
  }, []);

  const forceShowLabels = useCallback((labels: string[]) => {
    setForceShow((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const l of labels) {
        if (!next.has(l)) {
          next.add(l);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const clearForceShow = useCallback(() => {
    setForceShow(new Set());
  }, []);

  const value = useMemo<ValidationApi>(
    () => ({
      errors,
      setErrors,
      setError,
      clearErrors,
      clearAll,
      touched,
      markTouched,
      markAllTouched,
      resetTouched,
      forceShow,
      forceShowLabels,
      clearForceShow,
    }),
    [
      errors,
      setErrors,
      setError,
      clearErrors,
      clearAll,
      touched,
      markTouched,
      markAllTouched,
      resetTouched,
      forceShow,
      forceShowLabels,
      clearForceShow,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useValidation(): ValidationApi {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useValidation must be used inside <ValidationProvider>");
  }
  return ctx;
}

/** Returns null when no provider is present (e.g. Field used outside the form). */
export function useValidationOptional(): ValidationApi | null {
  return useContext(Ctx);
}
