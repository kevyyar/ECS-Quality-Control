import { describe, expect, it } from "vitest";

import {
  buildTicketResolutionReportData,
  renderTicketResolutionReportPdf,
  renderTicketResolutionReportText,
  type TicketResolutionReportInput,
} from "./ticket-resolution-report";

const closedAt = new Date("2026-05-30T19:00:00Z");
const input = {
  branding: {
    displayName: "ECS Cleaning",
    logoUrl: null,
    primaryBrandColor: "#0f766e",
  },
  ticket: {
    id: "ticket-1",
    displayNumber: "T-000001",
    title: "Restroom — Mirrors",
    status: "closed",
    clientName: "Acme Facilities",
    buildingName: "North Tower",
    areaName: "Restroom",
    inspectionSubmittedAt: new Date("2026-05-30T18:00:00Z"),
    submittedByEmail: "supervisor@example.com",
    failedItemName: "Mirrors - historical wording",
    failedItemDescription: "No streaks - historical wording",
    issueNote: "Streaked mirror",
    beforePhotos: [{ id: "before-1", storagePath: "before/photo.jpg" }],
    resolutionNote: "Re-cleaned mirror",
    afterPhotos: [{ id: "after-1", storagePath: "after/photo.jpg" }],
    closedByEmail: "supervisor@example.com",
    closedAt,
  },
  correctionNotes: [
    {
      id: "note-1",
      targetType: "ticket",
      targetId: "ticket-1",
      note: "Ticket-level clarification",
      createdByEmail: "manager@example.com",
      createdAt: new Date("2026-05-30T20:30:00Z"),
    },
  ],
} satisfies TicketResolutionReportInput;

describe("Ticket Resolution Report", () => {
  it("rejects Open Tickets", () => {
    expect(
      buildTicketResolutionReportData({
        ...input,
        ticket: { ...input.ticket, status: "open", closedAt: null, closedByEmail: null },
      }),
    ).toBeNull();
  });

  it("assembles before-and-after proof for one Closed Ticket", () => {
    const report = buildTicketResolutionReportData(input);

    expect(report).toMatchObject({
      displayNumber: "T-000001",
      title: "Restroom — Mirrors",
      failedItemName: "Mirrors - historical wording",
      beforePhotos: [{ storagePath: "before/photo.jpg" }],
      resolutionNote: "Re-cleaned mirror",
      afterPhotos: [{ storagePath: "after/photo.jpg" }],
      correctionNotes: [{ note: "Ticket-level clarification" }],
    });
  });

  it("renders a PDF with the required single-Ticket sections", async () => {
    const report = buildTicketResolutionReportData(input);

    if (!report) {
      throw new Error("expected report");
    }

    const text = renderTicketResolutionReportText(report);
    const pdf = Buffer.from(await renderTicketResolutionReportPdf(report)).toString("latin1");

    expect(pdf).toContain("%PDF-1.3");
    expect(text).toContain("Ticket Resolution Report");
    expect(text).toContain("T-000001");
    expect(text).toContain("Before Photo: before/photo.jpg");
    expect(text).toContain("After Photo: after/photo.jpg");
    expect(text).not.toContain("Weekly Inspection Report");
  });
});
