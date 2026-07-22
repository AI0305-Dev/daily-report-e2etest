import { test } from "@playwright/test";
import { resetDatabase } from "./fixtures/seed";

test("seed database", async ({ page }) => {
  await resetDatabase();
  await page.goto("http://localhost:3000");
});
