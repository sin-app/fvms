import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@fvms.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin123!";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default async function globalSetup() {
  mkdirSync("e2e/.auth", { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /masuk/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: "e2e/.auth/admin.json" });
  await browser.close();
}
