import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@fvms.com";
const ADMIN_PASSWORD = "Admin123!";

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test("shows reports page with filters and stats", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: /laporan/i })).toBeVisible();
    await expect(page.getByLabel(/kabupaten/i)).toBeVisible();
  });

  test("can filter by date range", async ({ page }) => {
    await page.goto("/reports");
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();
    await expect(dateInputs.nth(1)).toBeVisible();
  });

  test("shows download buttons", async ({ page }) => {
    await page.goto("/reports");
    await page.waitForTimeout(1000);
    const buttons = page.getByRole("button", { name: /download/i });
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("shows kabupaten dropdown", async ({ page }) => {
    await page.goto("/reports");
    const kabSelect = page.locator("select").first();
    await expect(kabSelect).toBeVisible();
  });
});
