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
  const centre = await prisma.centre.upsert({
    where: { code: "DL001" },
    update: {},
    create: { code: "DL001" },
  });
  const centre2 = await prisma.centre.upsert({
    where: { code: "MH002" },
    update: {},
    create: { code: "MH002" },
  });

  const hospital = await prisma.hospital.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "AIIMS New Delhi", centreId: centre.id },
  });
  const hospital2 = await prisma.hospital.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: "Tata Memorial Hospital", centreId: centre2.id },
  });

  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      fullName: "Dr. A. Srinivasan",
      role: "Registry coordinator",
      initials: "AS",
      hospitalId: hospital.id,
    },
  });
  await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      fullName: "Dr. P. Mehta",
      role: "Registry coordinator",
      initials: "PM",
      hospitalId: hospital2.id,
    },
  });

  // Patients from the dashboard mock
  const demoPatients = [
    {
      id: 101,
      fullName: "Anita Sharma",
      age: 54,
      gender: "FEMALE" as const,
      hospitalId: hospital.id,
      hbcrRegistrationNo: "HBCR-2024-0184",
    },
    {
      id: 102,
      fullName: "Rajesh Kumar",
      age: 67,
      gender: "MALE" as const,
      hospitalId: hospital.id,
      hbcrRegistrationNo: "HBCR-2024-0183",
    },
    {
      id: 103,
      fullName: "Meena Patel",
      age: 42,
      gender: "FEMALE" as const,
      hospitalId: hospital2.id,
      hbcrRegistrationNo: "HBCR-2024-0182",
    },
    {
      id: 104,
      fullName: "Suresh Nair",
      age: 71,
      gender: "MALE" as const,
      hospitalId: hospital2.id,
      hbcrRegistrationNo: "HBCR-2024-0181",
    },
    {
      id: 105,
      fullName: "Fatima Begum",
      age: 49,
      gender: "FEMALE" as const,
      hospitalId: hospital.id,
      hbcrRegistrationNo: "HBCR-2024-0180",
    },
  ];

  for (const p of demoPatients) {
    const { hospitalId: _hid, hbcrRegistrationNo: _reg, ...patient } = p;
    void _hid;
    void _reg;

    await prisma.patient.upsert({
      where: { id: p.id },
      update: { fullName: p.fullName },
      create: patient,
    });
    await prisma.registration.upsert({
      where: { id: p.id },
      update: {
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

  // eslint-disable-next-line no-console
  console.log("Seed complete: 2 centres, 2 hospitals, 2 users, 5 patients, 5 registrations");
  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", e);
  process.exit(1);
});
