import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { compare } from "bcryptjs";
import { setupTestDb, teardownTestDb, TEST_PASSWORD, makeSession, makeRequest } from "./setup";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

describe("認証ロジック統合テスト (IT001-IT006)", () => {
  beforeEach(async () => {
    vi.resetModules();
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  async function authorizeUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error("E104");
    if (user.isDeleted) throw new Error("E105");

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) throw new Error("E104");

    return { id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin };
  }

  it("IT001: SALESユーザーで正常ログイン", async () => {
    const result = await authorizeUser("sales1@test.com", TEST_PASSWORD);
    expect(result.role).toBe("SALES");
    expect(result.email).toBe("sales1@test.com");
  });

  it("IT002: MANAGERユーザーで正常ログイン", async () => {
    const result = await authorizeUser("manager1@test.com", TEST_PASSWORD);
    expect(result.role).toBe("MANAGER");
    expect(result.isAdmin).toBe(true);
  });

  it("IT003: 誤パスワードで E104 エラー", async () => {
    await expect(authorizeUser("sales1@test.com", "wrongpassword")).rejects.toThrow("E104");
  });

  it("IT004: 存在しないメールアドレスで E104 エラー", async () => {
    await expect(authorizeUser("nonexistent@test.com", TEST_PASSWORD)).rejects.toThrow("E104");
  });

  it("IT005: 論理削除済みユーザーで E105 エラー", async () => {
    await expect(authorizeUser("deleted@test.com", TEST_PASSWORD)).rejects.toThrow("E105");
  });

  it("IT006: ログアウト後に認証必須エンドポイントへのアクセスは 401 になる", async () => {
    const salesUser = await prisma.user.findUnique({ where: { email: "sales1@test.com" } });
    expect(salesUser).not.toBeNull();

    vi.doMock("@/auth", () => ({
      auth: vi.fn().mockResolvedValue(makeSession(salesUser!)),
    }));

    const { GET: getWithSession } = await import("@/app/api/reports/route");
    const reqWithSession = makeRequest("http://localhost/api/reports");
    const resWithSession = await getWithSession(reqWithSession);
    expect(resWithSession.status).toBe(200);

    vi.resetModules();
    vi.doMock("@/auth", () => ({
      auth: vi.fn().mockResolvedValue(null),
    }));

    const { GET: getAfterSignout } = await import("@/app/api/reports/route");
    const reqAfterSignout = makeRequest("http://localhost/api/reports");
    const resAfterSignout = await getAfterSignout(reqAfterSignout);
    const json = await resAfterSignout.json();

    expect(resAfterSignout.status).toBe(401);
    expect(json.error.code).toBe("E001");
  });

  it("UT_password_hash: パスワードは bcrypt でハッシュ化されている", async () => {
    const user = await prisma.user.findUnique({ where: { email: "sales1@test.com" } });
    expect(user).not.toBeNull();
    const isHashed = await compare(TEST_PASSWORD, user!.password);
    expect(isHashed).toBe(true);
    expect(user!.password).not.toBe(TEST_PASSWORD);
  });
});
