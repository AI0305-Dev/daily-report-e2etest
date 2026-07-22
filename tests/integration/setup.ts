import { PrismaClient, ReportStatus, type User } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { NextRequest } from "next/server";
import { vi } from "vitest";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export const TEST_PASSWORD = "password123";
export const TEST_PASSWORD_HASH = hash(TEST_PASSWORD, 12);

export async function setupTestDb() {
  const passwordHash = await TEST_PASSWORD_HASH;

  await prisma.comment.deleteMany();
  await prisma.visitRecord.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const manager1 = await prisma.user.create({
    data: {
      name: "鈴木部長",
      email: "manager1@test.com",
      password: passwordHash,
      role: "MANAGER",
      isAdmin: true,
      lastUpdateId: "system",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "田中部長",
      email: "manager2@test.com",
      password: passwordHash,
      role: "MANAGER",
      isAdmin: false,
      lastUpdateId: "system",
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: "山田太郎",
      email: "sales1@test.com",
      password: passwordHash,
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
      password: passwordHash,
      role: "SALES",
      isAdmin: false,
      managerId: manager1.id,
      lastUpdateId: "system",
    },
  });

  const deletedUser = await prisma.user.create({
    data: {
      name: "削除済みユーザー",
      email: "deleted@test.com",
      password: passwordHash,
      role: "SALES",
      isAdmin: false,
      managerId: manager1.id,
      isDeleted: true,
      lastUpdateId: "system",
    },
  });

  const customer1 = await prisma.customer.create({
    data: { name: "テスト顧客A", isDeleted: false, lastUpdateId: "system" },
  });

  await prisma.customer.create({
    data: { name: "テスト顧客B", isDeleted: false, lastUpdateId: "system" },
  });

  await prisma.customer.create({
    data: { name: "削除済み顧客", isDeleted: true, lastUpdateId: "system" },
  });

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dayOffset = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  const draftReport = await prisma.dailyReport.create({
    data: {
      userId: sales1.id,
      date: dayOffset(4),
      status: ReportStatus.DRAFT,
      lastUpdateId: sales1.id,
    },
  });

  const rejectedReport = await prisma.dailyReport.create({
    data: {
      userId: sales1.id,
      date: dayOffset(2),
      status: ReportStatus.REJECTED,
      lastUpdateId: sales1.id,
    },
  });

  const submittedReport = await prisma.dailyReport.create({
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

  const completedReport = await prisma.dailyReport.create({
    data: {
      userId: sales1.id,
      date: dayOffset(1),
      status: ReportStatus.COMPLETED,
      lastUpdateId: sales1.id,
    },
  });

  await prisma.comment.create({
    data: {
      reportId: completedReport.id,
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

  return {
    manager1,
    manager2,
    sales1,
    sales2,
    deletedUser,
    customer1,
    draftReport,
    rejectedReport,
    submittedReport,
    completedReport,
  };
}

export function makeSession(user: User) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

export function mockAuth(user: User | null) {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue(user ? makeSession(user) : null),
  }));
}

export function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(
    new URL(url, "http://localhost"),
    options as ConstructorParameters<typeof NextRequest>[1]
  );
}

export async function teardownTestDb() {
  await prisma.comment.deleteMany();
  await prisma.visitRecord.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
}
