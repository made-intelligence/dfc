import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Ensure every DFC_MEMBER user has a DFCMember record
  const membersWithoutRecord = await prisma.user.findMany({
    where: {
      role: "DFC_MEMBER",
      dfcMember: null,
    },
  });

  for (const user of membersWithoutRecord) {
    await prisma.dFCMember
      .create({
        data: {
          userId: user.id,
          category: "MEMBER",
          status: "ACTIVE",
          goodStanding: false,
          duesStatus: "NOT_YET_DUE",
          whatsappOptIn: true,
        },
      })
      .catch(() => {}); // ignore if already exists
  }

  console.log(
    `Ensured DFCMember records for ${membersWithoutRecord.length} users`
  );

  // Summary
  const counts = await Promise.all([
    prisma.user.count({ where: { role: "SUPERADMIN" } }),
    prisma.user.count({ where: { role: "SECRETARIAT" } }),
    prisma.user.count({ where: { role: "DFC_MEMBER" } }),
    prisma.user.count({ where: { role: "PATIENT" } }),
    prisma.user.count({ where: { role: "HOSPITAL_ADMIN" } }),
  ]);

  console.log("\nUser counts by role:");
  console.log(`  SUPERADMIN:    ${counts[0]}`);
  console.log(`  SECRETARIAT:   ${counts[1]}`);
  console.log(`  DFC_MEMBER:    ${counts[2]}`);
  console.log(`  PATIENT:       ${counts[3]}`);
  console.log(`  HOSPITAL_ADMIN: ${counts[4]}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
