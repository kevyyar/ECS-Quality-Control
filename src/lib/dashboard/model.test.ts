import { describe, expect, it } from "vitest";

import { summarizeDashboardMetrics } from "./model";

describe("summarizeDashboardMetrics", () => {
  it("counts only Submitted Inspection Tickets and results", () => {
    const metrics = summarizeDashboardMetrics({
      tickets: [
        {
          ticketId: "ticket-open",
          status: "open",
          buildingId: "building-a",
          buildingName: "North Tower",
          inspectionStatus: "submitted",
        },
        {
          ticketId: "ticket-closed",
          status: "closed",
          buildingId: "building-a",
          buildingName: "North Tower",
          inspectionStatus: "submitted",
        },
        {
          ticketId: "draft-ticket-guard",
          status: "open",
          buildingId: "building-b",
          buildingName: "South Tower",
          inspectionStatus: "draft",
        },
      ],
      inspectionResults: [
        { resultStatus: "pass", inspectionStatus: "submitted", isSkipped: false },
        { resultStatus: "fail", inspectionStatus: "submitted", isSkipped: false },
        { resultStatus: "not_applicable", inspectionStatus: "submitted", isSkipped: false },
        { resultStatus: "fail", inspectionStatus: "draft", isSkipped: false },
        { resultStatus: "pass", inspectionStatus: "submitted", isSkipped: true },
        { resultStatus: null, inspectionStatus: "submitted", isSkipped: false },
      ],
    });

    expect(metrics.ticketStatusCounts).toEqual({ open: 1, closed: 1 });
    expect(metrics.inspectionResultCounts).toEqual({
      pass: 1,
      fail: 1,
      notApplicable: 1,
    });
    expect(metrics.openTicketsByBuilding).toEqual([
      { buildingId: "building-a", buildingName: "North Tower", openTicketCount: 1 },
    ]);
  });

  it("sorts Open Tickets by Building by count descending and name ascending", () => {
    const metrics = summarizeDashboardMetrics({
      tickets: [
        {
          ticketId: "1",
          status: "open",
          buildingId: "b",
          buildingName: "Beta",
          inspectionStatus: "submitted",
        },
        {
          ticketId: "2",
          status: "open",
          buildingId: "a",
          buildingName: "Alpha",
          inspectionStatus: "submitted",
        },
        {
          ticketId: "3",
          status: "open",
          buildingId: "c",
          buildingName: "Gamma",
          inspectionStatus: "submitted",
        },
        {
          ticketId: "4",
          status: "open",
          buildingId: "c",
          buildingName: "Gamma",
          inspectionStatus: "submitted",
        },
      ],
      inspectionResults: [],
    });

    expect(metrics.openTicketsByBuilding.map((row) => row.buildingName)).toEqual([
      "Gamma",
      "Alpha",
      "Beta",
    ]);
  });
});
