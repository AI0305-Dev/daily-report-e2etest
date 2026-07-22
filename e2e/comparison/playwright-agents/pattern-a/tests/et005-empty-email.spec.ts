// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET005: メールアドレス未入力でのバリデーションエラー", async ({ page }) => {
    // 1. `/login` を開く
    await page.goto("/login");

    // 2. パスワード欄に `password123` を入力する（メールアドレスは空のまま）
    await page.getByRole("textbox", { name: "パスワード" }).fill("password123");

    // 3. 「ログイン」ボタンをクリックする
    await page.getByRole("button", { name: "ログイン" }).click();

    // 期待結果: 「メールアドレスを入力してください」（E101）が表示される
    await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  });
});
