/**
 * Lightweight form-state context used to gather the values entered across
 * the multi-step registration form. It does NOT change the visual behaviour
 * of `Field` / `SelectField`; they continue to work as before. When the
 * provider wraps them, each keystroke additionally writes into the context
 * keyed by `label`. The orchestrator then reads the captured values on
 * submit.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type Listener = () => void;

type FormStateCtx = {
  /** Mutable map of `field label -> current value`. */
  values: React.MutableRefObject<Record<string, unknown>>;
  set: (label: string, value: unknown) => void;
  /** When present, fields whose label is in this set are read-only. */
  readOnlyFields?: Set<string>;
  /** When true, ALL fields are forced read-only (view mode). */
  forceReadOnly?: boolean;
};

const Ctx = createContext<FormStateCtx | null>(null);

export function FormStateProvider({
  children,
  readOnlyFields,
  initialValues,
  forceReadOnly = false,
}: {
  children: ReactNode;
  readOnlyFields?: Set<string>;
  initialValues?: Record<string, unknown>;
  forceReadOnly?: boolean;
}) {
  const values = useRef<Record<string, unknown>>(initialValues ?? {});
  const listeners = useRef<Set<Listener>>(new Set());
  const set = useCallback((label: string, value: unknown) => {
    if (values.current[label] === value) return;
    values.current[label] = value;
    listeners.current.forEach((fn) => fn());
  }, []);
  // Sync ref when initialValues prop changes (e.g., after async data load).
  // Must be synchronous during render so children's useState initializers
  // and useEffect sync hooks see the values immediately.
  if (initialValues) {
    for (const [k, v] of Object.entries(initialValues)) {
      if (values.current[k] !== v) values.current[k] = v;
    }
  }
  useEffect(() => () => listeners.current.clear(), []);
  return (
    <Ctx.Provider value={{ values, set, readOnlyFields, forceReadOnly }}>{children}</Ctx.Provider>
  );
}

export function useFormStateOptional(): FormStateCtx | null {
  return useContext(Ctx);
}

/** Check if a field label is in the read-only set, or if forceReadOnly is on. */
export function useIsFieldReadOnly(label: string): boolean {
  const ctx = useContext(Ctx);
  if (!ctx) return false;
  if (ctx.forceReadOnly) return true;
  if (!ctx.readOnlyFields) return false;
  return ctx.readOnlyFields.has(label);
}

/** Returns true when the form is in view/read-only mode (forceReadOnly). */
export function useForceReadOnly(): boolean {
  const ctx = useContext(Ctx);
  return ctx?.forceReadOnly === true;
}

/**
 * Returns a snapshot of the captured values. Call this from the orchestrator
 * at submit / save time.
 */
function useFormSnapshot(): () => Record<string, unknown> {
  const ctx = useContext(Ctx);
  if (!ctx) return () => ({});
  return () => ({ ...ctx.values.current });
}

function useFormSetter() {
  const ctx = useContext(Ctx);
  return ctx?.set ?? (() => {});
}
