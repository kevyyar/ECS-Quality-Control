import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CookiesToSet = Array<{
  name: string;
  value: string;
  options?: Record<string, unknown>;
}>;

type CookieMethods = {
  getAll(): Array<{ name: string; value: string }>;
  setAll(cookiesToSet: CookiesToSet, headers: Record<string, string>): void;
};

const { createServerClient } = vi.hoisted(() => ({
  createServerClient: vi.fn(
    (_url: string, _anonKey: string, options: { cookies: CookieMethods }) => ({
      auth: {
        getClaims: vi.fn(async () => {
          options.cookies.setAll(
            [
              {
                name: "sb-test-auth-token",
                value: "refreshed-token",
                options: { path: "/" },
              },
            ],
            {
              "cache-control": "no-store",
              "x-supabase-auth": "refreshed",
            },
          );

          return { data: null, error: null };
        }),
      },
    }),
  ),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

const { updateSession } = await import("./proxy");

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("copies headers passed to cookies.setAll onto the returned response", async () => {
    const request = new NextRequest("https://app.example.com/dashboard");

    const response = await updateSession(request);

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-supabase-auth")).toBe("refreshed");
  });
});
