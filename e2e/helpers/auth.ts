import { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password = "password123") {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.waitForURL(/\/(reports|manager\/reports)/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
  await page.waitForURL("/login");
}
