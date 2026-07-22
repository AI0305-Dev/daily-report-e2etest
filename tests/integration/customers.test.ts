import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { setupTestDb, teardownTestDb, mockAuth, makeRequest, prisma } from "./setup";
import type { User, Customer } from "@prisma/client";

type SetupResult = {
  manager1: User;
  sales1: User;
  customer1: Customer;
};

let db: SetupResult;

beforeEach(async () => {
  vi.resetModules();
  db = (await setupTestDb()) as SetupResult;
});

afterAll(async () => {
  await teardownTestDb();
  vi.resetModules();
});

describe("顧客マスタAPI統合テスト (IT070-IT079)", () => {
  it("IT070: ADMIN は isDeleted=false の顧客のみ取得できる", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/customers/route");

    const req = makeRequest("http://localhost/api/customers");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const customers = json.data as Array<{ name: string }>;
    expect(customers.some((c) => c.name === "削除済み顧客")).toBe(false);
    expect(customers.some((c) => c.name === "テスト顧客A")).toBe(true);
  });

  it("IT071: SALES も顧客一覧を取得できる", async () => {
    mockAuth(db.sales1);
    const { GET } = await import("@/app/api/customers/route");

    const req = makeRequest("http://localhost/api/customers");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it("IT072: 顧客名で部分一致検索できる", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/customers/route");

    const req = makeRequest("http://localhost/api/customers?name=顧客A");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const customers = json.data as Array<{ name: string }>;
    expect(customers.length).toBeGreaterThan(0);
    expect(customers.every((c) => c.name.includes("顧客A"))).toBe(true);
  });

  it("IT073: ADMIN は顧客を作成できる", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/customers/route");

    const req = makeRequest("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({ name: "新規顧客テスト", address: "東京都", note: null }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.name).toBe("新規顧客テスト");
  });

  it("IT074: name が空の顧客作成は 400 E401", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/customers/route");

    const req = makeRequest("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E401");
  });

  it("IT075: SALES が顧客作成すると 403 E002", async () => {
    mockAuth(db.sales1);
    const { POST } = await import("@/app/api/customers/route");

    const req = makeRequest("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({ name: "不正作成" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });

  it("IT076: ADMIN は顧客を更新できる", async () => {
    mockAuth(db.manager1);
    const { PUT } = await import("@/app/api/customers/[id]/route");

    const req = makeRequest(`http://localhost/api/customers/${db.customer1.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "更新済み顧客A", address: null, note: null }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.customer1.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.name).toBe("更新済み顧客A");
  });

  it("IT077: 存在しない顧客を更新すると 404 E003", async () => {
    mockAuth(db.manager1);
    const { PUT } = await import("@/app/api/customers/[id]/route");

    const req = makeRequest("http://localhost/api/customers/nonexistent-id", {
      method: "PUT",
      body: JSON.stringify({ name: "存在しない顧客" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("E003");
  });

  it("IT078: 顧客を論理削除できる", async () => {
    mockAuth(db.manager1);
    const { DELETE } = await import("@/app/api/customers/[id]/route");

    const req = makeRequest(`http://localhost/api/customers/${db.customer1.id}`, {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: db.customer1.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(db.customer1.id);

    const deleted = await prisma.customer.findUnique({ where: { id: db.customer1.id } });
    expect(deleted?.isDeleted).toBe(true);
  });

  it("IT079: 削除済み顧客を再削除すると 400 E405", async () => {
    // 1回削除してから再度削除を試みる
    mockAuth(db.manager1);
    const { DELETE } = await import("@/app/api/customers/[id]/route");

    // 1回目の削除
    const req1 = makeRequest(`http://localhost/api/customers/${db.customer1.id}`, {
      method: "DELETE",
    });
    await DELETE(req1, { params: Promise.resolve({ id: db.customer1.id }) });

    // 2回目の削除（モジュールは同一なので再インポート不要）
    const req2 = makeRequest(`http://localhost/api/customers/${db.customer1.id}`, {
      method: "DELETE",
    });
    const res = await DELETE(req2, { params: Promise.resolve({ id: db.customer1.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E405");
  });
});
