# Pattern C: コメントフロー テスト計画

## Application Overview

日報システムのコメント機能に関するテスト計画。MANAGERによるPROBLEM/PLAN/GENERALコメントの追加、送信後の表示確認、SALESによるコメント閲覧、コメント不可条件（DRAFT・REJECTED・COMPLETED状態）を検証する。アプリ探索によりコメント入力欄のプレースホルダー「コメントを入力」、送信後に入力欄がクリアされる動作を確認済み。

## Test Scenarios

### 1. コメントフロー

**Seed:** `e2e/seed.spec.ts`

#### 1.1. TC-CMT-001: MANAGER が Problem へのコメントを送信する

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. manager1@test.com でログインし、シードの SUBMITTED 日報詳細画面を開く
   - expect: Problem・ Plan・全般のコメント入力欄（「コメントを入力」プレースホルダ）と「送信」ボタンが表示される

2. Problem のコメント入力欄（最初の「コメントを入力」）に「ProblemへのE2Eテストコメント」を入力する
3. 対応する「送信」ボタン（最初の送信）をクリックする
   - expect: 入力欄がクリアされる
   - expect: 「ProblemへのE2Eテストコメント」がコメント一覧に表示される

#### 1.2. TC-CMT-002: MANAGER が Plan へのコメントを送信する

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. manager1@test.com でログインし、シードの SUBMITTED 日報詳細画面を開く
2. Plan のコメント入力欄（中間の「コメントを入力」）に「Planへのテストコメント」を入力し、対応する「送信」ボタンをクリックする
   - expect: 「Planへのテストコメント」が表示される
   - expect: 入力欄がクリアされる

#### 1.3. TC-CMT-003: MANAGER が全般コメント（GENERAL）を送信する

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. manager1@test.com でログインし、シードの SUBMITTED 日報詳細画面を開く
2. 全般コメント入力欄（最後の「コメントを入力」）に「全般テストコメント」を入力し、「送信」ボタンをクリックする
   - expect: 「全般テストコメント」が表示される

#### 1.4. TC-CMT-004: SALES が上長コメントを閲覧できる

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. manager1@test.com でログインし、シードの SUBMITTED 日報詳細画面で Problem にコメント「上長コメント閲覧テスト」を送信する
   - expect: コメントが表示される

2. ログアウトして sales1@test.com でログインし、同じ日報の /reports/[id] にアクセスする
   - expect: 「上長コメント」セクションが表示される
   - expect: 「上長コメント閲覧テスト」テキストが表示される

#### 1.5. TC-CMT-005: コメント本文が空の状態で送信してもエラー - E303

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. manager1@test.com でログインし、SUBMITTED 日報詳細画面を開く
2. Problem のコメント入力欄は空のまま、「送信」ボタンをクリックする
   - expect: 「コメントを入力してください」エラーメッセージが表示される（E303）

#### 1.6. TC-CMT-006: SUBMITTED 以外の日報にはコメント入力欄が表示されない

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. manager1@test.com でログインして /manager/reports を開く
2. ステータスフィルターを「全て」に変更し、COMPLETED 日報の詳細画面を開く
   - expect: コメント入力欄（「コメントを入力」）が表示されない
   - expect: 「送信」ボタンが表示されない

#### 1.7. TC-CMT-007: 差し戻し理由のコメントが SALES の日報詳細に表示される

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. sales1@test.com で日報を提出し、manager1@test.com で理由付き差し戻しを実行する
2. sales1@test.com でログインし差し戻し日報の詳細画面を開く
   - expect: 差し戻し理由として入力したテキストが「上長コメント」として表示される

#### 1.8. TC-CMT-008: SALES はコメント送信不可（MANAGER 画面にアクセスできない）

**File:** `specs/pattern-c/comments.spec.ts`

**Steps:**

1. sales1@test.com でログインしている状態で API エンドポイント POST /api/reports/[id]/comments に直接リクエストを送る
   - expect: 403 エラー（E002）が返される
