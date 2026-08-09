import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Order matters due to FKs
  await prisma.treatmentModalityDetail.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.diagnosticProcedure.deleteMany();
  await prisma.diagnosticMethod.deleteMany();
  await prisma.pathologicalDiagnosis.deleteMany();
  await prisma.familialCancerHistory.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.patientIdentification.deleteMany();
  await prisma.patientRelative.deleteMany();
  await prisma.patientAddress.deleteMany();
  await prisma.patientHabit.deleteMany();
  await prisma.patientComorbidity.deleteMany();
  await prisma.patient.deleteMany();

  console.log("Cleared patient/registration data.");
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
