// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET006: 不正なメール形式でのバリデーションエラー", async ({ page }) => {
    // 1. `/login` を開く
    await page.goto("/login");

    // 2. メールアドレス欄に `test@test` を入力する
    // （@なしの invalid-email はHTMLネイティブバリデーションでsubmitがブロックされZodに到達しない）
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("test@test");

    // 3. パスワード欄に `password123` を入力する
    await page.getByRole("textbox", { name: "パスワード" }).fill("password123");

    // 4. 「ログイン」ボタンをクリックする
    await page.getByRole("button", { name: "ログイン" }).click();

    // 期待結果: 「正しいメールアドレスの形式で入力してください」（E102）が表示される
    await expect(page.getByText("正しいメールアドレスの形式で入力してください")).toBeVisible();
  });
});
