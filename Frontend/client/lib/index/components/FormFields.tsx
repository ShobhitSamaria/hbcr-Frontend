import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useFormStateOptional } from "@/lib/formState";
import { useValidationOptional } from "@/lib/validationContext";

type FieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  name?: string;
};

export function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  name,
}: FieldProps) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
  // If context is available, derive an initial value to keep things in sync
  // for the very first render (subsequent renders use the controlled `value`).
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
      // Clear stale error the moment the user starts fixing it.
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
      <input
        required={required}
        type={type}
        value={displayValue}
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
            : "border-[#dce9eb] focus:border-[#36a99c] focus:ring-[#36a99c]/10")
        }
      />
      {shouldShow && (
        <span className="mt-1 block text-[10px] font-medium text-[#d04a4a]">
          {errorMsg}
        </span>
      )}
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  options: string[];
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  name?: string;
};

export function SelectField({
  label,
  options,
  value,
  onChange,
  required = false,
  name,
}: SelectFieldProps) {
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
      <div className="relative">
        <select
          required={required}
          value={displayValue}
          onChange={(e) => handle(e.target.value)}
          onBlur={onBlur}
          name={name ?? label}
          aria-invalid={shouldShow ? true : undefined}
          data-error={shouldShow ? "true" : undefined}
          className={
            "h-10 w-full appearance-none rounded-lg border bg-[#fbfdfd] px-3 text-xs outline-none " +
            (shouldShow
              ? "border-[#d04a4a] text-[#d04a4a] focus:border-[#d04a4a]"
              : "border-[#dce9eb] text-[#6e8790] focus:border-[#36a99c]")
          }
        >
          {options.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className={
            "pointer-events-none absolute right-3 top-3 " +
            (shouldShow ? "text-[#d04a4a]" : "text-[#9aafb5]")
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
};

export function ToggleDetails({ title, items }: ToggleDetailsProps) {
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const base = Object.fromEntries(items.map((item) => [item, "No"]));
    if (!ctx) return base;
    for (const item of items) {
      const cur = ctx.values.current[`${title}::${item}::answer`];
      if (typeof cur === "string") base[item] = cur;
    }
    return base;
  });
  const handle = (key: string, v: string) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    if (ctx) ctx.set(`${title}::${key}::answer`, v);
    if (validation) {
      validation.clearErrors([`${title}::${key}::answer`]);
    }
  };
  return (
    <div>
      <label className="mb-3 block text-xs font-bold text-[#486b77]">
        {title}
      </label>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718991]"
          >
            <span className="w-40">{item}</span>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name={title + item}
                checked={answers[item] === "Yes"}
                onChange={() => handle(item, "Yes")}
                className="accent-[#0b7d87]"
              />
              Yes
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name={title + item}
                checked={answers[item] === "No"}
                onChange={() => handle(item, "No")}
                className="accent-[#0b7d87]"
              />
              No
            </label>
            <input
              placeholder="Duration (Months)"
              type="number"
              className="h-8 w-36 rounded-lg border border-[#dce9eb] bg-[#fbfdfd] px-2 text-[11px] outline-none focus:border-[#36a99c]"
            />
          </div>
        ))}
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
