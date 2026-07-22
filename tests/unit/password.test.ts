import { describe, it, expect } from "vitest";
import { changePasswordSchema } from "@/lib/schemas/password";

describe("パスワード変更スキーマ (UT080-UT087)", () => {
  it("UT080: 正常: 有効な入力", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "NewPass2",
      confirmPassword: "NewPass2",
    });
    expect(result.success).toBe(true);
  });

  it("UT081: 異常: currentPasswordが空の場合 E601 エラー", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "NewPass2",
      confirmPassword: "NewPass2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.path[0] === "currentPassword");
      expect(error?.message).toBe("E601");
    }
  });

  it("UT082: 異常: newPasswordが空の場合 E603 エラー", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "",
      confirmPassword: "NewPass2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path[0] === "newPassword" && i.message === "E603"
      );
      expect(error).toBeDefined();
    }
  });

  it("UT083: 異常: newPasswordが7文字の場合 E604 エラー", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "Pass123",
      confirmPassword: "Pass123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path[0] === "newPassword" && i.message === "E604"
      );
      expect(error).toBeDefined();
    }
  });

  it("UT084: 異常: newPasswordに数字なしの場合 E605 エラー", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path[0] === "newPassword" && i.message === "E605"
      );
      expect(error).toBeDefined();
    }
  });

  it("UT085: 異常: newPasswordに英字なしの場合 E605 エラー", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path[0] === "newPassword" && i.message === "E605"
      );
      expect(error).toBeDefined();
    }
  });

  it("UT086: 異常: confirmPasswordが空の場合 E606 エラー", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "NewPass2",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword" && i.message === "E606"
      );
      expect(error).toBeDefined();
    }
  });

  it("UT087: 異常: confirmPasswordがnewPasswordと不一致の場合 E607 エラー", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "NewPass2",
      confirmPassword: "NewPass3",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword" && i.message === "E607"
      );
      expect(error).toBeDefined();
    }
  });
});
