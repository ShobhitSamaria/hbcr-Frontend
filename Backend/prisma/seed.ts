import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

async function main() {
  const adapter = new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://shobhitsamaria@localhost:5432/hbcr_db",
  });
  const prisma = new PrismaClient({ adapter });

  // Centre & Hospital
  // Centre codes are numeric (e.g. "961", "962") and used as the prefix
  // for Reference Number generation.
  const centre = await prisma.centre.upsert({
    where: { code: "961" },
    update: {},
    create: { code: "961" },
  });
  const centre2 = await prisma.centre.upsert({
    where: { code: "962" },
    update: {},
    create: { code: "962" },
  });

  const hospital = await prisma.hospital.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: "961", name: "AIIMS New Delhi", centreId: centre.id },
  });
  const hospital2 = await prisma.hospital.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, code: "962", name: "Tata Memorial Hospital", centreId: centre2.id },
  });

  // Login credentials (dev seed). Usernames are the hospital codes and the
  // shared password is documented in the README / login helper.
  const seedUsers = [
    {
      id: 1,
      username: "hospital1",
      fullName: "Dr. A. Srinivasan",
      role: "Registry coordinator",
      initials: "AS",
      hospitalId: hospital.id,
    },
    {
      id: 2,
      username: "hospital2",
      fullName: "Dr. P. Mehta",
      role: "Registry coordinator",
      initials: "PM",
      hospitalId: hospital2.id,
    },
  ];
  const { hashSync } = await import("bcryptjs");
  const passwordHash = hashSync("HBCR@2024", 10);

  for (const u of seedUsers) {
    const { id, ...data } = u;
    await prisma.user.upsert({
      where: { id },
      update: { ...data, passwordHash },
      create: { id, ...data, passwordHash },
    });
  }

  // Seed HospitalSequence rows for the demo hospitals so the sequence
  // generator starts at 1 for each.
  await prisma.hospitalSequence.upsert({
    where: { hospitalId: hospital.id },
    update: {},
    create: { hospitalId: hospital.id, nextSequence: 1 },
  });
  await prisma.hospitalSequence.upsert({
    where: { hospitalId: hospital2.id },
    update: {},
    create: { hospitalId: hospital2.id, nextSequence: 1 },
  });

  // Patients from the dashboard mock
  // Reference Number = HospitalCode + 5-digit sequence
  // Registration Number = last 2 digits of year + last 5 digits of reference
  // For demo data: hospital code 961, year 2024
  const demoPatients = [
    {
      id: 101,
      fullName: "Anita Sharma",
      age: 54,
      gender: "FEMALE" as const,
      hospitalId: hospital.id,
      referenceNo: "96100001",
      hbcrRegistrationNo: "2400001",
    },
    {
      id: 102,
      fullName: "Rajesh Kumar",
      age: 67,
      gender: "MALE" as const,
      hospitalId: hospital.id,
      referenceNo: "96100002",
      hbcrRegistrationNo: "2400002",
    },
    {
      id: 103,
      fullName: "Meena Patel",
      age: 42,
      gender: "FEMALE" as const,
      hospitalId: hospital2.id,
      referenceNo: "96200001",
      hbcrRegistrationNo: "2400001",
    },
    {
      id: 104,
      fullName: "Suresh Nair",
      age: 71,
      gender: "MALE" as const,
      hospitalId: hospital2.id,
      referenceNo: "96200002",
      hbcrRegistrationNo: "2400002",
    },
    {
      id: 105,
      fullName: "Fatima Begum",
      age: 49,
      gender: "FEMALE" as const,
      hospitalId: hospital.id,
      referenceNo: "96100003",
      hbcrRegistrationNo: "2400003",
    },
  ];

  for (const p of demoPatients) {
    const { hospitalId: _hid, referenceNo: _ref, hbcrRegistrationNo: _reg, ...patient } = p;
    void _hid;
    void _ref;
    void _reg;

    await prisma.patient.upsert({
      where: { id: p.id },
      update: { fullName: p.fullName },
      create: patient,
    });
    await prisma.registration.upsert({
      where: { id: p.id },
      update: {
        referenceNo: p.referenceNo,
        hbcrRegistrationNo: p.hbcrRegistrationNo,
        hospitalId: p.hospitalId,
        status: p.fullName.includes("Suresh")
          ? "COMPLETED"
          : p.fullName.includes("Rajesh")
            ? "PENDING"
            : "ACTIVE",
        createdAt: new Date(
          Date.UTC(2024, 5, 28 - (p.id % 5), 10, 0, 0),
        ),
      },
      create: {
        id: p.id,
        patientId: p.id,
        hospitalId: p.hospitalId,
        referenceNo: p.referenceNo,
        hbcrRegistrationNo: p.hbcrRegistrationNo,
        status: p.fullName.includes("Suresh")
          ? "COMPLETED"
          : p.fullName.includes("Rajesh")
            ? "PENDING"
            : "ACTIVE",
        createdAt: new Date(
          Date.UTC(2024, 5, 28 - (p.id % 5), 10, 0, 0),
        ),
      },
    });
  }

  // The demo rows above are inserted with explicit ids (101-105), so the
  // Postgres autoincrement sequences are left behind the seeded rows. If the
  // seed ever runs against a fresh/migrate-reset database, the next patient
  // or registration insert would collide with a seeded id and fail with a
  // unique-constraint error (409). Advance both sequences past the max id.
  await prisma.$executeRawUnsafe(
    `SELECT setval('"hbcr.patients_id_seq"', GREATEST((SELECT COALESCE(MAX(id), 0) FROM "hbcr.patients"), (SELECT last_value FROM "hbcr.patients_id_seq")))`,
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval('"hbcr.registrations_id_seq"', GREATEST((SELECT COALESCE(MAX(id), 0) FROM "hbcr.registrations"), (SELECT last_value FROM "hbcr.registrations_id_seq")))`,
  );

  // eslint-disable-next-line no-console
  console.log("Seed complete: 2 centres, 2 hospitals, 2 users, 5 patients, 5 registrations");
  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", e);
  process.exit(1);
});
