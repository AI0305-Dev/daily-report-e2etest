import { test } from "@playwright/test";
import { resetDatabase } from "./fixtures/seed";

test("seed database", async () => {
  await resetDatabase();
});
