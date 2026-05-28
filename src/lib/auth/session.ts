import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  canPerformProtectedAction,
  type ProtectedAction,
  type UserCapability,
} from "./capabilities";
import { getInternalUserProfileByAuthUserId } from "./internal-users";

export type CurrentInternalUser = {
  authUserId: string;
  email: string;
  capabilities: UserCapability[];
};

function hasSupabaseAuthCookie(
  cookieList: Awaited<ReturnType<typeof cookies>>,
): boolean {
  return cookieList
    .getAll()
    .some(
      ({ name }) => name.startsWith("sb-") && name.includes("auth-token"),
    );
}

export async function getCurrentInternalUser(): Promise<CurrentInternalUser | null> {
  const cookieStore = await cookies();

  if (!hasSupabaseAuthCookie(cookieStore)) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const profile = await getInternalUserProfileByAuthUserId(user.id);

  if (!profile) {
    return null;
  }

  return {
    authUserId: user.id,
    email: user.email ?? profile.email,
    capabilities: profile.capabilities,
  };
}

export async function requireInternalUser(): Promise<CurrentInternalUser> {
  const user = await getCurrentInternalUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireProtectedAction(
  action: ProtectedAction,
): Promise<CurrentInternalUser> {
  const user = await requireInternalUser();

  if (!canPerformProtectedAction(user.capabilities, action)) {
    redirect("/forbidden");
  }

  return user;
}
