import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useFormStateOptional, useIsFieldReadOnly } from "@/lib/formState";
import { useValidationOptional } from "@/lib/validationContext";

type FieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  name?: string;
  maxLength?: number;
  /**
   * Form-state/validation key override. Defaults to `label`, which keeps the
   * existing behaviour; components that want a prettier visible label than
   * the pipeline's state key (e.g. several fields labelled "Code" that must
   * persist under "23.1 Code") pass an explicit `stateKey`.
   */
  stateKey?: string;
};

export function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  readOnly = false,
  disabled = false,
  name,
  maxLength,
  stateKey,
}: FieldProps) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
  const key = stateKey ?? label;
  const isReadOnlyByContext = useIsFieldReadOnly(key);
  const effectiveReadOnly = readOnly || isReadOnlyByContext;
  // If context is available, derive an initial value to keep things in sync
  // for the very first render (subsequent renders use the controlled `value`).
  const initial = ctx
    ? ((ctx.values.current[key] as string | undefined) ?? "")
    : undefined;
  const [innerValue, setInnerValue] = useState<string>(initial ?? "");
  const isControlled = value !== undefined;
  const displayValue = isControlled ? (value ?? "") : innerValue;
  const errorMsg = validation?.errors[key];
  const shouldShow = errorMsg && (validation.forceShow.has(key) || validation.touched.has(key));
  const handle = (v: string) => {
    if (ctx) ctx.set(key, v);
    if (!isControlled) setInnerValue(v);
    onChange?.(v);
    if (validation && errorMsg && v.trim() !== "") {
      // Clear stale error the moment the user starts fixing it.
      validation.clearErrors([key]);
    }
  };
  const onBlur = () => {
    validation?.markTouched(key);
  };
  return (
    <div className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
        {label}{required && <span className="ml-0.5 text-[#d04a4a]">*</span>}
      </span>
      <input
        required={required}
        type={type}
        value={displayValue}
        readOnly={effectiveReadOnly}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(e) => handle(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        name={name ?? label}
        aria-invalid={shouldShow ? true : undefined}
        data-error={shouldShow ? "true" : undefined}
        className={
          "h-10 w-full rounded-lg border bg-[#fbfdfd] px-3 text-xs text-[#244c5b] outline-none transition placeholder:text-[#afc0c4] focus:ring-2 " +
          (shouldShow
            ? "border-[#d04a4a] focus:border-[#d04a4a] focus:ring-[#d04a4a]/15"
            : "border-[#dce9eb] focus:border-[#36a99c] focus:ring-[#36a99c]/10") +
          (disabled ? " cursor-not-allowed bg-[#eef2f3] text-[#9aafb5]" : "") +
          (effectiveReadOnly && !disabled ? " cursor-not-allowed bg-[#f8fbfb] text-[#52707b]" : "")
        }
      />
      {shouldShow && (
        <span className="mt-1 block text-[10px] font-medium text-[#d04a4a]">
          {errorMsg}
        </span>
      )}
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  value?: string;
  onChange?: (v: string) => void;
  name?: string;
};

export function TextAreaField({
  label,
  placeholder,
  maxLength = 1000,
  rows = 3,
  value,
  onChange,
  name,
}: TextAreaFieldProps) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
  const initial = ctx
    ? ((ctx.values.current[label] as string | undefined) ?? "")
    : undefined;
  const [innerValue, setInnerValue] = useState<string>(initial ?? "");
  const isControlled = value !== undefined;
  const displayValue = isControlled ? (value ?? "") : innerValue;
  const errorMsg = validation?.errors[label];
  const shouldShow = errorMsg && (validation.forceShow.has(label) || validation.touched.has(label));
  const handle = (v: string) => {
    if (v.length > maxLength) return;
    if (ctx) ctx.set(label, v);
    if (!isControlled) setInnerValue(v);
    onChange?.(v);
    if (validation && errorMsg && v.trim() !== "") {
      validation.clearErrors([label]);
    }
  };
  const onBlur = () => {
    validation?.markTouched(label);
  };
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
        {label}
      </span>
      <textarea
        value={displayValue}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => handle(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        name={name ?? label}
        aria-invalid={shouldShow ? true : undefined}
        data-error={shouldShow ? "true" : undefined}
        className={
          "w-full resize-y rounded-lg border bg-[#fbfdfd] px-3 py-2 text-xs text-[#244c5b] outline-none transition placeholder:text-[#afc0c4] focus:ring-2 " +
          (shouldShow
            ? "border-[#d04a4a] focus:border-[#d04a4a] focus:ring-[#d04a4a]/15"
            : "border-[#dce9eb] focus:border-[#36a99c] focus:ring-[#36a99c]/10")
        }
      />
      <span className="mt-1 block text-right text-[10px] text-[#96aab0]">
        {displayValue.length}/{maxLength}
      </span>
      {shouldShow && (
        <span className="mt-1 block text-[10px] font-medium text-[#d04a4a]">
          {errorMsg}
        </span>
      )}
    </label>
  );
}

type SelectOption = string | { value: string; label: string };

type SelectFieldProps = {
  label: string;
  /** Plain strings (value = label) or { value, label } pairs. */
  options: SelectOption[];
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  name?: string;
  /** When true the select is not editable (used to keep fields visible but
   *  disabled when their parent condition is not currently applicable). */
  disabled?: boolean;
  /** Placeholder text shown as the first, unselected option. Defaults to "Select". */
  placeholder?: string;
};

export function SelectField({
  label,
  options,
  value,
  onChange,
  required = false,
  name,
  disabled = false,
  placeholder = "Select",
}: SelectFieldProps) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
  const isReadOnlyByContext = useIsFieldReadOnly(label);
  const effectiveDisabled = disabled || isReadOnlyByContext;
  const initial = ctx
    ? ((ctx.values.current[label] as string | undefined) ?? "")
    : undefined;
  const [innerValue, setInnerValue] = useState<string>(initial ?? "");
  const isControlled = value !== undefined;
  const displayValue = isControlled ? (value ?? "") : innerValue;
  const errorMsg = validation?.errors[label];
  const shouldShow = errorMsg && (validation.forceShow.has(label) || validation.touched.has(label));
  const handle = (v: string) => {
    if (ctx) ctx.set(label, v);
    if (!isControlled) setInnerValue(v);
    onChange?.(v);
    if (validation && errorMsg && v.trim() !== "") {
      validation.clearErrors([label]);
    }
  };
  const onBlur = () => {
    validation?.markTouched(label);
  };
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
        {label}{required && <span className="ml-0.5 text-[#d04a4a]">*</span>}
      </span>
      <div className="relative">
        <select
          required={required}
          value={displayValue}
          disabled={effectiveDisabled}
          onChange={(e) => handle(e.target.value)}
          onBlur={onBlur}
          name={name ?? label}
          aria-invalid={shouldShow ? true : undefined}
          data-error={shouldShow ? "true" : undefined}
          className={
            "h-10 w-full appearance-none rounded-lg border bg-[#fbfdfd] px-3 text-xs outline-none " +
            (shouldShow
              ? "border-[#d04a4a] text-[#d04a4a] focus:border-[#d04a4a]"
              : "border-[#dce9eb] focus:border-[#36a99c]") +
            (!displayValue ? " text-[#afc0c4]" : " text-[#6e8790]") +
            (effectiveDisabled && !disabled ? " cursor-not-allowed bg-[#f8fbfb]" : "") +
            (disabled ? " cursor-not-allowed bg-[#eef2f3] text-[#9aafb5]" : "")
          }
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((x) => {
            const opt =
              typeof x === "string" ? { value: x, label: x } : x;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={14}
          className={
            "pointer-events-none absolute right-3 top-3 " +
            (shouldShow ? "text-[#d04a4a]" : disabled ? "text-[#c6d3d7]" : "text-[#9aafb5]")
          }
        />
      </div>
      {shouldShow && (
        <span className="mt-1 block text-[10px] font-medium text-[#d04a4a]">
          {errorMsg}
        </span>
      )}
    </label>
  );
}

type ToggleDetailsProps = {
  title: string;
  items: string[];
  required?: boolean;
};

export function ToggleDetails({ title, items, required }: ToggleDetailsProps) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
  const isReadOnlyByContext = useIsFieldReadOnly(title);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const base = Object.fromEntries(items.map((item) => [item, "No"]));
    if (!ctx) return base;
    for (const item of items) {
      const cur = ctx.values.current[`${title}::${item}::answer`];
      if (typeof cur === "string") base[item] = cur;
    }
    return base;
  });
  const [durations, setDurations] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (!ctx) return base;
    for (const item of items) {
      const cur = ctx.values.current[`${title}::${item}::duration`];
      if (typeof cur === "string") base[item] = cur;
    }
    return base;
  });
  const handle = (key: string, v: string) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    if (ctx) ctx.set(`${title}::${key}::answer`, v);
    if (v === "No") {
      setDurations((d) => ({ ...d, [key]: "" }));
      if (ctx) ctx.set(`${title}::${key}::duration`, "");
    }
    if (validation) {
      validation.clearErrors([`${title}::${key}::answer`]);
      validation.clearErrors([`${title}::${key}::duration`]);
    }
  };
  const handleDuration = (key: string, v: string) => {
    setDurations((d) => ({ ...d, [key]: v }));
    if (ctx) ctx.set(`${title}::${key}::duration`, v);
    if (validation) {
      validation.clearErrors([`${title}::${key}::duration`]);
    }
  };
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        {title}{required && <span className="ml-0.5 text-[#d04a4a]">*</span>}
      </label>
      <div className="space-y-3">
        {items.map((item) => {
          const isYes = answers[item] === "Yes";
          const durationKey = `${title}::${item}::duration`;
          const durationError = validation?.errors[durationKey];
          const showDurationError = durationError && (validation.forceShow.has(durationKey) || validation.touched.has(durationKey));
          return (
            <div
              key={item}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718991]"
            >
              <span className="w-40">{item}</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={title + item}
                  checked={isYes}
                  onChange={() => handle(item, "Yes")}
                  className="accent-[#0b7d87]"
                  disabled={isReadOnlyByContext}
                />
                Yes
              </span>
              <span className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={title + item}
                  checked={answers[item] === "No"}
                  onChange={() => handle(item, "No")}
                  className="accent-[#0b7d87]"
                  disabled={isReadOnlyByContext}
                />
                No
              </span>
              <input
                placeholder="Duration (Months)"
                type="number"
                min="1"
                step="1"
                disabled={!isYes || isReadOnlyByContext}
                value={durations[item] ?? ""}
                onChange={(e) => handleDuration(item, e.target.value)}
                className={`h-8 w-36 rounded-lg border px-2 text-[11px] outline-none focus:ring-2 ${
                  showDurationError
                    ? "border-[#d04a4a] focus:border-[#d04a4a] focus:ring-[#d04a4a]/15"
                    : isYes
                      ? "border-[#dce9eb] bg-[#fbfdfd] focus:border-[#36a99c] focus:ring-[#36a99c]/10"
                      : "cursor-not-allowed border-[#dce9eb] bg-[#eef2f3] text-[#9aafb5]"
                }`}
              />
              {showDurationError && (
                <span className="block text-[10px] font-medium text-[#d04a4a]">
                  {durationError}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CheckGroupProps = {
  title: string;
  items: string[];
};

function CheckGroup({ title, items }: CheckGroupProps) {
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        {title}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((x) => (
          <label
            key={x}
            className="flex cursor-pointer items-center gap-2 text-xs text-[#718991]"
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-[#c9dce0] accent-[#0b7d87]"
            />
            {x}
          </label>
        ))}
      </div>
    </div>
  );
}
