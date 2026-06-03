import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

const { validateCompanyLogoFile } = await import("./logo-storage");

describe("Company Branding logo storage", () => {
  it("rejects SVG logo uploads because public SVGs are not sanitized", () => {
    const svg = new File(["<svg />"], "logo.svg", { type: "image/svg+xml" });

    expect(validateCompanyLogoFile(svg)).toBe(
      "Logo file must be a PNG, JPG, or WEBP image.",
    );
  });

  it("accepts raster logo uploads within the size limit", () => {
    const png = new File(["png"], "logo.png", { type: "image/png" });

    expect(validateCompanyLogoFile(png)).toBeNull();
  });
});
