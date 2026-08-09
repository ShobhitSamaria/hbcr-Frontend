/**
 * Typed API client for the HBCR backend.
 *
 * The base URL resolves at runtime so this works against the Vite dev proxy
 * (`/api/...`) or a direct backend host (`VITE_API_BASE`).
 *
 * Every function returns a `Result<T>` so the UI never has to wrap calls in
 * try/catch. Internally we map non-2xx responses to readable errors.
 */

export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      status: number;
      details?: unknown;
      fields?: { field?: string; message: string }[];
    };

const DEFAULT_BASE = (() => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE as string;
  }
  // When the Vite proxy is configured (dev), use relative /api so we don't
  // worry about ports. In production, point at the deployed host.
  return "/api";
})();

const API_BASE = DEFAULT_BASE;

class ApiError extends Error {
  status: number;
  details?: unknown;
  /**
   * When the backend responds with 422, the validator's per-field
   * `details` array (shape: `{ field, message }[]`) is kept here so the
   * form can highlight the offending field. For non-422 errors, this is
   * whatever the backend put under `error.details`.
   */
  fields?: { field?: string; message: string }[];
  constructor(
    message: string,
    status: number,
    details?: unknown,
    fields?: { field?: string; message: string }[],
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.fields = fields;
  }
}

async function call<T>(
  path: string,
  init: RequestInit = {},
): Promise<Result<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
  let body: any = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  if (res.ok && body?.success) {
    return { ok: true, data: body.data as T };
  }
  const message =
    (body?.error?.message as string) || res.statusText || "Request failed";
  const details = body?.error?.details;
  // Backend 422 responses put an array of { field, message } under
  // error.details. We surface that as `fields` so the form can highlight
  // individual inputs.
  const fields = Array.isArray(details) ? (details as { field?: string; message: string }[]) : undefined;
  return { ok: false, error: message, status: res.status, details: details, fields: fields };
}

async function send<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await call<T>(path, init);
  if (r.ok === false) throw new ApiError(r.error, r.status, r.details, r.fields);
  return r.data;
}

// ---------- Health ----------
export const healthApi = {
  ping: () => send<{ name: string; env: string; time: string }>("/health"),
  ready: () => send<{ status: string; db: string }>("/health/ready"),
};

// ---------- Reference ----------
export const auxApi = {
  centres: () => send<Array<{ id: number; code: string }>>("/centres"),
  hospitals: () =>
    send<Array<{
      id: number;
      name: string;
      centreId: number;
      centre?: { id: number; code: string };
    }>>("/hospitals"),
  users: () => send<Array<{ id: number; fullName: string; role: string; initials: string }>>("/users"),
};

// ---------- Dashboard ----------
export type DashboardStats = {
  totalPatients: number;
  newRegistrations: number;
  pendingCases: number;
  completedCases: number;
};
export type CaseOverviewItem = { status: "ACTIVE" | "PENDING" | "COMPLETED"; count: number };

export const dashboardApi = {
  stats: () => send<DashboardStats>("/dashboard/stats"),
  monthly: (months = 6) =>
    send<Array<{ month: string; value: number }>>(`/dashboard/monthly?months=${months}`),
  caseOverview: () => send<CaseOverviewItem[]>("/dashboard/case-overview"),
  recent: (limit = 5) =>
    send<RegistrationListItem[]>(`/dashboard/recent?limit=${limit}`),
};

// ---------- Patients ----------
export type ApiPatient = {
  id: number;
  fullName: string;
  age: number | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  createdAt: string;
  identifications?: ApiPatientIdentification[];
  relatives?: ApiPatientRelative[];
  addresses?: ApiPatientAddress[];
  habits?: ApiPatientHabit[];
  comorbidities?: ApiPatientComorbidity[];
  registrations?: ApiRegistration[];
  _count?: { registrations: number };
};

export type ApiPatientIdentification = {
  id: number;
  patientId: number;
  idType:
    | "AADHAAR"
    | "ABHA"
    | "VOTER_ID"
    | "PASSPORT"
    | "AB_PMJAY"
    | "OTHER";
  number: string;
};

export type ApiPatientRelative = {
  id: number;
  patientId: number;
  relationship: "FATHER" | "MOTHER" | "SPOUSE";
  name: string | null;
  mobileNumber: string | null;
};

export type ApiPatientAddress = {
  id: number;
  patientId: number;
  addressType: "RESIDENTIAL" | "PERMANENT";
  flatHouseNo: string | null;
  streetRoad: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pinCode: string | null;
  mobileNumber: string | null;
  email: string | null;
};

export type ApiPatientHabit = {
  id: number;
  patientId: number;
  habit: "SMOKING" | "SMOKELESS_TOBACCO" | "BETEL_NUT" | "ALCOHOL";
  answer: "YES" | "NO" | "UNKNOWN";
  durationMonths: number | null;
};

export type ApiPatientComorbidity = {
  id: number;
  patientId: number;
  comorbidity: string;
  answer: "YES" | "NO" | "UNKNOWN";
  durationMonths: number | null;
};

export type PaginatedPatients = {
  items: ApiPatient[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const patientApi = {
  list: (q?: { page?: number; limit?: number; search?: string; gender?: string }) => {
    const sp = new URLSearchParams();
    if (q?.page) sp.set("page", String(q.page));
    if (q?.limit) sp.set("limit", String(q.limit));
    if (q?.search) sp.set("search", q.search);
    if (q?.gender) sp.set("gender", q.gender);
    const qs = sp.toString();
    return send<PaginatedPatients>(`/patients${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => send<ApiPatient>(`/patients/${id}`),
  create: (data: { fullName: string; age?: number; dateOfBirth?: string; gender: "MALE" | "FEMALE" | "OTHER" }) =>
    send<ApiPatient>(`/patients`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ fullName: string; age: number; dateOfBirth: string; gender: "MALE" | "FEMALE" | "OTHER" }>) =>
    send<ApiPatient>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => send<void>(`/patients/${id}`, { method: "DELETE" }),
};

// ---------- Side tables (under /patients/:patientId/side) ----------
export const sideApi = {
  identifications: {
    list: (patientId: number) =>
      send<ApiPatientIdentification[]>(`/patients/${patientId}/side/identifications`),
    create: (patientId: number, data: { idType: string; number: string }) =>
      send<ApiPatientIdentification>(`/patients/${patientId}/side/identifications`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    remove: (patientId: number, id: number) =>
      send<void>(`/patients/${patientId}/side/identifications/${id}`, { method: "DELETE" }),
  },
  relatives: {
    list: (patientId: number) =>
      send<ApiPatientRelative[]>(`/patients/${patientId}/side/relatives`),
    create: (patientId: number, data: { relationship: "FATHER" | "MOTHER" | "SPOUSE"; name?: string; mobileNumber?: string }) =>
      send<ApiPatientRelative>(`/patients/${patientId}/side/relatives`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  addresses: {
    list: (patientId: number) =>
      send<ApiPatientAddress[]>(`/patients/${patientId}/side/addresses`),
    upsert: (
      patientId: number,
      addressType: "RESIDENTIAL" | "PERMANENT",
      data: Partial<Omit<ApiPatientAddress, "id" | "patientId" | "addressType">>,
    ) =>
      send<ApiPatientAddress>(
        `/patients/${patientId}/side/addresses`,
        { method: "POST", body: JSON.stringify({ addressType, ...data }) },
      ),
  },
  habits: {
    list: (patientId: number) =>
      send<ApiPatientHabit[]>(`/patients/${patientId}/side/habits`),
    create: (patientId: number, data: { habit: string; answer: "YES" | "NO" | "UNKNOWN"; durationMonths?: number }) =>
      send<ApiPatientHabit>(`/patients/${patientId}/side/habits`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  comorbidities: {
    list: (patientId: number) =>
      send<ApiPatientComorbidity[]>(`/patients/${patientId}/side/comorbidities`),
    create: (patientId: number, data: { comorbidity: string; answer: "YES" | "NO" | "UNKNOWN"; durationMonths?: number }) =>
      send<ApiPatientComorbidity>(`/patients/${patientId}/side/comorbidities`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};

// ---------- Registrations ----------
export type ApiRegistration = {
  id: number;
  patientId: number;
  hbcrRegistrationNo: string;
  hospitalId: number;
  departmentName?: string | null;
  unitNumber?: string | null;
  hospitalRegistrationNo?: string | null;
  dateOfReporting?: string | null;
  caseRegisteredThrough?: string | null;
  referralType?: string | null;
  referralFacilityName?: string | null;
  referralFacilityCity?: string | null;
  referralFacilityDistrict?: string | null;
  referralFacilityHospitalLabNh?: string | null;
  referralFacilityRegDate?: string | null;
  dateOfFirstDiagnosis?: string | null;
  anthropometricHeightCm?: string | null;
  anthropometricWeightKg?: string | null;
  maritalStatus?: string | null;
  education?: string | null;
  status: "ACTIVE" | "PENDING" | "COMPLETED";
  formCompletedBy?: string | null;
  formCompletionDate?: string | null;
  createdByUserId?: number | null;
  createdAt: string;
  hospital?: { id: number; name: string };
  pathologicalDiagnosis?: ApiPathologicalDiagnosis | null;
  familialCancerHistory?: ApiFamilialCancerHistory | null;
  diagnosticMethods?: ApiDiagnosticMethod[];
  treatments?: ApiTreatment[];
  patient?: { id: number; fullName: string; age?: number | null; gender?: string };
};

export type RegistrationListItem = {
  id: number;
  patientId: number;
  hbcrRegistrationNo: string;
  hospitalId: number;
  status: "ACTIVE" | "PENDING" | "COMPLETED";
  createdAt: string;
  patient: { id: number; fullName: string; age: number | null; gender: string };
  hospital: { id: number; name: string };
};

export const registrationApi = {
  forPatient: (patientId: number) =>
    send<ApiRegistration[]>(`/patients/${patientId}/registrations`),
  create: (
    patientId: number,
    data: {
      hbcrRegistrationNo: string;
      hospitalId: number;
      departmentName?: string;
      unitNumber?: string;
      hospitalRegistrationNo?: string;
      dateOfReporting?: string;
      caseRegisteredThrough?: string;
      referralType?: string;
      referralFacilityName?: string;
      referralFacilityCity?: string;
      referralFacilityDistrict?: string;
      referralFacilityHospitalLabNh?: string;
      referralFacilityRegDate?: string;
      dateOfFirstDiagnosis?: string;
      anthropometricHeightCm?: number;
      anthropometricWeightKg?: number;
      maritalStatus?: string;
      education?: string;
      status?: "ACTIVE" | "PENDING" | "COMPLETED";
      formCompletedBy?: string;
      formCompletionDate?: string;
      createdByUserId?: number;
    },
  ) =>
    send<ApiRegistration>(`/patients/${patientId}/registrations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: number) => send<ApiRegistration>(`/registrations/${id}`),
};

// ---------- Pathological diagnosis ----------
export type ApiPathologicalDiagnosis = {
  id: number;
  registrationId: number;
  longestSymptomDurationMonths?: number | null;
  anatomicalSite?: string | null;
  pathologySlideNo?: string | null;
  primaryTumorSite?: string | null;
  morphology?: string | null;
  icdoTopography?: string | null;
  icdoMorphology?: string | null;
  secondarySite?: string | null;
  metastasisMorphology?: string | null;
  icd10Site?: string | null;
  laterality?: string | null;
  pairedLaterality?: string | null;
  sequence?: string | null;
};

export const pathologyApi = {
  upsert: (registrationId: number, data: Partial<ApiPathologicalDiagnosis>) =>
    send<ApiPathologicalDiagnosis>(`/registrations/${registrationId}/pathological-diagnosis`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ---------- Family cancer history ----------
export type ApiFamilialCancerHistory = {
  id: number;
  registrationId: number;
  familyHistory: "YES" | "NO" | "UNKNOWN";
  relationshipWithCancer?: string | null;
  degreeOfRelationship?: string | null;
  primarySite?: string | null;
  ageAtDiagnosis?: number | null;
  dateOfDiagnosis?: string | null;
};

export const familyHistoryApi = {
  upsert: (registrationId: number, data: Partial<ApiFamilialCancerHistory>) =>
    send<ApiFamilialCancerHistory>(`/registrations/${registrationId}/family-history`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ---------- Diagnostic ----------
export type ApiDiagnosticMethod = {
  id: number;
  registrationId: number;
  method:
    | "CLINICAL_ONLY"
    | "MICROSCOPIC"
    | "IMAGING"
    | "DCO"
    | "OTHER";
  clinicalOnlyDate?: string | null;
  procedures?: ApiDiagnosticProcedure[];
};

export type ApiDiagnosticProcedure = {
  id: number;
  diagnosticMethodId: number;
  procedureName: string;
  isOthers: boolean;
  othersSpecify?: string | null;
  procedureDate?: string | null;
};

export const diagnosticApi = {
  listMethods: (registrationId: number) =>
    send<ApiDiagnosticMethod[]>(`/registrations/${registrationId}/diagnostic-methods`),
  createMethod: (registrationId: number, data: { method: string; clinicalOnlyDate?: string }) =>
    send<ApiDiagnosticMethod>(`/registrations/${registrationId}/diagnostic-methods`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createProcedure: (
    methodId: number,
    data: { procedureName: string; isOthers?: boolean; othersSpecify?: string; procedureDate?: string },
  ) =>
    send<ApiDiagnosticProcedure>(`/diagnostic-methods/${methodId}/procedures`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ---------- Treatment ----------
export type ApiTreatment = {
  id: number;
  registrationId: number;
  treatmentStage: "PRIOR_REGISTRATION" | "AT_RI";
  treatmentGivenChoice?: string | null;
  treatmentType?: string | null;
  clinicalExtentOfDisease?: string | null;
  stagingSystem?: string | null;
  tnmT?: string | null;
  tnmN?: string | null;
  tnmM?: string | null;
  compositeStage?: string | null;
  ecogStatus?: string | null;
  ecogGrade?: string | null;
  targetedTherapyType?: string | null;
  targetedTherapyOtherSpecify?: string | null;
  modalities?: ApiTreatmentModality[];
};

export type ApiTreatmentModality = {
  id: number;
  treatmentId: number;
  modality: string;
  isSelected: boolean;
  intentionToTreat?: string | null;
  role?: string | null;
  details?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  othersSpecify?: string | null;
};

const treatmentApi = {
  upsert: (
    registrationId: number,
    data: Partial<ApiTreatment> & { treatmentStage: "PRIOR_REGISTRATION" | "AT_RI" },
  ) =>
    send<ApiTreatment>(`/registrations/${registrationId}/treatments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  upsertModality: (treatmentId: number, data: Partial<ApiTreatmentModality> & { modality: string }) =>
    send<ApiTreatmentModality>(`/treatments/${treatmentId}/modalities`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ---------- Re-exports ----------
