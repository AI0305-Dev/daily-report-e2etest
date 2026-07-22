// spec: specs/pattern-a/auth.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ET009: 未認証状態での保護ページへのアクセス", async ({ page }) => {
    // 1. `/reports` に直接アクセスする（未ログイン状態）
    await page.goto("/reports");

    // 期待結果: `/login` にリダイレクトされる
    await expect(page).toHaveURL(/\/login/);
  });
});
