// spec: specs/pattern-c/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs, logout } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("認証フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("TC-AUTH-001: SALESユーザーのログイン成功", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "日報システム" })).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();

    await page.getByLabel("メールアドレス").fill("sales1@test.com");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("TC-AUTH-002: MANAGERユーザーのログイン成功", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("manager1@test.com");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("TC-AUTH-003: 誤ったパスワードでのログイン失敗", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("sales1@test.com");
    await page.getByLabel("パスワード").fill("wrongpassword");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "メールアドレスまたはパスワードが正しくありません" })
    ).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("TC-AUTH-004: 存在しないメールアドレスでのログイン失敗", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("notexist@test.com");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "メールアドレスまたはパスワードが正しくありません" })
    ).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("TC-AUTH-005: メールアドレス未入力でのログイン失敗", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  });

  test("TC-AUTH-006: 不正なメール形式でのログイン失敗", async ({ page }) => {
    // @なしだとHTMLネイティブバリデーションがsubmitをブロックするため test@test を使用
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("test@test");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page.getByText("正しいメールアドレスの形式で入力してください")).toBeVisible();
  });

  test("TC-AUTH-007: ログアウト機能", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await expect(page).toHaveURL(/\/reports/);

    await page.getByRole("button", { name: "ログアウト" }).click();

    await expect(page).toHaveURL("/login");
  });

  test("TC-AUTH-008: 未認証でのページアクセス", async ({ page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("TC-AUTH-009: 未認証で /manager/reports にアクセス", async ({ page }) => {
    await page.goto("/manager/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("TC-AUTH-010: 削除済みユーザーはログイン不可", async ({ page }) => {
    // 管理者でログインしてsales2を削除
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);
    await page.locator("tr", { hasText: "佐藤次郎" }).getByRole("button", { name: "削除" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page.locator("tr", { hasText: "佐藤次郎" })).toBeHidden();
    await logout(page);

    // 削除済みユーザーでログインを試みる
    await page.getByLabel("メールアドレス").fill("sales2@test.com");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "このアカウントは無効です。管理者にお問い合わせください" })
    ).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("TC-AUTH-011: 認証済みユーザーが /login にアクセスするとリダイレクトされる", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/login");

    await expect(page).toHaveURL(/\/reports/);
  });
});
