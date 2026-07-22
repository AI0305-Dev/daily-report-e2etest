import { describe, it, expect } from "vitest";
import { createCommentSchema } from "@/lib/schemas/comment";

describe("コメントスキーマ (UT021-UT025)", () => {
  it("UT021: 正常: PROBLEM宛コメント", () => {
    const result = createCommentSchema.safeParse({
      targetField: "PROBLEM",
      body: "テスト",
    });
    expect(result.success).toBe(true);
  });

  it("UT022: 正常: GENERAL宛コメント", () => {
    const result = createCommentSchema.safeParse({
      targetField: "GENERAL",
      body: "テスト",
    });
    expect(result.success).toBe(true);
  });

  it("UT023: 異常: bodyが空の場合 E303 エラー", () => {
    const result = createCommentSchema.safeParse({
      targetField: "PLAN",
      body: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const bodyError = result.error.issues.find((i) => i.path[0] === "body");
      expect(bodyError?.message).toBe("E303");
    }
  });

  it("UT024: 異常: bodyが1001文字の場合 E304 エラー", () => {
    const result = createCommentSchema.safeParse({
      targetField: "PROBLEM",
      body: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const bodyError = result.error.issues.find((i) => i.path[0] === "body");
      expect(bodyError?.message).toBe("E304");
    }
  });

  it("UT025: 異常: 不正なtargetFieldの場合バリデーションエラー", () => {
    const result = createCommentSchema.safeParse({
      targetField: "INVALID",
      body: "テスト",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.path[0] === "targetField");
      expect(error).toBeDefined();
    }
  });
});
