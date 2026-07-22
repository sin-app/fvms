import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@fvms.com";
const ADMIN_PASSWORD = "Admin123!";

test.describe("Master Data", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test("shows kabupaten page", async ({ page }) => {
    await page.goto("/master-data/kabupaten");
    await expect(page.getByRole("heading", { name: /kabupaten/i })).toBeVisible();
  });

  test("shows kecamatan page", async ({ page }) => {
    await page.goto("/master-data/kecamatan");
    await expect(page.getByRole("heading", { name: /kecamatan/i })).toBeVisible();
  });

  test("shows desa page", async ({ page }) => {
    await page.goto("/master-data/desa");
    await expect(page.getByRole("heading", { name: /desa/i })).toBeVisible();
  });
});
