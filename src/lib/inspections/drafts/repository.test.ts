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
  insertReturning,
} = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
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
  insertReturning: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const {
  ActiveBuildingInspectionPlanRequiredForDraftError,
  ActiveBuildingRequiredForDraftError,
  ActiveDraftInspectionAlreadyExistsError,
  getDraftInspection,
  listActiveDraftInspections,
  startDraftInspection,
} = await import("./repository");

const createdAt = new Date("2026-05-29T14:00:00Z");
const startedAt = new Date("2026-05-29T14:30:00Z");
const archivedAt = new Date("2026-05-29T15:00:00Z");

const clientRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Acme Facilities",
  archivedAt: null,
};

const buildingRow = {
  id: "33333333-3333-4333-8333-333333333333",
  clientId: clientRow.id,
  name: "North Tower",
  archivedAt: null,
};

const planRow = {
  id: "19191919-1919-4191-8191-191919191919",
  buildingId: buildingRow.id,
  createdAt,
  updatedAt: createdAt,
};

const planEntryRow = {
  id: "20202020-2020-4202-8202-202020202020",
  planId: planRow.id,
  areaId: "77777777-7777-4777-8777-777777777777",
  inspectionTemplateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  position: 1,
  createdAt,
  updatedAt: createdAt,
};

const areaRow = {
  id: planEntryRow.areaId,
  buildingId: buildingRow.id,
  areaTypeId: "55555555-5555-4555-8555-555555555555",
  name: "First Floor Restroom",
  archivedAt: null,
};

const areaTypeRow = {
  id: areaRow.areaTypeId,
  name: "Restroom",
  archivedAt: null,
};

const inspectionTemplateRow = {
  id: planEntryRow.inspectionTemplateId,
  name: "Restroom Standard",
  description: "Weekly restroom checks",
  archivedAt: null,
};

const inspectionTemplateSectionRow = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  name: "Fixtures",
};

const inspectionTemplateItemRow = {
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  templateId: inspectionTemplateRow.id,
  sectionId: inspectionTemplateSectionRow.id,
  position: 1,
  name: "Mirrors",
  description: "No streaks",
};

const starter = {
  authUserId: "99999999-9999-4999-8999-999999999999",
  email: "supervisor@example.com",
};

const savedInspectionRow = {
  id: "abababab-abab-4aba-8aba-abababababab",
  status: "draft" as const,
  clientId: clientRow.id,
  buildingId: buildingRow.id,
  clientNameSnapshot: clientRow.name,
  buildingNameSnapshot: buildingRow.name,
  startedByAuthUserId: starter.authUserId,
  startedByEmail: starter.email,
  startedAt,
  createdAt: startedAt,
  updatedAt: startedAt,
};

const submittedInspectionRow = {
  ...savedInspectionRow,
  id: "bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc",
  status: "submitted" as const,
};

const savedAreaInspectionRow = {
  id: "cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd",
  inspectionId: savedInspectionRow.id,
  source: "planned" as const,
  position: 1,
  areaId: areaRow.id,
  areaTypeId: areaTypeRow.id,
  inspectionTemplateId: inspectionTemplateRow.id,
  areaNameSnapshot: areaRow.name,
  areaTypeNameSnapshot: areaTypeRow.name,
  inspectionTemplateNameSnapshot: inspectionTemplateRow.name,
  inspectionTemplateDescriptionSnapshot: inspectionTemplateRow.description,
  createdAt: startedAt,
  updatedAt: startedAt,
};

const savedInspectionItemRow = {
  id: "efefefef-efef-4efe-8efe-efefefefefef",
  areaInspectionId: savedAreaInspectionRow.id,
  sourceTemplateItemId: inspectionTemplateItemRow.id,
  sourceTemplateSectionId: inspectionTemplateSectionRow.id,
  position: 1,
  sectionNameSnapshot: inspectionTemplateSectionRow.name,
  itemNameSnapshot: inspectionTemplateItemRow.name,
  itemDescriptionSnapshot: inspectionTemplateItemRow.description,
  createdAt: startedAt,
  updatedAt: startedAt,
};

function activePlanHydrationRow() {
  return {
    plan: planRow,
    building: buildingRow,
    client: clientRow,
    entry: planEntryRow,
    area: areaRow,
    areaType: areaTypeRow,
    inspectionTemplate: inspectionTemplateRow,
  };
}

function templateItemHydrationRow() {
  return {
    item: inspectionTemplateItemRow,
    section: inspectionTemplateSectionRow,
  };
}

describe("Draft Inspection repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    selectFrom.mockReturnValue({
      innerJoin: selectInnerJoin,
      leftJoin: selectLeftJoin,
      where: selectWhere,
      orderBy: selectOrderBy,
      limit: selectLimit,
    });
    selectInnerJoin.mockReturnValue({
      innerJoin: selectInnerJoin,
      leftJoin: selectLeftJoin,
      where: selectWhere,
      orderBy: selectOrderBy,
      limit: selectLimit,
    });
    selectLeftJoin.mockReturnValue({
      leftJoin: selectLeftJoin,
      where: selectWhere,
      orderBy: selectOrderBy,
    });
    selectWhere.mockReturnValue({
      for: selectForUpdate,
      limit: selectLimit,
      orderBy: selectOrderBy,
    });
    selectForUpdate.mockReturnValue({ limit: selectLimit });
    db.select.mockReturnValue({ from: selectFrom });
    db.transaction.mockImplementation(async (callback) => callback(db));
    db.insert.mockReturnValue({ values: insertValues });
    insertValues.mockReturnValue({ returning: insertReturning });
  });

  it("starts a Draft Inspection from a non-empty active Building Inspection Plan", async () => {
    selectLimit.mockResolvedValueOnce([{ building: buildingRow, client: clientRow }]);
    selectLimit.mockResolvedValueOnce([]);
    selectOrderBy.mockResolvedValueOnce([activePlanHydrationRow()]);
    selectOrderBy.mockResolvedValueOnce([templateItemHydrationRow()]);
    insertReturning.mockResolvedValueOnce([savedInspectionRow]);
    insertReturning.mockResolvedValueOnce([savedAreaInspectionRow]);
    insertReturning.mockResolvedValueOnce([savedInspectionItemRow]);

    await expect(
      startDraftInspection({ buildingId: buildingRow.id }, starter),
    ).resolves.toEqual({
      id: savedInspectionRow.id,
      status: "draft",
      clientId: clientRow.id,
      buildingId: buildingRow.id,
      clientNameSnapshot: clientRow.name,
      buildingNameSnapshot: buildingRow.name,
      startedByAuthUserId: starter.authUserId,
      startedByEmail: starter.email,
      startedAt,
      areaInspections: [
        {
          id: savedAreaInspectionRow.id,
          inspectionId: savedInspectionRow.id,
          source: "planned",
          position: 1,
          areaId: areaRow.id,
          areaTypeId: areaTypeRow.id,
          inspectionTemplateId: inspectionTemplateRow.id,
          areaNameSnapshot: areaRow.name,
          areaTypeNameSnapshot: areaTypeRow.name,
          inspectionTemplateNameSnapshot: inspectionTemplateRow.name,
          inspectionTemplateDescriptionSnapshot: inspectionTemplateRow.description,
          items: [
            {
              id: savedInspectionItemRow.id,
              areaInspectionId: savedAreaInspectionRow.id,
              sourceTemplateItemId: inspectionTemplateItemRow.id,
              sourceTemplateSectionId: inspectionTemplateSectionRow.id,
              position: 1,
              sectionNameSnapshot: inspectionTemplateSectionRow.name,
              itemNameSnapshot: inspectionTemplateItemRow.name,
              itemDescriptionSnapshot: inspectionTemplateItemRow.description,
            },
          ],
        },
      ],
    });

    expect(insertValues).toHaveBeenNthCalledWith(1, {
      status: "draft",
      clientId: clientRow.id,
      buildingId: buildingRow.id,
      clientNameSnapshot: clientRow.name,
      buildingNameSnapshot: buildingRow.name,
      startedByAuthUserId: starter.authUserId,
      startedByEmail: starter.email,
    });
    expect(insertValues).toHaveBeenNthCalledWith(2, [
      {
        inspectionId: savedInspectionRow.id,
        source: "planned",
        position: 1,
        areaId: areaRow.id,
        areaTypeId: areaTypeRow.id,
        inspectionTemplateId: inspectionTemplateRow.id,
        areaNameSnapshot: areaRow.name,
        areaTypeNameSnapshot: areaTypeRow.name,
        inspectionTemplateNameSnapshot: inspectionTemplateRow.name,
        inspectionTemplateDescriptionSnapshot: inspectionTemplateRow.description,
      },
    ]);
    expect(insertValues).toHaveBeenNthCalledWith(3, [
      {
        areaInspectionId: savedAreaInspectionRow.id,
        sourceTemplateItemId: inspectionTemplateItemRow.id,
        sourceTemplateSectionId: inspectionTemplateSectionRow.id,
        position: 1,
        sectionNameSnapshot: inspectionTemplateSectionRow.name,
        itemNameSnapshot: inspectionTemplateItemRow.name,
        itemDescriptionSnapshot: inspectionTemplateItemRow.description,
      },
    ]);
    expect(insertValues).not.toHaveBeenCalledWith(
      expect.objectContaining({ buildingInspectionPlanEntryId: planEntryRow.id }),
    );
  });

  it("blocks starting a Draft Inspection for an inactive Building", async () => {
    selectLimit.mockResolvedValueOnce([
      { building: { ...buildingRow, archivedAt }, client: clientRow },
    ]);

    await expect(
      startDraftInspection({ buildingId: buildingRow.id }, starter),
    ).rejects.toBeInstanceOf(ActiveBuildingRequiredForDraftError);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("blocks starting a Draft Inspection when the Building has no plan", async () => {
    selectLimit.mockResolvedValueOnce([{ building: buildingRow, client: clientRow }]);
    selectLimit.mockResolvedValueOnce([]);
    selectOrderBy.mockResolvedValueOnce([]);

    await expect(
      startDraftInspection({ buildingId: buildingRow.id }, starter),
    ).rejects.toBeInstanceOf(ActiveBuildingInspectionPlanRequiredForDraftError);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("blocks starting a Draft Inspection from an empty Building Inspection Plan", async () => {
    selectLimit.mockResolvedValueOnce([{ building: buildingRow, client: clientRow }]);
    selectLimit.mockResolvedValueOnce([]);
    selectOrderBy.mockResolvedValueOnce([
      {
        ...activePlanHydrationRow(),
        entry: null,
        area: null,
        areaType: null,
        inspectionTemplate: null,
      },
    ]);

    await expect(
      startDraftInspection({ buildingId: buildingRow.id }, starter),
    ).rejects.toBeInstanceOf(ActiveBuildingInspectionPlanRequiredForDraftError);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("blocks starting a Draft Inspection from a stale-only Building Inspection Plan", async () => {
    selectLimit.mockResolvedValueOnce([{ building: buildingRow, client: clientRow }]);
    selectLimit.mockResolvedValueOnce([]);
    selectOrderBy.mockResolvedValueOnce([
      {
        ...activePlanHydrationRow(),
        area: { ...areaRow, archivedAt },
      },
    ]);

    await expect(
      startDraftInspection({ buildingId: buildingRow.id }, starter),
    ).rejects.toBeInstanceOf(ActiveBuildingInspectionPlanRequiredForDraftError);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("blocks a duplicate active Draft Inspection for the same Building", async () => {
    selectLimit.mockResolvedValueOnce([{ building: buildingRow, client: clientRow }]);
    selectLimit.mockResolvedValueOnce([{ id: savedInspectionRow.id }]);

    const result = startDraftInspection({ buildingId: buildingRow.id }, starter);

    await expect(result).rejects.toBeInstanceOf(ActiveDraftInspectionAlreadyExistsError);
    await expect(result).rejects.toMatchObject({
      draftInspectionId: savedInspectionRow.id,
    });
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("hydrates a Draft Inspection from stored snapshots", async () => {
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: {
          ...savedAreaInspectionRow,
          areaNameSnapshot: "Original Restroom",
          inspectionTemplateNameSnapshot: "Original Template",
        },
        item: {
          ...savedInspectionItemRow,
          itemNameSnapshot: "Original Mirror Check",
        },
      },
    ]);

    await expect(getDraftInspection(savedInspectionRow.id)).resolves.toEqual(
      expect.objectContaining({
        id: savedInspectionRow.id,
        buildingNameSnapshot: buildingRow.name,
        areaInspections: [
          expect.objectContaining({
            areaNameSnapshot: "Original Restroom",
            inspectionTemplateNameSnapshot: "Original Template",
            items: [
              expect.objectContaining({ itemNameSnapshot: "Original Mirror Check" }),
            ],
          }),
        ],
      }),
    );
  });

  it("lists active Draft Inspections with snapshot metadata and counts", async () => {
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: savedInspectionItemRow,
      },
      {
        inspection: submittedInspectionRow,
        areaInspection: null,
        item: null,
      },
    ]);

    await expect(listActiveDraftInspections()).resolves.toEqual([
      {
        id: savedInspectionRow.id,
        buildingId: buildingRow.id,
        clientId: clientRow.id,
        buildingNameSnapshot: buildingRow.name,
        clientNameSnapshot: clientRow.name,
        startedByEmail: starter.email,
        startedAt,
        areaInspectionCount: 1,
        itemCount: 1,
      },
    ]);
  });
});
