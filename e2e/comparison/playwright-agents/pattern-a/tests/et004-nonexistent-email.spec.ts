// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET004: 存在しないメールアドレスでのログイン失敗", async ({ page }) => {
    // 1. `/login` を開く
    await page.goto("/login");

    // 2. メールアドレス欄に `notexist@test.com` を入力する
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("notexist@test.com");

    // 3. パスワード欄に `password123` を入力する
    await page.getByRole("textbox", { name: "パスワード" }).fill("password123");

    // 4. 「ログイン」ボタンをクリックする
    await page.getByRole("button", { name: "ログイン" }).click();

    // 期待結果: E104 エラーメッセージが表示される。`/login` のまま
    await expect(page).toHaveURL("/login");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "メールアドレスまたはパスワードが正しくありません" })
    ).toBeVisible();
  });
});
