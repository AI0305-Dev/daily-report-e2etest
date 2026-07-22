import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { setupTestDb, teardownTestDb, TEST_PASSWORD, mockAuth, makeRequest } from "./setup";
import type { User } from "@prisma/client";

type SetupResult = {
  sales1: User;
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

describe("パスワード変更API統合テスト (IT090-IT092)", () => {
  it("IT090: パスワードを正常に変更できる", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/users/me/password/route");

    const req = makeRequest("http://localhost/api/users/me/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: TEST_PASSWORD,
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      }),
    });
    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.message).toBe("パスワードを変更しました");
  });

  it("IT091: 現在のパスワードが不一致は 400 E602", async () => {
    mockAuth(db.sales1);
    const { PUT } = await import("@/app/api/users/me/password/route");

    const req = makeRequest("http://localhost/api/users/me/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: "wrongPassword1",
        newPassword: "NewPass789",
        confirmPassword: "NewPass789",
      }),
    });
    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("E602");
  });

  it("IT092: 未認証は 401 E001", async () => {
    mockAuth(null);
    const { PUT } = await import("@/app/api/users/me/password/route");

    const req = makeRequest("http://localhost/api/users/me/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: TEST_PASSWORD,
        newPassword: "NewPass999",
        confirmPassword: "NewPass999",
      }),
    });
    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("E001");
  });
});
