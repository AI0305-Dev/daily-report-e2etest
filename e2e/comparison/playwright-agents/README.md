# Playwright Test Agents 比較実験

E2Eテストの設計・実装を、Playwright Test Agents（Planner / Generator）にどこまで任せられるかを検証する。

**実験条件**: `docs/test-spec.md`（既存のテスト仕様書）は入力として与えていない。他の設計書（requirements / screen-definition / api-spec / validation / er-diagram）のみを入力に、AIが自律的にテストシナリオを発見できるかを見ている。

## 2パターン

| パターン                  | 入力                       | 想定シナリオ                                                       |
| ------------------------- | -------------------------- | ------------------------------------------------------------------ |
| **Planner①（パターンA）** | 設計書のみ                 | アプリ探索なしでテスト設計を行うケース                             |
| **Planner②（パターンC）** | 設計書＋アプリを実際に探索 | 実装済みアプリを探索しながらテスト設計を行うケース（本命パターン） |

## ディレクトリ構成

```
playwright-agents/
  pattern-a/
    tests/   ← Generator出力（Planner①: 設計書のみパターン）
  pattern-c/
    tests/   ← Generator出力（Planner②: 設計書＋アプリ探索パターン）

docs/specs/
  pattern-a/   ← Planner①出力（テスト計画）
  pattern-c/   ← Planner②出力（テスト計画）
```

## 実行方法

各パターンのテストはパスを指定して個別に実行する（`testDir: ./e2e` 配下のため、パス指定なしだと本体テストも含めて全件実行される）。

```bash
# Planner①（パターンA）
npx playwright test e2e/comparison/playwright-agents/pattern-a/

# Planner②（パターンC）
npx playwright test e2e/comparison/playwright-agents/pattern-c/
```

## 比較対象

同じ日報システムに対する3通りのE2Eテスト設計・実装を並べて比較できる。

| 手法                  | 設計書                      | テストコード                                                 |
| --------------------- | --------------------------- | ------------------------------------------------------------ |
| Claude Code単体       | `docs/test-spec.md`         | `e2e/*.spec.ts`                                              |
| Planner①（パターンA） | `docs/specs/pattern-a/*.md` | `e2e/comparison/playwright-agents/pattern-a/tests/*.spec.ts` |
| Planner②（パターンC） | `docs/specs/pattern-c/*.md` | `e2e/comparison/playwright-agents/pattern-c/tests/*.spec.ts` |
