import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, requireProtectedAction, upsertCompanyBranding } =
  vi.hoisted(() => ({
    revalidatePath: vi.fn(),
    requireProtectedAction: vi.fn(),
    upsertCompanyBranding: vi.fn(),
  }));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/company-branding/repository", () => ({
  upsertCompanyBranding,
}));

const { saveCompanyBranding } = await import("./actions");

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

describe("saveCompanyBranding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue({
      authUserId: "auth-user-id",
      email: "supervisor@example.com",
      capabilities: ["supervisor"],
    });
    upsertCompanyBranding.mockImplementation(async (branding) => branding);
  });

  it("requires Supervisor branding capability before saving", async () => {
    await saveCompanyBranding(
      { status: "idle" },
      formData({
        displayName: "Evergreen Cleaning Services",
        logoUrl: "/logos/ecs.svg",
        primaryBrandColor: "#0f766e",
      }),
    );

    expect(requireProtectedAction).toHaveBeenCalledWith("configureBranding");
  });

  it("does not persist when the branding capability check fails", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      saveCompanyBranding(
        { status: "idle" },
        formData({
          displayName: "Evergreen Cleaning Services",
          primaryBrandColor: "#0f766e",
        }),
      ),
    ).rejects.toThrow("redirect:/forbidden");

    expect(upsertCompanyBranding).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("persists normalized Company Branding and revalidates the Company Branding page", async () => {
    await expect(
      saveCompanyBranding(
        { status: "idle" },
        formData({
          displayName: " Evergreen Cleaning Services ",
          logoUrl: " /logos/ecs.svg ",
          primaryBrandColor: " #0F766E ",
          contactPhone: " 555-0100 ",
          contactEmail: " info@example.com ",
          contactWebsite: " https://example.com ",
          contactAddress: " 123 Main St ",
        }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Company Branding saved.",
    });

    expect(upsertCompanyBranding).toHaveBeenCalledWith({
      displayName: "Evergreen Cleaning Services",
      logoUrl: "/logos/ecs.svg",
      primaryBrandColor: "#0f766e",
      contactPhone: "555-0100",
      contactEmail: "info@example.com",
      contactWebsite: "https://example.com",
      contactAddress: "123 Main St",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/company-branding");
  });

  it("returns validation errors without saving invalid branding", async () => {
    await expect(
      saveCompanyBranding(
        { status: "idle" },
        formData({
          displayName: "",
          primaryBrandColor: "green",
        }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {
        displayName: "Company display name is required.",
        primaryBrandColor: "Primary brand color must be a hex color like #0f766e.",
      },
      values: {
        displayName: "",
        logoUrl: "",
        primaryBrandColor: "green",
        contactPhone: "",
        contactEmail: "",
        contactWebsite: "",
        contactAddress: "",
      },
    });

    expect(upsertCompanyBranding).not.toHaveBeenCalled();
  });
});
