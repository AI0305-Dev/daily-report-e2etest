// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET011: 認証済みユーザーが `/login` にアクセスすると自動リダイレクト", async ({ page }) => {
    // 前提条件: sales1@test.com でログイン済み
    await page.goto("/login");
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("sales1@test.com");
    await page.getByRole("textbox", { name: "パスワード" }).fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL(/\/reports/);

    // `/login` に直接アクセスする
    await page.goto("http://localhost:3000/login");

    // 期待結果: `/reports` にリダイレクトされる（ログイン画面は表示されない）
    await expect(page).toHaveURL(/\/reports/);
  });
});
