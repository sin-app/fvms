import { test, expect } from "@playwright/test";

test.describe("Notifications", () => {
  test("navigates to notifications via sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /notifikasi/i }).click();
    await page.waitForURL(/\/notifications/);
    await expect(page.getByRole("heading", { name: /notifikasi/i })).toBeVisible();
  });

  test("navigates to notification page", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /notifikasi/i })).toBeVisible();
  });
});
