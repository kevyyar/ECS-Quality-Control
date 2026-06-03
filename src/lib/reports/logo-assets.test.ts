import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
}));

const { loadReportLogoAsset } = await import("./logo-assets");

describe("loadReportLogoAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    readFileMock.mockResolvedValue(Buffer.from("local logo"));
  });

  it("loads app-relative logos from public assets", async () => {
    await expect(loadReportLogoAsset("/logos/ecs.png")).resolves.toEqual(
      Buffer.from("local logo"),
    );

    expect(readFile).toHaveBeenCalledWith(expect.stringContaining("public/logos/ecs.png"));
  });

  it("loads uploaded logos only from the configured Supabase public logo path", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(Buffer.from("uploaded logo"), {
        headers: { "content-length": "13", "content-type": "image/png" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loadReportLogoAsset(
        "https://project.supabase.co/storage/v1/object/public/company-branding/logos/ecs.png",
      ),
    ).resolves.toEqual(Buffer.from("uploaded logo"));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(readFile).not.toHaveBeenCalled();
  });

  it("does not fetch arbitrary remote logo URLs server-side", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadReportLogoAsset("https://storage.example/logo.png")).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(readFile).not.toHaveBeenCalled();
  });

  it("rejects oversized uploaded logos before reading the body", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(Buffer.from("too large"), {
        headers: { "content-length": "2000001", "content-type": "image/png" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loadReportLogoAsset(
        "https://project.supabase.co/storage/v1/object/public/company-branding/logos/ecs.png",
      ),
    ).resolves.toBeNull();
  });
});
