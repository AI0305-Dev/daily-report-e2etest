// spec: specs/pattern-a/password.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("パスワード変更フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET080: SALES ユーザーがパスワードを変更する", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    await page.getByRole("button", { name: "山田太郎" }).click();
    await page.getByRole("menuitem", { name: "パスワード変更" }).click();
    await expect(page).toHaveURL("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("ET081: MANAGER ユーザーがパスワードを変更するとマネージャートップに戻る", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");

    await page.getByRole("button", { name: "鈴木部長" }).click();
    await page.getByRole("menuitem", { name: "パスワード変更" }).click();
    await expect(page).toHaveURL("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("ET082: 現在のパスワードが誤っているとエラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("wrongpassword");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("現在のパスワードが正しくありません")).toBeVisible();
    await expect(page).toHaveURL("/settings/password");
  });

  test("ET083: 新しいパスワードが 8 文字未満でエラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("Pass1");
    await page.getByLabel("新しいパスワード（確認）").fill("Pass1");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("パスワードは8文字以上で入力してください")).toBeVisible();
  });

  test("ET084: 新しいパスワードに数字が含まれないとエラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("Password");
    await page.getByLabel("新しいパスワード（確認）").fill("Password");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("パスワードは英字と数字を両方含めてください")).toBeVisible();
  });

  test("ET085: 確認用パスワードが不一致でエラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass789");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("パスワードが一致しません")).toBeVisible();
  });

  test("ET086: パスワード変更画面でキャンセルすると SALES は日報一覧に戻る", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByRole("button", { name: "キャンセル" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("ET087: パスワード変更画面でキャンセルすると MANAGER は上長日報一覧に戻る", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/settings/password");

    await page.getByRole("button", { name: "キャンセル" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });
});
