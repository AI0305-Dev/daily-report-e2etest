import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { resetDatabase } from "./fixtures/seed";

test.describe("ET050-ET051: パスワード変更フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET050: パスワード変更成功 → /reports にリダイレクト", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    // ヘッダーのユーザー名をクリック
    await page.getByRole("button", { name: "山田太郎" }).click();

    // ドロップダウンから「パスワード変更」を選択
    await page.getByRole("menuitem", { name: "パスワード変更" }).click();
    await expect(page).toHaveURL("/settings/password");

    // パスワード変更フォームに入力
    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    // /reports にリダイレクト
    await expect(page).toHaveURL(/\/reports/);
  });

  test("ET051: パスワード変更失敗（現パスワード不正） → E602エラーが表示される", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");

    // パスワード変更画面に直接アクセス
    await page.goto("/settings/password");

    // 誤った現在のパスワードを入力
    await page.getByLabel("現在のパスワード").fill("wrongpassword");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    // E602エラーが表示される（同画面のまま）
    await expect(page.getByText("現在のパスワードが正しくありません")).toBeVisible();
    await expect(page).toHaveURL("/settings/password");
  });
});
