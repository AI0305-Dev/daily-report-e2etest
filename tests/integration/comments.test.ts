import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { setupTestDb, teardownTestDb, mockAuth, makeRequest } from "./setup";
import type { User, Customer, DailyReport } from "@prisma/client";

type SetupResult = {
  manager1: User;
  manager2: User;
  sales1: User;
  sales2: User;
  customer1: Customer;
  draftReport: DailyReport;
  submittedReport: DailyReport;
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

// ----------------------------------------------------------------
// IT060-IT066: コメントAPI
// ----------------------------------------------------------------
describe("POST /reports/:id/comments", () => {
  it("IT060: PROBLEMへのコメントを追加できる", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/comments/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ targetField: "PROBLEM", body: "課題へのコメント" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.targetField).toBe("PROBLEM");
    expect(json.data.body).toBe("課題へのコメント");
    expect(json.data.author.id).toBe(db.manager1.id);
    expect(json.data.author.name).toBe(db.manager1.name);
  });

  it("IT061: PLANへのコメントを追加できる", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/comments/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ targetField: "PLAN", body: "プランへのコメント" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.targetField).toBe("PLAN");
    expect(json.data.body).toBe("プランへのコメント");
    expect(json.data.author.id).toBe(db.manager1.id);
    expect(json.data.author.name).toBe(db.manager1.name);
  });

  it("IT062: GENERALコメントを追加できる", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/comments/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ targetField: "GENERAL", body: "全般コメント" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.targetField).toBe("GENERAL");
    expect(json.data.body).toBe("全般コメント");
    expect(json.data.author.id).toBe(db.manager1.id);
    expect(json.data.author.name).toBe(db.manager1.name);
  });

  it("IT063: bodyが空のコメントは 400 E303", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/comments/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ targetField: "GENERAL", body: "" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E303");
  });

  it("IT064: SALESがコメントすると 403 E002", async () => {
    mockAuth(db.sales1);
    const { POST } = await import("@/app/api/reports/[id]/comments/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ targetField: "GENERAL", body: "コメント" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });

  it("IT065: 配下以外の日報へのコメントは 403 E302", async () => {
    mockAuth(db.manager2);
    const { POST } = await import("@/app/api/reports/[id]/comments/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ targetField: "GENERAL", body: "コメント" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E302");
  });

  it("IT066: DRAFT日報へのコメントは 400 E305", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/comments/route");

    const req = makeRequest(`http://localhost/api/reports/${db.draftReport.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ targetField: "GENERAL", body: "コメント" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.draftReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E305");
  });
});
