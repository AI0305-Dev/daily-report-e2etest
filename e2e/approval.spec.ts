import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";
import { resetDatabase } from "./fixtures/seed";

test.describe("ET020-ET023: 承認・差し戻しフロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET020: 承認フロー → ステータスが「完了」、一覧に戻る", async ({ page }) => {
    // SALESで日報を提出（当日の日報を新規作成して提出）
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await page.getByLabel("日付").fill(dateStr);
    await page.getByRole("button", { name: "提出" }).click();
    await expect(page.getByText("提出済")).toBeVisible();
    const reportUrl = page.url();
    const reportId = reportUrl.split("/").pop();

    // MANAGERでログイン
    await logout(page);
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${reportId}`);

    // 承認ボタンをクリック
    await page.getByRole("button", { name: "承認" }).click();

    // 確認ダイアログでOK
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "承認" }).last().click();

    // 一覧に戻り、ステータスが完了になっていること
    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("ET021: 差し戻しフロー → ステータスが「差し戻し」", async ({ page }) => {
    // SALESで日報を提出
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await page.getByLabel("日付").fill(dateStr);
    await page.getByRole("button", { name: "提出" }).click();
    await expect(page.getByText("提出済")).toBeVisible();
    const reportUrl = page.url();
    const reportId = reportUrl.split("/").pop();

    // MANAGERでログイン
    await logout(page);
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${reportId}`);

    // 差し戻しボタンをクリック
    await page.getByRole("button", { name: "差し戻し" }).click();

    // 確認ダイアログでOK
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "差し戻し" }).last().click();

    // 一覧に戻ること
    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("ET022: 差し戻し後の再提出 → ステータスが「提出済」", async ({ page }) => {
    // SALESで日報を提出
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await page.getByLabel("日付").fill(dateStr);
    await page.getByRole("button", { name: "提出" }).click();
    await expect(page.getByText("提出済")).toBeVisible();
    const reportUrl = page.url();
    const reportId = reportUrl.split("/").pop();

    // MANAGERで差し戻し
    await logout(page);
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${reportId}`);
    await page.getByRole("button", { name: "差し戻し" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "差し戻し" }).last().click();
    await expect(page).toHaveURL(/\/manager\/reports/);

    // SALESで差し戻し日報を開いて再提出
    await logout(page);
    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${reportId}`);
    await expect(page.getByText("差し戻し")).toBeVisible();
    await page.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(`/reports/${reportId}/edit`);
    await page.getByRole("button", { name: "提出" }).click();

    // 提出済になること
    await expect(page).toHaveURL(`/reports/${reportId}`);
    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("ET023: 承認後は編集不可 → 編集ボタンが表示されない", async ({ page }) => {
    // SALESで日報を提出
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await page.getByLabel("日付").fill(dateStr);
    await page.getByRole("button", { name: "提出" }).click();
    await expect(page.getByText("提出済")).toBeVisible();
    const reportUrl = page.url();
    const reportId = reportUrl.split("/").pop();

    // MANAGERで承認
    await logout(page);
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${reportId}`);
    await page.getByRole("button", { name: "承認" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "承認" }).last().click();
    await expect(page).toHaveURL(/\/manager\/reports/);
    await page.waitForLoadState("load");

    // SALESで日報詳細を確認 → 編集ボタンがないこと
    await logout(page);
    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${reportId}`);
    await expect(page.getByText("完了")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });
});
