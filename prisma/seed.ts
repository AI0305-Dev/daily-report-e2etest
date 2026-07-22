import { config } from "dotenv";
import { PrismaClient, ReportStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const PASSWORD_HASH = await hash("password123", 12);

  await prisma.comment.deleteMany();
  await prisma.visitRecord.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const manager1 = await prisma.user.create({
    data: {
      name: "鈴木部長",
      email: "manager1@test.com",
      password: PASSWORD_HASH,
      role: "MANAGER",
      isAdmin: true,
      lastUpdateId: "system",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "田中部長",
      email: "manager2@test.com",
      password: PASSWORD_HASH,
      role: "MANAGER",
      isAdmin: false,
      lastUpdateId: "system",
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: "山田太郎",
      email: "sales1@test.com",
      password: PASSWORD_HASH,
      role: "SALES",
      isAdmin: false,
      managerId: manager1.id,
      lastUpdateId: "system",
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: "佐藤次郎",
      email: "sales2@test.com",
      password: PASSWORD_HASH,
      role: "SALES",
      isAdmin: false,
      managerId: manager1.id,
      lastUpdateId: "system",
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      name: "テスト顧客A",
      isDeleted: false,
      lastUpdateId: "system",
    },
  });

  await prisma.customer.create({
    data: {
      name: "テスト顧客B",
      isDeleted: false,
      lastUpdateId: "system",
    },
  });

  await prisma.customer.create({
    data: {
      name: "削除済み顧客",
      isDeleted: true,
      lastUpdateId: "system",
    },
  });

  const today = new Date();
  const dayOffset = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  await prisma.dailyReport.create({
    data: {
      userId: sales1.id,
      date: dayOffset(4),
      status: ReportStatus.DRAFT,
      lastUpdateId: sales1.id,
    },
  });

  const submitted = await prisma.dailyReport.create({
    data: {
      userId: sales1.id,
      date: dayOffset(3),
      status: ReportStatus.SUBMITTED,
      lastUpdateId: sales1.id,
      visitRecords: {
        create: {
          customerId: customer1.id,
          content: "テスト訪問",
          sortOrder: 1,
          lastUpdateId: sales1.id,
        },
      },
    },
  });

  await prisma.dailyReport.create({
    data: {
      userId: sales1.id,
      date: dayOffset(2),
      status: ReportStatus.REJECTED,
      lastUpdateId: sales1.id,
    },
  });

  const completed = await prisma.dailyReport.create({
    data: {
      userId: sales1.id,
      date: dayOffset(1),
      status: ReportStatus.COMPLETED,
      lastUpdateId: sales1.id,
    },
  });

  await prisma.comment.create({
    data: {
      reportId: completed.id,
      authorId: manager1.id,
      targetField: "GENERAL",
      body: "承認済みコメント",
      lastUpdateId: manager1.id,
    },
  });

  await prisma.dailyReport.create({
    data: {
      userId: sales2.id,
      date: dayOffset(1),
      status: ReportStatus.SUBMITTED,
      lastUpdateId: sales2.id,
    },
  });

  console.log("Seed completed");
  console.log(`  MANAGER1: ${manager1.email} / password123`);
  console.log(`  MANAGER2: ${manager2.email} / password123`);
  console.log(`  SALES1:   ${sales1.email} / password123`);
  console.log(`  SALES2:   ${sales2.email} / password123`);
  console.log(`  SUBMITTED report ID: ${submitted.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
