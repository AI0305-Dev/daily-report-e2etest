# セットアップ手順（まっさらなPCでE2Eテストを動かす）

このリポジトリは日報システム（エンハンス前のベース状態）に対する3つのE2Eテスト設計・実装手法の比較デモです。詳細は [`README.md`](README.md) を参照してください。

DBはこのリポジトリに同梱の `docker-compose.yml` でローカルPostgresを起動する前提でまとめています（Neonなど他のPostgreSQLアカウントを新たに用意する必要はありません）。

---

## 必要なもの（共通）

| ツール          | バージョン目安 | 用途                         |
| --------------- | -------------- | ---------------------------- |
| Git             | 最新           | リポジトリの取得             |
| Node.js         | 20.x LTS       | アプリの実行・テスト         |
| Docker Desktop  | 最新           | ローカルPostgresの起動       |
| Claude Code CLI | 最新（任意）   | セットアップ・テストの自動化 |

---

## Windows での手順

### 1. 必要なツールをインストール

PowerShell（管理者権限）で:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
```

インストール後、Docker Desktopを起動し、WSL2バックエンドの初期化が終わるまで待つ。

### 2. （任意）Claude Code CLIをインストール

Node.jsのインストール直後は現在のPowerShellにPATHが反映されていないことがあるため、**新しいPowerShellウィンドウ**を開いて実行する:

```powershell
npm install -g @anthropic-ai/claude-code
```

初回起動時にブラウザでのログインを求められる:

```powershell
claude
```

ログインが完了すればセットアップ完了。以降はこのリポジトリのディレクトリで `claude` を起動すれば利用できる。

### 3. リポジトリを取得

```powershell
git clone https://github.com/AI0305-Dev/daily-report-e2etest.git
cd daily-report-e2etest
```

### 4. 環境変数ファイルを作成

```powershell
Copy-Item .env.example .env.local
```

`.env.local` の `AUTH_SECRET` を適当なランダム文字列に変更する（`DATABASE_URL` はDocker前提のためそのままでよい）。

### 5. ローカルPostgresを起動

```powershell
docker compose up -d db
```

### 6. 依存関係のインストールとDBセットアップ

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
```

### 7. Playwrightのブラウザをインストール

```powershell
npx playwright install --with-deps chromium
```

### 8. E2Eテストを実行

```powershell
# Claude Code単体（本体テスト）
npx playwright test e2e/auth.spec.ts e2e/reports.spec.ts e2e/approval.spec.ts e2e/comments.spec.ts e2e/admin.spec.ts e2e/password.spec.ts e2e/ui-screens.spec.ts

# Planner①（パターンA）
npx playwright test e2e/comparison/playwright-agents/pattern-a/

# Planner②（パターンC）
npx playwright test e2e/comparison/playwright-agents/pattern-c/
```

---

## Mac での手順

### 1. 必要なツールをインストール

ターミナルで（[Homebrew](https://brew.sh/) が未導入なら先にインストール）:

```bash
brew install git node@20 --cask docker
```

Docker Desktopを起動し、初期化が終わるまで待つ。

### 2. （任意）Claude Code CLIをインストール

```bash
npm install -g @anthropic-ai/claude-code
```

初回起動時にブラウザでのログインを求められる:

```bash
claude
```

ログインが完了すればセットアップ完了。以降はこのリポジトリのディレクトリで `claude` を起動すれば利用できる。

### 3. リポジトリを取得

```bash
git clone https://github.com/AI0305-Dev/daily-report-e2etest.git
cd daily-report-e2etest
```

### 4. 環境変数ファイルを作成

```bash
cp .env.example .env.local
```

`.env.local` の `AUTH_SECRET` を適当なランダム文字列に変更する（生成例: `openssl rand -base64 32`）。`DATABASE_URL` はDocker前提のためそのままでよい。

### 5. ローカルPostgresを起動

```bash
docker compose up -d db
```

### 6. 依存関係のインストールとDBセットアップ

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

### 7. Playwrightのブラウザをインストール

```bash
npx playwright install --with-deps chromium
```

### 8. E2Eテストを実行

```bash
# Claude Code単体（本体テスト）
npx playwright test e2e/auth.spec.ts e2e/reports.spec.ts e2e/approval.spec.ts e2e/comments.spec.ts e2e/admin.spec.ts e2e/password.spec.ts e2e/ui-screens.spec.ts

# Planner①（パターンA）
npx playwright test e2e/comparison/playwright-agents/pattern-a/

# Planner②（パターンC）
npx playwright test e2e/comparison/playwright-agents/pattern-c/
```

---

## Claude Codeに任せる場合

上記の手順をすべて自分で打つ代わりに、Claude Codeに一括で指示することもできる。ポイントは「何を達成したいか」と「制約（Dockerを使う・Neonは不要）」を伝えること。

### 初回セットアップを丸ごと任せる場合

```
このリポジトリ（daily-report-e2etest）をセットアップして、E2Eテストが実行できる状態にしてください。
SETUP.mdの手順に従い、DBはdocker-compose.ymlのローカルPostgresを使ってください
（Neonなど外部DBは使わない）。.env.localが無ければ.env.exampleからコピーして作成し、
AUTH_SECRETはランダムな文字列を生成して設定してください。
完了したら3系統のE2Eテスト（Claude Code単体／Planner①／Planner②）を実行し、
結果をまとめて報告してください。
```

### セットアップ済みで、テストだけ実行してほしい場合

```
README.mdの「テストの実行」セクションにある3系統のE2Eテストを順番に実行し、
それぞれの成功/失敗件数を表にまとめて報告してください。
```

### 失敗したときに調査してほしい場合

```
さきほどのE2Eテストで失敗した◯◯を、実際にブラウザを操作して手動で再現できるか確認し、
アプリ側のバグかテストの実行タイミングの問題かを切り分けてください。
```

### 補足

- Claude Codeはコマンド実行の許可を求めてくることがある。`npm install` や `npx playwright test` など初回セットアップに必要な操作は許可してよい
- Dockerが起動していないと `docker compose up -d db` が失敗する。Docker Desktopが起動済みか確認するよう指示に含めてもよい
- テストが不安定な場合は、`playwright.config.ts` の `retries` 設定（既定でリトライする構成になっている）に任せてよい
