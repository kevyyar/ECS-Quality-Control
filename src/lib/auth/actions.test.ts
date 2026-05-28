import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPassword, signOut, getInternalUserProfileByAuthUserId } =
  vi.hoisted(() => ({
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getInternalUserProfileByAuthUserId: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    delete: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      signInWithPassword,
      signOut,
    },
  })),
}));

vi.mock("./internal-users", () => ({
  getInternalUserProfileByAuthUserId,
}));

const { signInInternalUser } = await import("./actions");

function loginFormData(): FormData {
  const formData = new FormData();
  formData.set("email", "user@example.com");
  formData.set("password", "password123");

  return formData;
}

describe("signInInternalUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects valid Supabase credentials when the auth user has no internal profile and signs out locally", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: { id: "00000000-0000-0000-0000-000000000001" } },
      error: null,
    });
    getInternalUserProfileByAuthUserId.mockResolvedValue(null);
    signOut.mockResolvedValue({ error: null });

    await expect(
      signInInternalUser({ error: null }, loginFormData()),
    ).resolves.toEqual({ error: "Invalid email or password." });

    expect(getInternalUserProfileByAuthUserId).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
    );
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
