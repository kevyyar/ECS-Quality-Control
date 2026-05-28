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
  "/setup/clients",
  "/setup/clients/11111111-1111-4111-8111-111111111111",
  "/setup/buildings",
  "/setup/buildings/33333333-3333-4333-8333-333333333333",
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
