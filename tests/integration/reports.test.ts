import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { setupTestDb, teardownTestDb, mockAuth, makeRequest } from "./setup";
import type { User, DailyReport, Customer } from "@prisma/client";

type SetupResult = {
  manager1: User;
  manager2: User;
  sales1: User;
  sales2: User;
  customer1: Customer;
  draftReport: DailyReport;
  rejectedReport: DailyReport;
  submittedReport: DailyReport;
  completedReport: DailyReport;
};

let db: SetupResult;

// 各テストでDBをリセットして状態汚染を防ぐ
beforeEach(async () => {
  vi.resetModules();
  db = (await setupTestDb()) as SetupResult;
});

afterAll(async () => {
  await teardownTestDb();
  vi.resetModules();
});

// ----------------------------------------------------------------
// IT010-IT014: 日報一覧
// ----------------------------------------------------------------
describe("GET /reports", () => {
  it("IT010: SALESは自分の日報のみ取得できる", async () => {
    mockAuth(db.sales1);
    const { GET } = await import("@/app/api/reports/route");

    const req = makeRequest("http://localhost/api/reports");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const userIds = (json.data as Array<{ user: { id: string } }>).map((r) => r.user.id);
    expect(userIds.every((id) => id === db.sales1.id)).toBe(true);
  });

  it("IT011: MANAGERは配下営業の日報のみ取得できる", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/reports/route");

    const req = makeRequest("http://localhost/api/reports");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const userIds = (json.data as Array<{ user: { id: string } }>).map((r) => r.user.id);
    expect(userIds.every((id) => id === db.sales1.id || id === db.sales2.id)).toBe(true);
    expect(userIds).not.toContain(db.manager2.id);
  });

  it("IT011a: MANAGERはstatus未指定でもDRAFT日報を取得できない", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/reports/route");

    const req = makeRequest("http://localhost/api/reports");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const statuses = (json.data as Array<{ status: string }>).map((r) => r.status);
    expect(statuses).not.toContain("DRAFT");
  });

  it("IT011b: MANAGERはstatus=DRAFTを指定してもDRAFT日報を取得できない", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/reports/route");

    const req = makeRequest("http://localhost/api/reports?status=DRAFT");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const statuses = (json.data as Array<{ status: string }>).map((r) => r.status);
    expect(statuses).not.toContain("DRAFT");
  });

  it("IT012: ステータスで絞り込みできる", async () => {
    mockAuth(db.sales1);
    const { GET } = await import("@/app/api/reports/route");

    const req = makeRequest("http://localhost/api/reports?status=SUBMITTED");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    const statuses = (json.data as Array<{ status: string }>).map((r) => r.status);
    expect(statuses.every((s) => s === "SUBMITTED")).toBe(true);
  });

  it("IT013: 日付範囲で絞り込みできる", async () => {
    mockAuth(db.sales1);
    const { GET } = await import("@/app/api/reports/route");

    // シードデータ: DRAFT=当日-4日, SUBMITTED=当日-3日, REJECTED=当日-2日, COMPLETED=当日-1日
    // dateFrom=当日-4日 & dateTo=当日-3日 でDRAFT・SUBMITTEDの2件のみが返るはず
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const d4 = new Date(today);
    d4.setDate(today.getDate() - 4);
    const d3 = new Date(today);
    d3.setDate(today.getDate() - 3);
    const dateFrom = d4.toISOString().split("T")[0];
    const dateTo = d3.toISOString().split("T")[0];

    const url = `http://localhost/api/reports?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    const req = makeRequest(url);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect((json.data as unknown[]).length).toBe(2);
    const dates = (json.data as Array<{ date: string }>).map((r) => r.date.substring(0, 10));
    dates.forEach((date) => {
      expect(date >= dateFrom).toBe(true);
      expect(date <= dateTo).toBe(true);
    });
  });

  it("IT014: 未認証は 401 E001", async () => {
    mockAuth(null);
    const { GET } = await import("@/app/api/reports/route");

    const req = makeRequest("http://localhost/api/reports");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("E001");
  });
});

// ----------------------------------------------------------------
// IT020-IT025: 日報作成
// ----------------------------------------------------------------
describe("POST /reports", () => {
  it("IT020: 下書きで日報を作成できる", async () => {
    mockAuth(db.sales1);
    const { POST } = await import("@/app/api/reports/route");

    const today = new Date();
    today.setDate(today.getDate() - 10);
    const dateStr = today.toISOString().split("T")[0];

    const req = makeRequest("http://localhost/api/reports", {
      method: "POST",
      body: JSON.stringify({ date: dateStr, status: "DRAFT" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.status).toBe("DRAFT");
  });

  it("IT021: 訪問記録複数行で作成できる", async () => {
    mockAuth(db.sales1);
    const { POST } = await import("@/app/api/reports/route");

    const today = new Date();
    today.setDate(today.getDate() - 15);
    const dateStr = today.toISOString().split("T")[0];

    const req = makeRequest("http://localhost/api/reports", {
      method: "POST",
      body: JSON.stringify({
        date: dateStr,
        status: "DRAFT",
        visitRecords: [
          { customerId: db.customer1.id, content: "訪問内容1", sortOrder: 1 },
          { customerId: db.customer1.id, content: "訪問内容2", sortOrder: 2 },
        ],
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.visitRecords).toHaveLength(2);
  });

  it("IT022: 即時提出できる (status=SUBMITTED)", async () => {
    mockAuth(db.sales1);
    const { POST } = await import("@/app/api/reports/route");

    const today = new Date();
    today.setDate(today.getDate() - 20);
    const dateStr = today.toISOString().split("T")[0];

    const req = makeRequest("http://localhost/api/reports", {
      method: "POST",
      body: JSON.stringify({ date: dateStr, status: "SUBMITTED" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.status).toBe("SUBMITTED");
  });

  it("IT023: 同日重複は 400 E202", async () => {
    mockAuth(db.sales1);
    const { POST } = await import("@/app/api/reports/route");

    // draftReport は当日-4日のDRAFTなので同じ日付で再送
    const today = new Date();
    today.setDate(today.getDate() - 4);
    const dateStr = today.toISOString().split("T")[0];

    const req = makeRequest("http://localhost/api/reports", {
      method: "POST",
      body: JSON.stringify({ date: dateStr, status: "DRAFT" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E202");
  });

  it("IT024: MANAGERは日報作成不可 403 E002", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/route");

    const today = new Date();
    today.setDate(today.getDate() - 25);
    const dateStr = today.toISOString().split("T")[0];

    const req = makeRequest("http://localhost/api/reports", {
      method: "POST",
      body: JSON.stringify({ date: dateStr, status: "DRAFT" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });

  it("IT025: 未認証は 401 E001", async () => {
    mockAuth(null);
    const { POST } = await import("@/app/api/reports/route");

    const req = makeRequest("http://localhost/api/reports", {
      method: "POST",
      body: JSON.stringify({ date: "2026-05-01", status: "DRAFT" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("E001");
  });
});

// ----------------------------------------------------------------
// IT030-IT033: 日報詳細
// ----------------------------------------------------------------
describe("GET /reports/:id", () => {
  it("IT030: SALESは自分の日報を取得できる", async () => {
    mockAuth(db.sales1);
    const { GET } = await import("@/app/api/reports/[id]/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(db.submittedReport.id);
  });

  it("IT031: MANAGERは配下営業の日報を取得できる", async () => {
    mockAuth(db.manager1);
    const { GET } = await import("@/app/api/reports/[id]/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(db.submittedReport.id);
  });

  it("IT032: 別のSALESの日報は 403 E002", async () => {
    mockAuth(db.sales2);
    const { GET } = await import("@/app/api/reports/[id]/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });

  it("IT032b: 配下でないMANAGERの日報アクセスは 403 E002", async () => {
    mockAuth(db.manager2);
    const { GET } = await import("@/app/api/reports/[id]/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });

  it("IT033: 存在しない日報は 404 E003", async () => {
    mockAuth(db.sales1);
    const { GET } = await import("@/app/api/reports/[id]/route");

    const req = makeRequest("http://localhost/api/reports/nonexistent-id");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("E003");
  });
});

// ----------------------------------------------------------------
// IT040-IT044: 日報更新
// ----------------------------------------------------------------
describe("PUT /reports/:id", () => {
  it("IT040: DRAFT日報を更新できる", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.draftReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.draftReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "DRAFT", problem: "更新済み課題" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.draftReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.problem).toBe("更新済み課題");
  });

  it("IT041: REJECTED日報を更新できる", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.rejectedReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.rejectedReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "DRAFT", plan: "更新済みプラン" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.rejectedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.plan).toBe("更新済みプラン");
  });

  it("IT042: SUBMITTED日報の更新は 400 E210", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.submittedReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "DRAFT" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E210");
  });

  it("IT043: COMPLETED日報の更新は 400 E210", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.completedReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.completedReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "DRAFT" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.completedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E210");
  });

  it("IT044: 他ユーザーの日報更新は 403 E002", async () => {
    mockAuth(db.sales2);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.draftReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.draftReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "DRAFT" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.draftReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });
});

// ----------------------------------------------------------------
// IT050-IT058: 提出・承認・差し戻し
// ----------------------------------------------------------------
describe("提出・承認・差し戻し", () => {
  it("IT050: DRAFT → SUBMITTED に提出できる", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.draftReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.draftReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "SUBMITTED" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.draftReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("SUBMITTED");
  });

  it("IT051: REJECTED → SUBMITTED に再提出できる", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.rejectedReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.rejectedReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "SUBMITTED" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.rejectedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("SUBMITTED");
  });

  it("IT052: SUBMITTED日報への提出は 400 E210", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/reports/[id]/route");

    const dateStr = db.submittedReport.date.toISOString().split("T")[0];

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}`, {
      method: "PUT",
      body: JSON.stringify({ date: dateStr, status: "SUBMITTED" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E210");
  });

  it("IT053: MANAGERがSUBMITTED日報を承認できる", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/approve/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("COMPLETED");
  });

  it("IT054: DRAFT日報の承認は 400 E301", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/approve/route");

    const req = makeRequest(`http://localhost/api/reports/${db.draftReport.id}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.draftReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E301");
  });

  it("IT055: 配下以外の日報承認は 403 E302", async () => {
    mockAuth(db.manager2);
    const { POST } = await import("@/app/api/reports/[id]/approve/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E302");
  });

  it("IT056: MANAGERがSUBMITTED日報を差し戻しできる", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/reject/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("REJECTED");
  });

  it("IT057: COMPLETED日報の差し戻しは 400 E301", async () => {
    mockAuth(db.manager1);
    const { POST } = await import("@/app/api/reports/[id]/reject/route");

    const req = makeRequest(`http://localhost/api/reports/${db.completedReport.id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.completedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E301");
  });

  it("IT058: SALESが承認操作すると 403 E002", async () => {
    mockAuth(db.sales1);
    const { POST } = await import("@/app/api/reports/[id]/approve/route");

    const req = makeRequest(`http://localhost/api/reports/${db.submittedReport.id}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: db.submittedReport.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("E002");
  });
});
