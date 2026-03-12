import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Test1234@", 12);

  const user = await prisma.user.upsert({
    where: { email: "dodulana@gmail.com" },
    update: {
      name: "Dr. Adebowale Odulana",
      role: UserRole.SUPERADMIN,
      password,
    },
    create: {
      email: "dodulana@gmail.com",
      password,
      name: "Dr. Adebowale Odulana",
      phone: "",
      role: UserRole.SUPERADMIN,
    },
  });

  await prisma.dFCMember.upsert({
    where: { userId: user.id },
    update: {
      category: "MEMBER",
      status: "ACTIVE",
      goodStanding: true,
      duesStatus: "WAIVED",
      isBotMember: true,
      memberNumber: "DFC-2024-001",
      excoPosition: "PRESIDENT",
      excoElectedAt: new Date("2024-01-01"),
    },
    create: {
      userId: user.id,
      category: "MEMBER",
      status: "ACTIVE",
      goodStanding: true,
      duesStatus: "WAIVED",
      isBotMember: true,
      whatsappOptIn: true,
      memberNumber: "DFC-2024-001",
      effectiveDate: new Date("2024-01-01"),
      excoPosition: "PRESIDENT",
      excoElectedAt: new Date("2024-01-01"),
    },
  });

  console.log(`✅ Seeded President account: dodulana@gmail.com / Test1234@`);
  console.log(`   Role: SUPERADMIN | DFCMember: ACTIVE, Good Standing, BOT Member`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
