// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET010: 論理削除済みユーザーのログイン失敗", async ({ page }) => {
    // 前提条件: 管理者が sales2@test.com（佐藤次郎）を論理削除する
    await page.goto("/login");
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("manager1@test.com");
    await page.getByRole("textbox", { name: "パスワード" }).fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL(/\/manager\/reports/);

    await page.goto("http://localhost:3000/admin/users");
    await page
      .getByRole("row", { name: "佐藤次郎 sales2@test.com SALES" })
      .getByRole("button")
      .click();
    await page.getByRole("button", { name: "削除する" }).click();

    // 佐藤次郎が一覧から消えていることを確認
    await expect(page.getByRole("row", { name: "佐藤次郎 sales2@test.com SALES" })).toBeHidden();

    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL("/login");

    // 削除済みユーザーでログインを試みる
    await page.getByRole("textbox", { name: "メールアドレス" }).fill("sales2@test.com");
    await page.getByRole("textbox", { name: "パスワード" }).fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    // 期待結果: 「このアカウントは無効です。管理者にお問い合わせください」（E105）が表示される
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "このアカウントは無効です。管理者にお問い合わせください" })
    ).toBeVisible();
    await expect(page).toHaveURL("/login");
  });
});
