# Pattern C: パスワード変更フロー テスト計画

## Application Overview

日報システムのパスワード変更機能に関するテスト計画。認証済み全ロールユーザーによるパスワード変更の成功・失敗シナリオ、バリデーションエラーを検証する。アプリ探索によりパスワード変更画面へのアクセス経路（ヘッダーのユーザー名ボタンクリック → ドロップダウンメニュー「パスワード変更」）、ラベル名「現在のパスワード」「新しいパスワード \*」「新しいパスワード（確認）」、ボタン名「変更する」「キャンセル」を確認済み。

## Test Scenarios

### 1. パスワード変更フロー

**Seed:** `e2e/seed.spec.ts`

#### 1.1. TC-PWD-001: SALES ユーザーのパスワード変更成功 - /reports にリダイレクト

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインする
   - expect: /reports に遷移する

2. ヘッダーの「山田太郎」ボタンをクリックする
   - expect: ドロップダウンメニューが表示される
   - expect: 「パスワード変更」メニューアイテムが含まれる

3. 「パスワード変更」をクリックする
   - expect: /settings/password に遷移する
   - expect: 見出し「パスワード変更」が表示される

4. 「現在のパスワード」入力欄に「password123」を入力する
5. 「新しいパスワード \*」入力欄（exact: true）に「NewPass456」を入力する
6. 「新しいパスワード（確認）」入力欄に「NewPass456」を入力する
7. 「変更する」ボタンをクリックする
   - expect: /reports にリダイレクトされる

#### 1.2. TC-PWD-002: MANAGER ユーザーのパスワード変更成功 - /manager/reports にリダイレクト

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. manager2@test.com でログインして /settings/password にアクセスする
   - expect: パスワード変更画面が表示される

2. 「現在のパスワード」に「password123」、「新しいパスワード \*」に「NewPass456」、「新しいパスワード（確認）」に「NewPass456」を入力し、「変更する」をクリックする
   - expect: /manager/reports にリダイレクトされる

#### 1.3. TC-PWD-003: 現在のパスワード不正で失敗 - E602 エラー

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password にアクセスする
2. 「現在のパスワード」に「wrongpassword」を入力し、新しいパスワードに「NewPass456」を入力し、「変更する」をクリックする
   - expect: 「現在のパスワードが正しくありません」エラーメッセージが表示される（E602）
   - expect: URLは /settings/password のまま

#### 1.4. TC-PWD-004: 新パスワードポリシー不足（文字数不足）- E604 エラー

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password にアクセスする
2. 「現在のパスワード」に「password123」を入力し、新しいパスワードに 7 文字の「Pass123」を入力し、確認欄にも同じ内容を入力し「変更する」をクリックする
   - expect: 「パスワードは8文字以上で入力してください」エラーメッセージが表示される（E604）

#### 1.5. TC-PWD-005: 新パスワードポリシー不足（数字なし）- E605 エラー

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password にアクセスする
2. 「現在のパスワード」に「password123」、新しいパスワードに英字のみ「Password」を入力し、確認欄にも同じ内容を入力し「変更する」をクリックする
   - expect: 「パスワードは英字と数字を両方含めてください」エラーメッセージが表示される（E605）

#### 1.6. TC-PWD-006: 新パスワードポリシー不足（英字なし）- E605 エラー

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password にアクセスする
2. 新しいパスワードに数字のみ「12345678」を入力し「変更する」をクリックする
   - expect: 「パスワードは英字と数字を両方含めてください」エラーメッセージが表示される（E605）

#### 1.7. TC-PWD-007: 確認パスワード不一致 - E607 エラー

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password にアクセスする
2. 「現在のパスワード」に「password123」、「新しいパスワード \*」に「NewPass456」、「新しいパスワード（確認）」に「DifferentPass789」を入力し「変更する」をクリックする
   - expect: 「パスワードが一致しません」エラーメッセージが表示される（E607）

#### 1.8. TC-PWD-008: パスワード変更画面で「キャンセル」を押すとロール別トップに戻る

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password にアクセスする
2. 「キャンセル」ボタンをクリックする
   - expect: /reports に戻る（SALES の場合）

#### 1.9. TC-PWD-009: 現在のパスワード未入力 - E601 エラー

**File:** `specs/pattern-c/password.spec.ts`

**Steps:**

1. sales1@test.com でログインして /settings/password にアクセスする
2. 「現在のパスワード」入力欄を空のまま、新しいパスワードに「NewPass456」を入力し、「変更する」をクリックする
   - expect: 「現在のパスワードを入力してください」エラーメッセージが表示される（E601）
