import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  db,
  selectFrom,
  selectWhere,
  selectForUpdate,
  selectLimit,
  selectOrderBy,
  insertValues,
  insertReturning,
} = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  selectFrom: vi.fn(),
  selectWhere: vi.fn(),
  selectForUpdate: vi.fn(),
  selectLimit: vi.fn(),
  selectOrderBy: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const {
  CorrectionNoteTargetNotAllowedError,
  CorrectionNoteTargetNotFoundError,
  addCorrectionNote,
  getSubmittedInspectionCorrectionNoteTarget,
  listCorrectionNotes,
} = await import("./repository");

const author = {
  authUserId: "99999999-9999-4999-8999-999999999999",
  email: "manager@example.com",
};
const submittedInspection = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status: "submitted" as const,
};
const draftInspection = {
  ...submittedInspection,
  status: "draft" as const,
};
const openTicket = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  status: "open" as const,
};
const closedTicket = {
  ...openTicket,
  status: "closed" as const,
};
const noteRow = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  targetType: "submitted_inspection" as const,
  inspectionId: submittedInspection.id,
  ticketId: null,
  note: "Clarifying note.",
  createdByAuthUserId: author.authUserId,
  createdByEmail: author.email,
  createdAt: new Date("2026-05-30T20:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  selectFrom.mockReturnValue({ where: selectWhere });
  selectWhere.mockReturnValue({
    for: selectForUpdate,
    orderBy: selectOrderBy,
  });
  selectForUpdate.mockReturnValue({ limit: selectLimit });
  db.select.mockReturnValue({ from: selectFrom });
  insertValues.mockReturnValue({ returning: insertReturning });
  db.insert.mockReturnValue({ values: insertValues });
});

describe("Correction Notes repository", () => {
  it("adds Correction Notes to Submitted Inspections", async () => {
    selectLimit.mockResolvedValueOnce([submittedInspection]);
    insertReturning.mockResolvedValueOnce([noteRow]);

    await expect(
      addCorrectionNote(
        {
          targetType: "submitted_inspection",
          targetId: submittedInspection.id,
          note: "  Clarifying note.  ",
        },
        author,
      ),
    ).resolves.toEqual({
      id: noteRow.id,
      targetType: "submitted_inspection",
      targetId: submittedInspection.id,
      note: "Clarifying note.",
      createdByAuthUserId: author.authUserId,
      createdByEmail: author.email,
      createdAt: noteRow.createdAt,
    });

    expect(insertValues).toHaveBeenCalledWith({
      targetType: "submitted_inspection",
      inspectionId: submittedInspection.id,
      ticketId: null,
      note: "Clarifying note.",
      createdByAuthUserId: author.authUserId,
      createdByEmail: author.email,
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects Correction Notes for Draft Inspections", async () => {
    selectLimit.mockResolvedValueOnce([draftInspection]);

    await expect(
      addCorrectionNote(
        {
          targetType: "submitted_inspection",
          targetId: draftInspection.id,
          note: "Not allowed.",
        },
        author,
      ),
    ).rejects.toBeInstanceOf(CorrectionNoteTargetNotAllowedError);

    expect(insertValues).not.toHaveBeenCalled();
  });

  it("adds Correction Notes to Open and Closed Tickets", async () => {
    selectLimit.mockResolvedValueOnce([openTicket]).mockResolvedValueOnce([closedTicket]);
    insertReturning
      .mockResolvedValueOnce([{ ...noteRow, targetType: "ticket", inspectionId: null, ticketId: openTicket.id }])
      .mockResolvedValueOnce([{ ...noteRow, targetType: "ticket", inspectionId: null, ticketId: closedTicket.id }]);

    await expect(
      addCorrectionNote(
        { targetType: "ticket", targetId: openTicket.id, note: "Open note." },
        author,
      ),
    ).resolves.toMatchObject({ targetType: "ticket", targetId: openTicket.id });
    await expect(
      addCorrectionNote(
        { targetType: "ticket", targetId: closedTicket.id, note: "Closed note." },
        author,
      ),
    ).resolves.toMatchObject({ targetType: "ticket", targetId: closedTicket.id });

    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects missing targets", async () => {
    selectLimit.mockResolvedValueOnce([]);

    await expect(
      addCorrectionNote(
        { targetType: "ticket", targetId: openTicket.id, note: "Missing." },
        author,
      ),
    ).rejects.toBeInstanceOf(CorrectionNoteTargetNotFoundError);
  });

  it("lists Correction Notes for a target", async () => {
    selectOrderBy.mockResolvedValueOnce([noteRow]);

    await expect(
      listCorrectionNotes({ targetType: "submitted_inspection", targetId: submittedInspection.id }),
    ).resolves.toEqual([
      {
        id: noteRow.id,
        targetType: "submitted_inspection",
        targetId: submittedInspection.id,
        note: noteRow.note,
        createdByAuthUserId: author.authUserId,
        createdByEmail: author.email,
        createdAt: noteRow.createdAt,
      },
    ]);
  });

  it("returns no Correction Notes for malformed target ids", async () => {
    await expect(
      listCorrectionNotes({ targetType: "ticket", targetId: "not-a-uuid" }),
    ).resolves.toEqual([]);

    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns null for malformed Submitted Inspection correction-note target ids", async () => {
    await expect(
      getSubmittedInspectionCorrectionNoteTarget("not-a-uuid"),
    ).resolves.toBeNull();

    expect(db.select).not.toHaveBeenCalled();
  });
});
