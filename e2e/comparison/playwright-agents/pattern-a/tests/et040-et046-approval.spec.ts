// spec: specs/pattern-a/approval.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs, logout } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("承認・差し戻しフロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET040: MANAGER が提出済み日報を承認する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");

    await page
      .locator("tbody tr")
      .filter({ hasText: "山田太郎" })
      .filter({ hasText: "提出済" })
      .click();
    await page.getByRole("button", { name: "承認" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "承認" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.reload();
    await expect(page.getByText("完了")).toBeVisible();
  });

  test("ET041: MANAGER が提出済み日報を差し戻す", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");

    await page
      .locator("tbody tr")
      .filter({ hasText: "山田太郎" })
      .filter({ hasText: "提出済" })
      .click();
    await page.getByRole("button", { name: "差し戻し" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("textbox").fill("訪問内容が不十分です");
    await page.getByRole("dialog").getByRole("button", { name: "差し戻し" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
    await page.goto(`/manager/reports/${submittedReportId}`);
    await expect(page.getByText("差し戻し")).toBeVisible();
  });

  test("ET042: 差し戻し後に SALES が修正・再提出できる", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.getByRole("button", { name: "差し戻し" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "差し戻し" }).click();
    await expect(page).toHaveURL(/\/manager\/reports/);
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.getByRole("cell", { name: "差し戻し" }).nth(0).click();
    await page.getByRole("link", { name: "編集" }).click();
    await page.getByLabel("Problem（課題・相談）").fill("修正した内容");
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("ET043: 承認後の日報は SALES から編集ボタンが見えない", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.getByRole("button", { name: "承認" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "承認" }).click();
    await expect(page).toHaveURL(/\/manager\/reports/);
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${submittedReportId}`);

    await expect(page.getByText("完了")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("ET044: 承認ダイアログでキャンセルすると承認されない", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "承認" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "キャンセル" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("ET045: 差し戻しダイアログでキャンセルすると差し戻されない", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "差し戻し" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "キャンセル" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("ET046: COMPLETED 日報には承認・差し戻しボタンが表示されない", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/manager/reports");

    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await page.getByRole("option", { name: "全て" }).click();
    await page
      .locator("tbody tr")
      .filter({ hasText: "山田太郎" })
      .filter({ hasText: "完了" })
      .click();

    await expect(page.getByRole("button", { name: "承認" })).toBeHidden();
    await expect(page.getByRole("button", { name: "差し戻し" })).toBeHidden();
    await expect(page.getByPlaceholder("コメントを入力")).toBeHidden();
  });
});
