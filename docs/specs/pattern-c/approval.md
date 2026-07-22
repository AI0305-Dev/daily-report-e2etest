# Pattern C: 承認・差し戻しフロー テスト計画

## Application Overview

日報システムの承認・差し戻しフローに関するテスト計画。MANAGERロールによる提出済み日報の承認・差し戻し操作、確認ダイアログの動作、差し戻し後のSALESによる再提出フローを検証する。アプリ探索により確認ダイアログ内のボタン名（「承認」「差し戻し」「キャンセル」）、差し戻し理由入力欄の存在などを確認済み。

## Test Scenarios

### 1. 承認・差し戻しフロー

**Seed:** `e2e/seed.spec.ts`

#### 1.1. TC-APR-001: 承認フロー - ステータスが「完了」になり一覧に戻る

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. sales1@test.com でログインし「+ 日報を作成」をクリックする
2. 日付欄に今日の日付を入力し、「提出」ボタンをクリックする
   - expect: ステータス「提出済」が表示される

3. ログアウトして manager1@test.com でログインし、提出した日報の URL（/manager/reports/[id]）にアクセスする
   - expect: 日報詳細画面が表示される
   - expect: 「承認」ボタンと「差し戻し」ボタンが表示される

4. 「承認」ボタンをクリックする
   - expect: 確認ダイアログが表示される
   - expect: ダイアログ内に「承認」ボタンと「キャンセル」ボタンが含まれる

5. ダイアログ内の「承認」ボタンをクリックする
   - expect: /manager/reports に遷移する
   - expect: 承認した日報の行が一覧（デフォルト「提出済」フィルター）から非表示になる

#### 1.2. TC-APR-002: 承認確認ダイアログで「キャンセル」を押すと承認されない

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. manager1@test.com でログインしてシードの SUBMITTED 日報詳細画面を開く
2. 「承認」ボタンをクリックしダイアログが表示されたら「キャンセル」をクリックする
   - expect: ダイアログが閉じる
   - expect: 日報詳細画面はそのまま表示される
   - expect: ステータスは変わらず「提出済」のまま

#### 1.3. TC-APR-003: 差し戻しフロー - ステータスが「差し戻し」になる

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. sales1@test.com で日報を提出して URL を取得する
   - expect: 提出済日報が作成される

2. manager1@test.com でログインしてその日報詳細画面を開く
3. 「差し戻し」ボタンをクリックする
   - expect: 確認ダイアログが表示される
   - expect: ダイアログ内に差し戻し理由のテキスト入力欄が含まれる
   - expect: 「差し戻し」ボタンと「キャンセル」ボタンが含まれる

4. 差し戻し理由の入力欄に「訪問内容の記載が不十分です」と入力し、ダイアログ内の「差し戻し」ボタンをクリックする
   - expect: /manager/reports に遷移する

#### 1.4. TC-APR-004: 差し戻し終わりの日報を SALES が再提出する

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. sales1@test.com で日報を提出し、manager1@test.com で差し戻しを実行した後、再度 sales1@test.com でログインする
2. 差し戻し日報の詳細画面を開く
   - expect: ステータス「差し戻し」が表示される
   - expect: 「編集」ボタンが表示される

3. 「編集」リンクをクリックし内容を修正して「提出」ボタンをクリックする
   - expect: ステータスが「提出済」に変わる

#### 1.5. TC-APR-005: 承認後は SALES が編集不可 - 編集ボタンが表示されない

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. sales1@test.com で日報を提出し、manager1@test.com で承認を実行する
2. 再度 sales1@test.com でログインし、承認済み日報の詳細画面を開く
   - expect: ステータス「完了」が表示される
   - expect: 「編集」ボタンが表示されない

#### 1.6. TC-APR-006: 差し戻し理由なしで差し戻しできる

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. sales1@test.com で日報を提出し、manager1@test.com でその日報詳細画面を開く
2. 「差し戻し」ボタンをクリックし、理由入力欄は空のままダイアログ内の「差し戻し」ボタンをクリックする
   - expect: /manager/reports に遷移する（エラーにならない）

#### 1.7. TC-APR-007: SALESが他の SALES の日報詳細にアクセス不可

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. manager1@test.com でログインしてシードの SUBMITTED 日報 ID を確認する
2. sales2@test.com でログインし、sales1 の日報 URL（/reports/[id]）に直接アクセスする
   - expect: アクセスできない（403 エラーまたはロール別トップにリダイレクト）

#### 1.8. TC-APR-008: MANAGERが配下以外の SALES の日報を承認不可

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. sales1@test.com で日報を提出する（MANAGER1 配下の営業）
2. manager2@test.com でログインし、提出済み日報の /manager/reports/[id] に直接アクセスする
   - expect: アクセスを拒否される（403 エラーまたはリダイレクト）

#### 1.9. TC-APR-009: SALES が承認操作不可

**File:** `specs/pattern-c/approval.spec.ts`

**Steps:**

1. sales1@test.com で日報を提出し、得た ID で /manager/reports/[id] に直接アクセスを試みる
   - expect: アクセス不可（SALES は MANAGER 画面にアクセスできない）
