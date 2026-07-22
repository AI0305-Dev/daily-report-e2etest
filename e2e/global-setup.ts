import { config } from "dotenv";

config({ path: ".env.local" });

import { resetDatabase } from "./fixtures/seed";

export default async function globalSetup() {
  await resetDatabase();
}
