# 日報システム — E2Eテスト設計・実装 3手法比較デモ

営業担当者が日々の顧客訪問記録・課題・翌日計画を報告し、上長が確認・承認するための日報管理システム。
本ブランチは、このアプリに対する **E2Eテストの設計・実装を3つの手法で比較するためのデモ用ブランチ** です（機能追加前のベース状態）。

詳細な要件定義は [`docs/requirements.md`](docs/requirements.md) を参照。

## 3つの手法

同じ日報システムに対して、テスト設計書とテストコードを3通りの方法で用意している。

| 手法                      | 説明                                                                                       | 設計書                                          | テストコード                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Claude Code単体**       | 既存のテスト仕様書をもとに、Claude Codeが直接テストコードを実装                            | [`docs/test-spec.md`](docs/test-spec.md)        | [`e2e/*.spec.ts`](e2e)                                                                                  |
| **Planner①（パターンA）** | Playwright Test Agents の Planner に設計書のみを渡し、アプリ探索なしでテスト計画を自動生成 | [`docs/specs/pattern-a/`](docs/specs/pattern-a) | [`e2e/comparison/playwright-agents/pattern-a/tests/`](e2e/comparison/playwright-agents/pattern-a/tests) |
| **Planner②（パターンC）** | Planner に設計書＋実装済みアプリの探索を許可してテスト計画を自動生成（本命パターン）       | [`docs/specs/pattern-c/`](docs/specs/pattern-c) | [`e2e/comparison/playwright-agents/pattern-c/tests/`](e2e/comparison/playwright-agents/pattern-c/tests) |

比較実験の詳細は [`e2e/comparison/playwright-agents/README.md`](e2e/comparison/playwright-agents/README.md) を参照。

## セットアップ

Docker上のローカルPostgresを使う前提の手順（Windows/Mac）を [`SETUP.md`](SETUP.md) にまとめている。まっさらなPCから始める場合はそちらを参照。

Docker・DBがすでに手元にある場合の最短ルート:

```bash
npm install
cp .env.example .env.local   # AUTH_SECRETを設定（DATABASE_URLはローカルDocker前提のままでOK）
docker compose up -d db
npx prisma generate
npx prisma migrate deploy
```

## テストの実行

```bash
# Claude Code単体（本体テスト）
npx playwright test e2e/auth.spec.ts e2e/reports.spec.ts e2e/approval.spec.ts e2e/comments.spec.ts e2e/admin.spec.ts e2e/password.spec.ts e2e/ui-screens.spec.ts

# Planner①（パターンA）
npx playwright test e2e/comparison/playwright-agents/pattern-a/

# Planner②（パターンC）
npx playwright test e2e/comparison/playwright-agents/pattern-c/
```

## 技術スタック

Next.js 15 (App Router) / TypeScript / Prisma / Auth.js / PostgreSQL（本番はNeon、このデモではDocker上のローカルPostgresを推奨） / Zod / Tailwind CSS + shadcn/ui / Playwright

詳細は [`CLAUDE.md`](CLAUDE.md) を参照。
