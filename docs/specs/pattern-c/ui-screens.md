# Pattern C: UI要素検証 テスト計画

## Application Overview

日報システムの各画面のUI要素検証テスト計画。画面の初期表示内容（見出し・ラベル・ボタン・フィルター・列ヘッダーなど）、状態変化によるUI要素の表示/非表示、フィルター機能の動作を検証する。アプリ探索により実際のラベル名・ボタン名・プレースホルダー・combobox順序（上長フィルターが nth(0)、ステータスフィルターが nth(1) など）を確認済み。

## Test Scenarios

### 1. SC001 ログイン画面

**Seed:** `e2e/seed.spec.ts`

#### 1.1. TC-UI-001: ログイン画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. 未認証状態で /login を開く
   - expect: 見出し「日報システム」が表示される
   - expect: 「メールアドレス」ラベルの入力欄が表示される
   - expect: 「パスワード」ラベルの入力欄が表示される
   - expect: 「ログイン」ボタンが表示される

### 2. SC002 日報一覧（営業）

**Seed:** `e2e/seed.spec.ts`

#### 2.1. TC-UI-002: 日報一覧（営業）の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインする
   - expect: 見出し「日報一覧」が表示される
   - expect: 「+ 日報を作成」リンクボタンが表示される
   - expect: 「ステータス:」フィルターが表示される
   - expect: 列ヘッダー「日付」と「ステータス」が表示される

#### 2.2. TC-UI-003: isAdmin=false の SALES は管理者リンクが非表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com（isAdmin=false）でログインする
   - expect: ナビゲーションに「顧客マスタ」リンクが表示されない
   - expect: 「営業マスタ」リンクが表示されない
   - expect: 「日報一覧」リンクは表示される

#### 2.3. TC-UI-004: isAdmin=true のユーザーは管理者リンクが表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com（isAdmin=true）でログインする
   - expect: 「顧客マスタ」リンクが表示される
   - expect: 「営業マスタ」リンクが表示される

#### 2.4. TC-UI-005: ステータスフィルター変更で一覧が絞り込まれる

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインする
2. ステータスフィルターのドロップダウン（1番目の combobox）を開いて「下書き」を選択する
   - expect: 下書きステータスの日報のみ表示される
   - expect: 「提出済」「差し戻し」「完了」のセルは表示されない

### 3. SC003 日報作成

**Seed:** `e2e/seed.spec.ts`

#### 3.1. TC-UI-006: 日報作成画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports/new を開く
   - expect: 見出し「日報作成」が表示される
   - expect: 「日付」ラベルの入力欄が表示され、初期値は今日の日付
   - expect: 「訪問記録を追加」ボタンが表示される
   - expect: 「キャンセル」「下書き保存」「提出」ボタンが表示される

#### 3.2. TC-UI-007: 訪問記録 10 件追加で追加ボタンが disabled になる

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports/new を開く
2. 「訪問記録を追加」ボタンを 10 回クリックする
   - expect: 「訪問記録を追加」ボタンが disabled 状態になり、クリックできなくなる

### 4. SC004 日報編集

**Seed:** `e2e/seed.spec.ts`

#### 4.1. TC-UI-008: 日報編集画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインし、/reports から「下書き」日報の行をクリックする
2. 「編集」リンクをクリックして編集画面を開く
   - expect: 見出し「日報編集」が表示される
   - expect: 日付入力欄に既存の日付が表示される（空になっていない）

### 5. SC005 日報詳細（営業）

**Seed:** `e2e/seed.spec.ts`

#### 5.1. TC-UI-009: DRAFT 日報の詳細 - 「下書き」バッジと編集ボタンが表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports を開き、「下書き」行をクリックする
   - expect: ステータスバッジ「下書き」が表示される
   - expect: 「編集」リンクボタンが表示される

#### 5.2. TC-UI-010: SUBMITTED 日報の詳細 - 「提出済」バッジで編集ボタンなし

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインし、ステータスフィルターを「全て」に変更して「提出済」行をクリックする
   - expect: ステータス「提出済」が表示される
   - expect: 「編集」リンクボタンが表示されない

#### 5.3. TC-UI-011: REJECTED 日報の詳細 - 「差し戻し」バッジと編集ボタンが表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインし、ステータスフィルターを「全て」に変更して「差し戻し」行をクリックする
   - expect: ステータス「差し戻し」が表示される
   - expect: 「編集」リンクボタンが表示される

#### 5.4. TC-UI-012: COMPLETED 日報の詳細 - 「完了」バッジで編集ボタンなし

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインし、ステータスフィルターを「全て」に変更して「完了」行をクリックする
   - expect: ステータス「完了」が表示される
   - expect: 「編集」リンクボタンが表示されない

### 6. SC006 日報一覧（上長）

**Seed:** `e2e/seed.spec.ts`

#### 6.1. TC-UI-013: 日報一覧（上長）の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインする
   - expect: 見出し「部下の日報一覧」が表示される
   - expect: 列ヘッダー「日付」「営業氏名」「ステータス」が表示される

#### 6.2. TC-UI-014: ステータスフィルターのデフォルト値が「提出済」で選択肢に日本語表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインする
   - expect: ステータスフィルターのデフォルト値が「提出済」と日本語で表示される

2. ステータスフィルター（2番目の combobox）を開く
   - expect: 選択肢に「全て」「提出済」「差し戻し」「完了」が日本語で表示される

#### 6.3. TC-UI-015: 営業フィルターのデフォルト値「全員」と配下営業が選択肢に含まれる

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインする
2. 営業フィルター（1番目の combobox）を開く
   - expect: デフォルト値「全員」が表示される
   - expect: 選択肢に「山田太郎」「佐藤次郎」が含まれる

#### 6.4. TC-UI-016: ステータスフィルターを「全て」に変更すると全建表示（DRAFT除く）

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインする
2. ステータスフィルター（2番目の combobox）を「全て」に変更する
   - expect: SUBMITTED・ REJECTED・ COMPLETED のステータスの日報が表示される
   - expect: DRAFT 日報は表示されない

#### 6.5. TC-UI-017: 営業フィルターで特定営業を選択すると絞り込まれる

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインしステータスフィルターを「全て」に変更する
2. 営業フィルター（1番目の combobox）から「山田太郎」を選択する
   - expect: 山田太郎の日報のみ表示される
   - expect: 佐藤次郎の行は表示されない

### 7. SC007 日報詳細（上長）

**Seed:** `e2e/seed.spec.ts`

#### 7.1. TC-UI-018: SUBMITTED 日報詳細 - 承認・差し戻しボタンとコメント入力欄が表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインし、シードの SUBMITTED 日報詳細画面を開く
   - expect: 「差し戻し」ボタンと「承認」ボタンが表示される
   - expect: Problem・Plan・全般コメントの入力欄（「コメントを入力」）と「送信」ボタンが表示される

#### 7.2. TC-UI-019: COMPLETED 日報詳細 - 承認・差し戻しボタンとコメント入力欄なし

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインし、ステータスフィルターを「全て」に変更し COMPLETED 日報詳細画面を開く
   - expect: 「差し戻し」「承認」ボタンが表示されない
   - expect: コメント入力欄（「コメントを入力」）が表示されない
   - expect: 「送信」ボタンが表示されない

#### 7.3. TC-UI-020: 承認ボタンクリックで確認ダイアログが表示される

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインし、SUBMITTED 日報詳細画面で「承認」ボタンをクリックする
   - expect: 確認ダイアログが表示される
   - expect: ダイアログ内に「承認」ボタンと「キャンセル」ボタンが含まれる

#### 7.4. TC-UI-021: 差し戻しボタンクリックで理由入力欄付きダイアログが表示される

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインし、SUBMITTED 日報詳細画面で「差し戻し」ボタンをクリックする
   - expect: 確認ダイアログが表示される
   - expect: ダイアログ内に差し戻し理由のテキスト入力欄が含まれる
   - expect: 「差し戻し」ボタンと「キャンセル」ボタンが含まれる

#### 7.5. TC-UI-022: コメント送信後に入力欄がクリアされコメントが追加表示される

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインし、SUBMITTED 日報詳細画面を開く
2. Problem のコメント入力欄（最初の 「コメントを入力」）に「TC-UI-022テスト」と入力し、「送信」ボタンをクリックする
   - expect: 入力欄が空になる（クリアされる）
   - expect: 「TC-UI-022テスト」がコメント一覧に表示される

### 8. SC008 顧客マスタ一覧

**Seed:** `e2e/seed.spec.ts`

#### 8.1. TC-UI-023: 顧客マスタ一覧の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインし、「顧客マスタ」リンクをクリックする
   - expect: 見出し「顧客マスタ」が表示される
   - expect: 「+ 顧客を追加」リンクボタンが表示される
   - expect: 「顧客名:」ラベルの検索欄が表示される
   - expect: 列ヘッダー「顧客名」「住所」「備考」が表示される

#### 8.2. TC-UI-024: 顧客名検索で一覧が絞り込まれる

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/customers を開く
2. 顧客名検索欄（プレースホルダ「顧客名で検索」）に「テスト顧客A」を入力する
   - expect: 「テスト顧客A」の行のみ表示される
   - expect: 「テスト顧客B」は表示されない

### 9. SC009 顧客追加・編集

**Seed:** `e2e/seed.spec.ts`

#### 9.1. TC-UI-025: 顧客追加画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/customers/new を開く
   - expect: 見出し「顧客追加」が表示される
   - expect: 「顧客名」必須フィールドが表示される
   - expect: 「住所」「備考」フィールドが表示される（必須マーカーなし）
   - expect: 「キャンセル」「保存」ボタンが表示される

#### 9.2. TC-UI-026: 顧客編集画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/customers を開き、テスト顧客A の「編集」リンクをクリックする
   - expect: 見出し「顧客編集」が表示される
   - expect: 顧客名入力欄に「テスト顧客A」が初期値として表示される

### 10. SC010 営業マスタ一覧

**Seed:** `e2e/seed.spec.ts`

#### 10.1. TC-UI-027: 営業マスタ一覧の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインし、「営業マスタ」リンクをクリックする
   - expect: 見出し「営業マスタ」が表示される
   - expect: 「+ 営業を追加」リンクボタンが表示される
   - expect: 「氏名:」「ロール:」フィルターが表示される
   - expect: 列ヘッダー「氏名」「メールアドレス」「ロール」「管理者」「上長」が表示される

#### 10.2. TC-UI-028: 氏名検索で一覧が絞り込まれる

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開く
2. 氏名検索欄（プレースホルダ「氏名で検索」）に「山田」を入力する
   - expect: 「山田太郎」の行のみ表示される
   - expect: 「佐藤次郎」は表示されない

#### 10.3. TC-UI-029: ロールフィルターで SALES のみ絞り込まれる

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開く
2. ロールフィルター（1番目の combobox）を「SALES」に変更する
   - expect: SALES ロールのユーザーのみ表示される
   - expect: MANAGER ロールのユーザーは 0 件表示される

### 11. SC011 営業追加・編集

**Seed:** `e2e/seed.spec.ts`

#### 11.1. TC-UI-030: 営業追加画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users/new を開く
   - expect: 見出し「営業追加」が表示される
   - expect: 「氏名」「メールアドレス」「ロール」必須フィールドが表示される
   - expect: SALES ラジオボタンがデフォルトで選択され、「上長」フィールドが表示される

#### 11.2. TC-UI-031: MANAGER ラジオボタンを選択すると上長フィールドが非表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users/new を開く
2. MANAGER ラジオボタンをクリックする
   - expect: 「上長」フィールドが非表示になる

#### 11.3. TC-UI-032: MANAGER から SALES に切り替えると上長フィールドが再表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users/new を開き、MANAGER ラジオボタンを選択する（上長フィールド非表示を確認）
   - expect: 「上長」フィールドが非表示

2. SALES ラジオボタンをクリックする
   - expect: 「上長」フィールドが再び表示される

#### 11.4. TC-UI-033: 営業編集画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開き、山田太郎の「編集」リンクをクリックする
   - expect: 見出し「営業編集」が表示される
   - expect: 氏名入力欄に「山田太郎」が表示される
   - expect: メールアドレス入力欄が disabled（編集不可・読み取り専用）になっている
   - expect: 「パスワードをリセット」ボタンが表示される

### 12. SC012 パスワード変更

**Seed:** `e2e/seed.spec.ts`

#### 12.1. TC-UI-034: パスワード変更画面の初期表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password を開く
   - expect: 見出し「パスワード変更」が表示される
   - expect: 「現在のパスワード」必須フィールドが表示される
   - expect: 「新しいパスワード \*」必須フィールドが表示される
   - expect: 「新しいパスワード（確認）」必須フィールドが表示される
   - expect: 「キャンセル」「変更する」ボタンが表示される

### 13. 共通ヘッダー

**Seed:** `e2e/seed.spec.ts`

#### 13.1. TC-UI-035: ヘッダーのユーザー名クリックでドロップダウン表示

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインする
2. ヘッダーの「山田太郎」ボタンをクリックする
   - expect: ドロップダウンメニューが表示される
   - expect: 「パスワード変更」メニューアイテムが含まれる

#### 13.2. TC-UI-036: SALES の「日報一覧」リンクが /reports に遷移

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. sales1@test.com でログインする
2. ヘッダーの「日報一覧」リンクをクリックする
   - expect: /reports に遷移する

#### 13.3. TC-UI-037: MANAGER の「日報一覧」リンクが /manager/reports に遷移

**File:** `specs/pattern-c/ui-screens.spec.ts`

**Steps:**

1. manager1@test.com でログインする
2. ヘッダーの「日報一覧」リンクをクリックする
   - expect: /manager/reports に遷移する
