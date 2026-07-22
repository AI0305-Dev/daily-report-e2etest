// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET007: パスワード未入力でのバリデーションエラー", async ({ page }) => {
    // 1. `/login` を開く
    await page.goto("/login");

    // 2. メールアドレス欄に `sales1@test.com` を入力する（パスワードは空のまま）
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("sales1@test.com");

    // 3. 「ログイン」ボタンをクリックする
    await page.getByRole("button", { name: "ログイン" }).click();

    // 期待結果: 「パスワードを入力してください」（E103）が表示される
    await expect(page.getByText("パスワードを入力してください")).toBeVisible();
  });
});
