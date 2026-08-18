import { useEffect, useRef, useState } from "react";
import { icd10Api, type Icdo10Hit } from "@/lib/api";
import { useFormStateOptional } from "@/lib/formState";
import { useValidationOptional } from "@/lib/validationContext";

type Suggestion = { code: string; name: string } | null;

type Props = {
  /** Visible label (e.g. "24. Site of Tumour (ICD-10)"). */
  label: string;
  placeholder?: string;
  /** Form-state key the picked ICD-10 code is saved under. */
  stateKey: string;
  /**
   * Optional ICD-10 site suggestion auto-populated from the 23.1 Topography
   * selection. The value is reviewable/editable like any manual input; the
   * moment the user types, the "suggested" hint clears. null/undefined shows
   * no suggestion.
   */
  suggestion?: Suggestion;
  /**
   * Optional change callback fired with the current text/code whenever the
   * value changes (manual typing, suggestion apply or dropdown pick). Lets
   * callers outside the registration form context keep their own state in
   * sync — the component itself is unchanged when omitted.
   */
  onChange?: (code: string) => void;
  /** When true the input is not editable (used to keep the field visible but
   *  disabled when its parent condition is not currently applicable). */
  disabled?: boolean;
};

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 8;
// Rules are excluded from the site lookup.
const SEARCH_TYPES = "range,code,example";

/**
 * Autocomplete input backed by /api/icd10/search. Suggestions show only the
 * ICD-10 code and its workbook description (range category name or the worked
 * example that mentions it) — no internal kind/example/rule metadata. Picking
 * one stores the concrete code (e.g. "C71" or "C71.9").
 */
export function Icdo10Autocomplete({ label, placeholder, stateKey, suggestion, onChange, disabled = false }: Props) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();

  const [value, setValue] = useState<string>(() =>
    ctx ? String(ctx.values.current[stateKey] ?? "") : "",
  );
  const [suggestions, setSuggestions] = useState<Icdo10Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** Currently applied suggestion (code + site name) for the hint line. */
  const [applied, setApplied] = useState<Suggestion>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  // Monotonic request id so only the latest in-flight response is applied.
  const reqRef = useRef(0);
  // Tracks the last suggestion applied so identical suggestions don't
  // re-clobber a value the user may have typed in the meantime.
  const appliedKeyRef = useRef<string>("");

  // Auto-populate when a new topography-derived suggestion arrives. The user
  // can review and change it; typing clears the "suggested" hint.
  useEffect(() => {
    const key = suggestion ? `${suggestion.code}::${suggestion.name}` : "";
    if (key === appliedKeyRef.current) return;
    appliedKeyRef.current = key;
    if (suggestion && suggestion.code) {
      setValue(suggestion.code);
      if (ctx) ctx.set(stateKey, suggestion.code);
      if (validation && errorMsg) validation.clearErrors([stateKey]);
      setApplied(suggestion);
      onChange?.(suggestion.code);
    } else {
      setApplied(null);
    }
  }, [suggestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const errorMsg = validation?.errors[stateKey];
  const shouldShow =
    errorMsg &&
    (validation.forceShow.has(stateKey) || validation.touched.has(stateKey));

  const runSearch = (q: string) => {
    const id = ++reqRef.current;
    icd10Api
      .search(q, { type: SEARCH_TYPES, limit: SUGGESTION_LIMIT })
      .then((hits) => {
        if (reqRef.current !== id) return;
        // Keep only entries with a concrete selectable code, deduped by
        // code + description (a worked example's mention and its row can both
        // match the same query).
        const seen = new Set<string>();
        const usable: Icdo10Hit[] = [];
        for (const h of hits) {
          if (h.code === null) continue;
          const key = `${h.code}::${h.description}`;
          if (seen.has(key)) continue;
          seen.add(key);
          usable.push(h);
        }
        setSuggestions(usable);
        setActive(usable.length > 0 ? 0 : -1);
        setOpen(usable.length > 0);
      })
      .catch(() => {
        if (reqRef.current !== id) return;
        setSuggestions([]);
        setOpen(false);
      });
  };

  const scheduleSearch = (q: string) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (q.trim().length < MIN_QUERY) {
      ++reqRef.current; // invalidate any in-flight request
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = window.setTimeout(() => runSearch(q.trim()), DEBOUNCE_MS);
  };

  const pick = (hit: Icdo10Hit) => {
    if (hit.code === null) return;
    setValue(hit.code);
    if (ctx) ctx.set(stateKey, hit.code);
    if (validation && errorMsg) validation.clearErrors([stateKey]);
    setOpen(false);
    setSuggestions([]);
    onChange?.(hit.code);
  };

  // Close the dropdown on outside clicks.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Clear pending timers on unmount.
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      ++reqRef.current;
    },
    [],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = suggestions[active >= 0 ? active : 0];
      if (hit) pick(hit);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
        {label}
      </span>
      <div className="relative" ref={containerRef}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            // Manual typing takes over from any topography-derived suggestion.
            if (applied) setApplied(null);
            if (ctx) ctx.set(stateKey, v);
            if (validation && errorMsg && v.trim() !== "") {
              validation.clearErrors([stateKey]);
            }
            scheduleSearch(v);
            onChange?.(v);
          }}
          onBlur={() => {
            validation?.markTouched(stateKey);
          }}
          onKeyDown={onKeyDown}
          aria-invalid={shouldShow ? true : undefined}
          data-error={shouldShow ? "true" : undefined}
          className={
            "h-10 w-full rounded-lg border bg-[#fbfdfd] px-3 text-xs text-[#244c5b] outline-none transition placeholder:text-[#afc0c4] focus:ring-2 " +
            (shouldShow
              ? "border-[#d04a4a] focus:border-[#d04a4a] focus:ring-[#d04a4a]/15"
              : "border-[#dce9eb] focus:border-[#36a99c] focus:ring-[#36a99c]/10") +
            (disabled ? " cursor-not-allowed bg-[#eef2f3] text-[#9aafb5]" : "")
          }
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#dce9eb] bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <button
                key={`${s.code}::${s.description}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={
                  "block w-full px-3 py-2 text-left " +
                  (i === active ? "bg-[#eef8f7]" : "hover:bg-[#f4f9f9]")
                }
              >
                <span className="flex items-baseline gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-[#0b7d87]">
                    {s.code}
                  </span>
                  <span aria-hidden className="shrink-0 text-xs text-[#96aab0]">
                    —
                  </span>
                  <span className="truncate text-xs text-[#244c5b]">
                    {s.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {applied && !shouldShow && (
        <span className="mt-1 block text-[10px] font-medium text-[#0b7d87]">
          Suggested from 23.1 (Topography): {applied.code} — {applied.name}
        </span>
      )}
      {shouldShow && (
        <span className="mt-1 block text-[10px] font-medium text-[#d04a4a]">
          {errorMsg}
        </span>
      )}
    </div>
  );
}


