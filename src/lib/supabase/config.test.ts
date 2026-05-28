import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSection(config: string, section: string): string {
  const match = config.match(
    new RegExp(`\\[${section.replace(".", "\\.")}\\]([\\s\\S]*?)(?=\\n\\[|$)`),
  );

  const body = match?.[1];

  if (!body) {
    throw new Error(`Missing Supabase config section: ${section}`);
  }

  return body;
}

describe("Supabase auth config", () => {
  it("disables public signup for every configured auth channel", () => {
    const config = readFileSync("supabase/config.toml", "utf8");

    expect(readSection(config, "auth")).toMatch(/enable_signup\s*=\s*false/);
    expect(readSection(config, "auth.email")).toMatch(
      /enable_signup\s*=\s*false/,
    );
    expect(readSection(config, "auth.sms")).toMatch(/enable_signup\s*=\s*false/);
    expect(readSection(config, "auth")).toMatch(
      /enable_anonymous_sign_ins\s*=\s*false/,
    );
  });
});
