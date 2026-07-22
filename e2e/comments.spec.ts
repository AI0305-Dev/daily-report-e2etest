import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";
import { resetDatabase } from "./fixtures/seed";

test.describe("ET030-ET031: コメントフロー", () => {
  let submittedReportId: string;

  test.beforeEach(async () => {
    const result = await resetDatabase();
    submittedReportId = result.submittedReportId;
  });

  test("ET030: MANAGERがProblemへのコメントを送信 → コメントが表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    // ページ内の最初のコメント入力欄（Problem）を使用
    const allCommentTextareas = page.getByPlaceholder("コメントを入力");
    await allCommentTextareas.first().fill("ProblemへのE2Eテストコメント");
    await page.getByRole("button", { name: "送信" }).first().click();

    await expect(page.getByText("ProblemへのE2Eテストコメント")).toBeVisible();
  });

  test("ET031: SALESが上長コメントを閲覧できる", async ({ page }) => {
    // まずMANAGERでコメントを投稿
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    const allCommentTextareas = page.getByPlaceholder("コメントを入力");
    await allCommentTextareas.first().fill("ET031上長コメント確認テスト");

    // コメント投稿APIのレスポンスを直接待ち、書き込みが完了したことを確認してから進める
    const [commentResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/reports/${submittedReportId}/comments`) &&
          res.request().method() === "POST"
      ),
      page.getByRole("button", { name: "送信" }).first().click(),
    ]);
    expect(commentResponse.ok()).toBeTruthy();
    await expect(page.getByText("ET031上長コメント確認テスト")).toBeVisible();

    // SALESで同じ日報を確認
    await logout(page);
    await loginAs(page, "sales1@test.com");

    // 日報詳細はサーバーサイドレンダリングのため、直前の書き込みが読み取り側に
    // 反映されるまでの遅延で初回表示に間に合わないことがある。反映されるまでリロードして再取得する
    // 内側のtoBeVisibleにも短いtimeoutを明示し、goto自体を繰り返しリトライさせる
    // （指定しないとexpectのグローバル既定(15s)を継承し、外側のtoPassがほぼ1回しか試行できなくなる）
    await expect(async () => {
      await page.goto(`/reports/${submittedReportId}`, { waitUntil: "load" });
      await expect(page.getByText("ET031上長コメント確認テスト")).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    await expect(page.getByText("上長コメント", { exact: true })).toBeVisible();
  });
});
