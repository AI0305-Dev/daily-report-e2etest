// spec: specs/pattern-a/ui-screens.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("UI 表示確認", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET100: ログイン画面の初期表示", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "日報システム" })).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("ET101: SALES の日報一覧画面の初期表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: "日報一覧" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ 日報を作成" })).toBeVisible();
    await expect(page.locator("[data-slot='select-trigger']")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "日付" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ステータス" })).toBeVisible();
  });

  test("ET102: isAdmin=false の SALES ではナビに管理者リンクが表示されない", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    await expect(page.getByRole("link", { name: "日報一覧" })).toBeVisible();
    await expect(page.getByRole("link", { name: "顧客マスタ" })).toBeHidden();
    await expect(page.getByRole("link", { name: "営業マスタ" })).toBeHidden();
  });

  test("ET103: isAdmin=true のユーザーのナビには管理者リンクが表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");

    await expect(page.getByRole("link", { name: "日報一覧" })).toBeVisible();
    await expect(page.getByRole("link", { name: "顧客マスタ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "営業マスタ" })).toBeVisible();
  });

  test("ET104: 日報作成画面の初期表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await expect(page.getByRole("heading", { name: "日報作成" })).toBeVisible();
    await expect(page.getByRole("button", { name: "訪問記録を追加" })).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "下書き保存" })).toBeVisible();
    await expect(page.getByRole("button", { name: "提出" })).toBeVisible();

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await expect(page.getByLabel("日付")).toHaveValue(dateStr);
  });

  test("ET105: 日報編集画面には既存データが初期値として表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.getByRole("cell", { name: "下書き" }).click();
    await page.getByRole("link", { name: "編集" }).click();

    await expect(page.getByRole("heading", { name: "日報編集" })).toBeVisible();
    await expect(page.getByLabel("日付")).not.toHaveValue("");
  });

  test("ET106: MANAGER の日報一覧画面のフィルター初期値", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/manager/reports");

    await expect(page.getByRole("heading", { name: "部下の日報一覧" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "日付" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "営業氏名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ステータス" })).toBeVisible();
    await expect(page.locator("[data-slot='select-trigger']").nth(1)).toContainText("提出済");
    await expect(page.locator("[data-slot='select-trigger']").nth(0)).toContainText("全員");
  });

  test("ET107: MANAGER の日報一覧で「全て」フィルターに変更すると件数が増える", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/manager/reports");

    const initialCount = await page.locator("tbody tr").count();

    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForURL(/status=ALL/);

    const newCount = await page.locator("tbody tr").count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test("ET108: SUBMITTED 日報詳細（上長）にコメント欄と操作ボタンが表示される", async ({
    page,
  }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await expect(page.getByRole("button", { name: "差し戻し" })).toBeVisible();
    await expect(page.getByRole("button", { name: "承認" })).toBeVisible();
    await expect(page.getByPlaceholder("コメントを入力").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "送信" }).first()).toBeVisible();
  });

  test("ET109: 顧客追加画面の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers/new");

    await expect(page.getByRole("heading", { name: "顧客追加" })).toBeVisible();
    await expect(page.getByText("顧客名")).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
  });

  test("ET110: 顧客編集画面には既存データが初期値として表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForURL(/page=1/);

    await page
      .locator("tr", { hasText: "テスト顧客A" })
      .getByRole("link", { name: "編集" })
      .click();
    await page.waitForURL(/\/edit/);

    await expect(page.getByRole("heading", { name: "顧客編集" })).toBeVisible();
    await expect(page.getByLabel("顧客名")).toHaveValue("テスト顧客A");
  });

  test("ET111: 営業追加画面の初期表示と SALES デフォルト選択", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await expect(page.getByRole("heading", { name: "営業追加" })).toBeVisible();
    await expect(page.getByLabel("氏名")).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByRole("radio", { name: "SALES" })).toBeChecked();
    await expect(page.locator("[id='managerId']")).toBeVisible();
  });

  test("ET112: 営業編集画面ではメールアドレスが読み取り専用", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.locator("tr", { hasText: "山田太郎" }).getByRole("link", { name: "編集" }).click();
    await page.waitForURL(/\/edit/);

    await expect(page.getByRole("heading", { name: "営業編集" })).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeDisabled();
    await expect(page.getByRole("button", { name: "パスワードをリセット" })).toBeVisible();
  });

  test("ET113: パスワード変更画面の初期表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await expect(page.getByRole("heading", { name: "パスワード変更" })).toBeVisible();
    await expect(page.getByLabel("現在のパスワード")).toBeVisible();
    await expect(page.getByLabel("新しいパスワード *", { exact: true })).toBeVisible();
    await expect(page.getByLabel("新しいパスワード（確認）")).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "変更する" })).toBeVisible();
  });

  test("ET114: ヘッダーのユーザー名クリックでドロップダウンが表示される", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    await page.getByRole("button", { name: "山田太郎" }).click();

    await expect(page.getByRole("menuitem", { name: "パスワード変更" })).toBeVisible();
  });

  test("ET115: SALES の「日報一覧」ナビリンクをクリックすると `/reports` に遷移する", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");

    await page.getByRole("link", { name: "日報一覧" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("ET116: MANAGER の「日報一覧」ナビリンクをクリックすると `/manager/reports` に遷移する", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");

    await page.getByRole("link", { name: "日報一覧" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });
});
