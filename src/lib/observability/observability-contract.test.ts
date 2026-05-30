import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = {
  login: readFileSync("src/lib/auth/actions.ts", "utf8"),
  drafts: readFileSync("src/app/inspections/drafts/actions.ts", "utf8"),
  tickets: readFileSync("src/app/tickets/actions.ts", "utf8"),
  weeklyReport: readFileSync("src/app/inspections/[inspectionId]/weekly-report/route.ts", "utf8"),
  ticketReport: readFileSync("src/app/tickets/[ticketId]/resolution-report/route.ts", "utf8"),
  deploymentDocs: readFileSync("docs/deployment.md", "utf8"),
};

describe("operational diagnostics coverage", () => {
  it("logs the MVP critical workflows without storing a product audit log", () => {
    expect(files.login).toContain('logOperationalError("login.');
    expect(files.drafts).toContain('logOperationalError("draft.start.');
    expect(files.drafts).toContain('logOperationalError("draft.submit.');
    expect(files.drafts).toContain('logOperationalError("photo.before.');
    expect(files.tickets).toContain('logOperationalError("ticket.close.');
    expect(files.tickets).toContain('logOperationalError("photo.after.');
    expect(files.weeklyReport).toContain('logOperationalError("pdf.weekly-inspection.');
    expect(files.ticketReport).toContain('logOperationalError("pdf.ticket-resolution.');
  });

  it("documents production error visibility through Vercel runtime logs", () => {
    expect(files.deploymentDocs).toContain("Production error visibility");
    expect(files.deploymentDocs).toContain("vercel logs --environment production --status-code 5xx --since 1h");
    expect(files.deploymentDocs).toContain("Vercel project dashboard");
    expect(files.deploymentDocs).toContain("not a product audit log");
  });
});
