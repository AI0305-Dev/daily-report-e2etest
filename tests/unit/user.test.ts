import { describe, it, expect } from "vitest";
import { createUserSchema } from "@/lib/schemas/user";

describe("ユーザースキーマ (UT040-UT049)", () => {
  it("UT040: 正常: SALESユーザー", () => {
    const result = createUserSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
      role: "SALES",
      isAdmin: false,
      managerId: "manager-id-1",
    });
    expect(result.success).toBe(true);
  });

  it("UT041: 正常: MANAGERユーザー", () => {
    const result = createUserSchema.safeParse({
      name: "鈴木部長",
      email: "suzuki@example.com",
      role: "MANAGER",
      isAdmin: true,
    });
    expect(result.success).toBe(true);
  });

  it("UT042: 異常: nameが空の場合 E501 エラー", () => {
    const result = createUserSchema.safeParse({
      name: "",
      email: "yamada@example.com",
      role: "MANAGER",
      isAdmin: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameError?.message).toBe("E501");
    }
  });

  it("UT043: 異常: emailが空の場合 E503 エラー", () => {
    const result = createUserSchema.safeParse({
      name: "山田太郎",
      email: "",
      role: "MANAGER",
      isAdmin: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailError?.message).toBe("E503");
    }
  });

  it("UT044: 異常: emailが不正形式の場合 E504 エラー", () => {
    const result = createUserSchema.safeParse({
      name: "山田太郎",
      email: "invalid",
      role: "MANAGER",
      isAdmin: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailError?.message).toBe("E504");
    }
  });

  it("UT045: 異常: emailが255文字の場合 E506 エラー", () => {
    const result = createUserSchema.safeParse({
      name: "山田太郎",
      email: "a".repeat(249) + "@b.com",
      role: "MANAGER",
      isAdmin: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailError?.message).toBe("E506");
    }
  });

  it("UT046: 異常: roleが空の場合 E507 エラー", () => {
    const result = createUserSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
      role: "",
      isAdmin: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const roleError = result.error.issues.find((i) => i.path[0] === "role");
      expect(roleError?.message).toBe("E507");
    }
  });

  it("UT047: 異常: 不正なroleの場合バリデーションエラー", () => {
    const result = createUserSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
      role: "ADMIN",
      isAdmin: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const roleError = result.error.issues.find((i) => i.path[0] === "role");
      expect(roleError).toBeDefined();
    }
  });

  it("UT048: 異常: role=SALESかつmanagerIdが未指定の場合 E509 エラー", () => {
    const result = createUserSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
      role: "SALES",
      isAdmin: false,
      managerId: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.message === "E509");
      expect(error).toBeDefined();
    }
  });

  it("UT049: 異常: nameが51文字の場合 E502 エラー", () => {
    const result = createUserSchema.safeParse({
      name: "a".repeat(51),
      email: "yamada@example.com",
      role: "MANAGER",
      isAdmin: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameError?.message).toBe("E502");
    }
  });
});
