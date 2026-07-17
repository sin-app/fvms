import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@fvms.com";
const ADMIN_PASSWORD = "Admin123!";

test.describe("Schedules", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test("shows schedule list page", async ({ page }) => {
    await page.goto("/schedules");
    await expect(page.getByRole("heading", { name: /jadwal kunjungan/i })).toBeVisible();
  });

  test("shows calendar view", async ({ page }) => {
    await page.goto("/schedules/calendar");
    await expect(page.getByRole("heading", { name: /kalender kunjungan/i })).toBeVisible();
  });

  test("can filter schedules by status", async ({ page }) => {
    await page.goto("/schedules");
    await page.locator("select").first().selectOption("pending");
    await page.waitForTimeout(500);
  });

  test("navigates to import page", async ({ page }) => {
    await page.goto("/import");
    await expect(page.getByRole("heading", { name: /import excel/i })).toBeVisible();
  });

  test("navigates to reports page", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: /laporan/i })).toBeVisible();
  });
});
