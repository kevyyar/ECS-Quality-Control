"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import { getInternalUserProfileByAuthUserId } from "./internal-users";

export type LoginFormState = {
  error: string | null;
};

const invalidLoginState: LoginFormState = {
  error: "Invalid email or password.",
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

function readFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith("sb-") && name.includes("auth-token");
}

async function clearSupabaseAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.getAll().forEach(({ name }) => {
    if (isSupabaseAuthCookie(name)) {
      cookieStore.delete(name);
    }
  });
}

async function signOutWithoutLeakingReason(
  supabase: ServerSupabaseClient,
): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (!error) {
      return;
    }
  } catch {
    // Fall back to clearing local auth cookies below.
  }

  try {
    await clearSupabaseAuthCookies();
  } catch {
    // Keep the login response generic even if session cleanup cannot complete.
  }
}

export async function signInInternalUser(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = readFormValue(formData, "email").trim();
  const password = readFormValue(formData, "password");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let supabase: ServerSupabaseClient;

  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return invalidLoginState;
  }

  let authUserId: string;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !user) {
      return invalidLoginState;
    }

    authUserId = user.id;
  } catch {
    return invalidLoginState;
  }

  let hasInternalProfile = false;

  try {
    hasInternalProfile = Boolean(
      await getInternalUserProfileByAuthUserId(authUserId),
    );
  } catch {
    await signOutWithoutLeakingReason(supabase);

    return invalidLoginState;
  }

  if (!hasInternalProfile) {
    await signOutWithoutLeakingReason(supabase);

    return invalidLoginState;
  }

  redirect("/dashboard");
}

export async function signOutInternalUser(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      await clearSupabaseAuthCookies();
    }
  } catch {
    try {
      await clearSupabaseAuthCookies();
    } catch {
      // Redirect to the safe unauthenticated route without exposing config errors.
    }
  }

  redirect("/login");
}
