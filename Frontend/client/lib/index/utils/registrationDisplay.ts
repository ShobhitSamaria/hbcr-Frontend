/**
 * Display helpers for HBCR records. The API stores enum values in
 * SCREAMING_SNAKE_CASE; the UI shows human-friendly labels and dates.
 */

export function formatRegistrationDate(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function registrationStatusLabel(s: "ACTIVE" | "PENDING" | "COMPLETED"): string {
  if (s === "ACTIVE") return "Active";
  if (s === "PENDING") return "Pending";
  return "Completed";
}

function statusToneClass(s: "ACTIVE" | "PENDING" | "COMPLETED"): string {
  if (s === "COMPLETED") return "bg-[#e8f6ec] text-[#30935c]";
  if (s === "PENDING") return "bg-[#fff3d9] text-[#bf7a0d]";
  return "bg-[#e3f4f2] text-[#087888]";
}

/** Default 6-char colour used to differentiate avatars in the table. */
const PALETTE = [
  "bg-rose-100 text-rose-600",
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-fuchsia-100 text-fuchsia-600",
];
export function avatarColorClass(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}
