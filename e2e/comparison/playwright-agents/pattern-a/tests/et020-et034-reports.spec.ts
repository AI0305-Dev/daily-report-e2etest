// spec: specs/pattern-a/reports.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("日報作成・編集・提出フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET020: 日報を下書き保存する（訪問記録あり）", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByPlaceholder("顧客名を入力して検索").fill("テスト顧客A");
    await page.locator("button", { hasText: "テスト顧客A" }).click();
    await page.getByPlaceholder("訪問内容").fill("新製品の提案を実施");
    await page.getByLabel("Problem（課題・相談）").fill("課題事項テスト");
    await page.getByLabel("Plan（明日やること）").fill("フォローアップ予定");
    await page.getByRole("button", { name: "下書き保存" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("下書き")).toBeVisible();
  });

  test("ET021: 日報を即時提出する（訪問記録なし）", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByLabel("Problem（課題・相談）").fill("内勤のため訪問なし");
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("ET022: 訪問記録を複数行追加して日報を保存する", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    const addButton = page.getByRole("button", { name: "訪問記録を追加" });
    await addButton.click();
    await addButton.click();
    await addButton.click();

    const customerInputs = page.getByPlaceholder("顧客名を入力して検索");
    await customerInputs.nth(0).fill("テスト顧客A");
    await page.locator("button", { hasText: "テスト顧客A" }).click();
    await page.getByPlaceholder("訪問内容").nth(0).fill("訪問内容1");

    await customerInputs.nth(1).fill("テスト顧客B");
    await page.locator("button", { hasText: "テスト顧客B" }).click();
    await page.getByPlaceholder("訪問内容").nth(1).fill("訪問内容2");

    await page.getByRole("button", { name: "削除" }).nth(2).click();
    await page.getByRole("button", { name: "下書き保存" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("テスト顧客A")).toBeVisible();
    await expect(page.getByText("テスト顧客B")).toBeVisible();
  });

  test("ET023: 訪問記録 10 件で追加ボタンが disabled になる", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    const addButton = page.getByRole("button", { name: "訪問記録を追加" });
    for (let i = 0; i < 10; i++) {
      await addButton.click();
    }

    await expect(addButton).toBeDisabled();
  });

  test("ET024: 同じ日付の日報を 2 件作成しようとするとエラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    await page.goto("/reports/new");
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);

    await page.goto("/reports/new");
    await page.getByRole("button", { name: "下書き保存" }).click();

    await expect(page.getByText("選択した日付の日報はすでに作成されています")).toBeVisible();
  });

  test("ET025: 訪問記録の顧客未選択で提出するとエラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByPlaceholder("訪問内容").fill("内容あり");
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("顧客を選択してください")).toBeVisible();
  });

  test("ET026: 訪問記録の訪問内容未入力で提出するとエラー", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByPlaceholder("顧客名を入力して検索").fill("テスト顧客A");
    await page.locator("button", { hasText: "テスト顧客A" }).click();
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page.getByText("訪問内容を入力してください")).toBeVisible();
  });

  test("ET027: 削除済み顧客が訪問記録の顧客選択肢に表示されない", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "訪問記録を追加" }).click();
    await page.getByPlaceholder("顧客名を入力して検索").fill("削除済み");
    await page.waitForTimeout(400);

    await expect(page.locator("button", { hasText: "削除済み顧客" })).toBeHidden();
  });

  test("ET028: DRAFT 日報を編集して再保存する", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "下書き" }).click();
    await page.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(/\/reports\/[^/]+\/edit$/);

    await page.getByLabel("Problem（課題・相談）").fill("編集後の課題");
    await page.getByRole("button", { name: "下書き保存" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("編集後の課題")).toBeVisible();
  });

  test("ET029: REJECTED 日報を編集して再提出する", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "差し戻し" }).click();
    await page.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(/\/reports\/[^/]+\/edit$/);

    await page.getByLabel("Plan（明日やること）").fill("修正後の計画");
    await page.getByRole("button", { name: "提出" }).click();

    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);
    await expect(page.getByText("提出済")).toBeVisible();
  });

  test("ET030: SUBMITTED 日報の詳細画面には編集ボタンが表示されない", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "提出済" }).click();

    await expect(page.getByText("提出済")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("ET031: COMPLETED 日報の詳細画面には編集ボタンが表示されない", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "完了" }).click();

    await expect(page.getByText("完了")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("ET032: 日報一覧のステータスフィルターで絞り込みができる", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "下書き" }).click();

    await expect(page.getByRole("cell", { name: "下書き" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "提出済" })).toBeHidden();
    await expect(page.getByRole("cell", { name: "差し戻し" })).toBeHidden();
    await expect(page.getByRole("cell", { name: "完了" })).toBeHidden();
  });

  test("ET033: 日報作成画面でキャンセルすると日報一覧に戻る", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await page.getByRole("button", { name: "キャンセル" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("ET034: 日報編集画面でキャンセルすると日報詳細に戻る", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "下書き" }).click();
    await page.waitForURL(/\/reports\/[^/]+$/);
    const detailUrl = page.url();
    await page.getByRole("link", { name: "編集" }).click();

    await page.getByRole("button", { name: "キャンセル" }).click();

    await expect(page).toHaveURL(detailUrl);
  });
});
