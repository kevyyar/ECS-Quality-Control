import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, selectFrom, selectLeftJoin, selectWhere, selectOrderBy } = vi.hoisted(() => ({
  db: { select: vi.fn() },
  selectFrom: vi.fn(),
  selectLeftJoin: vi.fn(),
  selectWhere: vi.fn(),
  selectOrderBy: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const { listInspections } = await import("./repository");

const draftInspection = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "draft" as const,
  clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  buildingId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  clientNameSnapshot: "Acme Facilities",
  buildingNameSnapshot: "North Tower",
  startedByEmail: "supervisor@example.com",
  startedAt: new Date("2026-05-25T10:00:00Z"),
  submittedByEmail: null,
  submittedAt: null,
};

const submittedInspection = {
  ...draftInspection,
  id: "22222222-2222-4222-8222-222222222222",
  status: "submitted" as const,
  submittedByEmail: "supervisor@example.com",
  submittedAt: new Date("2026-05-26T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  db.select.mockReturnValue({ from: selectFrom });
  selectFrom.mockReturnValue({ leftJoin: selectLeftJoin });
  selectLeftJoin.mockReturnValue({ leftJoin: selectLeftJoin, where: selectWhere, orderBy: selectOrderBy });
  selectWhere.mockReturnValue({ orderBy: selectOrderBy });
});

describe("listInspections", () => {
  it("returns Draft and Submitted inspection summaries with unique area/item counts", async () => {
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: draftInspection,
        areaInspection: { id: "area-1" },
        item: { id: "item-1" },
      },
      {
        inspection: draftInspection,
        areaInspection: { id: "area-1" },
        item: { id: "item-1" },
      },
      {
        inspection: submittedInspection,
        areaInspection: { id: "area-2" },
        item: { id: "item-2" },
      },
    ]);

    await expect(listInspections()).resolves.toEqual([
      {
        id: draftInspection.id,
        status: "draft",
        clientId: draftInspection.clientId,
        buildingId: draftInspection.buildingId,
        clientName: "Acme Facilities",
        buildingName: "North Tower",
        startedAt: draftInspection.startedAt,
        startedByEmail: "supervisor@example.com",
        submittedAt: null,
        submittedByEmail: null,
        areaInspectionCount: 1,
        itemCount: 1,
      },
      {
        id: submittedInspection.id,
        status: "submitted",
        clientId: submittedInspection.clientId,
        buildingId: submittedInspection.buildingId,
        clientName: "Acme Facilities",
        buildingName: "North Tower",
        startedAt: submittedInspection.startedAt,
        startedByEmail: "supervisor@example.com",
        submittedAt: submittedInspection.submittedAt,
        submittedByEmail: "supervisor@example.com",
        areaInspectionCount: 1,
        itemCount: 1,
      },
    ]);
  });

  it("adds query predicates for supported filters", async () => {
    selectOrderBy.mockResolvedValueOnce([]);

    await listInspections({
      clientId: draftInspection.clientId,
      buildingId: draftInspection.buildingId,
      status: "submitted",
      inspectionWeek: "this-week",
      now: new Date(2026, 4, 27),
    });

    expect(selectWhere).toHaveBeenCalledTimes(1);
  });
});
