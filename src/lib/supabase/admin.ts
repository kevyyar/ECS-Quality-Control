import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

function readServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key || key.startsWith("replace-with")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be configured for private storage.");
  }

  return key;
}

export function createSupabaseAdminClient() {
  const env = getSupabasePublicEnv();

  return createClient(env.url, readServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
