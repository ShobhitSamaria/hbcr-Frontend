import { useState } from "react";
import { Field, SelectField } from "../FormFields";
import { useFormStateOptional } from "@/lib/formState";

export function CodingDetails() {  
  const ctx = useFormStateOptional();
const [laterality, setLaterality] = useState(
  (ctx?.values.current["25. Laterality"] as string) || "Not a Paired Site"
);
  const [pairedSite, setPairedSite] = useState(
  (ctx?.values.current["25(a). pairedLaterality"] as string) || ""
);
  return ( 
    <div className="space-y-6 border-t border-[#edf3f4] pt-6">
      <div>
        <label className="mb-3 block text-xs font-bold text-[#486b77]">
          23. Coding According to ICD-O-3
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="23(a). Primary Site of Tumour - Topography"
            placeholder="Enter topography"
            required
          />
          <Field
            label="23(b). Primary Histology - Morphology"
            placeholder="Enter morphology"
            required
          />
          <Field
            label="23(c). Secondary Site of Tumour"
            placeholder="Enter secondary site"
          />
          <Field
            label="23(d). Morphology of Metastasis"
            placeholder="Enter metastatic morphology"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-1">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold text-[#5d7a84]">
            24. Site of Tumour (ICD-10)
          </span>
          <Field
            label="Enter ICD-10 site"
            placeholder="Enter metastatic morphology"
          />
          {/* <input
            required
            placeholder="Enter ICD-10 site"
            className="h-10 w-full rounded-lg border border-[#dce9eb] bg-[#fbfdfd] px-3 text-xs text-[#244c5b] outline-none transition placeholder:text-[#afc0c4] focus:border-[#36a99c] focus:ring-2 focus:ring-[#36a99c]/10"
          /> */}
          <span className="mt-1 block text-[10px] text-[#96aab0]">
            Include sub-site if any.
          </span>
        </label>
        <div>
          <label className="mb-3 block text-xs font-bold text-[#486b77]">
            25. Laterality
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
        required
        options={[
          "Select sequence",
          "One Primary Only",
          "First of Two or More Primaries",
          "Second of Two or More Primaries",
          "Third of Three or More Primaries",
          "Unspecified Sequence Number (Unknown)",
        ]}
      />
    </div>
  );
}
