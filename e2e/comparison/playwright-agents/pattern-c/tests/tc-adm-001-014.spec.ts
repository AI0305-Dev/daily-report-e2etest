// spec: specs/pattern-c/admin.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("管理者フロー", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("TC-ADM-001: 顧客追加 - 一覧に追加される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "顧客マスタ" }).click();
    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.getByRole("heading", { name: "顧客マスタ" })).toBeVisible();

    await page.getByRole("link", { name: "+ 顧客を追加" }).click();
    await expect(page.getByRole("heading", { name: "顧客追加" })).toBeVisible();

    await page.getByLabel("顧客名").fill("TC-ADM-001テスト顧客");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.getByText("TC-ADM-001テスト顧客")).toBeVisible();
  });

  test("TC-ADM-002: 顧客名必須エラー - E401", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers/new");

    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("顧客名を入力してください")).toBeVisible();
  });

  test("TC-ADM-003: 顧客編集 - 変更が反映される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForURL(/page=1/);

    await page
      .locator("tr", { hasText: "テスト顧客A" })
      .getByRole("link", { name: "編集" })
      .click();
    await expect(page.getByRole("heading", { name: "顧客編集" })).toBeVisible();
    await expect(page.getByLabel("顧客名")).toHaveValue("テスト顧客A");

    await page.getByLabel("顧客名").fill("テスト顧客A（編集済）");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.getByText("テスト顧客A（編集済）")).toBeVisible();
  });

  test("TC-ADM-004: 顧客削除 - 一覧から非表示になる（論理削除）", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForURL(/page=1/);

    await page
      .locator("tr", { hasText: "テスト顧客B" })
      .getByRole("button", { name: "削除" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();

    await expect(page.locator("tr", { hasText: "テスト顧客B" })).toBeHidden();
  });

  test("TC-ADM-005: 顧客名検索 - 部分一致で絞り込みできる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForURL(/page=1/);

    await page.getByPlaceholder("顧客名で検索").fill("テスト顧客A");

    await expect(page.locator("tr", { hasText: "テスト顧客A" })).toBeVisible();
    await expect(page.locator("tr", { hasText: "テスト顧客B" })).toBeHidden();
  });

  test("TC-ADM-006: 営業追加 - 一覧に追加、初期パスワードが表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "営業マスタ" }).click();
    await expect(page).toHaveURL(/\/admin\/users/);

    await page.getByRole("link", { name: "+ 営業を追加" }).click();
    await expect(page.getByRole("heading", { name: "営業追加" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "SALES" })).toBeChecked();
    await expect(page.locator("[id='managerId']")).toBeVisible();

    await page.getByLabel("氏名").fill("TC-ADM-006テスト営業");
    await page.getByLabel("メールアドレス").fill("tc-adm-006@test.com");
    await page.locator("[id='managerId']").click();
    await page.getByRole("option", { name: "鈴木部長" }).click();
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByRole("heading", { name: "初期パスワード" })).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("TC-ADM-006テスト営業")).toBeVisible();
  });

  test("TC-ADM-007: MANAGER ロールで営業追加 - 上長フィールドが非表示", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByRole("radio", { name: "MANAGER" }).click();

    await expect(page.locator("[id='managerId']")).toBeHidden();
  });

  test("TC-ADM-008: 営業編集 - 氏名変更、メール読み取り専用", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.locator("tr", { hasText: "山田太郎" }).getByRole("link", { name: "編集" }).click();
    await expect(page.getByRole("heading", { name: "営業編集" })).toBeVisible();
    await expect(page.getByLabel("氏名")).toHaveValue("山田太郎");
    await expect(page.getByLabel("メールアドレス")).toBeDisabled();
    await expect(page.getByRole("button", { name: "パスワードをリセット" })).toBeVisible();

    await page.getByLabel("氏名").fill("山田太郎（編集済）");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("山田太郎（編集済）")).toBeVisible();
  });

  test("TC-ADM-009: 営業削除 - 一覧から非表示になる（論理削除）", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByLabel("氏名").fill("削除用テストユーザー");
    await page.getByLabel("メールアドレス").fill("delete-test@test.com");
    await page.locator("[id='managerId']").click();
    await page.getByRole("option", { name: "鈴木部長" }).click();
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByRole("heading", { name: "初期パスワード" })).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
    await page.waitForURL(/\/admin\/users/);

    await page
      .locator("tr", { hasText: "削除用テストユーザー" })
      .getByRole("button", { name: "削除" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();

    await expect(page.locator("tr", { hasText: "削除用テストユーザー" })).toBeHidden();
  });

  test("TC-ADM-010: 自分自身のアカウントは削除不可 - E510", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page
      .getByRole("row", { name: /鈴木部長 manager1@test\.com/ })
      .getByRole("button", { name: "削除" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();

    await expect(page.getByText("自分自身のアカウントは削除できません")).toBeVisible();
  });

  test.fixme("TC-ADM-011: 最後の MANAGER は削除不可 - E511", async ({ page }) => {
    // シードデータでは manager1 が isAdmin のため、田中部長削除後に鈴木部長を削除しようとすると
    // E511より E510（自己削除不可）が先に返されるため fixme
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.locator("tr", { hasText: "田中部長" }).getByRole("button", { name: "削除" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page.locator("tr", { hasText: "田中部長" })).toBeHidden();

    await page.locator("tr", { hasText: "鈴木部長" }).getByRole("button", { name: "削除" }).click();
    await page.getByRole("button", { name: "削除する" }).click();

    await expect(page.getByText("MANAGERが存在しなくなるため削除できません")).toBeVisible();
  });

  test("TC-ADM-012: パスワードリセット - 新しい初期パスワードが発行される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.locator("tr", { hasText: "山田太郎" }).getByRole("link", { name: "編集" }).click();
    await expect(page.getByRole("button", { name: "パスワードをリセット" })).toBeVisible();

    await page.getByRole("button", { name: "パスワードをリセット" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button")
      .filter({ hasText: /リセット|確認|OK/ })
      .click();

    await expect(page.getByRole("heading", { name: "初期パスワード" })).toBeVisible();
  });

  test("TC-ADM-013: 氏名検索・ロールフィルターで営業一覧を絞り込める", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.getByPlaceholder("氏名で検索").fill("山田");
    await expect(page.locator("tr", { hasText: "山田太郎" })).toBeVisible();
    await expect(page.locator("tr", { hasText: "佐藤次郎" })).toBeHidden();

    await page.getByPlaceholder("氏名で検索").fill("");
    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "SALES" }).click();
    await expect(page.getByRole("row", { name: /山田太郎/ }).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /鈴木部長 manager1@test\.com/ })).toBeHidden();
    await expect(page.getByRole("row", { name: /田中部長/ })).toBeHidden();
  });

  test("TC-ADM-014: isAdmin でないユーザーが管理者画面にアクセス不可", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/admin/customers");

    await expect(page).toHaveURL(/\/(reports|login)/);
  });
});
