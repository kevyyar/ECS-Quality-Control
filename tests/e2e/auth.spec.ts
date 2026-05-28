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
  "/setup/area-types",
  "/setup/area-types/55555555-5555-4555-8555-555555555555",
  "/setup/areas",
  "/setup/areas/77777777-7777-4777-8777-777777777777",
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
