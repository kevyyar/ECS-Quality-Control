type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

function readRequiredEnv(name: string, value: string | undefined): string {
  if (!value || value.startsWith("replace-with")) {
    throw new Error(`${name} must be configured for Supabase auth.`);
  }

  return value;
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    url: readRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    anonKey: readRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}
