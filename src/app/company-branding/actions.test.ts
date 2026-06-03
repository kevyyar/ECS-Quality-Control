import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  uploadCompanyLogo,
  upsertCompanyBranding,
  validateCompanyLogoFile,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  uploadCompanyLogo: vi.fn(),
  upsertCompanyBranding: vi.fn(),
  validateCompanyLogoFile: vi.fn((file: File) => {
    if (file.size > 2_000_000) {
      return "Logo file must be 2 MB or smaller.";
    }

    return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ? null
      : "Logo file must be a PNG, JPG, or WEBP image.";
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/company-branding/repository", () => ({
  upsertCompanyBranding,
}));
vi.mock("@/lib/company-branding/logo-storage", () => ({
  uploadCompanyLogo,
  validateCompanyLogoFile,
}));

const { saveCompanyBranding } = await import("./actions");

function formData(values: Record<string, string | File>): FormData {
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
    validateCompanyLogoFile.mockImplementation((file: File) => {
      if (file.size > 2_000_000) {
        return "Logo file must be 2 MB or smaller.";
      }

      return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
        ? null
        : "Logo file must be a PNG, JPG, or WEBP image.";
    });
    uploadCompanyLogo.mockResolvedValue("https://storage.example/company-branding/logos/ecs.png");
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

  it("uploads a selected Company Branding logo file before persisting", async () => {
    const logoFile = new File(["png"], "ecs.png", { type: "image/png" });

    await expect(
      saveCompanyBranding(
        { status: "idle" },
        formData({
          displayName: "Evergreen Cleaning Services",
          logoUrl: "/logos/old.svg",
          logoFile,
          primaryBrandColor: "#0f766e",
        }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Company Branding saved.",
    });

    expect(uploadCompanyLogo).toHaveBeenCalledWith(logoFile);
    expect(upsertCompanyBranding).toHaveBeenCalledWith(
      expect.objectContaining({
        logoUrl: "https://storage.example/company-branding/logos/ecs.png",
      }),
    );
  });

  it("clears an existing Company Branding logo when requested", async () => {
    await expect(
      saveCompanyBranding(
        { status: "idle" },
        formData({
          displayName: "Evergreen Cleaning Services",
          logoUrl: "https://storage.example/company-branding/logos/old.png",
          removeCurrentLogo: "true",
          primaryBrandColor: "#0f766e",
        }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Company Branding saved.",
    });

    expect(uploadCompanyLogo).not.toHaveBeenCalled();
    expect(upsertCompanyBranding).toHaveBeenCalledWith(
      expect.objectContaining({ logoUrl: null }),
    );
  });

  it("returns a field error without saving an unsupported logo file", async () => {
    await expect(
      saveCompanyBranding(
        { status: "idle" },
        formData({
          displayName: "Evergreen Cleaning Services",
          logoUrl: "/logos/old.svg",
          logoFile: new File(["not an image"], "logo.txt", { type: "text/plain" }),
          primaryBrandColor: "#0f766e",
        }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {
        logoUrl: "Logo file must be a PNG, JPG, or WEBP image.",
      },
      values: {
        displayName: "Evergreen Cleaning Services",
        logoUrl: "/logos/old.svg",
        primaryBrandColor: "#0f766e",
        contactPhone: "",
        contactEmail: "",
        contactWebsite: "",
        contactAddress: "",
      },
    });

    expect(uploadCompanyLogo).not.toHaveBeenCalled();
    expect(upsertCompanyBranding).not.toHaveBeenCalled();
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
