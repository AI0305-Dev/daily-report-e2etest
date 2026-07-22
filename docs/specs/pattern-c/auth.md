# Pattern C: 認証フロー テスト計画

## Application Overview

日報システムの認証フローに関するテスト計画。設計書（要件定義・画面定義・バリデーション仕様）とアプリ探索（既存Playwright specファイル）から得た実際のUIの詳細を組み合わせて作成。ログイン・ログアウト・未認証アクセス・削除済みユーザーのアクセス制御を検証する。

## Test Scenarios

### 1. 認証フロー

**Seed:** `e2e/seed.spec.ts`

#### 1.1. TC-AUTH-001: SALESユーザーのログイン成功

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザで /login を開く
   - expect: ページに見出し「日報システム」が表示される
   - expect: 「メールアドレス」ラベルの入力欄が表示される
   - expect: 「パスワード」ラベルの入力欄が表示される
   - expect: 「ログイン」ボタンが表示される

2. メールアドレス欄に「sales1@test.com」を入力する
3. パスワード欄に「password123」を入力する
4. 「ログイン」ボタンをクリックする
   - expect: /reports（営業の日報一覧）にリダイレクトされる
   - expect: URLが /reports で終わる

#### 1.2. TC-AUTH-002: MANAGERユーザーのログイン成功

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザで /login を開く
   - expect: ログイン画面が表示される

2. メールアドレス欄に「manager1@test.com」を入力し、パスワード欄に「password123」を入力する
3. 「ログイン」ボタンをクリックする
   - expect: /manager/reports（上長の日報一覧）にリダイレクトされる

#### 1.3. TC-AUTH-003: 誤ったパスワードでのログイン失敗

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザで /login を開く
   - expect: ログイン画面が表示される

2. メールアドレス欄に「sales1@test.com」を入力し、パスワード欄に「wrongpassword」を入力する
3. 「ログイン」ボタンをクリックする
   - expect: エラーメッセージ「メールアドレスまたはパスワードが正しくありません」が表示される（E104）
   - expect: URLは /login のままである（リダイレクトなし）

#### 1.4. TC-AUTH-004: 存在しないメールアドレスでのログイン失敗

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザで /login を開く
   - expect: ログイン画面が表示される

2. メールアドレス欄に「notexist@test.com」を入力し、パスワード欄に「password123」を入力する
3. 「ログイン」ボタンをクリックする
   - expect: エラーメッセージ「メールアドレスまたはパスワードが正しくありません」が表示される（E104）
   - expect: URLは /login のまま

#### 1.5. TC-AUTH-005: メールアドレス未入力でのログイン失敗

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザで /login を開く
2. メールアドレス欄は空のまま、パスワード欄に「password123」を入力する
3. 「ログイン」ボタンをクリックする
   - expect: バリデーションエラーが表示される（メールアドレス必須 E101）
   - expect: ログインは実行されない

#### 1.6. TC-AUTH-006: 不正なメール形式でのログイン失敗

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザで /login を開く
2. メールアドレス欄に「invalid-email」を入力し、パスワード欄に「password123」を入力する
3. 「ログイン」ボタンをクリックする
   - expect: メール形式エラー（E102）が表示される

#### 1.7. TC-AUTH-007: ログアウト機能

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports に遷移する
   - expect: 日報一覧画面が表示される

2. ヘッダーの「ログアウト」ボタンをクリックする
   - expect: /login にリダイレクトされる
   - expect: ログイン画面が表示される

#### 1.8. TC-AUTH-008: 未認証でのページアクセス

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザをログアウト状態（未認証）にして /reports に直接アクセスする
   - expect: /login にリダイレクトされる

#### 1.9. TC-AUTH-009: 未認証で /manager/reports にアクセス

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. ブラウザをログアウト状態（未認証）にして /manager/reports に直接アクセスする
   - expect: /login にリダイレクトされる

#### 1.10. TC-AUTH-010: 削除済みユーザーはログイン不可

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. manager1@test.com でログインし、営業マスタ画面から新規営業ユーザーを追加して初期パスワードを取得する
   - expect: 初期パスワードが表示されるモーダルダイアログが開く

2. 追加した営業ユーザーを削除する（確認ダイアログで「削除する」をクリック）
   - expect: 一覧から非表示になる

3. ログアウトして、削除したユーザーのメールアドレスと初期パスワードでログインを試みる
   - expect: エラーメッセージ「このアカウントは無効です。管理者にお問い合わせください」が表示される（E105）
   - expect: URLは /login のまま

#### 1.11. TC-AUTH-011: 認証済みユーザーが /login にアクセスするとリダイレクトされる

**File:** `specs/pattern-c/auth.spec.ts`

**Steps:**

1. sales1@test.com でログインして /reports にいる状態で、/login に直接アクセスする
   - expect: ロール別トップページ（/reports）にリダイレクトされる（ログイン画面は表示されない）
