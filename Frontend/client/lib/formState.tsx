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
};

const Ctx = createContext<FormStateCtx | null>(null);

export function FormStateProvider({ children }: { children: ReactNode }) {
  const values = useRef<Record<string, unknown>>({});
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
    <Ctx.Provider value={{ values, set }}>{children}</Ctx.Provider>
  );
}

export function useFormStateOptional(): FormStateCtx | null {
  return useContext(Ctx);
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
