import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { resetDatabase } from "./fixtures/seed";

test.describe("ET101: SC001 ログイン画面の初期表示", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET101: 未認証で /login を開く → 見出し・ラベル・ボタンが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "日報システム" })).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });
});

test.describe("ET102-ET105: SC002 日報一覧（営業）", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("ET102: SALESでログイン → 日報一覧の見出し・ボタン・フィルター・列ヘッダーが表示される", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await expect(page.getByRole("heading", { name: "日報一覧" })).toBeVisible();
    await expect(page.getByRole("link", { name: "日報を作成" })).toBeVisible();
    await expect(page.getByText("ステータス:")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "日付" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ステータス" })).toBeVisible();
  });

  test("ET103: isAdmin=false のSALESでログイン → 管理者リンクが表示されない", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await expect(page.getByRole("link", { name: "顧客マスタ" })).toBeHidden();
    await expect(page.getByRole("link", { name: "営業マスタ" })).toBeHidden();
  });

  test("ET104: isAdmin=true のユーザーでログイン → 管理者リンクが表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page.getByRole("link", { name: "顧客マスタ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "営業マスタ" })).toBeVisible();
  });

  test("ET105: ステータスフィルターを「下書き」に変更 → 下書きの日報のみ表示される", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.waitForLoadState("load");

    const statusTrigger = page.getByRole("combobox").first();
    await statusTrigger.click();
    await page.getByRole("option", { name: "下書き" }).click();
    await page.waitForLoadState("load");

    await expect(page.getByText("下書き").first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "提出済" })).toBeHidden();
    await expect(page.getByRole("cell", { name: "差し戻し" })).toBeHidden();
    await expect(page.getByRole("cell", { name: "完了" })).toBeHidden();
  });
});

test.describe("ET106-ET107: SC003 日報作成", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET106: SALESで /reports/new を開く → 見出し・必須マーカー・ボタン・今日の日付が表示される", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    await expect(page.getByRole("heading", { name: "日報作成" })).toBeVisible();
    await expect(page.getByLabel("日付")).toBeVisible();
    await expect(page.getByRole("button", { name: "訪問記録を追加" })).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "下書き保存" })).toBeVisible();
    await expect(page.getByRole("button", { name: "提出" })).toBeVisible();

    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await expect(page.getByLabel("日付")).toHaveValue(expectedDate);
  });

  test("ET107: 「訪問記録を追加」を10回クリック → ボタンがdisabled状態になる", async ({ page }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports/new");

    const addButton = page.getByRole("button", { name: "訪問記録を追加" });
    for (let i = 0; i < 10; i++) {
      await addButton.click();
    }

    await expect(addButton).toBeDisabled();
  });
});

test.describe("ET108: SC004 日報編集", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET108: SALESでDRAFT日報の編集画面を開く → 見出し・既存データが表示される", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.waitForLoadState("load");

    const row = page.getByRole("row").filter({ hasText: "下書き" });
    await row.click();
    await expect(page).toHaveURL(/\/reports\/[^/]+$/);

    await page.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(/\/reports\/[^/]+\/edit$/);

    await expect(page.getByRole("heading", { name: "日報編集" })).toBeVisible();
    await expect(page.getByLabel("日付")).not.toHaveValue("");
  });
});

test.describe("ET109-ET112: SC005 日報詳細（営業）ステータス別", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET109: DRAFT日報の詳細 → ステータスバッジ「下書き」・「編集」ボタンあり", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.waitForLoadState("load");

    const row = page.getByRole("row").filter({ hasText: "下書き" });
    await row.click();
    await expect(page).toHaveURL(/\/reports\/[^/]+$/);

    await expect(page.getByText("下書き").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeVisible();
  });

  test("ET110: SUBMITTED日報の詳細 → ステータスバッジ「提出済」・「編集」ボタンなし", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.waitForLoadState("load");

    const statusTrigger = page.getByRole("combobox").first();
    await statusTrigger.click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForLoadState("load");

    const row = page.getByRole("row").filter({ hasText: "提出済" });
    await row.click();
    await expect(page).toHaveURL(/\/reports\/[^/]+$/);

    await expect(page.getByText("提出済").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });

  test("ET111: REJECTED日報の詳細 → ステータスバッジ「差し戻し」・「編集」ボタンあり", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.waitForLoadState("load");

    const statusTrigger = page.getByRole("combobox").first();
    await statusTrigger.click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForLoadState("load");

    const row = page.getByRole("row").filter({ hasText: "差し戻し" });
    await row.click();
    await expect(page).toHaveURL(/\/reports\/[^/]+$/);

    await expect(page.getByText("差し戻し").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeVisible();
  });

  test("ET112: COMPLETED日報の詳細 → ステータスバッジ「完了」・「編集」ボタンなし", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/reports");
    await page.waitForLoadState("load");

    const statusTrigger = page.getByRole("combobox").first();
    await statusTrigger.click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForLoadState("load");

    const row = page.getByRole("row").filter({ hasText: "完了" });
    await row.click();
    await expect(page).toHaveURL(/\/reports\/[^/]+$/);

    await expect(page.getByText("完了").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "編集" })).toBeHidden();
  });
});

test.describe("ET113-ET117: SC006 日報一覧（上長）", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET113: MANAGERでログイン → 見出し・列ヘッダーが表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await expect(page.getByRole("heading", { name: "部下の日報一覧" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "日付" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "営業氏名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ステータス" })).toBeVisible();
  });

  test("ET114: ステータスフィルターのデフォルト値が「提出済」・選択肢に日本語が表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.waitForLoadState("load");

    await expect(page.getByText("提出済").first()).toBeVisible();

    const statusTrigger = page.getByRole("combobox").nth(1);
    await statusTrigger.click();
    await expect(page.getByRole("option", { name: "全て" })).toBeVisible();
    await expect(page.getByRole("option", { name: "提出済" })).toBeVisible();
    await expect(page.getByRole("option", { name: "差し戻し" })).toBeVisible();
    await expect(page.getByRole("option", { name: "完了" })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("ET115: 営業フィルターのデフォルト値が「全員」・配下営業の氏名が選択肢に含まれる", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.waitForLoadState("load");

    const comboboxes = page.getByRole("combobox");
    const count = await comboboxes.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const userTrigger = comboboxes.first();
    await expect(userTrigger).toContainText("全員");
    await userTrigger.click();
    await expect(page.getByRole("option", { name: "山田太郎" })).toBeVisible();
    await expect(page.getByRole("option", { name: "佐藤次郎" })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("ET116: ステータスフィルターを「全て」に変更 → 全ステータスの日報が表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.waitForLoadState("load");

    await expect(page.getByRole("cell", { name: "差し戻し" })).toBeHidden();
    await expect(page.getByRole("cell", { name: "下書き" })).toBeHidden();

    const statusTrigger = page.getByRole("combobox").nth(1);
    await statusTrigger.click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForLoadState("load");

    await expect(page.getByRole("cell", { name: "提出済" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "完了" }).first()).toBeVisible();
  });

  test("ET117: 営業フィルターで特定営業を選択 → その営業の日報のみ表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.waitForLoadState("load");

    const statusTrigger = page.getByRole("combobox").nth(1);
    await statusTrigger.click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForLoadState("load");

    const comboboxes = page.getByRole("combobox");
    const count = await comboboxes.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const userTrigger = comboboxes.first();
    await userTrigger.click();
    await page.getByRole("option", { name: "山田太郎" }).click();
    await page.waitForLoadState("load");

    await expect(page.getByRole("cell", { name: "山田太郎" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "佐藤次郎" })).toBeHidden();
  });
});

test.describe("ET118-ET122: SC007 日報詳細（上長）", () => {
  let submittedReportId: string;

  test.beforeEach(async () => {
    const result = await resetDatabase();
    submittedReportId = result.submittedReportId;
  });

  test("ET118: SUBMITTED日報の詳細 → 操作ボタン・コメント入力欄があり", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await expect(page.getByRole("button", { name: "差し戻し" })).toBeVisible();
    await expect(page.getByRole("button", { name: "承認" })).toBeVisible();
    await expect(page.getByPlaceholder("コメントを入力").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "送信" }).first()).toBeVisible();
  });

  test("ET119: COMPLETED日報の詳細 → 操作ボタン・コメント入力欄がない", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/manager/reports");
    await page.waitForLoadState("load");

    const statusTrigger = page.getByRole("combobox").nth(1);
    await statusTrigger.click();
    await page.getByRole("option", { name: "全て" }).click();
    await page.waitForLoadState("load");

    const completedRow = page.getByRole("row").filter({ hasText: "完了" });
    await completedRow.click();
    await expect(page).toHaveURL(/\/manager\/reports\/[^/]+$/);

    await expect(page.getByRole("button", { name: "差し戻し" })).toBeHidden();
    await expect(page.getByRole("button", { name: "承認" })).toBeHidden();
    await expect(page.getByPlaceholder("コメントを入力")).toBeHidden();
    await expect(page.getByRole("button", { name: "送信" })).toBeHidden();
  });

  test("ET120: 承認ボタンクリック → 確認ダイアログが表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "承認" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "承認" }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
  });

  test("ET121: 差し戻しボタンクリック → 理由入力欄付きダイアログが表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    await page.getByRole("button", { name: "差し戻し" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("textbox")).toBeVisible();
    await expect(page.getByRole("button", { name: "差し戻し" }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
  });

  test("ET122: コメント送信後 → 入力欄がクリアされコメントが追加表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto(`/manager/reports/${submittedReportId}`);

    const commentInput = page.getByPlaceholder("コメントを入力").first();
    await commentInput.fill("ET122テストコメント");
    await page.getByRole("button", { name: "送信" }).first().click();

    await expect(commentInput).toHaveValue("");
    await expect(page.getByText("ET122テストコメント")).toBeVisible();
  });
});

test.describe("ET123-ET124: SC008 顧客マスタ一覧", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET123: isAdminユーザーでログイン → 見出し・ボタン・検索ラベル・列ヘッダーが表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "顧客マスタ" }).click();
    await expect(page).toHaveURL("/admin/customers");

    await expect(page.getByRole("heading", { name: "顧客マスタ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "顧客を追加" })).toBeVisible();
    await expect(page.getByText("顧客名:")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "顧客名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "住所" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "備考" })).toBeVisible();
  });

  test("ET124: 顧客名検索欄に文字列を入力 → 一致する顧客名のみ表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForLoadState("load");

    await expect(page.getByText("テスト顧客A")).toBeVisible();
    await expect(page.getByText("テスト顧客B")).toBeVisible();

    const searchInput = page.getByPlaceholder("顧客名で検索");
    await searchInput.fill("テスト顧客A");
    await page.waitForLoadState("load");

    await expect(page.getByText("テスト顧客A")).toBeVisible();
    await expect(page.getByText("テスト顧客B")).toBeHidden();
  });
});

test.describe("ET125-ET126: SC009 顧客追加・編集", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET125: /admin/customers/new を開く → 見出し・必須マーカー・ボタンが表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers/new");

    await expect(page.getByRole("heading", { name: "顧客追加" })).toBeVisible();
    await expect(page.getByLabel("顧客名")).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();

    await expect(page.getByText("住所")).toBeVisible();
    await expect(page.getByText("備考")).toBeVisible();
  });

  test("ET126: 既存顧客の編集画面を開く → 見出し「顧客編集」・既存顧客名が初期値に表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/customers");
    await page.waitForLoadState("load");

    const row = page.getByRole("row").filter({ hasText: "テスト顧客A" });
    await row.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(/\/admin\/customers\/[^/]+\/edit$/);

    await expect(page.getByRole("heading", { name: "顧客編集" })).toBeVisible();
    await expect(page.getByLabel("顧客名")).toHaveValue("テスト顧客A");
  });
});

test.describe("ET127-ET129: SC010 営業マスタ一覧", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET127: isAdminユーザーでログイン → 見出し・ボタン・フィルター・列ヘッダーが表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.getByRole("link", { name: "営業マスタ" }).click();
    await expect(page).toHaveURL("/admin/users");

    await expect(page.getByRole("heading", { name: "営業マスタ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "営業を追加" })).toBeVisible();
    await expect(page.getByText("氏名:")).toBeVisible();
    await expect(page.getByText("ロール:")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "氏名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "メールアドレス" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "ロール" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "管理者" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "上長" })).toBeVisible();
  });

  test("ET128: 氏名検索欄に文字列を入力 → 一致する氏名のユーザーのみ表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForLoadState("load");

    await expect(page.getByText("山田太郎")).toBeVisible();
    await expect(page.getByText("佐藤次郎")).toBeVisible();

    const searchInput = page.getByPlaceholder("氏名で検索");
    await searchInput.fill("山田");
    await page.waitForLoadState("load");

    await expect(page.getByText("山田太郎")).toBeVisible();
    await expect(page.getByText("佐藤次郎")).toBeHidden();
  });

  test("ET129: ロールフィルターを「SALES」に変更 → SALESのみ表示される", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForLoadState("load");

    await expect(page.getByRole("cell", { name: "MANAGER" }).first()).toBeVisible();

    const roleTrigger = page.getByRole("combobox").first();
    await roleTrigger.click();
    await page.getByRole("option", { name: "SALES" }).click();
    await page.waitForLoadState("load");

    await expect(page.getByRole("cell", { name: "SALES" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "MANAGER" })).toHaveCount(0);
  });
});

test.describe("ET130-ET133: SC011 営業追加・編集", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET130: /admin/users/new を開く → 見出し・必須マーカー・デフォルト選択・上長フィールドが表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await expect(page.getByRole("heading", { name: "営業追加" })).toBeVisible();
    await expect(page.getByLabel("氏名")).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();

    await expect(page.getByRole("radio", { name: "SALES" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "MANAGER" })).not.toBeChecked();

    await expect(page.getByText("上長")).toBeVisible();
  });

  test("ET131: MANAGERラジオボタンを選択 → 上長フィールドが非表示になる", async ({ page }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await expect(page.getByText("上長")).toBeVisible();

    await page.getByRole("radio", { name: "MANAGER" }).click();

    await expect(page.getByText("上長")).toBeHidden();
  });

  test("ET132: 既存ユーザーの編集画面を開く → 見出し・既存データ・メール読み取り専用・リセットボタンが表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users");
    await page.waitForLoadState("load");

    const row = page.getByRole("row").filter({ hasText: "山田太郎" });
    await row.getByRole("link", { name: "編集" }).click();
    await expect(page).toHaveURL(/\/admin\/users\/[^/]+\/edit$/);

    await expect(page.getByRole("heading", { name: "営業編集" })).toBeVisible();
    await expect(page.getByLabel("氏名")).toHaveValue("山田太郎");

    const emailInput = page.getByLabel("メールアドレス");
    await expect(emailInput).toHaveValue("sales1@test.com");
    await expect(emailInput).toBeDisabled();

    await expect(page.getByRole("button", { name: "パスワードをリセット" })).toBeVisible();
  });

  test("ET133: MANAGERに切り替えた後SALESに戻す → 上長フィールドが再表示される", async ({
    page,
  }) => {
    await loginAs(page, "manager1@test.com");
    await page.goto("/admin/users/new");

    await page.getByRole("radio", { name: "MANAGER" }).click();
    await expect(page.getByText("上長")).toBeHidden();

    await page.getByRole("radio", { name: "SALES" }).click();
    await expect(page.getByText("上長")).toBeVisible();
  });
});

test.describe("ET134: SC012 パスワード変更", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET134: /settings/password を開く → 見出し・必須マーカー・ボタンが表示される", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");
    await page.goto("/settings/password");

    await expect(page.getByRole("heading", { name: "パスワード変更" })).toBeVisible();
    await expect(page.getByLabel("現在のパスワード")).toBeVisible();
    await expect(page.getByLabel("新しいパスワード *", { exact: true })).toBeVisible();
    await expect(page.getByLabel("新しいパスワード（確認）")).toBeVisible();
    await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByRole("button", { name: "変更する" })).toBeVisible();
  });
});

test.describe("ET135: 共通ヘッダー", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("ET135: ヘッダーのユーザー名をクリック → ドロップダウンに「パスワード変更」リンクが表示される", async ({
    page,
  }) => {
    await loginAs(page, "sales1@test.com");

    await page.getByRole("button", { name: "山田太郎" }).click();

    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "パスワード変更" })).toBeVisible();
  });
});
