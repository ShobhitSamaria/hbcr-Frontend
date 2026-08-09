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
  name: string;
  age: number;
  gender: string;
  hospital: string;
  diagnosis: string;
  stage: string;
  status: string;
  date: string;
  color: string;
};

export function apiRegistrationToRow(r: RegistrationListItem): PatientRow {
  return {
    id: r.hbcrRegistrationNo,
    name: r.patient?.fullName ?? "(unknown)",
    age: r.patient?.age ?? 0,
    gender:
      r.patient?.gender === "FEMALE"
        ? "Female"
        : r.patient?.gender === "MALE"
          ? "Male"
          : "Other",
    hospital: r.hospital?.name ?? "Unassigned",
    diagnosis: "—",
    stage: "—",
    status: registrationStatusLabel(r.status),
    date: formatRegistrationDate(r.createdAt),
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
  return {
    id,
    name: p.fullName,
    age: p.age ?? 0,
    gender:
      p.gender === "FEMALE" ? "Female" : p.gender === "MALE" ? "Male" : "Other",
    hospital: reg?.hospital?.name ?? "Unassigned",
    diagnosis: "—",
    stage: "—",
    status: reg?.status ? registrationStatusLabel(reg.status) : "Active",
    date: formatRegistrationDate(reg?.createdAt ?? p.createdAt),
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
    hospitalId: r.hospitalId,
    status: r.status,
    createdAt: r.createdAt,
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
  });
}
