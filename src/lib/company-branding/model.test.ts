import { describe, expect, it } from "vitest";

import { parseCompanyBrandingFormData } from "./model";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

describe("parseCompanyBrandingFormData", () => {
  it("normalizes valid shared Company Branding input", () => {
    const result = parseCompanyBrandingFormData(
      formData({
        displayName: "  Evergreen Cleaning Services  ",
        logoUrl: " /logos/ecs.svg ",
        primaryBrandColor: " #0F766E ",
        contactPhone: " 555-0100 ",
        contactEmail: " INFO@EXAMPLE.COM ",
        contactWebsite: " https://example.com ",
        contactAddress: " 123 Main St ",
      }),
    );

    expect(result).toEqual({
      ok: true,
      data: {
        displayName: "Evergreen Cleaning Services",
        logoUrl: "/logos/ecs.svg",
        primaryBrandColor: "#0f766e",
        contactPhone: "555-0100",
        contactEmail: "INFO@EXAMPLE.COM",
        contactWebsite: "https://example.com",
        contactAddress: "123 Main St",
      },
    });
  });

  it("treats blank optional report contact fields as null", () => {
    const result = parseCompanyBrandingFormData(
      formData({
        displayName: "Evergreen Cleaning Services",
        logoUrl: " ",
        primaryBrandColor: "#0f766e",
        contactPhone: " ",
        contactEmail: " ",
        contactWebsite: " ",
        contactAddress: " ",
      }),
    );

    expect(result).toEqual({
      ok: true,
      data: {
        displayName: "Evergreen Cleaning Services",
        logoUrl: null,
        primaryBrandColor: "#0f766e",
        contactPhone: null,
        contactEmail: null,
        contactWebsite: null,
        contactAddress: null,
      },
    });
  });

  it("rejects missing display names, invalid colors, and unsafe logo values", () => {
    const result = parseCompanyBrandingFormData(
      formData({
        displayName: " ",
        logoUrl: "//example.com/logo.svg",
        primaryBrandColor: "teal",
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        displayName: "Company display name is required.",
        logoUrl: "Logo must be an http(s) URL or an app-relative path.",
        primaryBrandColor: "Primary brand color must be a hex color like #0f766e.",
      },
      values: {
        displayName: "",
        logoUrl: "//example.com/logo.svg",
        primaryBrandColor: "teal",
        contactPhone: "",
        contactEmail: "",
        contactWebsite: "",
        contactAddress: "",
      },
    });
  });
});
