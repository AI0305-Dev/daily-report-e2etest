import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { resetDatabase } from "./fixtures/seed";

test.describe("ET040-ET045: 管理者フロー", () => {
  test("ET040: 顧客追加 → 一覧に追加される", async ({ page }) => {
    await resetDatabase();
    await loginAs(page, "manager1@test.com");

    // ナビゲーションから顧客マスタ画面へ
    await page.getByRole("link", { name: "顧客マスタ" }).click();
    await expect(page).toHaveURL("/admin/customers");

    // 顧客追加ボタンをクリック
    await page.getByRole("link", { name: "顧客を追加" }).click();
    await expect(page).toHaveURL("/admin/customers/new");

    // 顧客名を入力して保存
    await page.getByLabel("顧客名").fill("ET040テスト顧客");
    await page.getByRole("button", { name: "保存" }).click();

    // 一覧に戻り追加されていること
    await expect(page).toHaveURL("/admin/customers");
    await expect(page.getByText("ET040テスト顧客")).toBeVisible();
  });

  test("ET041: 顧客編集 → 変更が反映される", async ({ page }) => {
    await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "顧客マスタ" }).click();
    await expect(page).toHaveURL("/admin/customers");

    // テスト顧客Aの編集ボタンをクリック
    const row = page.getByRole("row").filter({ hasText: "テスト顧客A" });
    await row.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(/\/admin\/customers\/[^/]+\/edit$/);

    // 顧客名を変更して保存
    const nameInput = page.getByLabel("顧客名");
    await nameInput.clear();
    await nameInput.fill("テスト顧客A（編集済）");
    await page.getByRole("button", { name: "保存" }).click();

    // 一覧に戻り変更が反映されていること
    await expect(page).toHaveURL("/admin/customers");
    await expect(page.getByText("テスト顧客A（編集済）")).toBeVisible();
  });

  test("ET042: 顧客削除 → 一覧から非表示になる", async ({ page }) => {
    await resetDatabase();
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "顧客マスタ" }).click();
    await expect(page).toHaveURL("/admin/customers");

    // テスト顧客Bの削除ボタンをクリック
    const row = page.getByRole("row").filter({ hasText: "テスト顧客B" });
    await row.getByRole("button", { name: "削除" }).click();

    // 確認ダイアログでOK
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "削除" }).last().click();

    // 一覧から非表示になること
    await expect(page.getByText("テスト顧客B")).toBeHidden();
  });

  test.describe.serial("ET043-ET045: 営業追加・削除・ログイン不可フロー", () => {
    let newUserEmail: string;
    let newUserPassword: string;

    test.beforeAll(async () => {
      await resetDatabase();
    });

    test("ET043: 営業追加 → 一覧に追加、初期パスワードが表示される", async ({ page }) => {
      await loginAs(page, "manager1@test.com");
      await page.getByRole("link", { name: "営業マスタ" }).click();
      await expect(page).toHaveURL("/admin/users");

      // 営業追加ボタンをクリック
      await page.getByRole("link", { name: "営業を追加" }).click();
      await expect(page).toHaveURL("/admin/users/new");

      // 必須項目を入力
      newUserEmail = `e2e-test-${Date.now()}@test.com`;
      await page.getByLabel("氏名").fill("E2Eテスト営業");
      await page.getByLabel("メールアドレス").fill(newUserEmail);
      await page.getByRole("radio", { name: "SALES" }).click();

      // 上長を選択
      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: "鈴木部長" }).click();

      await page.getByRole("button", { name: "保存" }).click();

      // 初期パスワードモーダルが表示される
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("heading", { name: "初期パスワード" })).toBeVisible();

      // パスワードを取得
      const passwordEl = page.locator(".font-mono");
      newUserPassword = (await passwordEl.textContent()) ?? "";
      expect(newUserPassword.length).toBeGreaterThan(0);

      // モーダルを閉じる
      await page.getByRole("button", { name: "閉じる" }).click();

      // 一覧に追加されていること
      await expect(page).toHaveURL("/admin/users");
      await expect(page.getByText("E2Eテスト営業")).toBeVisible();

      // グローバル変数に保存（後続テストで使用）
      process.env.E2E_NEW_USER_EMAIL = newUserEmail;
      process.env.E2E_NEW_USER_PASSWORD = newUserPassword;
    });

    test("ET044: 営業削除 → 一覧から非表示になる", async ({ page }) => {
      const email = process.env.E2E_NEW_USER_EMAIL ?? newUserEmail;
      await loginAs(page, "manager1@test.com");
      await page.getByRole("link", { name: "営業マスタ" }).click();
      await expect(page).toHaveURL("/admin/users");

      // ET043で追加したユーザーの削除ボタンをクリック
      const row = page.getByRole("row").filter({ hasText: "E2Eテスト営業" });
      await row.getByRole("button", { name: "削除" }).click();

      // 確認ダイアログでOK
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "削除する" }).click();

      // 一覧から非表示になること
      await expect(page.getByText("E2Eテスト営業")).toBeHidden();
      process.env.E2E_DELETED_USER_EMAIL = email;
    });

    test("ET045: 削除済みユーザーはログイン不可 → E105エラーが表示される", async ({ page }) => {
      const email = process.env.E2E_DELETED_USER_EMAIL ?? newUserEmail;
      const password = process.env.E2E_NEW_USER_PASSWORD ?? newUserPassword;

      await page.goto("/login");
      await page.getByLabel("メールアドレス").fill(email);
      await page.getByLabel("パスワード").fill(password);
      await page.getByRole("button", { name: "ログイン" }).click();

      await expect(
        page.getByText("このアカウントは無効です。管理者にお問い合わせください")
      ).toBeVisible();
      await expect(page).toHaveURL("/login");
    });
  });
});
