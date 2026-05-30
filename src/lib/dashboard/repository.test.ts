import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, selectFrom, selectInnerJoin, selectWhere } = vi.hoisted(() => ({
  db: { select: vi.fn() },
  selectFrom: vi.fn(),
  selectInnerJoin: vi.fn(),
  selectWhere: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const { getDashboardMetrics } = await import("./repository");

beforeEach(() => {
  vi.clearAllMocks();
  db.select.mockReturnValue({ from: selectFrom });
  selectFrom.mockReturnValue({ innerJoin: selectInnerJoin });
  selectInnerJoin.mockReturnValue({ innerJoin: selectInnerJoin, where: selectWhere });
});

describe("getDashboardMetrics", () => {
  it("aggregates Submitted Inspection chart rows from the selected date range", async () => {
    selectWhere
      .mockResolvedValueOnce([
        {
          ticketId: "open-ticket",
          status: "open",
          buildingId: "building-a",
          buildingName: "North Tower",
          inspectionStatus: "submitted",
        },
        {
          ticketId: "closed-ticket",
          status: "closed",
          buildingId: "building-a",
          buildingName: "North Tower",
          inspectionStatus: "submitted",
        },
      ])
      .mockResolvedValueOnce([
        { resultStatus: "pass", inspectionStatus: "submitted", isSkipped: false },
        { resultStatus: "fail", inspectionStatus: "submitted", isSkipped: false },
        { resultStatus: "not_applicable", inspectionStatus: "submitted", isSkipped: false },
      ]);

    await expect(
      getDashboardMetrics({
        startAt: new Date("2026-05-25T00:00:00Z"),
        endBefore: new Date("2026-06-01T00:00:00Z"),
      }),
    ).resolves.toEqual({
      ticketStatusCounts: { open: 1, closed: 1 },
      inspectionResultCounts: { pass: 1, fail: 1, notApplicable: 1 },
      openTicketsByBuilding: [
        { buildingId: "building-a", buildingName: "North Tower", openTicketCount: 1 },
      ],
    });

    expect(selectWhere).toHaveBeenCalledTimes(2);
  });
});
