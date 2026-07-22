// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET003: 誤パスワードでのログイン失敗", async ({ page }) => {
    // 1. `/login` を開く
    await page.goto("/login");

    // 2. メールアドレス欄に `sales1@test.com` を入力する
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("sales1@test.com");

    // 3. パスワード欄に `wrongpassword` を入力する
    await page.getByRole("textbox", { name: "パスワード" }).fill("wrongpassword");

    // 4. 「ログイン」ボタンをクリックする
    await page.getByRole("button", { name: "ログイン" }).click();

    // 期待結果: `/login` のまま遷移せず、エラーメッセージが表示される
    await expect(page).toHaveURL("/login");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "メールアドレスまたはパスワードが正しくありません" })
    ).toBeVisible();
  });
});
