// spec: specs/pattern-c/password.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("パスワード変更フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("TC-PWD-001: SALES ユーザーのパスワード変更成功 - /reports にリダイレクト", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await expect(page).toHaveURL(/\/reports/);

    await page.getByRole("button", { name: "山田太郎" }).click();
    await expect(page.getByRole("menuitem", { name: "パスワード変更" })).toBeVisible();
    await page.getByRole("menuitem", { name: "パスワード変更" }).click();
    await expect(page).toHaveURL("/settings/password");
    await expect(page.getByRole("heading", { name: "パスワード変更" })).toBeVisible();

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("TC-PWD-002: MANAGER ユーザーのパスワード変更成功 - /manager/reports にリダイレクト", async ({
    page,
  }) => {
    await loginAs(page, "manager2@test.com");
    await page.goto("/settings/password");
    await expect(page.getByRole("heading", { name: "パスワード変更" })).toBeVisible();

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("TC-PWD-003: 現在のパスワード不正で失敗 - E602 エラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("wrongpassword");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("現在のパスワードが正しくありません")).toBeVisible();
    await expect(page).toHaveURL("/settings/password");
  });

  test("TC-PWD-004: 新パスワードポリシー不足（文字数不足）- E604 エラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("Pass123");
    await page.getByLabel("新しいパスワード（確認）").fill("Pass123");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("パスワードは8文字以上で入力してください")).toBeVisible();
  });

  test("TC-PWD-005: 新パスワードポリシー不足（数字なし）- E605 エラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("Password");
    await page.getByLabel("新しいパスワード（確認）").fill("Password");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("パスワードは英字と数字を両方含めてください")).toBeVisible();
  });

  test("TC-PWD-006: 新パスワードポリシー不足（英字なし）- E605 エラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("12345678");
    await page.getByLabel("新しいパスワード（確認）").fill("12345678");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("パスワードは英字と数字を両方含めてください")).toBeVisible();
  });

  test("TC-PWD-007: 確認パスワード不一致 - E607 エラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("現在のパスワード").fill("password123");
    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("DifferentPass789");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("パスワードが一致しません")).toBeVisible();
  });

  test("TC-PWD-008: パスワード変更画面で「キャンセル」を押すとロール別トップに戻る", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByRole("button", { name: "キャンセル" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("TC-PWD-009: 現在のパスワード未入力 - E601 エラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await page.getByLabel("新しいパスワード *", { exact: true }).fill("NewPass456");
    await page.getByLabel("新しいパスワード（確認）").fill("NewPass456");
    await page.getByRole("button", { name: "変更する" }).click();

    await expect(page.getByText("現在のパスワードを入力してください")).toBeVisible();
  });
});
