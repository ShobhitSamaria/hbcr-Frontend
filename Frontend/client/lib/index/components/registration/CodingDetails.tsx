import { useRef, useState } from "react";
import { Field, SelectField } from "../FormFields";
import { useFormStateOptional } from "@/lib/formState";
import { useValidationOptional } from "@/lib/validationContext";
import { icd10Api } from "@/lib/api";
import { IcdoAutocomplete } from "./IcdoAutocomplete";
import { Icdo10Autocomplete } from "./Icdo10Autocomplete";

export function CodingDetails() {  
  const ctx = useFormStateOptional();
  const validation = useValidationOptional();
const [laterality, setLaterality] = useState(
  (ctx?.values.current["25. Laterality"] as string) || "Not a Paired Site"
);
  const [pairedSite, setPairedSite] = useState(
  (ctx?.values.current["25(a). pairedLaterality"] as string) || ""
);
  // Code values are lifted here so a picked autocomplete suggestion can
  // update the visible Code field (Field only reads its initial value on
  // mount; it does not subscribe to form-state changes).
  const [code1, setCode1] = useState(
    (ctx?.values.current["23.1 Code"] as string) || "",
  );
  const [code2, setCode2] = useState(
    (ctx?.values.current["23.2 Code"] as string) || "",
  );
  const [code3, setCode3] = useState(
    (ctx?.values.current["23.3 Code"] as string) || "",
  );
  const [code4, setCode4] = useState(
    (ctx?.values.current["23.4 Code"] as string) || "",
  );
  // ICD-10 site suggestion for field 24, derived from the 23.1 Topography
  // selection. Only 23.1 (primary site) triggers the mapping — never
  // morphology (23.2/23.4) or the secondary site (23.3).
  const [icd10Suggestion, setIcd10Suggestion] = useState<{
    code: string;
    name: string;
  } | null>(null);
  // Guards against stale responses when the user quickly picks two codes.
  const mapReqRef = useRef(0);

  const handleTopographySelect = (h: { code: string; term: string }) => {
    setCode1(h.code);
    const id = ++mapReqRef.current;
    icd10Api
      .mapTopography(h.code)
      .then((m) => {
        if (mapReqRef.current !== id) return;
        setIcd10Suggestion(
          m ? { code: m.icd10Code, name: m.icdo3Term } : null,
        );
      })
      .catch(() => {
        if (mapReqRef.current !== id) return;
        setIcd10Suggestion(null); // lookup failed → no suggestion
      });
  };
  return ( 
    <div className="space-y-6 border-t border-[#edf3f4] pt-6">
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          23. Coding According to ICD-O-3
        </label>

        {/* 23.1 Primary Site of Tumour - Topography */}
        <div className="mt-4 space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <IcdoAutocomplete
              label="23.1 Primary Site of Tumour - Topography"
              placeholder="Search by code or site name"
              termKey="23.1 Site"
              codeKey="23.1 Code"
              section="topography"
              onSelect={handleTopographySelect}
            />
            <Field
              label="Code"
              stateKey="23.1 Code"
              value={code1}
              onChange={setCode1}
              placeholder="Enter ICD-O-3 topography code"
            />
          </div>
        </div>

        {/* 23.2 Primary Histology - Morphology */}
        <div className="mt-4 space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <IcdoAutocomplete
              label="23.2 Primary Histology - Morphology"
              placeholder="Search by code or morphology name"
              termKey="23.2 Morphology"
              codeKey="23.2 Code"
              section="morphology"
              onSelect={(h) => setCode2(h.code)}
            />
            <Field
              label="Code"
              stateKey="23.2 Code"
              value={code2}
              onChange={setCode2}
              placeholder="Enter ICD-O-3 morphology code"
            />
            <SelectField
              label="23.2 Grade"
              options={["Grade I - Well Differentiated", "Grade II - Moderately Differentiated", "Grade III - Poorly Differentiated", "Grade IV - Undifferentiated"]}
            />
          </div>
        </div>

        {/* 23.3 Secondary Site of Tumour */}
        <div className="mt-4 space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <IcdoAutocomplete
              label="23.3 Secondary Site of Tumour"
              placeholder="Search by code or site name"
              termKey="23.3 Site"
              codeKey="23.3 Code"
              section="topography"
              onSelect={(h) => setCode3(h.code)}
            />
            <Field
              label="Code"
              stateKey="23.3 Code"
              value={code3}
              onChange={setCode3}
              placeholder="Enter secondary site code"
            />
          </div>
        </div>

        {/* 23.4 Morphology of Metastasis */}
        <div className="mt-4 space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <IcdoAutocomplete
              label="23.4 Morphology of Metastasis"
              placeholder="Search by code or morphology name"
              termKey="23.4 Morphology"
              codeKey="23.4 Code"
              section="morphology"
              onSelect={(h) => setCode4(h.code)}
            />
            <Field
              label="Code"
              stateKey="23.4 Code"
              value={code4}
              onChange={setCode4}
              placeholder="Enter metastasis morphology code"
            />
            <SelectField
              label="23.4 Grade"
              options={["Grade I - Well Differentiated", "Grade II - Moderately Differentiated", "Grade III - Poorly Differentiated", "Grade IV - Undifferentiated"]}
            />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-1">
        <div className="block">
          <Icdo10Autocomplete
            label="24. Site of Tumour (ICD-10)"
            placeholder="Search by ICD-10 code or site name"
            stateKey="24. Site of Tumour (ICD-10)"
            suggestion={icd10Suggestion}
          />
          <span className="mt-1 block text-[10px] text-[#96aab0]">
            Include sub-site if any.
          </span>
        </div>
        <div>
          <label className="mb-3 block text-xs font-bold text-[#486b77]">
            25. Laterality<span className="ml-0.5 text-[#d04a4a]">*</span>
          </label>
          <div className="flex flex-wrap gap-4 text-xs text-[#718991]">
            {["Not a Paired Site", "Paired Site", "Unknown"].map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="laterality"
                  checked={laterality === option}
                  onChange={() => {
                    setLaterality(option);
                    ctx?.set("25. Laterality", option);
                  }}
                  className="accent-[#0b7d87]"
                />
                {option}
              </label>
            ))}
          </div>
          {validation?.errors["25. Laterality"] && (validation.forceShow.has("25. Laterality") || validation.touched.has("25. Laterality")) && (
            <p className="mt-1.5 text-[11px] font-medium text-[#d04a4a]">
              {validation.errors["25. Laterality"]}
            </p>
          )}
          {laterality === "Paired Site" && (
            <div className="mt-4 flex flex-col gap-2 text-xs text-[#718991]">
              {[
                "Right",
                "Left",
                "Only One Side Involved (Right/Left Origin Unknown)",
                "Bilateral Involvement (Laterality Origin Unknown)",
                "Paired Site Midline Tumour",
                "Paired Site, Laterality Unknown",
              ].map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paired-laterality"
                    checked={pairedSite === option}
                    onChange={() => {
                      setPairedSite(option);
                      ctx?.set("25(a). pairedLaterality", option);
                    }}
                    required
                    className="accent-[#0b7d87]"
                  />
                  {option}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <SelectField
        label="26. Sequence"
        options={["One Primary Only",
          "First of Two or More Primaries",
          "Second of Two or More Primaries",
          "Third of Three or More Primaries",
          "Unspecified Sequence Number (Unknown)",
        ]}
      />
    </div>
  );
}
