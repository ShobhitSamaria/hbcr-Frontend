import type {
  ApiPatient,
  ApiRegistration,
  DashboardStats,
  RegistrationListItem,
} from "@/lib/api";
import {
  avatarColorClass,
  formatRegistrationDate,
  registrationStatusLabel,
} from "./registrationDisplay";

export type PatientRow = {
  id: string;
  patientId?: number;
  referenceNo: string;
  registrationNo: string;
  name: string;
  age: string;
  gender: string;
  aadhar: string;
  icd10: string;
  status: string;
  date: string;
  completedBy: string;
  color: string;
};

/**
 * Derive Registration Number from Reference Number.
 * Formula: last 2 digits of year + last 5 digits of referenceNo.
 * Example: ref "96100001", year 2026 → "2600001"
 */
function deriveRegistrationNo(
  referenceNo: string | null | undefined,
  createdAt: string | Date,
): string {
  if (!referenceNo) return "—";
  const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const yearSuffix = String(d.getFullYear()).slice(-2);
  const lastFive = referenceNo.slice(-5);
  return `${yearSuffix}${lastFive}`;
}

export function apiRegistrationToRow(r: RegistrationListItem): PatientRow {
  return {
    id: r.hbcrRegistrationNo,
    patientId: r.patientId,
    referenceNo: r.referenceNo ?? r.hbcrRegistrationNo,
    registrationNo: deriveRegistrationNo(r.referenceNo, r.createdAt),
    name: r.patient?.fullName ?? "(unknown)",
    age: r.patient?.age ?? "—",
    gender:
      r.patient?.gender === "FEMALE"
        ? "Female"
        : r.patient?.gender === "MALE"
          ? "Male"
          : "Other",
    aadhar: "—",
    icd10: r.pathologicalDiagnosis?.icd10Site ?? "—",
    status: registrationStatusLabel(r.status),
    date: formatRegistrationDate(r.createdAt),
    completedBy: r.formCompletedBy ?? "—",
    color: avatarColorClass(r.patient?.fullName ?? ""),
  };
}

/**
 * Maps an API patient (whose clinical details live on embedded
 * registrations) into the flat `Patient` shape used by `PatientTable`.
 */
export function apiPatientToRow(p: ApiPatient): PatientRow {
  const reg = p.registrations?.[0];
  const id = reg?.hbcrRegistrationNo ?? `P-${p.id}`;
  const aadhar =
    p.identifications?.find((i) => i.idType === "AADHAAR")?.number ?? "—";
  return {
    id,
    patientId: p.id,
    referenceNo: reg?.referenceNo ?? id,
    registrationNo: deriveRegistrationNo(reg?.referenceNo, reg?.createdAt ?? new Date()),
    name: p.fullName,
    age: p.age ?? "—",
    gender:
      p.gender === "FEMALE" ? "Female" : p.gender === "MALE" ? "Male" : "Other",
    aadhar,
    icd10: (reg as any)?.pathologicalDiagnosis?.icd10Site ?? "—",
    status: reg?.status ? registrationStatusLabel(reg.status) : "Active",
    date: formatRegistrationDate(reg?.createdAt ?? p.createdAt),
    completedBy: (reg as any)?.formCompletedBy ?? "—",
    color: avatarColorClass(p.fullName),
  };
}

// Keep the screenshot's `dashboard.stats` shape visible so we can extend
// later without changing every consumer.
export type DashboardStatsOut = DashboardStats;
const _internal: {
  statsNote?: (_s: DashboardStats) => string;
  apiRegistrationToRow?: (r: ApiRegistration) => PatientRow;
} = {};

/**
 * Diagnostic helper: pull a `Patient` row out of a full registration record.
 * Not used yet but useful for the future "view registration" screen.
 */
function apiRegistrationFullToRow(r: ApiRegistration): PatientRow {
  return apiRegistrationToRow({
    id: r.id,
    patientId: r.patientId,
    hbcrRegistrationNo: r.hbcrRegistrationNo,
    referenceNo: r.referenceNo,
    hospitalId: r.hospitalId,
    status: r.status,
    createdAt: r.createdAt,
    formCompletedBy: r.formCompletedBy,
    patient: r.patient
      ? {
          id: r.patient.id,
          fullName: r.patient.fullName,
          age: r.patient.age ?? null,
          gender: r.patient.gender ?? "OTHER",
        }
      : undefined as never,
    hospital: r.hospital
      ? { id: r.hospital.id, name: r.hospital.name }
      : { id: 0, name: "Unassigned" },
    pathologicalDiagnosis: r.pathologicalDiagnosis ?? null,
  });
}
