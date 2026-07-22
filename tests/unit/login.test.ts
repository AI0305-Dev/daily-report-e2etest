import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/schemas/login";

describe("ログインスキーマ (UT001-UT004)", () => {
  it("UT001: 有効なメールアドレスとパスワードはバリデーション通過", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "pass",
    });
    expect(result.success).toBe(true);
  });

  it("UT002: メールアドレスが空の場合 E101 エラー", () => {
    const result = loginSchema.safeParse({ email: "", password: "pass" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailError?.message).toBe("E101");
    }
  });

  it("UT003: メール形式が不正な場合 E102 エラー", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "pass",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailError?.message).toBe("E102");
    }
  });

  it("UT004: パスワードが空の場合 E103 エラー", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find((i) => i.path[0] === "password");
      expect(passwordError?.message).toBe("E103");
    }
  });
});
