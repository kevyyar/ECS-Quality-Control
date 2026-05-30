import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = {
  dashboard: readFileSync("src/app/dashboard/page.tsx", "utf8"),
  inspections: readFileSync("src/app/inspections/page.tsx", "utf8"),
  tickets: readFileSync("src/app/tickets/page.tsx", "utf8"),
  draftEditor: readFileSync("src/app/inspections/drafts/draft-inspection-editor.tsx", "utf8"),
  submittedInspection: readFileSync("src/app/inspections/[inspectionId]/page.tsx", "utf8"),
  ticketDetail: readFileSync("src/app/tickets/[ticketId]/page.tsx", "utf8"),
};

describe("MVP responsive, accessibility, and UX polish", () => {
  it("lets filter action rows wrap on narrow screens", () => {
    expect(files.dashboard).toContain("flex flex-wrap items-end gap-3");
    expect(files.inspections).toContain("flex flex-wrap items-end gap-3");
    expect(files.tickets).toContain("flex flex-wrap items-end gap-3");
  });

  it("gives Before Photo file upload an accessible visible label and mobile-friendly control styling", () => {
    expect(files.draftEditor).toContain("Choose Before Photo");
    expect(files.draftEditor).toContain('htmlFor={`before-photo-${item.id}`}');
    expect(files.draftEditor).toContain('id={`before-photo-${item.id}`}');
    expect(files.draftEditor).toContain("w-full rounded-xl border border-amber-300");
  });

  it("explains PDF download behavior and failure recovery", () => {
    expect(files.submittedInspection).toContain('aria-describedby="weekly-report-download-help"');
    expect(files.submittedInspection).toContain("If the download fails");
    expect(files.ticketDetail).toContain('aria-describedby="ticket-resolution-report-download-help"');
    expect(files.ticketDetail).toContain("If the download fails");
  });
});
