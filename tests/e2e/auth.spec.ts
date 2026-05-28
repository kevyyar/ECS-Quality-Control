import { expect, test } from "@playwright/test";

test("internal users can reach the login form", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "Internal login" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

for (const path of [
  "/dashboard",
  "/setup",
  "/internal-users",
  "/company-branding",
  "/inspections/drafts",
  "/inspections/drafts/submit",
  "/tickets/close",
]) {
  test(`unauthenticated users are redirected from ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Internal login" }),
    ).toBeVisible();
  });
}
