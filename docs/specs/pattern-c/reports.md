# Pattern C: 日報作成・提出フロー テスト計画

## Application Overview

日報システムの日報作成・提出フローに関するテスト計画。SALES ロールのユーザーが日報を作成・下書き保存・提出する各シナリオ、訪問記録の追加・削除、バリデーションエラーを検証する。アプリ探索により実際のUI要素（ボタン名「訪問記録を追加」「下書き保存」「提出」、プレースホルダー「顧客名を入力して検索」「訪問内容」など）を確認済み。

## Test Scenarios

### 1. 日報作成・提出フロー

**Seed:** `e2e/seed.spec.ts`

#### 1.1. TC-REP-001: 下書き保存 - 日報詳細に遷移しステータスが「下書き」になる

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインする
   - expect: /reports に遷移する

2. 「+ 日報を作成」リンクをクリックする
   - expect: /reports/new に遷移する
   - expect: 見出し「日報作成」が表示される
   - expect: 日付の初期値が今日の日付になっている

3. 日付欄（ラベル「日付」）に今日の日付（不存在の日付）を入力する
4. 「訪問記録を追加」ボタンをクリックする
   - expect: 訪問記録の行が1件追加される

5. 「顧客名を入力して検索」プレースホルダのテキストボックスに「テスト顧客A」を入力する
   - expect: テスト顧客A の候補が表示される

6. 「テスト顧客A」をクリックして選択する
   - expect: 顧客が選択される

7. 「訪問内容」プレースホルダのテキストエリアに「E2Eテスト訪問」を入力する
8. 「Problem（課題・相談）」ラベルのテキストエリアに「E2Eテスト課題」を入力する
9. 「Plan（明日やること）」ラベルのテキストエリアに「E2Eテストプラン」を入力する
10. 「下書き保存」ボタンをクリックする
    - expect: /reports/[id] （日報詳細画面）に遷移する
    - expect: ステータス「下書き」が表示される
    - expect: 顧客名「テスト顧客A」と訪問内容が表示される
    - expect: 「E2Eテスト課題」と「E2Eテストプラン」が表示される

#### 1.2. TC-REP-002: 日報提出 - 日報詳細に遷移しステータスが「提出済」になる

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインし「+ 日報を作成」をクリックする
   - expect: /reports/new に遷移する

2. 日付欄に今日の日付を入力する
3. 「提出」ボタンをクリックする
   - expect: /reports/[id] に遷移する
   - expect: ステータス「提出済」が表示される
   - expect: 編集ボタンが表示されない

#### 1.3. TC-REP-003: 訪問記録の複数行追加・削除 - 2行が表示される

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports/new を開く
   - expect: 日報作成画面が表示される

2. 「訪問記録を追加」ボタンを 3 回クリックする
   - expect: 訪問記録の行が 3 件表示される

3. 2行目の「削除」ボタンをクリックする
   - expect: 訪問記録の行が 2 件に減る

#### 1.4. TC-REP-004: 訪問記録 10 件追加で「訪問記録を追加」ボタンが disabled になる

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports/new を開く
2. 「訪問記録を追加」ボタンを 10 回クリックする
   - expect: 訪問記録の行が 10 件表示される
   - expect: 「訪問記録を追加」ボタンが disabled 状態になり、クリックできなくなる

#### 1.5. TC-REP-005: 同日重複エラー - E202 エラーメッセージが表示される

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインし「+ 日報を作成」をクリックする
2. 日付欄にシードデータに存在する SUBMITTED 日報（当日-3日）と同じ日付を入力する
3. 「提出」ボタンをクリックする
   - expect: 「選択した日付の日報はすでに作成されています」エラーメッセージが表示される（E202）
   - expect: /reports/new のままでリダイレクトされない

#### 1.6. TC-REP-006: 訪問記録の顧客未選択で提出 - E204 エラーが表示される

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインし「+ 日報を作成」をクリックする
2. 日付欄に今日の日付を入力する
3. 「訪問記録を追加」ボタンをクリックする（顧客は選択しない）
4. 「提出」ボタンをクリックする
   - expect: 「顧客を選択してください」エラーメッセージが表示される（E204）

#### 1.7. TC-REP-007: 訪問内容未入力で提出 - E205 エラーが表示される

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインし「+ 日報を作成」をクリックする
2. 日付欄に今日の日付を入力する
3. 「訪問記録を追加」ボタンをクリックし、顧客を選択するが訪問内容は入力しない
4. 「提出」ボタンをクリックする
   - expect: 「訪問内容を入力してください」エラーメッセージが表示される（E205）

#### 1.8. TC-REP-008: 日付未入力で保存 - E201 エラーが表示される

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports/new を開く
2. 日付欄を空にする（初期値を制院する）
3. 「提出」ボタンをクリックする
   - expect: 日付必須エラー（E201）が表示される

#### 1.9. TC-REP-009: 日報一覧のステータスフィルター機能

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインする
   - expect: /reports に遷移する

2. ステータスフィルタードロップダウンを開いて「下書き」を選択する
   - expect: 下書きステータスの日報のみ表示される
   - expect: 「提出済」「差し戈し」「完了」の行は表示されない

#### 1.10. TC-REP-010: 日報編集 - 日付・訪問記録・Problem/Planを変更して保存

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインして日報一覧から DRAFT 日報の行をクリックする
   - expect: 日報詳細画面が表示される

2. 「編集」リンクをクリックする
   - expect: /reports/[id]/edit に遷移する
   - expect: 見出し「日報編集」が表示される
   - expect: 日付・Problem/Plan の既存内容が各入力欄に初期値として表示される

3. Problem テキストエリアに「編集テスト課題」を入力して「下書き保存」をクリックする
   - expect: /reports/[id] に遷移する
   - expect: 「編集テスト課題」が表示される

#### 1.11. TC-REP-011: 日報編集画面から「キャンセル」で日報詳細に戻る

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインして DRAFT 日報の編集画面を開く
2. 「キャンセル」ボタンをクリックする
   - expect: /reports/[id] に戻る

#### 1.12. TC-REP-012: 日報一覧画面で「一覧に戻る」リンクが機能する

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインして日報詳細画面を開く
2. 「← 一覧に戻る」リンクをクリックする
   - expect: /reports に戻る

#### 1.13. TC-REP-013: 訪問記録無しで提出できる（内勤日ケース）

**File:** `specs/pattern-c/reports.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports/new を開く
2. 日付欄に今日の日付を入力する（訪問記録は追加しない）
3. 「提出」ボタンをクリックする
   - expect: エラーにならず /reports/[id] に遷移する
   - expect: ステータス「提出済」が表示される
