// spec: specs/pattern-c/approval.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs, logout } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("承認・差し戻しフロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("TC-APR-001: 承認フロー - ステータスが「完了」になり一覧に戻る", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");
    await page.getByRole("button", { name: "提出" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    const reportId = page.url().split("/").pop();
    await logout(page);

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${reportId}`);
    await expect(page.getByRole("button", { name: "承認" })).toBeVisible();
    await expect(page.getByRole("button", { name: "差し戻し" })).toBeVisible();

    await page.getByRole("button", { name: "承認" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "承認" })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "キャンセル" })
    ).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "承認" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("TC-APR-002: 承認確認ダイアログで「キャンセル」を押すと承認されない", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "承認" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "キャンセル" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("TC-APR-003: 差し戻しフロー - ステータスが「差し戻し」になる", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");
    await page.getByRole("button", { name: "提出" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    const reportId = page.url().split("/").pop();
    await logout(page);

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${reportId}`);
    await page.getByRole("button", { name: "差し戻し" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("textbox")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "差し戻し" })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "キャンセル" })
    ).toBeVisible();

    await page.getByRole("dialog").getByRole("textbox").fill("訪問内容の記載が不十分です");
    await page.getByRole("dialog").getByRole("button", { name: "差し戻し" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("TC-APR-004: 差し戻し後の日報を SALES が再提出する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.getByRole("button", { name: "差し戻し" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "差し戻し" }).click();
    await expect(page).toHaveURL(/\/manager\/reports/);
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${submittedReportId}`);
    await expect(page.getByText("差し戻し")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeVisible();

    await page.getByRole("link", { name: "編集" }).click();
    await page.getByLabel("Problem（課題・相談）").fill("修正済み内容");
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("TC-APR-005: 承認後は SALES が編集不可 - 編集ボタンが表示されない", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.getByRole("button", { name: "承認" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "承認" }).click();
    await expect(page).toHaveURL(/\/manager\/reports/);
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${submittedReportId}`);
    await page.reload();

    await expect(page.getByText("完了")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("TC-APR-006: 差し戻し理由なしで差し戻しできる", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "差し戻し" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "差し戻し" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });

  test("TC-APR-007: SALESが他の SALES の日報詳細にアクセス不可", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "sales2@test.com");
    await page.goto(`/reports/${submittedReportId}`);

    await expect(page).toHaveURL(/\/(reports|login)/);
  });

  test("TC-APR-008: MANAGERが配下以外の SALES の日報を承認不可", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager2@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await expect(page).toHaveURL(/\/(manager\/reports|login)/);
    await expect(page.getByRole("button", { name: "承認" })).toBeHidden();
  });

  test("TC-APR-009: SALES が承認操作不可", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "sales1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await expect(page).toHaveURL(/\/(reports|login)/);
  });
});
