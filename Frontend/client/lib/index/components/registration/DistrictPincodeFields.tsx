import { useEffect, useRef, useState } from "react";
import { pincodeApi } from "@/lib/api";
import { useFormStateOptional } from "@/lib/formState";
import { useValidationOptional } from "@/lib/validationContext";

type Props = {
  /** Prefix for form-state keys (e.g. "" for residential, "Permanent " for permanent). */
  prefix?: string;
};

/* ------------------------------------------------------------------ */
/*  Searchable dropdown — type to filter, click to select              */
/* ------------------------------------------------------------------ */
function SearchableSelect({
  label,
  required,
  options,
  value,
  onChange,
  disabled,
  placeholder,
  errorMessage,
  showError,
}: {
  label: string;
  required?: boolean;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  errorMessage?: string;
  showError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options against the typed query
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  const inputCls = showError
    ? "h-10 w-full rounded-lg border border-[#d04a4a] bg-[#fef2f2] px-3 text-xs text-[#244c5b] outline-none focus:border-[#d04a4a] focus:ring-2 focus:ring-[#d04a4a]/15"
    : disabled
      ? "h-10 w-full cursor-not-allowed rounded-lg border border-[#dce9eb] bg-[#f1f5f5] px-3 text-xs text-[#a9b8bc] outline-none"
      : "h-10 w-full rounded-lg border border-[#dce9eb] bg-[#fbfdfd] px-3 text-xs text-[#244c5b] outline-none transition focus:border-[#36a99c] focus:ring-2 focus:ring-[#36a99c]/10";

  const labelCls = showError
    ? "mb-1.5 block text-[11px] font-bold text-[#d04a4a]"
    : "mb-1.5 block text-[11px] font-bold text-[#5d7a84]";

  // Determine whether to open dropdown above or below the field
  const [dropUp, setDropUp] = useState(false);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Measure space below the input
    const rect = inputWrapRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 220); // 220px ≈ max dropdown height
    }
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-0.5 text-[#d04a4a]">*</span>}
      </label>

      {/* Trigger / input — relative so the absolute dropdown anchors here */}
      <div className="relative" ref={inputWrapRef}>
        {open && !disabled ? (
          <input
            ref={inputRef}
            type="text"
            className={inputCls}
            placeholder="Type to search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
              } else if (e.key === "Enter" && filtered.length === 1) {
                select(filtered[0]);
              } else if (e.key === "ArrowDown" && filtered.length > 0) {
                // Let user scroll
              }
            }}
            autoFocus
          />
        ) : (
          <input
            type="text"
            className={inputCls}
            readOnly
            value={value || ""}
            placeholder={placeholder || "Select"}
            disabled={disabled}
            onClick={() => {
              if (!disabled) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!disabled) setOpen(true);
              }
            }}
          />
        )}

        {/* Chevron */}
        {!disabled && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#96aab0]"
            tabIndex={-1}
            onClick={() => {
              if (!disabled) {
                setOpen(!open);
                setQuery("");
              }
            }}
          >
            {open ? "▲" : "▼"}
          </button>
        )}

        {/* Dropdown list — absolute overlay, never pushes layout */}
        {open && !disabled && (
          <div
            className={`absolute left-0 right-0 z-50 max-h-48 overflow-y-auto rounded-lg border border-[#dce9eb] bg-white shadow-lg ${
              dropUp ? "bottom-full mb-1" : "top-full mt-1"
            }`}
          >
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-[#96aab0]">
                No match found
              </div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`w-full px-3 py-2 text-left text-xs transition hover:bg-[#e7f4f5] ${
                  opt === value
                    ? "bg-[#e7f4f5] font-medium text-[#0b7d87]"
                    : "text-[#244c5b]"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  select(opt);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {showError && errorMessage && (
        <span className="mt-0.5 text-[10px] font-medium text-[#d04a4a]">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export function DistrictPincodeFields({ prefix = "" }: Props) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();

  const districtKey = prefix + "District";
  const pincodeKey = prefix + "PIN Code";
  const stateKey = prefix + "State";

  const [districts, setDistricts] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [district, setDistrict] = useState<string>(() => {
    const v = ctx?.values.current[districtKey];
    return typeof v === "string" ? v : "";
  });
  const [pincode, setPincode] = useState<string>(() => {
    const v = ctx?.values.current[pincodeKey];
    return typeof v === "string" ? v : "";
  });
  const [loadingPincodes, setLoadingPincodes] = useState(false);

  // Fetch districts on mount
  useEffect(() => {
    let cancelled = false;
    pincodeApi
      .getDistricts()
      .then((list) => {
        if (!cancelled) setDistricts(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Fetch pincodes when district changes
  useEffect(() => {
    if (!district) { setPincodes([]); return; }
    let cancelled = false;
    setLoadingPincodes(true);
    pincodeApi
      .getPincodesByDistrict(district)
      .then((list) => {
        if (!cancelled) {
          setPincodes(list);
          if (pincode && !list.includes(pincode)) {
            setPincode("");
            ctx?.set(pincodeKey, "");
          }
        }
      })
      .catch(() => { if (!cancelled) setPincodes([]); })
      .finally(() => { if (!cancelled) setLoadingPincodes(false); });
    return () => { cancelled = true; };
  }, [district]);

  const handleDistrict = (v: string) => {
    setDistrict(v);
    ctx?.set(districtKey, v);
    setPincode("");
    ctx?.set(pincodeKey, "");
    if (v) ctx?.set(stateKey, "RAJASTHAN");
    validation?.clearErrors([districtKey]);
    validation?.clearErrors([pincodeKey]);
  };

  const handlePincode = (v: string) => {
    setPincode(v);
    ctx?.set(pincodeKey, v);
    validation?.clearErrors([pincodeKey]);
  };

  const districtError = validation?.errors[districtKey];
  const pincodeError = validation?.errors[pincodeKey];
  const districtShow =
    districtError &&
    (validation.forceShow.has(districtKey) || validation.touched.has(districtKey));
  const pincodeShow =
    pincodeError &&
    (validation.forceShow.has(pincodeKey) || validation.touched.has(pincodeKey));

  return (
    <>
      <SearchableSelect
        label={prefix + "District"}
        required
        options={districts}
        value={district}
        onChange={handleDistrict}
        placeholder="Select district"
        errorMessage={districtError}
        showError={!!districtShow}
      />

      <SearchableSelect
        label={prefix + "PIN Code"}
        required
        options={pincodes}
        value={pincode}
        onChange={handlePincode}
        disabled={!district || loadingPincodes}
        placeholder={
          !district ? "Select district first" : loadingPincodes ? "Loading…" : "Select pincode"
        }
        errorMessage={pincodeError}
        showError={!!pincodeShow}
      />

      {/* State — auto-filled, read-only */}
      <div className="flex flex-col">
        <label className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
          {prefix}State
        </label>
        <input
          type="text"
          value={district ? "RAJASTHAN" : ""}
          readOnly
          className="h-10 w-full cursor-not-allowed rounded-lg border border-[#dce9eb] bg-[#f1f5f5] px-3 text-xs text-[#a9b8bc] outline-none"
          placeholder="Auto-filled on district selection"
        />
      </div>
    </>
  );
}
