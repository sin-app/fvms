import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@fvms.com";
const ADMIN_PASSWORD = "Admin123!";

test.describe("Authentication", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /masuk/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("redirects authenticated user away from login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL(/\/dashboard/);
    await page.goto("/login");
    await page.waitForURL(/\/dashboard/);
  });

  test("shows validation errors on empty form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page.getByText(/email/i).first()).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test("shows dashboard stats", async ({ page }) => {
    await expect(page.getByText(/total jadwal/i)).toBeVisible();
    await expect(page.getByText(/selesai/i)).toBeVisible();
  });

  test("navigates to schedules page", async ({ page }) => {
    await page.goto("/schedules");
    await expect(page.getByRole("heading", { name: /jadwal kunjungan/i })).toBeVisible();
  });
});
