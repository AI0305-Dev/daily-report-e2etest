// spec: specs/pattern-a/comments.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs, logout } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("コメントフロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET050: MANAGER が提出済み日報の Problem にコメントを送信する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page
      .getByPlaceholder("コメントを入力")
      .nth(0)
      .fill("来週までに対応方針を確認してください");
    await page.getByRole("button", { name: "送信" }).nth(0).click();

    await expect(page.getByPlaceholder("コメントを入力").nth(0)).toHaveValue("");
    await expect(page.getByText("来週までに対応方針を確認してください")).toBeVisible();
  });

  test("ET051: MANAGER が提出済み日報の Plan にコメントを送信する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByPlaceholder("コメントを入力").nth(1).fill("先方の担当者を確認してから連絡を");
    await page.getByRole("button", { name: "送信" }).nth(1).click();

    await expect(page.getByPlaceholder("コメントを入力").nth(1)).toHaveValue("");
    await expect(page.getByText("先方の担当者を確認してから連絡を")).toBeVisible();
  });

  test("ET052: MANAGER が提出済み日報に全般コメントを送信する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByPlaceholder("コメントを入力").nth(2).fill("全体的によく書けています");
    await page.getByRole("button", { name: "送信" }).nth(2).click();

    await expect(page.getByPlaceholder("コメントを入力").nth(2)).toHaveValue("");
    await expect(page.getByText("全体的によく書けています")).toBeVisible();
  });

  test("ET053: SALES がコメントを閲覧できる", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page
      .getByPlaceholder("コメントを入力")
      .nth(0)
      .fill("来週までに対応方針を確認してください");
    await page.getByRole("button", { name: "送信" }).nth(0).click();
    await expect(page.getByPlaceholder("コメントを入力").nth(0)).toHaveValue("");
    await expect(page.getByText("来週までに対応方針を確認してください")).toBeVisible();
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${submittedReportId}`);
    await page.reload();

    await expect(page.getByText("来週までに対応方針を確認してください")).toBeVisible();
  });

  test("ET054: コメント本文が空のまま送信するとエラー", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "送信" }).nth(0).click();

    await expect(page.getByText("コメントを入力してください")).toBeVisible();
  });

  test("ET055: COMPLETED 日報の詳細画面ではコメント入力欄が表示されない", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/manager/reports");

    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await page.getByRole("option", { name: "全て" }).click();
    await page
      .locator("tbody tr")
      .filter({ hasText: "山田太郎" })
      .filter({ hasText: "完了" })
      .click();

    await expect(page.getByPlaceholder("コメントを入力")).toBeHidden();
    await expect(page.getByText("承認済みコメント")).toBeVisible();
  });

  test("ET056: 差し戻し時の理由コメントが日報詳細に表示される", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.getByRole("button", { name: "差し戻し" }).click();
    await page.getByRole("dialog").getByRole("textbox").fill("訪問内容が不十分です");
    await page.getByRole("dialog").getByRole("button", { name: "差し戻し" }).click();
    await expect(page).toHaveURL(/\/manager\/reports/);
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${submittedReportId}`);

    await expect(page.getByText("訪問内容が不十分です")).toBeVisible();
  });
});
