# 日報システム - プロジェクト概要

## システム概要

営業担当者が日々の顧客訪問記録・課題・翌日計画を報告し、上長が確認・承認するための日報管理システム。

### 詳細な要件定義

@docs/requirements.md

---

## 技術スタック

| カテゴリ         | 技術                                                  |
| ---------------- | ----------------------------------------------------- |
| Framework        | Next.js 15 (App Router)                               |
| 言語             | TypeScript 5.x                                        |
| ORM              | Prisma 6.x                                            |
| 認証             | Auth.js (NextAuth v5)                                 |
| DB               | PostgreSQL on Neon                                    |
| バリデーション   | Zod                                                   |
| APIスキーマ      | @asteasolutions/zod-to-openapi（OpenAPI 3.0自動生成） |
| UI               | Tailwind CSS + shadcn/ui                              |
| 単体・統合テスト | Vitest                                                |
| E2Eテスト        | Playwright                                            |
| コンテナ         | Docker                                                |
| デプロイ         | Google Cloud Run                                      |

---

## ロール

| ロール / フラグ         | 権限                                                  |
| ----------------------- | ----------------------------------------------------- |
| 営業（role: SALES）     | 日報の作成・提出・修正                                |
| 上長（role: MANAGER）   | 配下営業の日報を承認・差し戻し・コメント（1階層のみ） |
| 管理者（isAdmin: true） | 顧客マスタ・営業マスタのCRUD。上長との兼務可          |

---

## 日報ステータス遷移

```
[下書き] → (提出) → [提出済] → (承認) → [完了]
                          ↓
                       (差し戻し)
                          ↓
                       [差し戻し] → (修正・再提出) → [提出済]
```

---

## APIスキーマ方針

- 各Route HandlerのリクエストはZodスキーマで検証する
- `@asteasolutions/zod-to-openapi` でOpenAPI 3.0仕様を自動生成する
- `/api/docs` でOpenAPI JSONを配信、Swagger UIで閲覧可能にする

---

## テスト方針

| 種別       | ツール     | 対象                                           |
| ---------- | ---------- | ---------------------------------------------- |
| 単体テスト | Vitest     | バリデーションロジック、ユーティリティ関数     |
| 統合テスト | Vitest     | APIエンドポイント（DBありで検証）              |
| E2Eテスト  | Playwright | ログイン・日報提出・承認フローなど主要画面操作 |

---

## データモデル（概要）

### 主要テーブル

- **User**: 社員ID・氏名・メール・パスワード・ロール・上長FK
- **Customer**: 顧客ID・顧客名・住所・備考（論理削除あり）
- **DailyReport**: 日報ID・userId・日付・problem・plan・status
- **VisitRecord**: 日報ID・顧客ID・訪問内容・表示順
- **Comment**: 日報ID・authorId・対象フィールド・本文

---

## 画面設計

@docs/screen-definition.md

## ER図

@docs/er-diagram.md

## API設計

@docs/api-spec.md

## バリデーション

@docs/validation.md

## テスト仕様書

@docs/test-spec.md
