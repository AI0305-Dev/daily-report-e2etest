# Specs

Playwright Test Agentsのテスト計画ファイル（Planner出力）を格納するディレクトリ。

## ディレクトリ構成

```
docs/specs/
  pattern-a/   ← Planner①: 設計書のみでPlanner実行（アプリ探索なし）
  pattern-c/   ← Planner②: 設計書＋アプリ探索でPlanner実行（本命パターン）
```

生成されたテストコード（Generator出力）は `e2e/comparison/playwright-agents/` 以下に格納する。

## 実験詳細

→ `e2e/comparison/playwright-agents/README.md` を参照
