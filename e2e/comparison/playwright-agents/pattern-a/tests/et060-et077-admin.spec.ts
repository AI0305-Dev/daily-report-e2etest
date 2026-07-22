// spec: specs/pattern-a/admin.md
// seed: e2e/seed-generator.spec.ts

import { test, expect } from "@playwright/test";
import { loginAs } from "../../../../helpers/auth";
import { resetDatabase } from "../../../../fixtures/seed";

test.describe("管理者機能", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET060: 管理者が顧客を追加する", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.getByRole("link", { name: "+ 顧客を追加" }).click();

    await page.getByLabel("顧客名").fill("新規顧客テスト株式会社");
    await page.getByLabel("住所").fill("東京都千代田区1-1-1");
    await page.getByLabel("備考").fill("テスト用顧客");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.getByText("新規顧客テスト株式会社")).toBeVisible();
  });

  test("ET061: 管理者が顧客を編集する", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForURL(/page=1/);

    await page
      .locator("tr", { hasText: "テスト顧客A" })
      .getByRole("link", { name: "編集" })
      .click();
    await page.waitForURL(/\/edit/);
    await page.getByLabel("顧客名").fill("テスト顧客A（編集済）");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.getByText("テスト顧客A（編集済）")).toBeVisible();
  });

  test("ET062: 管理者が顧客を削除する（論理削除）", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");

    await page
      .locator("tr", { hasText: "テスト顧客B" })
      .getByRole("button", { name: "削除" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();

    await expect(page.getByText("テスト顧客B")).toBeHidden();
  });

  test("ET063: 顧客名が空のまま保存するとエラー", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers/new");

    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("顧客名を入力してください")).toBeVisible();
  });

  test("ET064: 顧客名検索で一覧が絞り込まれる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");

    await page.getByPlaceholder("顧客名で検索").fill("テスト顧客A");

    await expect(page.getByText("テスト顧客A")).toBeVisible();
    await expect(page.getByText("テスト顧客B")).toBeHidden();
  });

  test("ET065: 管理者が営業ユーザーを追加する（SALES ロール）", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByLabel("氏名").fill("新規営業テスト");
    await page.getByLabel("メールアドレス").fill("newuser@test.com");
    await page.locator("[id='managerId']").click();
    await page.getByRole("option", { name: "鈴木部長" }).click();
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("新規営業テスト")).toBeVisible();
  });

  test("ET066: 管理者が MANAGER ユーザーを追加する", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByLabel("氏名").fill("新部長テスト");
    await page.getByLabel("メールアドレス").fill("newmanager@test.com");
    await page.getByRole("radio", { name: "MANAGER" }).click();
    await expect(page.locator("[id='managerId']")).toBeHidden();
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("新部長テスト")).toBeVisible();
  });

  test("ET067: 管理者が営業ユーザーを編集する", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.locator("tr", { hasText: "山田太郎" }).getByRole("link", { name: "編集" }).click();
    await page.waitForURL(/\/edit/);
    await page.getByLabel("氏名").fill("山田太郎（編集済）");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("山田太郎（編集済）")).toBeVisible();
  });

  test("ET068: 管理者が営業ユーザーを削除する", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");

    await page.locator("tr", { hasText: "佐藤次郎" }).getByRole("button", { name: "削除" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();

    await expect(page.getByText("佐藤次郎")).toBeHidden();
  });

  test("ET069: 削除済みユーザーはログインできない", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.locator("tr", { hasText: "佐藤次郎" }).getByRole("button", { name: "削除" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL("/login");

    await page.getByLabel("メールアドレス").fill("sales2@test.com");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(
      page.getByText("このアカウントは無効です。管理者にお問い合わせください")
    ).toBeVisible();
  });

  test("ET070: 管理者は自分自身のアカウントを削除できない", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");

    await page
      .locator("tr")
      .filter({ hasText: "鈴木部長" })
      .filter({ hasText: "MANAGER" })
      .getByRole("button", { name: "削除" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();

    await expect(page.getByText("自分自身のアカウントは削除できません")).toBeVisible();
    await expect(
      page.locator("tr").filter({ hasText: "鈴木部長" }).filter({ hasText: "MANAGER" })
    ).toBeVisible();
  });

  test.fixme("ET071: 最後の MANAGER は削除できない", async ({ page }) => {
    // シードデータでは manager1（鈴木部長）が唯一のisAdminユーザーかつログインユーザーのため、
    // 田中部長を削除後に鈴木部長を削除しようとするとE511（最後のMANAGER）ではなく
    // E510（自分自身の削除不可）が先に返されるため、E511のメッセージを検証できない。
    // E511をテストするには、ログインユーザーとは別のMANAGERが最後の1人である状況が必要。
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");

    // 田中部長を先に削除
    await page
      .locator("tr")
      .filter({ hasText: "田中部長" })
      .filter({ hasText: "MANAGER" })
      .getByRole("button", { name: "削除" })
      .click();
    await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();
    await expect(page.locator("tr").filter({ hasText: "田中部長" })).toBeHidden();

    // 鈴木部長（最後のMANAGER）を削除しようとする
    await page
      .locator("tr")
      .filter({ hasText: "鈴木部長" })
      .filter({ hasText: "MANAGER" })
      .getByRole("button", { name: "削除" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();

    await expect(page.getByText("MANAGERが存在しなくなるため削除できません")).toBeVisible();
  });

  test("ET072: 管理者が営業ユーザーのパスワードをリセットする", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForURL(/page=1/);

    await page.locator("tr", { hasText: "山田太郎" }).getByRole("link", { name: "編集" }).click();
    await page.waitForURL(/\/edit/);
    await page.getByRole("button", { name: "パスワードをリセット" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "リセット" }).click();

    await expect(page.getByRole("heading", { name: "初期パスワード" })).toBeVisible();
    const passwordText = await page.getByRole("dialog").textContent();
    expect(passwordText).toMatch(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/);
  });

  test("ET073: ロールを MANAGER に変更すると上長フィールドが非表示になる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await expect(page.locator("[id='managerId']")).toBeVisible();
    await page.getByRole("radio", { name: "MANAGER" }).click();
    await expect(page.locator("[id='managerId']")).toBeHidden();
  });

  test("ET074: SALES ロールで上長を未選択のまま保存するとエラー", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByLabel("氏名").fill("テスト営業");
    await page.getByLabel("メールアドレス").fill("test@test.com");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("上長を選択してください")).toBeVisible();
  });

  test("ET075: 重複するメールアドレスで営業を追加するとエラー", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByLabel("氏名").fill("重複テスト");
    await page.getByLabel("メールアドレス").fill("sales1@test.com");
    await page.locator("[id='managerId']").click();
    await page.getByRole("option", { name: "鈴木部長" }).click();
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("このメールアドレスはすでに使用されています")).toBeVisible();
  });

  test("ET076: isAdmin でないユーザーは管理者画面にアクセスできない", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/admin/customers");

    await expect(page).toHaveURL(/\/(reports|login)/);
  });

  test("ET077: 営業マスタ一覧でロールフィルターが機能する", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");

    await page.locator("[data-slot='select-trigger']").click();
    await page.getByRole("option", { name: "SALES" }).click();

    await expect(
      page.locator("tr").filter({ hasText: "山田太郎" }).filter({ hasText: "SALES" })
    ).toBeVisible();
    await expect(
      page.locator("tr").filter({ hasText: "鈴木部長" }).filter({ hasText: "MANAGER" })
    ).toBeHidden();
    await expect(
      page.locator("tr").filter({ hasText: "田中部長" }).filter({ hasText: "MANAGER" })
    ).toBeHidden();
  });
});
