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
};

const Ctx = createContext<FormStateCtx | null>(null);

export function FormStateProvider({
  children,
  readOnlyFields,
  initialValues,
}: {
  children: ReactNode;
  readOnlyFields?: Set<string>;
  initialValues?: Record<string, unknown>;
}) {
  const values = useRef<Record<string, unknown>>(initialValues ?? {});
  // We use a tiny notification stream to re-render widgets that want live
  // previews. For our purposes only the orchestrator needs reactivity, but
  // we provide a simple refresh hook so future widgets can subscribe too.
  const listeners = useRef<Set<Listener>>(new Set());
  const set = useCallback((label: string, value: unknown) => {
    if (values.current[label] === value) return;
    values.current[label] = value;
    listeners.current.forEach((fn) => fn());
  }, []);
  useEffect(() => () => listeners.current.clear(), []);
  return (
    <Ctx.Provider value={{ values, set, readOnlyFields }}>{children}</Ctx.Provider>
  );
}

export function useFormStateOptional(): FormStateCtx | null {
  return useContext(Ctx);
}

/** Check if a field label is in the read-only set. */
export function useIsFieldReadOnly(label: string): boolean {
  const ctx = useContext(Ctx);
  if (!ctx?.readOnlyFields) return false;
  return ctx.readOnlyFields.has(label);
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
