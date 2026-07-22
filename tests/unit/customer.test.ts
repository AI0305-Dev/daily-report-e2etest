import { describe, it, expect } from "vitest";
import { createCustomerSchema } from "@/lib/schemas/customer";

describe("顧客スキーマ (UT030-UT035)", () => {
  it("UT030: 正常: 顧客名のみ", () => {
    const result = createCustomerSchema.safeParse({ name: "株式会社〇〇" });
    expect(result.success).toBe(true);
  });

  it("UT031: 正常: 全項目入力", () => {
    const result = createCustomerSchema.safeParse({
      name: "株式会社〇〇",
      address: "東京都〇〇区",
      note: "備考テキスト",
    });
    expect(result.success).toBe(true);
  });

  it("UT032: 異常: nameが空の場合 E401 エラー", () => {
    const result = createCustomerSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameError?.message).toBe("E401");
    }
  });

  it("UT033: 異常: nameが101文字の場合 E402 エラー", () => {
    const result = createCustomerSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameError?.message).toBe("E402");
    }
  });

  it("UT034: 異常: addressが201文字の場合 E403 エラー", () => {
    const result = createCustomerSchema.safeParse({
      name: "株式会社〇〇",
      address: "a".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const addressError = result.error.issues.find((i) => i.path[0] === "address");
      expect(addressError?.message).toBe("E403");
    }
  });

  it("UT035: 異常: noteが1001文字の場合 E404 エラー", () => {
    const result = createCustomerSchema.safeParse({
      name: "株式会社〇〇",
      note: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const noteError = result.error.issues.find((i) => i.path[0] === "note");
      expect(noteError?.message).toBe("E404");
    }
  });
});
