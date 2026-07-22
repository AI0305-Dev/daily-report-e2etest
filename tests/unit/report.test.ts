import { describe, it, expect } from "vitest";
import { createReportSchema } from "@/lib/schemas/report";

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const today = new Date();
const todayStr = toLocalDateStr(today);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = toLocalDateStr(tomorrow);

const validVisitRecord = {
  customerId: "customer-id-1",
  content: "訪問内容",
  sortOrder: 1,
};

describe("日報作成スキーマ (UT010-UT020)", () => {
  it("UT010: 正常: 必須項目のみ（訪問記録なし・status=DRAFT）", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      status: "DRAFT",
    });
    expect(result.success).toBe(true);
  });

  it("UT011: 正常: 訪問記録あり", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      visitRecords: [validVisitRecord],
      status: "SUBMITTED",
    });
    expect(result.success).toBe(true);
  });

  it("UT012: 異常: 日付が空の場合 E201 エラー", () => {
    const result = createReportSchema.safeParse({
      date: "",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dateError = result.error.issues.find((i) => i.path[0] === "date");
      expect(dateError?.message).toBe("E201");
    }
  });

  it("UT013: 異常: 未来日の場合 E203 エラー", () => {
    const result = createReportSchema.safeParse({
      date: tomorrowStr,
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dateError = result.error.issues.find((i) => i.path[0] === "date");
      expect(dateError?.message).toBe("E203");
    }
  });

  it("UT013a: 異常: 不正な日付文字列 (not-a-date) は E203 エラー", () => {
    const result = createReportSchema.safeParse({
      date: "not-a-date",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
  });

  it("UT013b: 異常: 存在しない月日 (2026-00-01) は E203 エラー", () => {
    const result = createReportSchema.safeParse({
      date: "2026-00-01",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
  });

  it("UT013c: 異常: 存在しない月日 (2026-13-01) は E203 エラー", () => {
    const result = createReportSchema.safeParse({
      date: "2026-13-01",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
  });

  it("UT014: 異常: 訪問記録の顧客IDが空の場合 E204 エラー", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      visitRecords: [{ ...validVisitRecord, customerId: "" }],
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.message === "E204");
      expect(error).toBeDefined();
    }
  });

  it("UT015: 異常: 訪問内容が空の場合 E205 エラー", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      visitRecords: [{ ...validVisitRecord, content: "" }],
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.message === "E205");
      expect(error).toBeDefined();
    }
  });

  it("UT016: 異常: 訪問記録が11件の場合 E206 エラー", () => {
    const records = Array.from({ length: 11 }, (_, i) => ({
      customerId: `customer-${i}`,
      content: "訪問内容",
      sortOrder: i + 1,
    }));
    const result = createReportSchema.safeParse({
      date: todayStr,
      visitRecords: records,
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.message === "E206");
      expect(error).toBeDefined();
    }
  });

  it("UT017: 異常: 訪問内容が1001文字の場合 E207 エラー", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      visitRecords: [{ ...validVisitRecord, content: "a".repeat(1001) }],
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.message === "E207");
      expect(error).toBeDefined();
    }
  });

  it("UT018: 異常: Problemが2001文字の場合 E208 エラー", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      problem: "a".repeat(2001),
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path[0] === "problem" && i.message === "E208"
      );
      expect(error).toBeDefined();
    }
  });

  it("UT019: 異常: Planが2001文字の場合 E209 エラー", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      plan: "a".repeat(2001),
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.path[0] === "plan" && i.message === "E209");
      expect(error).toBeDefined();
    }
  });

  it("UT020: 異常: 不正なstatusの場合バリデーションエラー", () => {
    const result = createReportSchema.safeParse({
      date: todayStr,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.path[0] === "status");
      expect(error).toBeDefined();
    }
  });
});
