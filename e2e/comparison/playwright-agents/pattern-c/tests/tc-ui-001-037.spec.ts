// spec: specs/pattern-c/ui-screens.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("UI要素検証", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("TC-UI-001: ログイン画面の初期表示", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "日報システム" })).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("TC-UI-002: 日報一覧（営業）の初期表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await expect(page.getByRole("heading", { name: "日報一覧" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ 日報を作成" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "日付" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ステータス" })).toBeVisible();
  });

  test("TC-UI-003: isAdmin=false の SALES は管理者リンクが非表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await expect(page.getByRole("link", { name: "顧客マスタ" })).toBeHidden();
    await expect(page.getByRole("link", { name: "営業マスタ" })).toBeHidden();
    await expect(page.getByRole("link", { name: "日報一覧" })).toBeVisible();
  });

  test("TC-UI-004: isAdmin=true のユーザーは管理者リンクが表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page.getByRole("link", { name: "顧客マスタ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "営業マスタ" })).toBeVisible();
  });

  test("TC-UI-005: ステータスフィルター変更で一覧が絞り込まれる", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");

    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "下書き" }).click();

    await expect(page.getByRole("cell", { name: "下書き" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "提出済" })).toBeHidden();
  });

  test("TC-UI-006: 日報作成画面の初期表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await expect(page.getByRole("heading", { name: "日報作成" })).toBeVisible();
    await expect(page.getByLabel("日付")).toBeVisible();
    await expect(page.getByRole("button", { name: "訪問記録を追加" })).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "下書き保存" })).toBeVisible();
    await expect(page.getByRole("button", { name: "提出" })).toBeVisible();

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await expect(page.getByLabel("日付")).toHaveValue(dateStr);
  });

  test("TC-UI-007: 訪問記録 10 件追加で追加ボタンが disabled になる", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    const addButton = page.getByRole("button", { name: "訪問記録を追加" });
    for (let i = 0; i < 10; i++) {
      await addButton.click();
    }
    await expect(addButton).toBeDisabled();
  });

  test("TC-UI-008: 日報編集画面の初期表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.getByRole("cell", { name: "下書き" }).click();
    await page.getByRole("link", { name: "編集" }).click();

    await expect(page.getByRole("heading", { name: "日報編集" })).toBeVisible();
    await expect(page.getByLabel("日付")).not.toHaveValue("");
  });

  test("TC-UI-009: DRAFT 日報の詳細 - 「下書き」バッジと編集ボタンが表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.getByRole("cell", { name: "下書き" }).click();

    await expect(page.getByText("下書き")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeVisible();
  });

  test("TC-UI-010: SUBMITTED 日報の詳細 - 「提出済」バッジで編集ボタンなし", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.getByRole("cell", { name: "提出済" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);

    await expect(page.getByRole("main").getByText("提出済")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("TC-UI-011: REJECTED 日報の詳細 - 「差し戻し」バッジと編集ボタンが表示", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.getByRole("cell", { name: "差し戻し" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);

    await expect(page.getByRole("main").getByText("差し戻し")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeVisible();
  });

  test("TC-UI-012: COMPLETED 日報の詳細 - 「完了」バッジで編集ボタンなし", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.getByRole("cell", { name: "完了" }).click();
    await expect(page).toHaveURL(/\/reports\/(?!new)[^/]+$/);

    await expect(page.getByRole("main").getByText("完了")).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("TC-UI-013: 日報一覧（上長）の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page.getByRole("heading", { name: "部下の日報一覧" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "日付" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "営業氏名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ステータス" })).toBeVisible();
  });

  test("TC-UI-014: ステータスフィルターのデフォルト値が「提出済」で選択肢に日本語表示", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page.locator("[data-slot='select-trigger']").nth(1)).toContainText("提出済");

    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await expect(page.getByRole("option", { name: "全て" })).toBeVisible();
    await expect(page.getByRole("option", { name: "提出済" })).toBeVisible();
    await expect(page.getByRole("option", { name: "差し戻し" })).toBeVisible();
    await expect(page.getByRole("option", { name: "完了" })).toBeVisible();
  });

  test("TC-UI-015: 営業フィルターのデフォルト値「全員」と配下営業が選択肢に含まれる", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page.locator("[data-slot='select-trigger']").nth(0)).toContainText("全員");

    await page.locator("[data-slot='select-trigger']").nth(0).click();
    await expect(page.getByRole("option", { name: "山田太郎" })).toBeVisible();
    await expect(page.getByRole("option", { name: "佐藤次郎" })).toBeVisible();
  });

  test("TC-UI-016: ステータスフィルターを「全て」に変更すると全件表示（DRAFT除く）", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page.locator("tbody tr").first()).toBeVisible();
    const initialCount = await page.locator("tbody tr").count();

    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForURL(/status=ALL/);
    await expect(page.locator("tbody tr").first()).toBeVisible();

    const newCount = await page.locator("tbody tr").count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test("TC-UI-017: 営業フィルターで特定営業を選択すると絞り込まれる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForURL(/status=ALL/);

    await page.locator("[data-slot='select-trigger']").nth(0).click();
    await page.getByRole("option", { name: "山田太郎" }).click();

    await expect(page.locator("tr", { hasText: "山田太郎" }).first()).toBeVisible();
    await expect(page.locator("tr", { hasText: "佐藤次郎" })).toBeHidden();
  });

  test("TC-UI-018: SUBMITTED 日報詳細 - 承認・差し戻しボタンとコメント入力欄が表示", async ({
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

  test("TC-UI-019: COMPLETED 日報詳細 - 承認・差し戻しボタンとコメント入力欄なし", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/manager/reports");
    await page.locator("[data-slot='select-trigger']").nth(1).click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForURL(/status=ALL/);
    await page.locator("tr", { hasText: "完了" }).click();

    await expect(page.getByRole("button", { name: "差し戻し" })).toBeHidden();
    await expect(page.getByRole("button", { name: "承認" })).toBeHidden();
    await expect(page.getByPlaceholder("コメントを入力")).toBeHidden();
  });

  test("TC-UI-020: 承認ボタンクリックで確認ダイアログが表示される", async ({ page }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "承認" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "承認" })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "キャンセル" })
    ).toBeVisible();
  });

  test("TC-UI-021: 差し戻しボタンクリックで理由入力欄付きダイアログが表示される", async ({
    page,
  }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "差し戻し" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("textbox")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: "差し戻し" })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "キャンセル" })
    ).toBeVisible();
  });

  test("TC-UI-022: コメント送信後に入力欄がクリアされコメントが追加表示される", async ({
    page,
  }) => {
    const { submittedReportId } = await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByPlaceholder("コメントを入力").first().fill("TC-UI-022テスト");
    await page.getByRole("button", { name: "送信" }).first().click();

    await expect(page.getByPlaceholder("コメントを入力").first()).toHaveValue("");
    await expect(page.getByText("TC-UI-022テスト")).toBeVisible();
  });

  test("TC-UI-023: 顧客マスタ一覧の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "顧客マスタ" }).click();

    await expect(page.getByRole("heading", { name: "顧客マスタ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ 顧客を追加" })).toBeVisible();
    await expect(page.getByPlaceholder("顧客名で検索")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "顧客名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "住所" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "備考" })).toBeVisible();
  });

  test("TC-UI-024: 顧客名検索で一覧が絞り込まれる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForURL(/page=1/);

    await page.getByPlaceholder("顧客名で検索").fill("テスト顧客A");

    await expect(page.locator("tr", { hasText: "テスト顧客A" })).toBeVisible();
    await expect(page.locator("tr", { hasText: "テスト顧客B" })).toBeHidden();
  });

  test("TC-UI-025: 顧客追加画面の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers/new");

    await expect(page.getByRole("heading", { name: "顧客追加" })).toBeVisible();
    await expect(page.getByLabel("顧客名")).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
  });

  test("TC-UI-026: 顧客編集画面の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForURL(/page=1/);
    await page
      .locator("tr", { hasText: "テスト顧客A" })
      .getByRole("link", { name: "編集" })
      .click();

    await expect(page.getByRole("heading", { name: "顧客編集" })).toBeVisible();
    await expect(page.getByLabel("顧客名")).toHaveValue("テスト顧客A");
  });

  test("TC-UI-027: 営業マスタ一覧の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "営業マスタ" }).click();

    await expect(page.getByRole("heading", { name: "営業マスタ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ 営業を追加" })).toBeVisible();
    await expect(page.getByPlaceholder("氏名で検索")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "氏名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "メールアドレス" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ロール" })).toBeVisible();
  });

  test("TC-UI-028: 氏名検索で一覧が絞り込まれる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.getByPlaceholder("氏名で検索").fill("山田");

    await expect(page.locator("tr", { hasText: "山田太郎" })).toBeVisible();
    await expect(page.locator("tr", { hasText: "佐藤次郎" })).toBeHidden();
  });

  test("TC-UI-029: ロールフィルターで SALES のみ絞り込まれる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "SALES" }).click();

    await expect(page.locator("tr", { hasText: "山田太郎" }).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /鈴木部長 manager1@test\.com/ })).toBeHidden();
    await expect(page.getByRole("row", { name: /田中部長/ })).toBeHidden();
  });

  test("TC-UI-030: 営業追加画面の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await expect(page.getByRole("heading", { name: "営業追加" })).toBeVisible();
    await expect(page.getByLabel("氏名")).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByRole("radio", { name: "SALES" })).toBeChecked();
    await expect(page.locator("[id='managerId']")).toBeVisible();
  });

  test("TC-UI-031: MANAGER ラジオボタンを選択すると上長フィールドが非表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByRole("radio", { name: "MANAGER" }).click();

    await expect(page.locator("[id='managerId']")).toBeHidden();
  });

  test("TC-UI-032: MANAGER から SALES に切り替えると上長フィールドが再表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByRole("radio", { name: "MANAGER" }).click();
    await expect(page.locator("[id='managerId']")).toBeHidden();

    await page.getByRole("radio", { name: "SALES" }).click();
    await expect(page.locator("[id='managerId']")).toBeVisible();
  });

  test("TC-UI-033: 営業編集画面の初期表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);
    await page.locator("tr", { hasText: "山田太郎" }).getByRole("link", { name: "編集" }).click();

    await expect(page.getByRole("heading", { name: "営業編集" })).toBeVisible();
    await expect(page.getByLabel("氏名")).toHaveValue("山田太郎");
    await expect(page.getByLabel("メールアドレス")).toBeDisabled();
    await expect(page.getByRole("button", { name: "パスワードをリセット" })).toBeVisible();
  });

  test("TC-UI-034: パスワード変更画面の初期表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await expect(page.getByRole("heading", { name: "パスワード変更" })).toBeVisible();
    await expect(page.getByLabel("現在のパスワード")).toBeVisible();
    await expect(page.getByLabel("新しいパスワード *", { exact: true })).toBeVisible();
    await expect(page.getByLabel("新しいパスワード（確認）")).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "変更する" })).toBeVisible();
  });

  test("TC-UI-035: ヘッダーのユーザー名クリックでドロップダウン表示", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    await page.getByRole("button", { name: "山田太郎" }).click();

    await expect(page.getByRole("menuitem", { name: "パスワード変更" })).toBeVisible();
  });

  test("TC-UI-036: SALES の「日報一覧」リンクが /reports に遷移", async ({ page }) => {
    await loginAs(page, "sales1@test.com");

    await page.getByRole("link", { name: "日報一覧" }).click();

    await expect(page).toHaveURL(/\/reports/);
  });

  test("TC-UI-037: MANAGER の「日報一覧」リンクが /manager/reports に遷移", async ({ page }) => {
    await loginAs(page, "manager1@test.com");

    await page.getByRole("link", { name: "日報一覧" }).click();

    await expect(page).toHaveURL(/\/manager\/reports/);
  });
});
