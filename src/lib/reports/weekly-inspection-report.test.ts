import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  buildWeeklyInspectionReportData,
  renderWeeklyInspectionReportPdf,
  renderWeeklyInspectionReportText,
  type WeeklyInspectionReportInput,
} from "./weekly-inspection-report";

const submittedAt = new Date("2026-05-30T18:00:00Z");
const closedAt = new Date("2026-05-30T19:00:00Z");

const input = {
  branding: {
    displayName: "ECS Cleaning",
    logoUrl: null,
    primaryBrandColor: "#0f766e",
  },
  inspection: {
    id: "inspection-1",
    status: "submitted",
    clientName: "Acme Facilities",
    buildingName: "North Tower",
    submittedAt,
    submittedByEmail: "supervisor@example.com",
  },
  areaInspections: [
    {
      id: "area-1",
      source: "planned",
      position: 1,
      areaName: "Restroom",
      templateName: "Restroom Standard",
      isSkipped: false,
      skipReason: null,
    },
    {
      id: "area-2",
      source: "planned",
      position: 2,
      areaName: "Lobby",
      templateName: "Lobby Standard",
      isSkipped: true,
      skipReason: "Building contact unavailable",
    },
    {
      id: "area-3",
      source: "one_off",
      position: 3,
      areaName: "Stairwell",
      templateName: "Stairwell Spot Check",
      isSkipped: false,
      skipReason: null,
    },
  ],
  items: [
    {
      id: "item-1",
      areaInspectionId: "area-1",
      position: 1,
      sectionName: "Fixtures",
      name: "Mirrors - historical wording",
      description: "No streaks - historical wording",
      resultStatus: "fail",
      resultNote: "Streaked mirror",
      beforePhotos: [{ id: "before-1", storagePath: "before/photo.jpg" }],
    },
    {
      id: "item-2",
      areaInspectionId: "area-3",
      position: 1,
      sectionName: null,
      name: "Handrails",
      description: null,
      resultStatus: "pass",
      resultNote: "Looks good",
      beforePhotos: [],
    },
  ],
  tickets: [
    {
      id: "ticket-1",
      inspectionItemId: "item-1",
      displayNumber: "T-000001",
      title: "Restroom — Mirrors - historical wording",
      status: "closed",
      resolutionNote: "Re-cleaned mirror",
      closedByEmail: "supervisor@example.com",
      closedAt,
      afterPhotos: [{ id: "after-1", storagePath: "after/photo.jpg" }],
    },
  ],
  correctionNotes: [
    {
      id: "note-1",
      targetType: "submitted_inspection",
      targetId: "inspection-1",
      note: "Inspection-level clarification",
      createdByEmail: "manager@example.com",
      createdAt: new Date("2026-05-30T20:00:00Z"),
    },
    {
      id: "note-2",
      targetType: "ticket",
      targetId: "ticket-1",
      note: "Ticket-level clarification",
      createdByEmail: "manager@example.com",
      createdAt: new Date("2026-05-30T20:30:00Z"),
    },
  ],
} satisfies WeeklyInspectionReportInput;

describe("Weekly Inspection Report", () => {
  it("rejects non-submitted inspections", () => {
    expect(
      buildWeeklyInspectionReportData({
        ...input,
        inspection: { ...input.inspection, status: "draft" },
      }),
    ).toBeNull();
  });

  it("assembles historical inspection content with current Ticket state and relevant notes", () => {
    const report = buildWeeklyInspectionReportData(input);

    expect(report).toMatchObject({
      branding: { displayName: "ECS Cleaning" },
      clientName: "Acme Facilities",
      buildingName: "North Tower",
      submittedByEmail: "supervisor@example.com",
    });
    expect(report?.areas).toHaveLength(3);
    expect(report?.areas[0]).toMatchObject({
      areaName: "Restroom",
      items: [
        {
          name: "Mirrors - historical wording",
          resultStatus: "fail",
          beforePhotos: [{ storagePath: "before/photo.jpg" }],
          ticket: {
            displayNumber: "T-000001",
            status: "closed",
            resolutionNote: "Re-cleaned mirror",
            afterPhotos: [{ storagePath: "after/photo.jpg" }],
            correctionNotes: [{ note: "Ticket-level clarification" }],
          },
        },
      ],
    });
    expect(report?.areas[1]).toMatchObject({
      isSkipped: true,
      skipReason: "Building contact unavailable",
      items: [],
    });
    expect(report?.areas[2]).toMatchObject({ source: "one_off" });
    expect(report?.inspectionCorrectionNotes).toEqual([
      expect.objectContaining({ note: "Inspection-level clarification" }),
    ]);
  });

  it("renders deterministic PDF bytes with required report sections", async () => {
    const report = buildWeeklyInspectionReportData(input);

    if (!report) {
      throw new Error("expected report");
    }

    const text = renderWeeklyInspectionReportText(report);
    const pdf = await renderWeeklyInspectionReportPdf(report);
    const content = Buffer.from(pdf).toString("latin1");

    expect(content).toContain("%PDF-1.3");
    expect(text).toContain("Weekly Inspection Report");
    expect(text).toContain("ECS Cleaning");
    expect(text).toContain("Mirrors - historical wording");
    expect(text).toContain("Before Photo: before/photo.jpg");
    expect(text).toContain("T-000001 - closed");
    expect(text).toContain("Closed by: supervisor@example.com");
    expect(text).toContain("After Photo: after/photo.jpg");
    expect(text).toContain("Correction Notes");
  });


  it("embeds downloaded photo assets in the PDF", async () => {
    const report = buildWeeklyInspectionReportData(input);

    if (!report) {
      throw new Error("expected report");
    }

    const jpeg = await sharp({
      create: {
        background: { b: 0, g: 80, r: 220 },
        channels: 3,
        height: 24,
        width: 32,
      },
    }).jpeg().toBuffer();
    const pdf = Buffer.from(
      await renderWeeklyInspectionReportPdf(
        report,
        new Map([
          ["before/photo.jpg", jpeg],
          ["after/photo.jpg", jpeg],
        ]),
      ),
    ).toString("latin1");

    expect(pdf).not.toContain("Photo could not be embedded");
    expect(pdf).not.toContain("Photo unavailable");
  });

  it("renders reports beyond the first page without dropping later items", async () => {
    const manyItems: WeeklyInspectionReportInput["items"] = Array.from(
      { length: 80 },
      (_, index) => ({
        id: `item-${index}`,
        areaInspectionId: "area-1",
        position: index + 1,
        sectionName: null,
        name: `Long report item ${index + 1}`,
        description: null,
        resultStatus: "pass",
        resultNote: null,
        beforePhotos: [],
      }),
    );
    const report = buildWeeklyInspectionReportData({ ...input, items: manyItems, tickets: [] });

    if (!report) {
      throw new Error("expected report");
    }

    const text = renderWeeklyInspectionReportText(report);
    const pdf = Buffer.from(await renderWeeklyInspectionReportPdf(report)).toString("latin1");

    expect(text).toContain("Long report item 80");
    expect(pdf).toMatch(/\/Count [2-9]/);
  });
});
