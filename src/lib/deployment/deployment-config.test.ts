import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("deployment configuration", () => {
  it("runs verification checks before the Vercel production build", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));

    expect(pkg.scripts.verify).toBe("pnpm typecheck && pnpm lint && pnpm test");
    expect(pkg.scripts["deploy:check"]).toBe(
      "node scripts/check-deployment-env.mjs && pnpm verify",
    );
    expect(vercel.buildCommand).toBe("pnpm deploy:check && pnpm build");
    expect(vercel.installCommand).toContain("pnpm install --frozen-lockfile");
  });
});
