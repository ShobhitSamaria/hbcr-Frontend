export type Patient = {
  id: string;
  name: string;
  age: string;
  gender: string;
  hospital: string;
  diagnosis: string;
  stage: string;
  status: string;
  date: string;
  color: string;
};

export type ChartDatum = { month: string; value: number };

const patients: Patient[] = [
  {
    id: "HBCR-2024-0184",
    name: "Anita Sharma",
    age: "54 Years 2 Months",
    gender: "Female",
    hospital: "AIIMS Delhi",
    diagnosis: "Breast carcinoma",
    stage: "IIA",
    status: "Active",
    date: "18 Jun 2024",
    color: "bg-rose-100 text-rose-600",
  },
  {
    id: "HBCR-2024-0183",
    name: "Rajesh Kumar",
    age: "67 Years 8 Months",
    gender: "Male",
    hospital: "Tata Memorial",
    diagnosis: "Lung carcinoma",
    stage: "III B",
    status: "Pending",
    date: "17 Jun 2024",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "HBCR-2024-0182",
    name: "Meena Patel",
    age: "42 Years 5 Months",
    gender: "Female",
    hospital: "Civil Hospital",
    diagnosis: "Cervical cancer",
    stage: "IIB",
    status: "Active",
    date: "16 Jun 2024",
    color: "bg-violet-100 text-violet-600",
  },
  {
    id: "HBCR-2024-0181",
    name: "Suresh Nair",
    age: "71 Years 1 Month",
    gender: "Male",
    hospital: "KEM Hospital",
    diagnosis: "Prostate cancer",
    stage: "IV",
    status: "Completed",
    date: "15 Jun 2024",
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "HBCR-2024-0180",
    name: "Fatima Begum",
    age: "49 Years 10 Months",
    gender: "Female",
    hospital: "AIIMS Delhi",
    diagnosis: "Ovarian carcinoma",
    stage: "III A",
    status: "Active",
    date: "14 Jun 2024",
    color: "bg-emerald-100 text-emerald-600",
  },
];

const chartData: ChartDatum[] = [
  { month: "Jan", value: 32 },
  { month: "Feb", value: 45 },
  { month: "Mar", value: 38 },
  { month: "Apr", value: 57 },
  { month: "May", value: 49 },
  { month: "Jun", value: 68 },
];

export const stepLabels = [
  "Identifying information",
  "Diagnostic details",
  "Clinical stage & treatment",
];

export const treatmentRows = [
  "Surgery",
  "Radiotherapy 1",
  "Radiotherapy 2",
  "Chemotherapy 1",
  "Chemotherapy 2",
  "Hormone Therapy",
  "Targeted Therapy",
  "Others",
];

const treatmentOptions = {
  intention: ["Curative", "Palliative", "Symptomatic", "Unknown"],
  role: ["Neo Adjuvant", "Definitive", "Concurrent", "Unknown"],
  details: ["Completed Treatment", "Incomplete Treatment"],
};

export const pageTitles: Record<string, string> = {
  dashboard: "Registry overview",
  register: "Patient registration",
  records: "Patient records",
  followup: "Follow-up records",
  drafts: "Drafts",
};
