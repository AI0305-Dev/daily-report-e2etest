# Pattern C: 管理者フロー テスト計画

## Application Overview

日報システムの管理者（isAdmin=true）向け機能のテスト計画。顧客マスタのCRUD操作、営業マスタのCRUD操作、初期パスワード発行とパスワードリセット機能を検証する。アプリ探索により実際のUI要素（「+ 顧客を追加」「+ 営業を追加」「削除する」ボタン、初期パスワード表示モーダルの「閉じる」ボタン、パスワードリセットの「パスワードをリセット」ボタンなど）を確認済み。

## Test Scenarios

### 1. 管理者フロー - 顧客マスタ管理

**Seed:** `e2e/seed.spec.ts`

#### 1.1. TC-ADM-001: 顧客追加 - 一覧に追加される

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインし、ナビゲーションの「顧客マスタ」リンクをクリックする
   - expect: /admin/customers に遷移する
   - expect: 見出し「顧客マスタ」、ボタン「+ 顧客を追加」が表示される

2. 「+ 顧客を追加」リンクをクリックする
   - expect: /admin/customers/new に遷移する
   - expect: 見出し「顧客追加」が表示される
   - expect: 「顧客名」必須フィールドが表示される

3. 「顧客名」ラベルの入力欄に「TC-ADM-001テスト顧客」を入力し「保存」ボタンをクリックする
   - expect: /admin/customers に遷移する
   - expect: 「TC-ADM-001テスト顧客」が一覧に表示される

#### 1.2. TC-ADM-002: 顧客名必須エラー - E401

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/customers/new を開く
2. 顧客名欄を空のまま「保存」ボタンをクリックする
   - expect: 「顧客名を入力してください」エラーメッセージが表示される（E401）

#### 1.3. TC-ADM-003: 顧客編集 - 変更が反映される

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/customers を開く
2. 「テスト顧客A」の行の「編集」リンクをクリックする
   - expect: /admin/customers/[id]/edit に遷移する
   - expect: 見出し「顧客編集」が表示される
   - expect: 顧客名入力欄に「テスト顧客A」が初期値として表示される

3. 顧客名を「テスト顧客A（編集済）」に変更し「保存」ボタンをクリックする
   - expect: /admin/customers に戻る
   - expect: 「テスト顧客A（編集済）」が一覧に表示される

#### 1.4. TC-ADM-004: 顧客削除 - 一覧から非表示になる（論理削除）

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/customers を開く
2. 「テスト顧客B」の行の「削除」ボタンをクリックする
   - expect: 確認ダイアログが表示される

3. 確認ダイアログ内の「削除」ボタンをクリックする
   - expect: 「テスト顧客B」が一覧から非表示になる

#### 1.5. TC-ADM-005: 顧客名検索 - 部分一致で絞り込みできる

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/customers を開く
2. 顧客名検索欄（プレースホルダ「顧客名で検索」）に「テスト顧客A」を入力する
   - expect: 「テスト顧客A」の行のみ表示される
   - expect: 「テスト顧客B」は表示されない

### 2. 管理者フロー - 営業マスタ管理

**Seed:** `e2e/seed.spec.ts`

#### 2.1. TC-ADM-006: 営業追加 - 一覧に追加、初期パスワードが表示される

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインし、「営業マスタ」リンクをクリックする
   - expect: /admin/users に遷移する

2. 「+ 営業を追加」リンクをクリックする
   - expect: /admin/users/new に遷移する
   - expect: 見出し「営業追加」が表示される
   - expect: SALES ラジオボタンがデフォルトで選択されている
   - expect: 「上長」フィールドが表示される

3. 「氏名」入力欄に「TC-ADM-006テスト営業」を入力する
4. 「メールアドレス」入力欄に新規メールアドレスを入力する
5. SALES ラジオボタンを選択したまま、「上長」ドロップダウンから「鈴木部長」を選択する
6. 「保存」ボタンをクリックする
   - expect: 初期パスワード表示モーダルダイアログが開く
   - expect: 見出し「初期パスワード」が表示される
   - expect: 初期パスワードの文字列が表示される（英数字混在コード）

7. 「閉じる」ボタンをクリックする
   - expect: /admin/users に戻る
   - expect: 「TC-ADM-006テスト営業」が一覧に表示される

#### 2.2. TC-ADM-007: MANAGER ロールで営業追加 - 上長フィールドが非表示

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users/new を開く
2. MANAGER ラジオボタンをクリックする
   - expect: 「上長」フィールドが非表示になる

#### 2.3. TC-ADM-008: 営業編集 - 氏名変更、メール読み取り専用

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開く
2. 「山田太郎」の行の「編集」リンクをクリックする
   - expect: /admin/users/[id]/edit に遷移する
   - expect: 見出し「営業編集」が表示される
   - expect: 氏名欄に「山田太郎」が表示される
   - expect: メールアドレス欄が disabled（編集不可）になっている
   - expect: 「パスワードをリセット」ボタンが表示される

3. 氏名を「山田太郎（編集済）」に変更し「保存」をクリックする
   - expect: /admin/users に戻る
   - expect: 「山田太郎（編集済）」が一覧に表示される

#### 2.4. TC-ADM-009: 営業削除 - 一覧から非表示になる（論理削除）

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users/new から新規営業を追加する（削除用ユーザーの初期パスワードを取得しておく）
2. 追加した営業の行の「削除」ボタンをクリックする
   - expect: 確認ダイアログが表示される

3. 確認ダイアログ内の「削除する」ボタンをクリックする
   - expect: 一覧から非表示になる

#### 2.5. TC-ADM-010: 自分自身のアカウントは削除不可 - E510

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開く
2. ログイン中のユーザー（鈴木部長）自身の「削除」ボタンをクリックし確認ダイアログで「削除する」をクリックする
   - expect: 「自分自身のアカウントは削除できません」エラーメッセージが表示される（E510）

#### 2.6. TC-ADM-011: 最後の MANAGER は削除不可 - E511

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開く
2. システム内の MANAGER が 1 名のみになるよう一方の MANAGER を削除した後、その MANAGER を削除しようとする
   - expect: 「MANAGERが存在しなくなるため削除できません」エラーメッセージが表示される（E511）

#### 2.7. TC-ADM-012: パスワードリセット - 新しい初期パスワードが発行される

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開き、山田太郎の編集画面を開く
   - expect: 「パスワードをリセット」ボタンが表示される

2. 「パスワードをリセット」ボタンをクリックする
   - expect: 確認ダイアログが表示される

3. 確認ダイアログでリセットを承認する
   - expect: 新しい初期パスワードが画面に表示される（英数字混在コード）

#### 2.8. TC-ADM-013: 氏名検索・ロールフィルターで営業一覧を絞り込める

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. manager1@test.com でログインして /admin/users を開く
2. 氏名検索欄（プレースホルダ「氏名で検索」）に「山田」を入力する
   - expect: 「山田太郎」の行のみ表示される
   - expect: 「佐藤次郎」は表示されない

3. 氏名検索欄をクリアし、ロールフィルターを「SALES」に変更する
   - expect: SALES ロールのユーザーのみ表示される
   - expect: MANAGER ロールのユーザーは表示されない

#### 2.9. TC-ADM-014: isAdmin でないユーザーが管理者画面にアクセス不可

**File:** `specs/pattern-c/admin.spec.ts`

**Steps:**

1. sales1@test.com でログインして /admin/customers に直接アクセスする
   - expect: アクセス不可（/reports にリダイレクトまたは 403 エラー）
