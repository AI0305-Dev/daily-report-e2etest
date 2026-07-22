import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";
import { resetDatabase } from "./fixtures/seed";

test.describe("ET001-ET005: 認証フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET001: SALESログイン → /reports に遷移", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await expect(page).toHaveURL(/\/reports$/);
  });

  test("ET002: MANAGERログイン → /manager/reports に遷移", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page).toHaveURL(/\/manager\/reports$/);
  });

  test("ET003: 誤パスワードでログイン → エラーメッセージ表示", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("sales1@test.com");
    await page.getByLabel("パスワード").fill("wrongpassword");
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page.getByText("メールアドレスまたはパスワードが正しくありません")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("ET004: ログアウト → /login に遷移", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await logout(page);
    await expect(page).toHaveURL("/login");
  });

  test("ET005: 未認証で /reports にアクセス → /login にリダイレクト", async ({ page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login/);
  });
});
