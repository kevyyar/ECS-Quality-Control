import { expect, test } from "@playwright/test";

test("home page identifies the scaffold", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Janitorial Quality Control" }),
  ).toBeVisible();
  await expect(page.getByText("Foundation only")).toBeVisible();
});
