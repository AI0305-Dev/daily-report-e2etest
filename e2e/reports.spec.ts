import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { resetDatabase } from "./fixtures/seed";

test.describe("ET010-ET014: 日報作成・提出フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET010: 下書き保存 → 日報詳細に遷移、ステータスが「下書き」", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();
    await expect(page).toHaveURL("/reports/new");

    // 日付を当日（シードデータと重複しない）に設定
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await page.getByLabel("日付").fill(dateStr);

    // 訪問記録を追加
    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByPlaceholder("顧客名を入力して検索").fill("テスト顧客A");
    await page.locator("text=テスト顧客A").waitFor({ timeout: 5000 });
    await page.getByText("テスト顧客A").first().click();
    await page.getByPlaceholder("訪問内容").fill("E2Eテスト訪問");

    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("下書き")).toBeVisible();
  });

  test("ET011: 日報提出 → 日報詳細に遷移、ステータスが「提出済」", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();

    // 当日の日付を設定
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await page.getByLabel("日付").fill(dateStr);

    await page.getByRole("button", { name: "提出" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("ET012: 訪問記録の複数行追加・削除 → 2行が表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();

    const addButton = page.getByRole("button", { name: "訪問記録を追加" });

    // 3回追加
    await addButton.click();
    await addButton.click();
    await addButton.click();

    // 訪問記録行が3つあることを確認
    const rows = page.locator('[class*="border rounded-lg p-3"]');
    await expect(rows).toHaveCount(3);

    // 2行目（インデックス1）の削除ボタンをクリック
    await rows.nth(1).getByRole("button", { name: "削除" }).click();

    // 2行になっていることを確認
    await expect(rows).toHaveCount(2);
  });

  test("ET013: 同日重複エラー → E202エラーメッセージ表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();

    // シードのSUBMITTED日報（当日-3日）と同じ日付を使う
    const today = new Date();
    const date3DaysAgo = new Date(today);
    date3DaysAgo.setDate(today.getDate() - 3);
    const dateStr = `${date3DaysAgo.getFullYear()}-${String(date3DaysAgo.getMonth() + 1).padStart(2, "0")}-${String(date3DaysAgo.getDate()).padStart(2, "0")}`;

    await page.getByLabel("日付").fill(dateStr);
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("選択した日付の日報はすでに作成されています")).toBeVisible();
  });

  test("ET014: 訪問記録の顧客未選択で提出 → E204エラー表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.getByRole("link", { name: "日報を作成" }).click();

    // 当日の日付を設定
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await page.getByLabel("日付").fill(dateStr);

    // 訪問記録を追加するが顧客を選択しない
    await page.getByRole("button", { name: "訪問記録を追加" }).click();

    await page.getByRole("button", { name: "提出" }).click();
    await expect(page.getByText("顧客を選択してください")).toBeVisible();
  });
});
