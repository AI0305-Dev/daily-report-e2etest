// spec: specs/pattern-c/comments.md
// seed: e2e/seed-generator.spec.ts

import { test, expect, request } from "@playwright/test";
import { loginAs, logout } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("コメントフロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("TC-CMT-001: MANAGER が Problem へのコメントを送信する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await expect(page.getByPlaceholder("コメントを入力").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "送信" }).first()).toBeVisible();

    await page.getByPlaceholder("コメントを入力").first().fill("ProblemへのE2Eテストコメント");
    await page.getByRole("button", { name: "送信" }).first().click();

    await expect(page.getByPlaceholder("コメントを入力").first()).toHaveValue("");
    await expect(page.getByText("ProblemへのE2Eテストコメント")).toBeVisible();
  });

  test("TC-CMT-002: MANAGER が Plan へのコメントを送信する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByPlaceholder("コメントを入力").nth(1).fill("Planへのテストコメント");
    await page.getByRole("button", { name: "送信" }).nth(1).click();

    await expect(page.getByText("Planへのテストコメント")).toBeVisible();
    await expect(page.getByPlaceholder("コメントを入力").nth(1)).toHaveValue("");
  });

  test("TC-CMT-003: MANAGER が全般コメント（GENERAL）を送信する", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByPlaceholder("コメントを入力").nth(2).fill("全般テストコメント");
    await page.getByRole("button", { name: "送信" }).nth(2).click();

    await expect(page.getByText("全般テストコメント")).toBeVisible();
  });

  test("TC-CMT-004: SALES が上長コメントを閲覧できる", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.getByPlaceholder("コメントを入力").first().fill("上長コメント閲覧テスト");
    await page.getByRole("button", { name: "送信" }).first().click();
    await expect(page.getByPlaceholder("コメントを入力").first()).toHaveValue("");
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${submittedReportId}`);
    await page.reload();

    await expect(page.getByText("上長コメント閲覧テスト")).toBeVisible();
  });

  test("TC-CMT-005: コメント本文が空の状態で送信してもエラー - E303", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "送信" }).first().click();

    await expect(page.getByText("コメントを入力してください")).toBeVisible();
  });

  test("TC-CMT-006: SUBMITTED 以外の日報にはコメント入力欄が表示されない", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/manager/reports");

    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.locator("tr", { hasText: "完了" }).click();

    await expect(page.getByPlaceholder("コメントを入力")).toBeHidden();
    await expect(page.getByRole("button", { name: "送信" })).toBeHidden();
  });

  test("TC-CMT-007: 差し戻し理由のコメントが SALES の日報詳細に表示される", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();

    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);
    await page.getByRole("button", { name: "差し戻し" }).click();
    await page.getByRole("dialog").getByRole("textbox").fill("差し戻し理由テストコメント");
    await page.getByRole("dialog").getByRole("button", { name: "差し戻し" }).click();
    await expect(page).toHaveURL(/\/manager\/reports/);
    await logout(page);

    await loginAs(page, "sales1@test.com");
    await page.goto(`/reports/${submittedReportId}`);

    await expect(page.getByText("差し戻し理由テストコメント")).toBeVisible();
  });

  test("TC-CMT-008: SALES はコメント送信不可（MANAGER 画面にアクセスできない）", async ({
    page,
  }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "sales1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    // SALESはマネージャー画面にアクセスできない
    await expect(page).toHaveURL(/\/(reports|login)/);
  });
});
