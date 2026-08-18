import { useEffect, useRef, useState } from "react";
import { icdoApi, type IcdoMorphologyHit, type IcdoTopographyHit } from "@/lib/api";
import { useFormStateOptional } from "@/lib/formState";
import { useValidationOptional } from "@/lib/validationContext";

type Hit = { code: string; term: string; synonyms: string[] };

type Props = {
  /** Visible label (e.g. "23.1 Primary Site of Tumour - Topography"). */
  label: string;
  placeholder?: string;
  /** Form-state key for the term/site value (e.g. "23.1 Site"). */
  termKey: string;
  /** Form-state key for the code value (e.g. "23.1 Code"). */
  codeKey: string;
  /** Which ICD-O-3 list to search: C-codes or xxxx/x morphology codes. */
  section: "topography" | "morphology";
  /** Called with the picked entry so the parent can sync the Code field. */
  onSelect?: (hit: { code: string; term: string }) => void;
};

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 8;

/**
 * Autocomplete input backed by the /api/icdo lookup endpoints. Searches by
 * code OR term (the backend matches code prefixes and every word of the
 * query against term + synonyms). Picking a suggestion fills BOTH the term
 * field (`termKey`) and the code field (`codeKey`) in the form state, so the
 * existing payload mapping (hbcrForm) saves them unchanged.
 */
export function IcdoAutocomplete({
  label,
  placeholder,
  termKey,
  codeKey,
  section,
  onSelect,
}: Props) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();

  const [value, setValue] = useState<string>(() =>
    ctx ? String(ctx.values.current[termKey] ?? "") : "",
  );
  const [suggestions, setSuggestions] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  // Monotonic request id so only the latest in-flight response is applied.
  const reqRef = useRef(0);

  const errorMsg = validation?.errors[termKey];
  const shouldShow =
    errorMsg &&
    (validation.forceShow.has(termKey) || validation.touched.has(termKey));

  const runSearch = (q: string) => {
    const id = ++reqRef.current;
    const promise =
      section === "topography"
        ? icdoApi.topography(q, SUGGESTION_LIMIT)
        : icdoApi.morphology(q, SUGGESTION_LIMIT);
    promise
      .then((hits) => {
        if (reqRef.current !== id) return;
        setSuggestions(hits);
        setActive(hits.length > 0 ? 0 : -1);
        setOpen(hits.length > 0);
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

  const pick = (hit: Hit) => {
    setValue(hit.term);
    if (ctx) {
      ctx.set(termKey, hit.term);
      ctx.set(codeKey, hit.code);
    }
    onSelect?.({ code: hit.code, term: hit.term });
    setOpen(false);
    setSuggestions([]);
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
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            if (ctx) ctx.set(termKey, v);
            if (validation && errorMsg && v.trim() !== "") {
              validation.clearErrors([termKey]);
            }
            scheduleSearch(v);
          }}
          onBlur={() => {
            validation?.markTouched(termKey);
          }}
          onKeyDown={onKeyDown}
          aria-invalid={shouldShow ? true : undefined}
          data-error={shouldShow ? "true" : undefined}
          className={
            "h-10 w-full rounded-lg border bg-[#fbfdfd] px-3 text-xs text-[#244c5b] outline-none transition placeholder:text-[#afc0c4] focus:ring-2 " +
            (shouldShow
              ? "border-[#d04a4a] focus:border-[#d04a4a] focus:ring-[#d04a4a]/15"
              : "border-[#dce9eb] focus:border-[#36a99c] focus:ring-[#36a99c]/10")
          }
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#dce9eb] bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <button
                key={s.code + "::" + s.term}
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
                <span className="text-xs font-bold text-[#0b7d87]">{s.code}</span>
                <span className="ml-2 text-xs text-[#244c5b]">{s.term}</span>
                {s.synonyms.length > 0 && (
                  <span className="block truncate text-[10px] text-[#96aab0]">
                    {s.synonyms.slice(0, 3).join(" · ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {shouldShow && (
        <span className="mt-1 block text-[10px] font-medium text-[#d04a4a]">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
