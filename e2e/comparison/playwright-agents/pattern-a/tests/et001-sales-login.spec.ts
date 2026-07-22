// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET001: SALES ユーザーのログイン成功", async ({ page }) => {
    // 1. `/login` を開く
    await page.goto("/login");

    // 2. メールアドレス欄に `sales1@test.com` を入力する
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("sales1@test.com");

    // 3. パスワード欄に `password123` を入力する
    await page.getByRole("textbox", { name: "パスワード" }).fill("password123");

    // 4. 「ログイン」ボタンをクリックする
    await page.getByRole("button", { name: "ログイン" }).click();

    // 期待結果: `/reports`（営業日報一覧）にリダイレクトされる
    await expect(page).toHaveURL(/\/reports/);
  });
});
