import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // このブランチはデモ用（実バグ検出目的ではなく安定実行が目的）のため、
  // ローカルでも既定でリトライする。回帰調査で無効化したい場合は PW_RETRIES=0 を指定する
  retries: Number(process.env.PW_RETRIES ?? 2),
  workers: 1,
  timeout: 60_000,
  expect: {
    // リモートDB(Neon)への往復に数百ms単位でかかるため、デフォルト5000msだと
    // タイムアウトぎりぎりで落ちることがある。余裕を持たせる
    timeout: 15_000,
  },
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
