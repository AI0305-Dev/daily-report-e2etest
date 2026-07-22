import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { setupTestDb, teardownTestDb, mockAuth, makeRequest } from "./setup";
import type { User } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SetupResult = {
  manager1: User;
  manager2: User;
  sales1: User;
  sales2: User;
};

let db: SetupResult;

function mockAuthWithSession(sessionUser: {
  id: string;
  name: string;
  email: string;
  role: "SALES" | "MANAGER";
  isAdmin: boolean;
}) {
  vi.doMock("@/auth", () => ({
    auth: vi.fn().mockResolvedValue({
      user: sessionUser,
      expires: new Date(Date.now() + 86400000).toISOString(),
    }),
  }));
}

beforeEach(async () => {
  vi.resetModules();
  db = (await setupTestDb()) as SetupResult;
});

afterAll(async () => {
  await teardownTestDb();
  vi.resetModules();
});

describe("営業マスタAPI統合テスト (IT080-IT096)", () => {
  it("IT080: ADMIN はユーザー一覧を取得できる (isDeleted=false のみ)", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/users/route");

    const req = makeRequest("http://localhost/api/users");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const users = json.data as Array<{ email: string }>;
    expect(users.some((u) => u.email === "deleted@test.com")).toBe(false);
    expect(users.some((u) => u.email === "sales1@test.com")).toBe(true);
  });

  it("IT081a: SALES がユーザー一覧取得すると 403 E002", async () => {
    mockAuth(db.sales1);
    const { GET } = await import("@/app/api/users/route");

    const req = makeRequest("http://localhost/api/users");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });

  it("IT081b: isAdmin=false の MANAGER がユーザー一覧取得すると 403 E002", async () => {
    mockAuth(db.manager2);
    const { GET } = await import("@/app/api/users/route");

    const req = makeRequest("http://localhost/api/users");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });

  it("IT082: SALESユーザーを作成できる (initialPassword あり)", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/users/route");

    const req = makeRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "テスト営業",
        email: "new-sales@test.com",
        role: "SALES",
        isAdmin: false,
        managerId: db.manager1.id,
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.role).toBe("SALES");
    expect(typeof json.data.initialPassword).toBe("string");
    expect(json.data.initialPassword.length).toBeGreaterThanOrEqual(8);
  });

  it("IT083: MANAGERユーザーを作成できる (initialPassword あり)", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/users/route");

    const req = makeRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "テスト管理職",
        email: "new-manager@test.com",
        role: "MANAGER",
        isAdmin: false,
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.role).toBe("MANAGER");
    expect(typeof json.data.initialPassword).toBe("string");
  });

  it("IT084: 重複メールで作成すると 400 E505", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/users/route");

    const req = makeRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "重複ユーザー",
        email: "sales1@test.com",
        role: "SALES",
        isAdmin: false,
        managerId: db.manager1.id,
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E505");
  });

  it("IT084a: role=SALES で managerId 未指定は 400 E509", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/users/route");

    const req = makeRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "上長なし営業",
        email: "no-manager@test.com",
        role: "SALES",
        isAdmin: false,
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E509");
  });

  it("IT085: ユーザーを更新できる", async () => {
    mockAuth(db.manager1);
    const { PUT } = await import("@/app/api/users/[id]/route");

    const req = makeRequest(`http://localhost/api/users/${db.sales1.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: "山田太郎（更新）",
        role: "SALES",
        isAdmin: false,
        managerId: db.manager1.id,
      }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.sales1.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.name).toBe("山田太郎（更新）");
  });

  it("IT086: ユーザーを論理削除できる", async () => {
    mockAuth(db.manager1);
    const { DELETE } = await import("@/app/api/users/[id]/route");

    const req = makeRequest(`http://localhost/api/users/${db.sales1.id}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: db.sales1.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(db.sales1.id);

    const deleted = await prisma.user.findUnique({ where: { id: db.sales1.id } });
    expect(deleted?.isDeleted).toBe(true);
  });

  it("IT087: 削除済みユーザーを削除すると 400 E508", async () => {
    mockAuth(db.manager1);
    const { DELETE } = await import("@/app/api/users/[id]/route");

    // 1回目削除
    const req1 = makeRequest(`http://localhost/api/users/${db.sales1.id}`, { method: "DELETE" });
    await DELETE(req1, { params: Promise.resolve({ id: db.sales1.id }) });

    // 2回目削除
    const req2 = makeRequest(`http://localhost/api/users/${db.sales1.id}`, { method: "DELETE" });
    const res = await DELETE(req2, { params: Promise.resolve({ id: db.sales1.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E508");
  });

  it("IT088: 自分自身を削除しようとすると 400 E510", async () => {
    mockAuth(db.manager1);
    const { DELETE } = await import("@/app/api/users/[id]/route");

    const req = makeRequest(`http://localhost/api/users/${db.manager1.id}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: db.manager1.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E510");
  });

  it("IT089: 唯一のMANAGERを削除しようとすると 400 E511", async () => {
    // セットアップ:
    //   1. manager1(isAdmin=true) で manager2 を先に削除し、MANAGERが manager1 のみの状態を作る
    //   2. manager1 自身を消そうとすると E510(自己削除禁止) が先に発火するため、
    //      isAdmin=true かつ role=SALES のセッションを別途作って manager1 を削除しようとする
    //      → これにより「唯一のMANAGERを削除しようとした」という E511 の経路を通る
    mockAuth(db.manager1);
    const { DELETE } = await import("@/app/api/users/[id]/route");

    await DELETE(
      makeRequest(`http://localhost/api/users/${db.manager2.id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: db.manager2.id }) }
    );

    vi.resetModules();
    mockAuthWithSession({
      id: db.sales1.id,
      name: db.sales1.name,
      email: db.sales1.email,
      role: "SALES",
      isAdmin: true,
    });
    const { DELETE: DELETE2 } = await import("@/app/api/users/[id]/route");

    const res = await DELETE2(
      makeRequest(`http://localhost/api/users/${db.manager1.id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: db.manager1.id }) }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E511");
  });

  it("IT093: パスワードリセットできる", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/users/[id]/reset-password/route");

    const req = makeRequest(`http://localhost/api/users/${db.sales1.id}/reset-password`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.sales1.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(typeof json.data.initialPassword).toBe("string");
    expect(json.data.initialPassword.length).toBeGreaterThanOrEqual(8);
  });

  it("IT094: 削除済みユーザーのパスワードリセットは 404 E003", async () => {
    mockAuth(db.manager1);
    const { DELETE } = await import("@/app/api/users/[id]/route");
    await DELETE(makeRequest(`http://localhost/api/users/${db.sales1.id}`, { method: "DELETE" }), {
      params: Promise.resolve({ id: db.sales1.id }),
    });

    vi.resetModules();
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/users/[id]/reset-password/route");
    const req = makeRequest(`http://localhost/api/users/${db.sales1.id}/reset-password`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.sales1.id }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("E003");
  });

  it("IT095: ユーザー詳細を取得できる", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/users/[id]/route");

    const req = makeRequest(`http://localhost/api/users/${db.sales1.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: db.sales1.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(db.sales1.id);
    expect(json.data.email).toBe("sales1@test.com");
  });

  it("IT096: 存在しないユーザーの詳細取得は 404 E003", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/users/[id]/route");

    const req = makeRequest("http://localhost/api/users/nonexistent-id");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("E003");
  });
});
