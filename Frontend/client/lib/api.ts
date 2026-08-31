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
  // worry about ports. In production on Vercel, we need to point at the
  // deployed backend since Vercel doesn't proxy /api to the backend.
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://hbcr.onrender.com/api";
  }
  return "/api";
})();

const API_BASE = DEFAULT_BASE;

/**
 * Custom header sent on state-changing requests (POST, PATCH, DELETE).
 * The backend checks this header to prevent CSRF attacks from
 * cross-origin HTML forms. The header value is a fixed, non-secret
 * string — it proves the request originated from our SPA, not a
 * malicious form.
 */
const CSRF_HEADER = "X-Requested-With";
const CSRF_VALUE = "HBCR-SPA";

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

/**
 * Storage key for the persisted auth session (see client/lib/auth.tsx). The
 * API client reads the bearer token straight from here so every request is
 * authenticated without threading state through the UI.
 */
export const AUTH_STORAGE_KEY = "hbcr.auth";

export function readStoredToken(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

async function call<T>(
  path: string,
  init: RequestInit = {},
): Promise<Result<T>> {
  const token = readStoredToken();
  const method = (init.method ?? "GET").toUpperCase();
  const isStateChanging = method === "POST" || method === "PATCH" || method === "DELETE";

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // CSRF header on state-changing requests
        ...(isStateChanging ? { [CSRF_HEADER]: CSRF_VALUE } : {}),
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
  // A 401 means the session is dead (expired or revoked). Notify the auth
  // provider so it can clear the session and send the user back to login.
  if (res.status === 401) {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hbcr:unauthorized"));
      }
    } catch {
      // non-browser environment — ignore
    }
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

// ---------- Auth ----------
export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  initials: string;
  hospitalId: number | null;
};

export type AuthHospital = {
  id: number;
  name: string;
  centreId?: number | null;
  centre?: { id: number; code: string } | null;
};

export type AuthSession = {
  token?: string;
  user: AuthUser;
  hospital: AuthHospital | null;
};

export const authApi = {
  login: (username: string, password: string) =>
    send<AuthSession>("/auth/login", {
      method: "POST",
      // Credentials sent via Authorization header (HTTP Basic Auth format)
      // instead of JSON body. This removes the password from the request
      // payload visible in browser DevTools Network tab.
      // HTTPS still encrypts the header during transit.
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    }),
  me: () => send<AuthSession>("/auth/me"),
  logout: () =>
    send<null>("/auth/logout", { method: "POST" }),
};

// ---------- Health ----------
export const healthApi = {
  ping: () => send<{ name: string; env: string; time: string }>("/health"),
  ready: () => send<{ status: string; db: string }>("/health/ready"),
};

// ---------- ICD-O-3 reference lookups (form autocomplete) ----------
export type IcdoTopographyHit = {
  code: string;
  term: string;
  synonyms: string[];
  groupCode: string | null;
  groupName: string | null;
};

export type IcdoMorphologyHit = {
  code: string;
  term: string;
  synonyms: string[];
  behavior: number | null;
  siteRestriction: string | null;
  groupName: string | null;
};

export const icdoApi = {
  topography: (q: string, limit = 8) =>
    send<IcdoTopographyHit[]>(
      `/icdo/topography?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
  morphology: (q: string, limit = 8) =>
    send<IcdoMorphologyHit[]>(
      `/icdo/morphology?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
};

// ---------- ICD-10 reference lookups (form autocomplete) ----------
// Backed by the ICD-10 workbook (code ranges + category names, worked
// examples and the individual codes those examples mention). The workbook has
// no per-code descriptions, so each result is just the code plus the
// workbook's own description text for it — no internal kind/example/rule
// metadata is exposed.
export type Icdo10Hit = {
  /** The ICD-10 code the form stores; null for entries with no single code. */
  code: string | null;
  /** The workbook's description (range category name / example scenario). */
  description: string;
};

export type Icdo10TopographyMapping = {
  /** The ICD-O-3 topography code that was looked up (e.g. "C30.0"). */
  icdo3Code: string;
  /** The ICD-O-3 preferred term for that code (site description). */
  icdo3Term: string;
  /** The suggested ICD-10 site code (e.g. "C30.0"). */
  icd10Code: string;
  note: string | null;
};

export const icd10Api = {
  /**
   * Search the ICD-10 workbook reference. `type` is a comma-separated kind
   * list (range, code, example, rule); the site autocomplete passes
   * "range,code,example" so rules never crowd the dropdown.
   */
  search: (
    q: string,
    opts: { type?: string; limit?: number } = {},
  ): Promise<Icdo10Hit[]> => {
    const params = new URLSearchParams({ q });
    if (opts.type) params.set("type", opts.type);
    params.set("limit", String(opts.limit ?? 8));
    return send<Icdo10Hit[]>(`/icd10/search?${params.toString()}`);
  },
  /**
   * ICD-O-3 Topography → ICD-10 site suggestion for field 24: given the
   * ICD-O-3 topography code picked in 23.1, return the matching ICD-10 site
   * or `null` when no reliable mapping exists (e.g. C42.x) — the UI then
   * shows no suggestion rather than an invented one.
   */
  mapTopography: (code: string): Promise<Icdo10TopographyMapping | null> =>
    send<Icdo10TopographyMapping | null>(
      `/icd10/map-topography?code=${encodeURIComponent(code)}`,
    ),
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
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  age: number | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  healthSchemeBeneficiary: boolean;
  healthSchemeDetails: string | null;
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
    | "PAN_CARD"
    | "VOTER_ID"
    | "PASSPORT"
    | "AB_PMJAY"
    | "OTHER";
  number: string | null;
  idName: string | null;
};

export type ApiPatientRelative = {
  id: number;
  patientId: number;
  relationship: "FATHER" | "MOTHER" | "SPOUSE" | "SON" | "DAUGHTER" | "OTHER";
  name: string | null;
  mobileNumber: string | null;
};

export type ApiPatientAddress = {
  id: number;
  patientId: number;
  addressType: "RESIDENTIAL" | "PERMANENT";
  urbanRural: "URBAN" | "RURAL" | null;
  wardNo: string | null;
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

export type PatientListQuery = {
  page?: number;
  limit?: number;
  /** Legacy full-name text search (kept for compatibility). */
  search?: string;
  name?: string;
  referenceNo?: string;
  hospitalRegNo?: string;
  aadhaar?: string;
  mobile?: string;
  icd10?: string;
  /** Date of entry (registration createdAt), inclusive; YYYY-MM-DD. */
  dateFrom?: string;
  dateTo?: string;
  gender?: string;
};

export const patientApi = {
  list: (q?: PatientListQuery) => {
    const sp = new URLSearchParams();
    if (q?.page) sp.set("page", String(q.page));
    if (q?.limit) sp.set("limit", String(q.limit));
    if (q?.search) sp.set("search", q.search);
    if (q?.name) sp.set("name", q.name);
    if (q?.referenceNo) sp.set("referenceNo", q.referenceNo);
    if (q?.hospitalRegNo) sp.set("hospitalRegNo", q.hospitalRegNo);
    if (q?.aadhaar) sp.set("aadhaar", q.aadhaar);
    if (q?.mobile) sp.set("mobile", q.mobile);
    if (q?.icd10) sp.set("icd10", q.icd10);
    if (q?.dateFrom) sp.set("dateFrom", q.dateFrom);
    if (q?.dateTo) sp.set("dateTo", q.dateTo);
    if (q?.gender) sp.set("gender", q.gender);
    const qs = sp.toString();
    return send<PaginatedPatients>(`/patients${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => send<ApiPatient>(`/patients/${id}`),
  create: (data: { fullName: string; firstName?: string; middleName?: string; lastName?: string; age?: number; dateOfBirth?: string; gender: "MALE" | "FEMALE" | "OTHER"; healthSchemeBeneficiary?: boolean; healthSchemeDetails?: string }) =>
    send<ApiPatient>(`/patients`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ fullName: string; firstName: string; middleName: string; lastName: string; age: number; dateOfBirth: string; gender: "MALE" | "FEMALE" | "OTHER"; healthSchemeBeneficiary: boolean; healthSchemeDetails: string }>) =>
    send<ApiPatient>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => send<void>(`/patients/${id}`, { method: "DELETE" }),
};

// ---------- Side tables (under /patients/:patientId/side) ----------
export const sideApi = {
  identifications: {
    list: (patientId: number) =>
      send<ApiPatientIdentification[]>(`/patients/${patientId}/side/identifications`),
    create: (patientId: number, data: { idType: string; number?: string; idName?: string }) =>
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
    create: (patientId: number, data: { relationship: "FATHER" | "MOTHER" | "SPOUSE" | "SON" | "DAUGHTER" | "OTHER"; name?: string; mobileNumber?: string }) =>
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
    update: (patientId: number, id: number, data: { answer: "YES" | "NO" | "UNKNOWN"; durationMonths?: number }) =>
      send<ApiPatientHabit>(`/patients/${patientId}/side/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (patientId: number, id: number) =>
      send<void>(`/patients/${patientId}/side/habits/${id}`, { method: "DELETE" }),
  },
  comorbidities: {
    list: (patientId: number) =>
      send<ApiPatientComorbidity[]>(`/patients/${patientId}/side/comorbidities`),
    create: (patientId: number, data: { comorbidity: string; answer: "YES" | "NO" | "UNKNOWN"; durationMonths?: number }) =>
      send<ApiPatientComorbidity>(`/patients/${patientId}/side/comorbidities`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (patientId: number, id: number, data: { answer: "YES" | "NO" | "UNKNOWN"; durationMonths?: number }) =>
      send<ApiPatientComorbidity>(`/patients/${patientId}/side/comorbidities/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (patientId: number, id: number) =>
      send<void>(`/patients/${patientId}/side/comorbidities/${id}`, { method: "DELETE" }),
  },
};

// ---------- Registrations ----------
export type ApiRegistration = {
  id: number;
  patientId: number;
  hbcrRegistrationNo: string;
  hospitalId: number;
  referenceNo?: string | null;
  departmentName?: string | null;
  unitNumber?: string | null;
  hospitalRegistrationNo?: string | null;
  hospitalRegistrationNoType?: string | null;
  dateOfReporting?: string | null;
  caseRegisteredThrough?: string | null;
  caseRegisteredThroughOther?: string | null;
  referralType?: string | null;
  referralFacilityName?: string | null;
  referralFacilityCity?: string | null;
  referralFacilityDistrict?: string | null;
  referralFacilityPincode?: string | null;
  referralFacilityHospitalLabNh?: string | null;
  referralFacilityRegDate?: string | null;
  dateOfFirstDiagnosis?: string | null;
  microscopicConfirmationLater?: boolean | null;
  anthropometricHeightCm?: string | null;
  anthropometricWeightKg?: string | null;
  maritalStatus?: string | null;
  maritalStatusOther?: string | null;
  education?: string | null;
  educationOther?: string | null;
  occupation?: string | null;
  status: "ACTIVE" | "PENDING" | "COMPLETED";
  formCompletedBy?: string | null;
  formCompletionDate?: string | null;
  remarks?: string | null;
  contactNumber?: string | null;
  designation?: string | null;
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
  referenceNo?: string | null;
  hospitalId: number;
  status: "ACTIVE" | "PENDING" | "COMPLETED";
  createdAt: string;
  formCompletedBy?: string | null;
  patient: { id: number; fullName: string; age: number | null; gender: string };
  hospital: { id: number; name: string };
  pathologicalDiagnosis?: { icd10Site?: string | null } | null;
};

export const registrationApi = {
  forPatient: (patientId: number) =>
    send<ApiRegistration[]>(`/patients/${patientId}/registrations`),
  create: (
    patientId: number,
    data: {
      hbcrRegistrationNo?: string;
      hospitalId: number;
      referenceNo?: string;
      departmentName?: string;
      unitNumber?: string;
      hospitalRegistrationNo?: string;
      hospitalRegistrationNoType?: string;
      dateOfReporting?: string;
      caseRegisteredThrough?: string;
      referralType?: string;
      referralFacilityName?: string;
      referralFacilityCity?: string;
      referralFacilityDistrict?: string;
      referralFacilityPincode?: string;
      referralFacilityHospitalLabNh?: string;
      referralFacilityRegDate?: string;
      dateOfFirstDiagnosis?: string;
      microscopicConfirmationLater?: boolean;
      anthropometricHeightCm?: number;
      anthropometricWeightKg?: number;
      maritalStatus?: string;
      education?: string;
      occupation?: string;
      status?: "ACTIVE" | "PENDING" | "COMPLETED";
      formCompletedBy?: string;
      formCompletionDate?: string;
      remarks?: string;
      contactNumber?: string;
      designation?: string;
      createdByUserId?: number;
    },
  ) =>
    send<ApiRegistration>(`/patients/${patientId}/registrations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: number) => send<ApiRegistration>(`/registrations/${id}`),
  update: (id: number, data: Partial<Pick<ApiRegistration, 'remarks' | 'status' | 'formCompletedBy' | 'formCompletionDate' | 'designation' | 'contactNumber'>>) =>
    send<ApiRegistration>(`/registrations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  previewNumbers: (hospitalId: number) =>
    send<{ hospitalId: number; hospitalName: string; centreCode: string; referenceNo: string; registrationNo: string }>(
      `/registrations/preview-numbers/${hospitalId}`,
    ),
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
  topographySite?: string | null;
  icdoMorphology?: string | null;
  histologyMorphology?: string | null;
  morphologyGrade?: "GRADE_I" | "GRADE_II" | "GRADE_III" | "GRADE_IV" | null;
  secondarySite?: string | null;
  secondarySiteCode?: string | null;
  metastasisMorphology?: string | null;
  metastasisMorphologyCode?: string | null;
  metastasisMorphologyGrade?: "GRADE_I" | "GRADE_II" | "GRADE_III" | "GRADE_IV" | null;
  icd10Site?: string | null;
  laterality?: string | null;
  pairedLaterality?: string | null;
  sequence?: string | null;
  pathologyDateOfReporting?: string | null;
};

export const pathologyApi = {
  get: (registrationId: number) =>
    send<ApiPathologicalDiagnosis>(`/registrations/${registrationId}/pathological-diagnosis`),
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

// ---------- Drafts ----------
export type ApiDraftListItem = {
  id: number;
  patientName: string;
  aadhaar: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  createdByUser: { fullName: string; initials: string };
};

export type ApiDraft = {
  id: number;
  hospitalId: number;
  createdByUserId: number;
  formData: Record<string, unknown>;
  patientName: string | null;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
};

export const draftApi = {
  list: (q?: string) => send<{ items: ApiDraftListItem[] }>(`/drafts${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  get: (id: number) => send<ApiDraft>(`/drafts/${id}`),
  save: (data: { id?: number; formData: Record<string, unknown>; currentStep: number; patientName?: string }) =>
    send<ApiDraft>("/drafts", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) =>
    send<void>(`/drafts/${id}`, { method: "DELETE" }),
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
  stagingSystemValue?: string | null;
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

export const treatmentApi = {
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

// ---------- Follow-up ----------
export type FollowUpMethod =
  | "HOSPITAL_VISIT"
  | "POST_EMAIL"
  | "TELEPHONE"
  | "HOUSE_VISIT"
  | "PUBLIC_DATABASE"
  | "SPECIAL_SURVEY_STUDY"
  | "OTHERS";
export type VitalStatus = "ALIVE" | "DEAD" | "UNKNOWN";
export type DiseaseStatus =
  | "NO_EVIDENCE_OF_DISEASE"
  | "NED_SECOND_PRIMARY_PRESENT"
  | "NED_OTHER_ILLNESS"
  | "CANCER_REGRESSION_RESIDUAL"
  | "CANCER_PROGRESSION_RECURRENCE"
  | "TOO_ADVANCED_CACHEXIA"
  | "NED_ON_CHEMO_HORMONAL"
  | "OTHERS"
  | "UNKNOWN";
export type PlaceOfDeath =
  | "RI"
  | "OTHER_HOSPITAL"
  | "RESIDENCE"
  | "OTHERS"
  | "UNKNOWN";
export type DeathInfoSource =
  | "CIVIL_REGISTRATION"
  | "BURIAL_CREMATION"
  | "VOTER_LIST"
  | "AADHAAR"
  | "CENSUS"
  | "ABDM"
  | "OTHERS"
  | "UNKNOWN";
export type FollowUpModality =
  | "SURGERY"
  | "RADIOTHERAPY"
  | "CHEMOTHERAPY"
  | "HORMONE_THERAPY"
  | "TARGETED_THERAPY"
  | "OTHERS";

export type FollowUpSearchHit = {
  registrationId: number;
  referenceNo: string | null;
  hbcrRegistrationNo: string | null;
  patientId: number;
  patientName: string;
  patientAge: number | null;
  patientGender: string;
  icd10Code: string | null;
  visitCount: number;
  createdAt: string;
};

export type ApiFollowUpTreatment = {
  id: number;
  followUpId: number;
  modality: FollowUpModality;
  startDate: string | null;
  endDate: string | null;
};

export type ApiFollowUp = {
  id: number;
  registrationId: number;
  visitNo: number;
  dateOfFollowUp: string;
  methodOfFollowUp: FollowUpMethod;
  methodOfFollowUpOther: string | null;
  vitalStatus: VitalStatus;
  diseaseStatus: DiseaseStatus | null;
  diseaseStatusOther: string | null;
  dateOfFirstRecurrence: string | null;
  treatmentGiven: boolean | null;
  treatmentType: string | null;
  dateOfDeath: string | null;
  placeOfDeath: PlaceOfDeath | null;
  placeOfDeathOther: string | null;
  sourceOfDeathInfo: DeathInfoSource | null;
  sourceOfDeathInfoOther: string | null;
  causeIa: string | null;
  causeIb: string | null;
  causeIc: string | null;
  causeIi: string | null;
  icd10Ucod: string | null;
  majorCauseGroupUcod: string | null;
  formCompletedBy: string | null;
  formCompletedByDesignation: string | null;
  formCompletedByContact: string | null;
  dateOfCompletion: string | null;
  createdAt: string;
  treatments: ApiFollowUpTreatment[];
};

export type FollowUpRegistrationDetail = {
  registrationId: number;
  hbcrRegistrationNo: string;
  referenceNo: string | null;
  hospitalRegistrationNo: string | null;
  patient: {
    id: number;
    fullName: string;
    age: number | null;
    gender: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    relatives: ApiPatientRelative[];
    addresses: ApiPatientAddress[];
    habits: ApiPatientHabit[];
    comorbidities: ApiPatientComorbidity[];
    identifications: ApiPatientIdentification[];
  };
  icd10Code: string | null;
  visits: ApiFollowUp[];
  /** Next visit number (backend-computed from existing records, max + 1). */
  nextVisitNo: number;
};

export type FollowUpCreateInput = {
  registrationId: number;
  dateOfFollowUp: string;
  methodOfFollowUp: FollowUpMethod;
  methodOfFollowUpOther?: string;
  vitalStatus: VitalStatus;
  diseaseStatus?: DiseaseStatus;
  diseaseStatusOther?: string;
  dateOfFirstRecurrence?: string;
  treatmentGiven?: boolean;
  treatmentType?: string;
  dateOfDeath?: string;
  placeOfDeath?: PlaceOfDeath;
  placeOfDeathOther?: string;
  sourceOfDeathInfo?: DeathInfoSource;
  sourceOfDeathInfoOther?: string;
  causeIa?: string;
  causeIb?: string;
  causeIc?: string;
  causeIi?: string;
  icd10Ucod?: string;
  majorCauseGroupUcod?: string;
  formCompletedBy?: string;
  formCompletedByDesignation?: string;
  formCompletedByContact?: string;
  dateOfCompletion?: string;
  treatments?: {
    modality: FollowUpModality;
    startDate?: string;
    endDate?: string;
  }[];
};

export const followUpApi = {
  /** Search registrations by Reference / HBCR / Hospital registration number,
   *  Aadhaar or Phone number (any combination). */
  search: (q: {
    referenceNo?: string;
    hbcrRegNo?: string;
    hospitalRegNo?: string;
    aadhaar?: string;
    phone?: string;
  }): Promise<FollowUpSearchHit[]> => {
    const sp = new URLSearchParams();
    if (q.referenceNo) sp.set("referenceNo", q.referenceNo);
    if (q.hbcrRegNo) sp.set("hbcrRegNo", q.hbcrRegNo);
    if (q.hospitalRegNo) sp.set("hospitalRegNo", q.hospitalRegNo);
    if (q.aadhaar) sp.set("aadhaar", q.aadhaar);
    if (q.phone) sp.set("phone", q.phone);
    return send<FollowUpSearchHit[]>(`/followups/search?${sp.toString()}`);
  },
  /** Read-only header + every existing visit for a registration. */
  registrationDetail: (registrationId: number): Promise<FollowUpRegistrationDetail> =>
    send<FollowUpRegistrationDetail>(`/followups/registrations/${registrationId}`),
  /** Create a new follow-up visit (never modifies previous visits). */
  create: (data: FollowUpCreateInput): Promise<ApiFollowUp> =>
    send<ApiFollowUp>("/followups", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: number): Promise<ApiFollowUp> => send<ApiFollowUp>(`/followups/${id}`),
};

export const pincodeApi = {
  /** Get all unique district names (sorted alphabetically). */
  getDistricts: (): Promise<string[]> =>
    send<{ districts: string[] }>('/pincodes').then((r) => r.districts),

  /** Get pincodes for a specific district. */
  getPincodesByDistrict: (district: string): Promise<string[]> =>
    send<{ district: string; pincodes: string[] }>(
      `/pincodes?district=${encodeURIComponent(district)}`,
    ).then((r) => r.pincodes),
};

// ---------- Re-exports ----------
