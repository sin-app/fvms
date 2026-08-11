import { test, expect } from "@playwright/test";

test.describe("Master Data", () => {
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
