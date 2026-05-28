import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, selectLimit, insertValues, insertReturning } = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  selectLimit: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/db/client", () => ({ db }));

const { COMPANY_BRANDING_SINGLETON_KEY, DEFAULT_COMPANY_BRANDING } = await import(
  "./model"
);
const { getCompanyBranding, upsertCompanyBranding } = await import(
  "./repository"
);

const savedRow = {
  singletonKey: COMPANY_BRANDING_SINGLETON_KEY,
  displayName: "Evergreen Cleaning Services",
  logoUrl: "/logos/ecs.svg",
  primaryBrandColor: "#0f766e",
  contactPhone: "555-0100",
  contactEmail: "info@example.com",
  contactWebsite: "https://example.com",
  contactAddress: "123 Main St",
  createdAt: new Date("2026-05-28T00:00:00Z"),
  updatedAt: new Date("2026-05-28T00:00:00Z"),
};

describe("Company Branding repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const selectWhere = vi.fn(() => ({ limit: selectLimit }));
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select.mockReturnValue({ from: selectFrom });

    const onConflictDoUpdate = vi.fn(() => ({ returning: insertReturning }));
    insertValues.mockReturnValue({ onConflictDoUpdate });
    db.insert.mockReturnValue({ values: insertValues });
  });

  it("returns default shared branding before a Supervisor has saved a record", async () => {
    selectLimit.mockResolvedValueOnce([]);

    await expect(getCompanyBranding()).resolves.toEqual(
      DEFAULT_COMPANY_BRANDING,
    );
  });

  it("upserts only the singleton Company Branding record", async () => {
    insertReturning.mockResolvedValueOnce([savedRow]);

    await expect(
      upsertCompanyBranding({
        displayName: "Evergreen Cleaning Services",
        logoUrl: "/logos/ecs.svg",
        primaryBrandColor: "#0f766e",
        contactPhone: "555-0100",
        contactEmail: "info@example.com",
        contactWebsite: "https://example.com",
        contactAddress: "123 Main St",
      }),
    ).resolves.toEqual({
      displayName: "Evergreen Cleaning Services",
      logoUrl: "/logos/ecs.svg",
      primaryBrandColor: "#0f766e",
      contactPhone: "555-0100",
      contactEmail: "info@example.com",
      contactWebsite: "https://example.com",
      contactAddress: "123 Main St",
    });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        singletonKey: COMPANY_BRANDING_SINGLETON_KEY,
        displayName: "Evergreen Cleaning Services",
      }),
    );
    expect(insertValues).not.toHaveBeenCalledWith(
      expect.objectContaining({ clientId: expect.anything() }),
    );
  });
});
