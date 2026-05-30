import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  db,
  selectFrom,
  selectInnerJoin,
  selectLeftJoin,
  selectWhere,
  selectForUpdate,
  selectLimit,
  selectOrderBy,
  insertValues,
  updateSet,
  updateWhere,
  updateReturning,
} = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  selectFrom: vi.fn(),
  selectInnerJoin: vi.fn(),
  selectLeftJoin: vi.fn(),
  selectWhere: vi.fn(),
  selectForUpdate: vi.fn(),
  selectLimit: vi.fn(),
  selectOrderBy: vi.fn(),
  insertValues: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const {
  TicketAlreadyClosedError,
  TicketClosureValidationError,
  TicketNotFoundError,
  closeTicket,
  getTicket,
  listOpenTickets,
} = await import("./repository");

const createdAt = new Date("2026-05-30T12:00:00Z");
const ticketId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const closer = {
  authUserId: "99999999-9999-4999-8999-999999999999",
  email: "supervisor@example.com",
};
const openTicket = {
  id: ticketId,
  ticketNumber: 1,
  status: "open" as const,
  title: "Restroom — Mirrors",
  inspectionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  areaInspectionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  inspectionItemId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  clientId: "11111111-1111-4111-8111-111111111111",
  buildingId: "22222222-2222-4222-8222-222222222222",
  areaId: "33333333-3333-4333-8333-333333333333",
  createdByAuthUserId: closer.authUserId,
  createdByEmail: closer.email,
  resolutionNote: null,
  closedByAuthUserId: null,
  closedByEmail: null,
  closedAt: null,
  createdAt,
  updatedAt: createdAt,
};

beforeEach(() => {
  vi.clearAllMocks();
  db.transaction.mockImplementation(async (callback) => callback(db));
  selectFrom.mockReturnValue({
    innerJoin: selectInnerJoin,
    leftJoin: selectLeftJoin,
    where: selectWhere,
    orderBy: selectOrderBy,
  });
  selectInnerJoin.mockReturnValue({
    innerJoin: selectInnerJoin,
    leftJoin: selectLeftJoin,
    where: selectWhere,
    orderBy: selectOrderBy,
  });
  selectLeftJoin.mockReturnValue({ leftJoin: selectLeftJoin, where: selectWhere });
  selectWhere.mockReturnValue({ for: selectForUpdate, orderBy: selectOrderBy, limit: selectLimit });
  selectForUpdate.mockReturnValue({ limit: selectLimit });
  db.select.mockReturnValue({ from: selectFrom });
  updateSet.mockReturnValue({ where: updateWhere });
  updateWhere.mockReturnValue({ returning: updateReturning });
  db.update.mockReturnValue({ set: updateSet });
  db.insert.mockReturnValue({ values: insertValues });
});

describe("Ticket repository", () => {
  it("lists Open Tickets with display context and Before Photos", async () => {
    selectOrderBy.mockResolvedValueOnce([
      {
        ticket: openTicket,
        client: { name: "Acme Facilities" },
        building: { name: "North Tower" },
        inspection: {
          clientNameSnapshot: "Acme Facilities",
          buildingNameSnapshot: "North Tower",
          submittedAt: new Date("2026-05-30T13:00:00Z"),
          submittedByEmail: closer.email,
        },
        areaInspection: { areaNameSnapshot: "Restroom" },
        item: {
          itemNameSnapshot: "Mirrors",
          itemDescriptionSnapshot: "No streaks",
          resultNote: "Streaked mirror",
        },
        evidence: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", storagePath: "before.jpg" },
      },
    ]);

    await expect(listOpenTickets()).resolves.toEqual([
      {
        id: ticketId,
        ticketNumber: 1,
        displayNumber: "T-000001",
        title: "Restroom — Mirrors",
        clientId: openTicket.clientId,
        buildingId: openTicket.buildingId,
        areaId: openTicket.areaId,
        clientName: "Acme Facilities",
        buildingName: "North Tower",
        areaName: "Restroom",
        inspectionSubmittedAt: new Date("2026-05-30T13:00:00Z"),
        submittedByEmail: closer.email,
        failedItemName: "Mirrors",
        failedItemDescription: "No streaks",
        issueNote: "Streaked mirror",
        beforePhotos: [{ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", storagePath: "before.jpg" }],
        createdAt,
      },
    ]);
  });


  it("hydrates Ticket detail with historical Inspection client and building snapshots", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        ticket: openTicket,
        client: { name: "Renamed Live Client" },
        building: { name: "Renamed Live Building" },
        inspection: {
          clientNameSnapshot: "Historical Client",
          buildingNameSnapshot: "Historical Building",
          submittedAt: new Date("2026-05-30T13:00:00Z"),
          submittedByEmail: closer.email,
        },
        areaInspection: { areaNameSnapshot: "Restroom" },
        item: {
          itemNameSnapshot: "Mirrors",
          itemDescriptionSnapshot: "No streaks",
          resultNote: "Streaked mirror",
        },
      },
    ]);
    selectOrderBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await expect(getTicket(ticketId)).resolves.toMatchObject({
      id: ticketId,
      clientName: "Historical Client",
      buildingName: "Historical Building",
    });
  });

  it("rejects Ticket closure without resolution note or After Photos", async () => {
    await expect(
      closeTicket({ ticketId, resolutionNote: "", afterPhotoStoragePaths: [] }, closer),
    ).rejects.toBeInstanceOf(TicketClosureValidationError);

    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects closing an already Closed Ticket", async () => {
    selectLimit.mockResolvedValueOnce([{ ...openTicket, status: "closed" }]);

    await expect(
      closeTicket(
        { ticketId, resolutionNote: "Verified clean.", afterPhotoStoragePaths: ["after.jpg"] },
        closer,
      ),
    ).rejects.toBeInstanceOf(TicketAlreadyClosedError);

    expect(updateSet).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("closes an Open Ticket with immutable closure metadata and After Photos", async () => {
    const closedAt = new Date("2026-05-30T14:00:00Z");
    const closedTicket = {
      ...openTicket,
      status: "closed" as const,
      resolutionNote: "Verified clean.",
      closedByAuthUserId: closer.authUserId,
      closedByEmail: closer.email,
      closedAt,
    };
    selectLimit.mockResolvedValueOnce([openTicket]);
    updateReturning.mockResolvedValueOnce([closedTicket]);

    await expect(
      closeTicket(
        { ticketId, resolutionNote: "  Verified clean.  ", afterPhotoStoragePaths: ["after.jpg"] },
        closer,
      ),
    ).resolves.toEqual({ id: ticketId, status: "closed" });

    expect(updateSet).toHaveBeenCalledWith({
      status: "closed",
      resolutionNote: "Verified clean.",
      closedByAuthUserId: closer.authUserId,
      closedByEmail: closer.email,
      closedAt: expect.anything(),
      updatedAt: expect.anything(),
    });
    expect(insertValues).toHaveBeenCalledWith([
      {
        ticketId,
        storagePath: "after.jpg",
        uploadedByAuthUserId: closer.authUserId,
      },
    ]);
  });

  it("rejects unknown Tickets", async () => {
    selectLimit.mockResolvedValueOnce([]);

    await expect(
      closeTicket(
        { ticketId, resolutionNote: "Verified clean.", afterPhotoStoragePaths: ["after.jpg"] },
        closer,
      ),
    ).rejects.toBeInstanceOf(TicketNotFoundError);
  });
});
