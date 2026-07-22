// spec: specs/pattern-c/reports.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("日報作成・提出フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("TC-REP-001: 下書き保存 - 日報詳細に遷移しステータスが「下書き」になる", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "+ 日報を作成" }).click();
    await expect(page).toHaveURL(/\/reports\/new/);
    await expect(page.getByRole("heading", { name: "日報作成" })).toBeVisible();

    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByPlaceholder("顧客名を入力して検索").fill("テスト顧客A");
    await page.locator("button", { hasText: "テスト顧客A" }).click();
    await page.getByPlaceholder("訪問内容").fill("E2Eテスト訪問");
    await page.getByLabel("Problem（課題・相談）").fill("E2Eテスト課題");
    await page.getByLabel("Plan（明日やること）").fill("E2Eテストプラン");
    await page.getByRole("button", { name: "下書き保存" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("下書き")).toBeVisible();
    await expect(page.getByText("テスト顧客A")).toBeVisible();
  });

  test("TC-REP-002: 日報提出 - 日報詳細に遷移しステータスが「提出済」になる", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "+ 日報を作成" }).click();
    await expect(page).toHaveURL(/\/reports\/new/);

    await page.getByRole("button", { name: "提出" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("提出済")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("TC-REP-003: 訪問記録の複数行追加・削除 - 2行が表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    const addButton = page.getByRole("button", { name: "訪問記録を追加" });
    await addButton.click();
    await addButton.click();
    await addButton.click();

    const deleteButtons = page.getByRole("button", { name: "削除" });
    await expect(deleteButtons).toHaveCount(3);
    await deleteButtons.nth(1).click();
    await expect(deleteButtons).toHaveCount(2);
  });

  test("TC-REP-004: 訪問記録 10 件追加で「訪問記録を追加」ボタンが disabled になる", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    const addButton = page.getByRole("button", { name: "訪問記録を追加" });
    for (let i = 0; i < 10; i++) {
      await addButton.click();
    }

    await expect(addButton).toBeDisabled();
  });

  test("TC-REP-005: 同日重複エラー - E202 エラーメッセージが表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    // 1件目: 今日の日付で日報を作成
    await page.goto("/reports/new");
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);

    // 2件目: 同じ今日の日付で日報を作成しようとするとエラー
    await page.goto("/reports/new");
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("選択した日付の日報はすでに作成されています")).toBeVisible();
    await expect(page).toHaveURL(/\/reports\/new/);
  });

  test("TC-REP-006: 訪問記録の顧客未選択で提出 - E204 エラーが表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("顧客を選択してください")).toBeVisible();
  });

  test("TC-REP-007: 訪問内容未入力で提出 - E205 エラーが表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByPlaceholder("顧客名を入力して検索").fill("テスト顧客A");
    await page.locator("button", { hasText: "テスト顧客A" }).click();
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("訪問内容を入力してください")).toBeVisible();
  });

  // ブラウザのネイティブ date input は fill("") で空にできないため、
  // 日付フィールドが空の状態を再現できない。アプリ側でも日付が必須のため
  // デフォルト値（今日）が常にセットされており、このシナリオは UI 上再現不可。
  test.fixme("TC-REP-008: 日付未入力で保存 - E201 エラーが表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByLabel("日付").fill("");
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("日付を入力してください")).toBeVisible();
  });

  test("TC-REP-009: 日報一覧のステータスフィルター機能", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "下書き" }).click();

    await expect(page.getByRole("cell", { name: "下書き" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "提出済" })).toBeHidden();
    await expect(page.getByRole("cell", { name: "差し戻し" })).toBeHidden();
    await expect(page.getByRole("cell", { name: "完了" })).toBeHidden();
  });

  test("TC-REP-010: 日報編集 - 日付・訪問記録・Problem/Planを変更して保存", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "下書き" }).click();
    await page.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(/\/reports\/[^/]+\/edit$/);
    await expect(page.getByRole("heading", { name: "日報編集" })).toBeVisible();

    await page.getByLabel("Problem（課題・相談）").fill("編集テスト課題");
    await page.getByRole("button", { name: "下書き保存" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("編集テスト課題")).toBeVisible();
  });

  test("TC-REP-011: 日報編集画面から「キャンセル」で日報詳細に戻る", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "下書き" }).click();
    await expect(page).toHaveURL(/\/reports\/[^/]+$/);
    const detailUrl = page.url();
    await page.getByRole("link", { name: "編集" }).click();
    await page.getByRole("button", { name: "キャンセル" }).click();

    await expect(page).toHaveURL(detailUrl);
  });

  test("TC-REP-012: 日報一覧画面で「一覧に戻る」リンクが機能する", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "下書き" }).click();
    await page.getByRole("link", { name: "一覧に戻る" }).click();

    await expect(page).toHaveURL(/\/reports$/);
  });

  test("TC-REP-013: 訪問記録無しで提出できる（内勤日ケース）", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "提出" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("提出済")).toBeVisible();
  });
});
