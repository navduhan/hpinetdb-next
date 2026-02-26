import { test, expect } from "@playwright/test";

test("home to plants navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("About HPInet")).toBeVisible();
  await page.goto("/plants?id=1");
  await expect(page.getByText("Host-Pathogen Selection")).toBeVisible();
});
