# API仕様書 - 日報システム

**バージョン**: 1.1  
**作成日**: 2026-05-19  
**ベースURL**: `/api`

---

## 1. 概要

### 認証方式

Auth.js (NextAuth v5) によるセッション認証。リクエストヘッダーにセッションCookieを含める。

### 共通レスポンス形式

```json
// 成功
{
  "data": { ... }
}

// エラー
{
  "error": {
    "code": "E001",
    "message": "ログインしてください"
  }
}
```

### 共通エラーレスポンス

| ステータス | コード            | 説明                 |
| ---------- | ----------------- | -------------------- |
| 400        | E0xx / E1xx〜E5xx | バリデーションエラー |
| 401        | E001              | 未認証               |
| 403        | E002              | 権限なし             |
| 404        | E003              | リソースが存在しない |
| 500        | E000              | サーバー内部エラー   |

### 権限記号

| 記号    | 意味                    |
| ------- | ----------------------- |
| SALES   | role=SALES のユーザー   |
| MANAGER | role=MANAGER のユーザー |
| ADMIN   | isAdmin=true のユーザー |

---

## 2. 認証API

### POST /auth/signin

ログイン。Auth.js が処理する。

**権限**: 不要

**リクエストボディ**

| フィールド | 型     | 必須 | 説明           |
| ---------- | ------ | ---- | -------------- |
| email      | string | ○    | メールアドレス |
| password   | string | ○    | パスワード     |

```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

**レスポンス**

| ステータス | 説明                                 |
| ---------- | ------------------------------------ |
| 200        | ログイン成功。セッションCookieを付与 |
| 401        | 認証失敗（E104）                     |

---

### POST /auth/signout

ログアウト。Auth.js が処理する。

**権限**: 認証済みユーザー

**レスポンス**: 200（セッション削除）

---

## 3. 日報API

### GET /reports

日報一覧取得。

- SALES: 自分の日報のみ
- MANAGER: 配下営業の日報のみ

**権限**: SALES / MANAGER

**クエリパラメータ**

| パラメータ | 型     | 必須 | 説明                                                                   |
| ---------- | ------ | ---- | ---------------------------------------------------------------------- |
| status     | string | -    | `DRAFT` / `SUBMITTED` / `REJECTED` / `COMPLETED`                       |
| dateFrom   | string | -    | 開始日（ISO8601: `2026-05-01`）                                        |
| dateTo     | string | -    | 終了日（ISO8601: `2026-05-31`）                                        |
| userId     | string | -    | MANAGERのみ有効。配下営業のIDで絞り込み。SALESが指定した場合は無視する |
| page       | number | -    | ページ番号（デフォルト: 1）                                            |
| limit      | number | -    | 1ページあたり件数（デフォルト: 20、最大: 100）                         |

**レスポンス: 200**

```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2026-05-18",
      "status": "SUBMITTED",
      "user": {
        "id": "uuid",
        "name": "山田 太郎"
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### POST /reports

日報作成。

**権限**: SALES

**リクエストボディ**

| フィールド                | 型             | 必須 | 説明                                        |
| ------------------------- | -------------- | ---- | ------------------------------------------- |
| date                      | string         | ○    | 日報の対象日（ISO8601）                     |
| visitRecords              | array          | -    | 訪問記録の配列                              |
| visitRecords[].customerId | string         | ○    | 顧客ID                                      |
| visitRecords[].content    | string         | ○    | 訪問内容（最大1000文字）                    |
| visitRecords[].sortOrder  | number         | ○    | 表示順                                      |
| problem                   | string \| null | -    | 課題・相談（最大2000文字）。省略時は null   |
| plan                      | string \| null | -    | 明日やること（最大2000文字）。省略時は null |
| status                    | string         | ○    | `DRAFT` / `SUBMITTED`                       |

```json
{
  "date": "2026-05-18",
  "visitRecords": [
    {
      "customerId": "uuid",
      "content": "新製品の提案を実施",
      "sortOrder": 1
    }
  ],
  "problem": "〇〇の件について検討が必要",
  "plan": "△△商事へのフォローアップ",
  "status": "DRAFT"
}
```

**レスポンス: 201**

```json
{
  "data": {
    "id": "uuid",
    "date": "2026-05-18",
    "status": "DRAFT",
    "visitRecords": [ ... ],
    "problem": "〇〇の件について検討が必要",
    "plan": "△△商事へのフォローアップ",
    "createdAt": "2026-05-18T09:00:00Z",
    "updatedAt": "2026-05-18T09:00:00Z",
    "lastUpdateId": "uuid"
  }
}
```

**エラー**

| ステータス | コード      | 条件                                  |
| ---------- | ----------- | ------------------------------------- |
| 400        | E202        | 同日の日報がすでに存在する            |
| 400        | E203        | 未来日が指定された                    |
| 400        | E204 / E205 | visitRecords の顧客・訪問内容が未入力 |

---

### GET /reports/:id

日報詳細取得。

**権限**: SALES（自分の日報）/ MANAGER（配下営業の日報）

**レスポンス: 200**

```json
{
  "data": {
    "id": "uuid",
    "date": "2026-05-18",
    "status": "SUBMITTED",
    "user": {
      "id": "uuid",
      "name": "山田 太郎"
    },
    "visitRecords": [
      {
        "id": "uuid",
        "customer": {
          "id": "uuid",
          "name": "株式会社〇〇"
        },
        "content": "新製品の提案を実施",
        "sortOrder": 1
      }
    ],
    "problem": "〇〇の件について検討が必要",
    "plan": "△△商事へのフォローアップ",
    "comments": [
      {
        "id": "uuid",
        "targetField": "PROBLEM",
        "body": "来週までに対応方針を確認してください",
        "author": {
          "id": "uuid",
          "name": "鈴木 部長"
        },
        "createdAt": "2026-05-18T10:00:00Z"
      }
    ],
    "createdAt": "2026-05-18T09:00:00Z",
    "updatedAt": "2026-05-18T09:00:00Z",
    "lastUpdateId": "uuid"
  }
}
```

**エラー**

| ステータス | コード | 条件                                       |
| ---------- | ------ | ------------------------------------------ |
| 403        | E002   | 自分の日報・配下営業の日報以外へのアクセス |
| 404        | E003   | 日報が存在しない                           |

---

### PUT /reports/:id

日報更新。

**権限**: SALES（自分の日報・ステータスが DRAFT または REJECTED のみ）

**リクエストボディ**: POST /reports と同じ（`status` は `DRAFT` / `SUBMITTED` のみ）

**レスポンス: 200**: 更新後の日報オブジェクト

**エラー**

| ステータス | コード | 条件                                                         |
| ---------- | ------ | ------------------------------------------------------------ |
| 400        | E202   | 変更後の日付に別の日報がすでに存在する（自身を除外して判定） |
| 400        | E210   | ステータスが DRAFT / REJECTED 以外                           |
| 403        | E002   | 他ユーザーの日報                                             |
| 404        | E003   | 日報が存在しない                                             |

---

### POST /reports/:id/approve

日報承認。ステータスを `COMPLETED` に変更。

**権限**: MANAGER（配下営業の日報・ステータスが SUBMITTED のみ）

**リクエストボディ**: なし

**レスポンス: 200**

```json
{
  "data": {
    "id": "uuid",
    "status": "COMPLETED"
  }
}
```

**エラー**

| ステータス | コード | 条件                        |
| ---------- | ------ | --------------------------- |
| 400        | E301   | ステータスが SUBMITTED 以外 |
| 403        | E302   | 配下営業以外の日報          |
| 404        | E003   | 日報が存在しない            |

---

### POST /reports/:id/reject

日報差し戻し。ステータスを `REJECTED` に変更。

**権限**: MANAGER（配下営業の日報・ステータスが SUBMITTED のみ）

**リクエストボディ**

| フィールド | 型     | 必須 | 説明                                                                                                                                                         |
| ---------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| reason     | string | -    | 差し戻し理由（最大1000文字）。指定した場合 `targetField: GENERAL` のコメントとして Comment テーブルに保存され、GET /reports/:id の `comments` 配列に含まれる |

```json
{
  "reason": "訪問内容の記載が不十分です"
}
```

**レスポンス: 200**

```json
{
  "data": {
    "id": "uuid",
    "status": "REJECTED"
  }
}
```

**エラー**

| ステータス | コード | 条件                        |
| ---------- | ------ | --------------------------- |
| 400        | E301   | ステータスが SUBMITTED 以外 |
| 400        | E304   | reason が1000文字超         |
| 403        | E302   | 配下営業以外の日報          |
| 404        | E003   | 日報が存在しない            |

---

## 4. コメントAPI

### POST /reports/:id/comments

コメント追加。ステータスが `SUBMITTED` の日報にのみ追加可能。

**権限**: MANAGER（配下営業の日報のみ）

**リクエストボディ**

| フィールド  | 型     | 必須 | 説明                           |
| ----------- | ------ | ---- | ------------------------------ |
| targetField | string | ○    | `PROBLEM` / `PLAN` / `GENERAL` |
| body        | string | ○    | コメント本文（最大1000文字）   |

```json
{
  "targetField": "PROBLEM",
  "body": "来週までに対応方針を確認してください"
}
```

**レスポンス: 201**

```json
{
  "data": {
    "id": "uuid",
    "targetField": "PROBLEM",
    "body": "来週までに対応方針を確認してください",
    "author": {
      "id": "uuid",
      "name": "鈴木 部長"
    },
    "createdAt": "2026-05-18T10:00:00Z"
  }
}
```

**エラー**

| ステータス | コード | 条件                              |
| ---------- | ------ | --------------------------------- |
| 400        | E303   | body が空                         |
| 400        | E304   | body が1000文字超                 |
| 400        | E305   | 日報のステータスが SUBMITTED 以外 |
| 403        | E302   | 配下営業以外の日報                |
| 404        | E003   | 日報が存在しない                  |

---

## 5. 顧客マスタAPI

### GET /customers

顧客一覧取得。`isDeleted: false` のみ返す。

**権限**: SALES / MANAGER / ADMIN

**クエリパラメータ**

| パラメータ | 型     | 必須 | 説明                                           |
| ---------- | ------ | ---- | ---------------------------------------------- |
| name       | string | -    | 顧客名（部分一致）                             |
| page       | number | -    | ページ番号（デフォルト: 1）                    |
| limit      | number | -    | 1ページあたり件数（デフォルト: 20、最大: 100） |

**レスポンス: 200**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "株式会社〇〇",
      "address": "東京都〇〇区",
      "note": null
    }
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### POST /customers

顧客作成。

**権限**: ADMIN

**リクエストボディ**

| フィールド | 型             | 必須 | 説明                                |
| ---------- | -------------- | ---- | ----------------------------------- |
| name       | string         | ○    | 顧客名（最大100文字）               |
| address    | string \| null | -    | 住所（最大200文字）。省略時は null  |
| note       | string \| null | -    | 備考（最大1000文字）。省略時は null |

```json
{
  "name": "株式会社〇〇",
  "address": "東京都〇〇区",
  "note": null
}
```

**レスポンス: 201**: 作成した顧客オブジェクト

**エラー**

| ステータス | コード     | 条件       |
| ---------- | ---------- | ---------- |
| 400        | E401       | name が空  |
| 400        | E402〜E404 | 文字数超過 |

---

### GET /customers/:id

顧客詳細取得。編集フォームの既存データロード用。

**権限**: ADMIN

**レスポンス: 200**

```json
{
  "data": {
    "id": "uuid",
    "name": "株式会社〇〇",
    "address": "東京都〇〇区",
    "note": null
  }
}
```

**エラー**

| ステータス | コード | 条件                        |
| ---------- | ------ | --------------------------- |
| 404        | E003   | 顧客が存在しない / 削除済み |

---

### PUT /customers/:id

顧客更新。

**権限**: ADMIN

**リクエストボディ**: POST /customers と同じ

**レスポンス: 200**: 更新後の顧客オブジェクト

**エラー**

| ステータス | コード | 条件                        |
| ---------- | ------ | --------------------------- |
| 404        | E003   | 顧客が存在しない / 削除済み |

---

### DELETE /customers/:id

顧客削除（論理削除）。`isDeleted: true` に更新。

**権限**: ADMIN

**レスポンス: 200**

```json
{
  "data": {
    "id": "uuid"
  }
}
```

**エラー**

| ステータス | コード | 条件             |
| ---------- | ------ | ---------------- |
| 400        | E405   | すでに削除済み   |
| 404        | E003   | 顧客が存在しない |

---

## 6. 営業マスタAPI

### GET /users

ユーザー一覧取得。`isDeleted: false` のみ返す。

**権限**: ADMIN

**クエリパラメータ**

| パラメータ | 型     | 必須 | 説明                                           |
| ---------- | ------ | ---- | ---------------------------------------------- |
| name       | string | -    | 氏名（部分一致）                               |
| role       | string | -    | `SALES` / `MANAGER`                            |
| page       | number | -    | ページ番号（デフォルト: 1）                    |
| limit      | number | -    | 1ページあたり件数（デフォルト: 20、最大: 100） |

**レスポンス: 200**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "山田 太郎",
      "email": "yamada@example.com",
      "role": "SALES",
      "isAdmin": false,
      "manager": {
        "id": "uuid",
        "name": "鈴木 部長"
      }
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### POST /users

ユーザー作成。初期パスワードを自動発行。

**権限**: ADMIN

**リクエストボディ**

| フィールド | 型      | 必須       | 説明                                                                 |
| ---------- | ------- | ---------- | -------------------------------------------------------------------- |
| name       | string  | ○          | 氏名（最大50文字）                                                   |
| email      | string  | ○          | メールアドレス（最大254文字・一意）                                  |
| role       | string  | ○          | `SALES` / `MANAGER`                                                  |
| isAdmin    | boolean | ○          | 管理者フラグ                                                         |
| managerId  | string  | ○（SALES） | 上長のユーザーID。role=SALES の場合は必須、role=MANAGER の場合は無視 |

```json
{
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "role": "SALES",
  "isAdmin": false,
  "managerId": "uuid"
}
```

**レスポンス: 201**

```json
{
  "data": {
    "id": "uuid",
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "role": "SALES",
    "isAdmin": false,
    "initialPassword": "Xxxx0000"
  }
}
```

> `initialPassword` はこのレスポンスのみ返す。DB にはハッシュ化して保存。生成ルール: 8文字以上・英字と数字を両方含む（ランダム生成）。

**エラー**

| ステータス | コード     | 条件                               |
| ---------- | ---------- | ---------------------------------- |
| 400        | E501〜E509 | 必須・形式・文字数エラー           |
| 400        | E505       | メールアドレスが重複               |
| 400        | E509       | role=SALES かつ managerId が未指定 |

---

### GET /users/:id

ユーザー詳細取得。編集フォームの既存データロード用。

**権限**: ADMIN

**レスポンス: 200**

```json
{
  "data": {
    "id": "uuid",
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "role": "SALES",
    "isAdmin": false,
    "manager": {
      "id": "uuid",
      "name": "鈴木 部長"
    }
  }
}
```

**エラー**

| ステータス | コード | 条件                            |
| ---------- | ------ | ------------------------------- |
| 404        | E003   | ユーザーが存在しない / 削除済み |

---

### PUT /users/:id

ユーザー更新。

**権限**: ADMIN

**リクエストボディ**: `name` / `role` / `isAdmin` / `managerId`（`email` は変更不可）

> `role` を `MANAGER` に変更した場合、`managerId` は `null` に更新する（フロント側で送信しなくてもバックエンドで自動クリア）。`role=SALES` かつ `managerId` 未指定の場合は E509 エラー。

**レスポンス: 200**: 更新後のユーザーオブジェクト（`initialPassword` なし）

**エラー**

| ステータス | コード | 条件                            |
| ---------- | ------ | ------------------------------- |
| 404        | E003   | ユーザーが存在しない / 削除済み |

---

### DELETE /users/:id

ユーザー削除（論理削除）。`isDeleted: true` に更新。

**権限**: ADMIN

**レスポンス: 200**

```json
{
  "data": {
    "id": "uuid"
  }
}
```

**エラー**

| ステータス | コード | 条件                                   |
| ---------- | ------ | -------------------------------------- |
| 400        | E508   | すでに削除済み                         |
| 400        | E510   | 自分自身のアカウントを削除しようとした |
| 400        | E511   | 削除するとMANAGERが存在しなくなる      |
| 404        | E003   | ユーザーが存在しない                   |

---

### POST /users/:id/reset-password

パスワードリセット。新しい初期パスワードを自動発行する。

**権限**: ADMIN

**リクエストボディ**: なし

**レスポンス: 200**

```json
{
  "data": {
    "initialPassword": "Xxxx0000"
  }
}
```

> `initialPassword` はこのレスポンスのみ返す。DB にはハッシュ化して保存。生成ルール: 8文字以上・英字と数字を両方含む（ランダム生成）。

**エラー**

| ステータス | コード | 条件                            |
| ---------- | ------ | ------------------------------- |
| 404        | E003   | ユーザーが存在しない / 削除済み |

---

## 7. パスワード変更API

### PUT /users/me/password

ログイン中のユーザー自身のパスワードを変更する。

**権限**: 認証済みユーザー（全ロール）

**リクエストボディ**

| フィールド      | 型     | 必須 | 説明                                      |
| --------------- | ------ | ---- | ----------------------------------------- |
| currentPassword | string | ○    | 現在のパスワード                          |
| newPassword     | string | ○    | 新しいパスワード（8文字以上・英数字混在） |
| confirmPassword | string | ○    | 新しいパスワード（確認用）                |

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456",
  "confirmPassword": "NewPass456"
}
```

**レスポンス: 200**

```json
{
  "data": {
    "message": "パスワードを変更しました"
  }
}
```

**エラー**

| ステータス | コード      | 条件                                                             |
| ---------- | ----------- | ---------------------------------------------------------------- |
| 400        | E601        | currentPassword が未入力                                         |
| 400        | E602        | currentPassword が現在のパスワードと一致しない                   |
| 400        | E603        | newPassword が未入力                                             |
| 400        | E604 / E605 | newPassword がポリシーを満たさない（8文字未満 / 英数字混在なし） |
| 400        | E606        | confirmPassword が未入力                                         |
| 400        | E607        | confirmPassword が newPassword と不一致                          |

---

## 8. エンドポイント一覧

| メソッド | パス                        | 説明                                      | 権限                    |
| -------- | --------------------------- | ----------------------------------------- | ----------------------- |
| POST     | `/auth/signin`              | ログイン                                  | -                       |
| POST     | `/auth/signout`             | ログアウト                                | 認証済み                |
| GET      | `/reports`                  | 日報一覧                                  | SALES / MANAGER         |
| POST     | `/reports`                  | 日報作成                                  | SALES                   |
| GET      | `/reports/:id`              | 日報詳細                                  | SALES / MANAGER         |
| PUT      | `/reports/:id`              | 日報更新・提出（status=SUBMITTED で提出） | SALES                   |
| POST     | `/reports/:id/approve`      | 日報承認                                  | MANAGER                 |
| POST     | `/reports/:id/reject`       | 日報差し戻し                              | MANAGER                 |
| POST     | `/reports/:id/comments`     | コメント追加                              | MANAGER                 |
| GET      | `/customers`                | 顧客一覧                                  | SALES / MANAGER / ADMIN |
| POST     | `/customers`                | 顧客作成                                  | ADMIN                   |
| GET      | `/customers/:id`            | 顧客詳細                                  | ADMIN                   |
| PUT      | `/customers/:id`            | 顧客更新                                  | ADMIN                   |
| DELETE   | `/customers/:id`            | 顧客削除                                  | ADMIN                   |
| GET      | `/users`                    | ユーザー一覧                              | ADMIN                   |
| POST     | `/users`                    | ユーザー作成                              | ADMIN                   |
| GET      | `/users/:id`                | ユーザー詳細                              | ADMIN                   |
| PUT      | `/users/:id`                | ユーザー更新                              | ADMIN                   |
| DELETE   | `/users/:id`                | ユーザー削除                              | ADMIN                   |
| POST     | `/users/:id/reset-password` | パスワードリセット                        | ADMIN                   |
| PUT      | `/users/me/password`        | パスワード変更                            | 認証済み                |
