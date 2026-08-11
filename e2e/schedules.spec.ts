import { test, expect } from "@playwright/test";

test.describe("Schedules", () => {
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
    const statusSelect = page
      .getByRole("combobox")
      .filter({ has: page.locator('option[value="pending"]') });
    await statusSelect.selectOption("pending");
    await expect(statusSelect).toHaveValue("pending");
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
