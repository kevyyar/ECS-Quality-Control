import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { describe, expect, it } from "vitest";

const script = "scripts/check-deployment-env.mjs";
const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  DATABASE_URL: "postgresql://user:pass@db.example.com:5432/postgres",
};

function runCheck(env: Record<string, string | undefined>) {
  const childEnv: NodeJS.ProcessEnv = { ...process.env };

  Object.keys(validEnv).forEach((name) => {
    delete childEnv[name];
  });
  Object.entries(env).forEach(([name, value]) => {
    if (value === undefined) {
      delete childEnv[name];
      return;
    }

    childEnv[name] = value;
  });

  return spawnSync(process.execPath, [script, "production"], {
    cwd: process.cwd(),
    env: childEnv,
    encoding: "utf8",
  });
}

describe("deployment environment check", () => {
  it("fails with clear diagnostics for missing or placeholder deployment variables", () => {
    const result = runCheck({
      NEXT_PUBLIC_SUPABASE_URL: "https://replace-with-production-project.supabase.co",
      DATABASE_URL: "postgresql://replace-with-production-db-url",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Deployment environment check failed for production");
    expect(result.stderr).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(result.stderr).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(result.stderr).toContain("DATABASE_URL");
    expect(result.stderr).toContain("Do not commit secrets");
  });

  it("rejects non-http deployment URLs", () => {
    const result = runCheck({
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL: "ftp://project.supabase.co",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("rejects the committed example env files until placeholders are replaced", () => {
    [".env.staging.example", ".env.production.example"].forEach((exampleFile) => {
      const exampleEnv = parse(readFileSync(exampleFile));
      const result = runCheck(exampleEnv);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Deployment environment check failed for production");
    });
  });

  it("passes when required deployment variables are present", () => {
    const result = runCheck(validEnv);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Deployment environment check passed for production");
  });
});
