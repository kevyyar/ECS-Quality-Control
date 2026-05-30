import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const deploymentDocs = readFileSync("docs/deployment.md", "utf8");
const seedSql = readFileSync("supabase/seed.sql", "utf8");

function sectionBetween(start: string, end: string) {
  const startIndex = deploymentDocs.indexOf(start);
  const endIndex = deploymentDocs.indexOf(end, startIndex);
  return deploymentDocs.slice(startIndex, endIndex);
}

describe("production data and file safety docs", () => {
  it("documents each production safety operating area", () => {
    [
      "Production migration process",
      "Backup strategy",
      "Photo/object storage safety",
      "Initial Supervisor bootstrap",
      "Restore notes",
      "Seed/starter data safety",
    ].forEach((heading) => {
      expect(deploymentDocs).toContain(heading);
    });
  });

  it("documents the safe production migration primitives", () => {
    expect(deploymentDocs).toContain("scripts/check-deployment-env.mjs");
    expect(deploymentDocs).toContain("pnpm db:migrate");
    expect(deploymentDocs).toContain("drizzle/meta/_journal.json");
    expect(deploymentDocs).toContain("DATABASE_URL");
  });

  it("keeps the short runbook from bypassing migration safety checks", () => {
    const runbook = sectionBetween("## Clean checkout deployment runbook", "## Production data and file safety");

    expect(runbook).toContain("[Production migration process](#production-migration-process)");
    expect(runbook).not.toContain("pnpm db:migrate");
  });

  it("orders migration safety before production migration execution", () => {
    const migrationSection = sectionBetween("### Production migration process", "### Backup strategy");

    expect(migrationSection.indexOf("scripts/check-deployment-env.mjs")).toBeLessThan(
      migrationSection.indexOf("fresh database backup"),
    );
    expect(migrationSection.indexOf("fresh database backup")).toBeLessThan(
      migrationSection.indexOf("pnpm db:migrate"),
    );
    expect(migrationSection).toContain("DATABASE_URL");
  });

  it("documents actionable database, Auth, and storage backup artifacts", () => {
    const backupSection = sectionBetween("### Backup strategy", "### Photo/object storage safety");

    expect(backupSection).toContain("inspection-evidence");
    expect(backupSection).toContain("Export Supabase Auth users");
    expect(backupSection).toContain("same timestamp or release");
  });

  it("documents the private evidence storage boundary", () => {
    expect(deploymentDocs).toContain("inspection-evidence");
    expect(deploymentDocs).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(deploymentDocs).toContain("private");
    expect(deploymentDocs).toContain("signed URL");
    expect(deploymentDocs).toContain("3600");
    expect(deploymentDocs).toContain("inspection_item_evidence.storage_path");
    expect(deploymentDocs).toContain("ticket_after_photo_evidence.storage_path");
  });

  it("documents bootstrap SQL using the current internal_users columns", () => {
    const bootstrapSection = sectionBetween("### Initial Supervisor bootstrap", "### Restore notes");

    expect(bootstrapSection).toContain("auth_user_id");
    expect(bootstrapSection).toContain("email");
    expect(bootstrapSection).toContain("supervisor = true");
    expect(bootstrapSection).not.toContain("full_name");
  });

  it("keeps current seed behavior local-only and future seed inserts idempotent", () => {
    if (/\binsert\s+into\b/i.test(seedSql)) {
      expect(seedSql).toMatch(/\bon\s+conflict\b/i);
    } else {
      expect(seedSql).toContain("intentionally has no starter inserts");
    }
    expect(deploymentDocs).toContain("local development only");
    expect(deploymentDocs).toContain("idempotent");
    expect(deploymentDocs).toContain("Drizzle migration journal");
  });
});
