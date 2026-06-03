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
  updateSet,
  updateWhere,
  deleteWhere,
} = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  deleteWhere: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const {
  ActiveBuildingInspectionPlanRequiredForDraftError,
  ActiveBuildingRequiredForDraftError,
  ActiveDraftInspectionAlreadyExistsError,
  DraftInspectionMutationNotAllowedError,
  DraftInspectionNotFoundError,
  DraftSubmissionConfirmationRequiredError,
  DraftSubmissionValidationError,
  addDraftInspectionItemBeforePhoto,
  addOneOffAreaInspection,
  discardDraftInspection,
  getDraftInspection,
  listActiveDraftInspections,
  removeDraftInspectionItemBeforePhoto,
  saveDraftInspectionItemResult,
  skipDraftAreaInspection,
  startDraftInspection,
  submitDraftInspection,
  unskipDraftAreaInspection,
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
  submittedByAuthUserId: null,
  submittedByEmail: null,
  submittedAt: null,
};

const submittedInspectionRow = {
  ...savedInspectionRow,
  id: "bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc",
  status: "submitted" as const,
  submittedByAuthUserId: starter.authUserId,
  submittedByEmail: starter.email,
  submittedAt: new Date("2026-05-29T15:30:00Z"),
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
  isSkipped: false,
  skipReason: null,
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
  resultStatus: null,
  resultNote: null,
  createdAt: startedAt,
  updatedAt: startedAt,
};

const beforePhotoEvidenceRow = {
  id: "10101010-1010-4101-8101-101010101010",
  inspectionItemId: savedInspectionItemRow.id,
  evidenceType: "before_photo" as const,
  storagePath: "inspections/drafts/photo.jpg",
  uploadedByAuthUserId: starter.authUserId,
  uploadedAt: new Date("2026-05-29T15:00:00Z"),
  createdAt: new Date("2026-05-29T15:00:00Z"),
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
    updateSet.mockReturnValue({ where: updateWhere });
    db.update.mockReturnValue({ set: updateSet });
    db.delete.mockReturnValue({ where: deleteWhere });
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
          isSkipped: false,
          skipReason: null,
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
              resultStatus: null,
              resultNote: null,
              beforePhotos: [],
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

  it("saves an item result on a Draft Inspection", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: savedInspectionItemRow,
      },
    ]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: {
          ...savedInspectionItemRow,
          resultStatus: "fail",
          resultNote: "Mirror cracked",
        },
        evidence: beforePhotoEvidenceRow,
      },
    ]);

    await expect(
      saveDraftInspectionItemResult({
        inspectionId: savedInspectionRow.id,
        itemId: savedInspectionItemRow.id,
        resultStatus: "fail",
        resultNote: "Mirror cracked",
      }),
    ).resolves.toMatchObject({
      id: savedInspectionRow.id,
      areaInspections: [
        {
          items: [
            expect.objectContaining({
              id: savedInspectionItemRow.id,
              resultStatus: "fail",
              resultNote: "Mirror cracked",
            }),
          ],
        },
      ],
    });

    expect(updateSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ resultStatus: "fail", resultNote: "Mirror cracked" }),
    );
    expect(db.select.mock.calls[0]?.[0]).not.toHaveProperty("evidence");
  });

  it.each(["pass", "not_applicable"] as const)(
    "returns deleted Before Photo paths when a failed item changes to %s",
    async (resultStatus) => {
      selectLimit.mockResolvedValueOnce([
        {
          inspection: savedInspectionRow,
          areaInspection: savedAreaInspectionRow,
          item: { ...savedInspectionItemRow, resultStatus: "fail" },
        },
      ]);
      selectOrderBy
        .mockResolvedValueOnce([{ storagePath: beforePhotoEvidenceRow.storagePath }])
        .mockResolvedValueOnce([
          {
            inspection: savedInspectionRow,
            areaInspection: savedAreaInspectionRow,
            item: { ...savedInspectionItemRow, resultStatus, resultNote: null },
            evidence: null,
          },
        ]);

      await expect(
        saveDraftInspectionItemResult({
          inspectionId: savedInspectionRow.id,
          itemId: savedInspectionItemRow.id,
          resultStatus,
          resultNote: "",
        }),
      ).resolves.toMatchObject({
        id: savedInspectionRow.id,
        removedStoragePaths: [beforePhotoEvidenceRow.storagePath],
      });

      expect(deleteWhere).toHaveBeenCalledTimes(1);
    },
  );

  it("blocks editing items in a skipped Area Inspection", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: { ...savedAreaInspectionRow, isSkipped: true, skipReason: "Closed" },
        item: savedInspectionItemRow,
      },
    ]);

    await expect(
      saveDraftInspectionItemResult({
        inspectionId: savedInspectionRow.id,
        itemId: savedInspectionItemRow.id,
        resultStatus: "pass",
        resultNote: "",
      }),
    ).rejects.toBeInstanceOf(DraftInspectionMutationNotAllowedError);
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("adds Before Photo evidence only to failed Draft Inspection items", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: { ...savedInspectionItemRow, resultStatus: "fail" },
      },
    ]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: { ...savedInspectionItemRow, resultStatus: "fail" },
        evidence: beforePhotoEvidenceRow,
      },
    ]);

    await expect(
      addDraftInspectionItemBeforePhoto({
        inspectionId: savedInspectionRow.id,
        itemId: savedInspectionItemRow.id,
        storagePath: ` ${beforePhotoEvidenceRow.storagePath} `,
        uploadedByAuthUserId: starter.authUserId,
      }),
    ).resolves.toMatchObject({
      areaInspections: [
        {
          items: [
            expect.objectContaining({
              beforePhotos: [expect.objectContaining({ storagePath: beforePhotoEvidenceRow.storagePath })],
            }),
          ],
        },
      ],
    });

    expect(insertValues).toHaveBeenCalledWith({
      inspectionItemId: savedInspectionItemRow.id,
      evidenceType: "before_photo",
      storagePath: beforePhotoEvidenceRow.storagePath,
      uploadedByAuthUserId: starter.authUserId,
    });
  });

  it("rejects Before Photo evidence on non-failed items", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: { ...savedInspectionItemRow, resultStatus: "pass" },
      },
    ]);

    await expect(
      addDraftInspectionItemBeforePhoto({
        inspectionId: savedInspectionRow.id,
        itemId: savedInspectionItemRow.id,
        storagePath: beforePhotoEvidenceRow.storagePath,
        uploadedByAuthUserId: starter.authUserId,
      }),
    ).rejects.toBeInstanceOf(DraftInspectionMutationNotAllowedError);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("removes Before Photo metadata and returns the stored object path", async () => {
    selectLimit.mockResolvedValueOnce([{ evidence: beforePhotoEvidenceRow }]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: { ...savedInspectionItemRow, resultStatus: "fail" },
        evidence: null,
      },
    ]);

    await expect(
      removeDraftInspectionItemBeforePhoto({
        inspectionId: savedInspectionRow.id,
        itemId: savedInspectionItemRow.id,
        evidenceId: beforePhotoEvidenceRow.id,
      }),
    ).resolves.toMatchObject({
      draft: { id: savedInspectionRow.id },
      storagePath: beforePhotoEvidenceRow.storagePath,
    });

    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ updatedAt: expect.anything() }));
  });

  it("marks planned Area Inspections skipped, clears item results, and returns deleted Before Photo paths", async () => {
    selectLimit.mockResolvedValueOnce([{ areaInspection: savedAreaInspectionRow }]);
    selectOrderBy
      .mockResolvedValueOnce([{ storagePath: beforePhotoEvidenceRow.storagePath }])
      .mockResolvedValueOnce([
        {
          inspection: savedInspectionRow,
          areaInspection: {
            ...savedAreaInspectionRow,
            isSkipped: true,
            skipReason: "Tenant denied access",
          },
          item: savedInspectionItemRow,
        },
      ]);

    await expect(
      skipDraftAreaInspection({
        inspectionId: savedInspectionRow.id,
        areaInspectionId: savedAreaInspectionRow.id,
        skipReason: " Tenant denied access ",
      }),
    ).resolves.toMatchObject({
      removedStoragePaths: [beforePhotoEvidenceRow.storagePath],
      areaInspections: [
        expect.objectContaining({ isSkipped: true, skipReason: "Tenant denied access" }),
      ],
    });

    expect(updateSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ isSkipped: true, skipReason: "Tenant denied access" }),
    );
    expect(updateSet).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ resultStatus: null, resultNote: null }),
    );
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });

  it("rejects skipping one-off Area Inspections", async () => {
    selectLimit.mockResolvedValueOnce([
      { areaInspection: { ...savedAreaInspectionRow, source: "one_off" as const } },
    ]);

    await expect(
      skipDraftAreaInspection({
        inspectionId: savedInspectionRow.id,
        areaInspectionId: savedAreaInspectionRow.id,
        skipReason: "Not needed",
      }),
    ).rejects.toBeInstanceOf(DraftInspectionMutationNotAllowedError);
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("unskips planned Area Inspections", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        areaInspection: {
          ...savedAreaInspectionRow,
          isSkipped: true,
          skipReason: "Tenant denied access",
        },
      },
    ]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: savedInspectionItemRow,
      },
    ]);

    await expect(
      unskipDraftAreaInspection({
        inspectionId: savedInspectionRow.id,
        areaInspectionId: savedAreaInspectionRow.id,
      }),
    ).resolves.toMatchObject({
      areaInspections: [expect.objectContaining({ isSkipped: false, skipReason: null })],
    });

    expect(updateSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ isSkipped: false, skipReason: null }),
    );
  });

  it("adds a one-off Area Inspection without changing the Building Inspection Plan", async () => {
    const oneOffAreaInspectionRow = {
      ...savedAreaInspectionRow,
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      source: "one_off" as const,
      position: 2,
    };

    selectLimit.mockResolvedValueOnce([savedInspectionRow]);
    selectLimit.mockResolvedValueOnce([
      {
        area: areaRow,
        areaType: areaTypeRow,
        building: { id: buildingRow.id, archivedAt: null },
        client: { id: clientRow.id, archivedAt: null },
      },
    ]);
    selectLimit.mockResolvedValueOnce([inspectionTemplateRow]);
    selectOrderBy.mockResolvedValueOnce([templateItemHydrationRow()]);
    selectOrderBy.mockResolvedValueOnce([{ position: 1 }]);
    insertReturning.mockResolvedValueOnce([oneOffAreaInspectionRow]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: savedInspectionItemRow,
      },
      {
        inspection: savedInspectionRow,
        areaInspection: oneOffAreaInspectionRow,
        item: { ...savedInspectionItemRow, areaInspectionId: oneOffAreaInspectionRow.id },
      },
    ]);

    await expect(
      addOneOffAreaInspection({
        inspectionId: savedInspectionRow.id,
        areaId: areaRow.id,
        inspectionTemplateId: inspectionTemplateRow.id,
      }),
    ).resolves.toMatchObject({
      areaInspections: [
        expect.objectContaining({ source: "planned" }),
        expect.objectContaining({ source: "one_off", position: 2 }),
      ],
    });

    expect(insertValues).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        inspectionId: savedInspectionRow.id,
        source: "one_off",
        position: 2,
      }),
    );
    expect(insertValues).not.toHaveBeenCalledWith(
      expect.objectContaining({ planId: planRow.id }),
    );
  });

  it("rejects invalid Draft submission without creating Tickets", async () => {
    selectLimit.mockResolvedValueOnce([savedInspectionRow]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: savedInspectionItemRow,
      },
    ]);

    await expect(
      submitDraftInspection(
        { inspectionId: savedInspectionRow.id, confirmSkippedPlannedAreas: false },
        starter,
      ),
    ).rejects.toBeInstanceOf(DraftSubmissionValidationError);
    expect(updateSet).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("submits valid Draft Inspections without Tickets when there are no failed items", async () => {
    const skippedAreaInspectionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

    selectLimit.mockResolvedValueOnce([savedInspectionRow]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: { ...savedInspectionItemRow, resultStatus: "not_applicable" },
      },
      {
        inspection: savedInspectionRow,
        areaInspection: {
          ...savedAreaInspectionRow,
          id: skippedAreaInspectionId,
          isSkipped: true,
          skipReason: "Tenant denied access",
        },
        item: {
          ...savedInspectionItemRow,
          id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          areaInspectionId: skippedAreaInspectionId,
          resultStatus: null,
        },
      },
    ]);

    selectOrderBy.mockResolvedValueOnce([]);

    await expect(
      submitDraftInspection(
        { inspectionId: savedInspectionRow.id, confirmSkippedPlannedAreas: true },
        starter,
      ),
    ).resolves.toEqual({
      id: savedInspectionRow.id,
      status: "submitted",
      ticketCount: 0,
      alreadySubmitted: false,
    });

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "submitted" }),
    );
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("requires confirmation before submitting skipped planned Area Inspections", async () => {
    const skippedAreaInspectionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

    selectLimit.mockResolvedValueOnce([savedInspectionRow]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: { ...savedInspectionItemRow, resultStatus: "not_applicable" },
      },
      {
        inspection: savedInspectionRow,
        areaInspection: {
          ...savedAreaInspectionRow,
          id: skippedAreaInspectionId,
          isSkipped: true,
          skipReason: "Area unavailable",
        },
        item: {
          ...savedInspectionItemRow,
          id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          areaInspectionId: skippedAreaInspectionId,
          resultStatus: null,
        },
      },
    ]);

    await expect(
      submitDraftInspection(
        { inspectionId: savedInspectionRow.id, confirmSkippedPlannedAreas: false },
        starter,
      ),
    ).rejects.toBeInstanceOf(DraftSubmissionConfirmationRequiredError);

    expect(updateSet).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("submits valid Draft Inspections and creates one open Ticket per failed item", async () => {
    selectLimit.mockResolvedValueOnce([savedInspectionRow]);
    selectOrderBy.mockResolvedValueOnce([
      {
        inspection: savedInspectionRow,
        areaInspection: savedAreaInspectionRow,
        item: {
          ...savedInspectionItemRow,
          resultStatus: "fail",
          resultNote: "Mirror cracked",
        },
        evidence: beforePhotoEvidenceRow,
      },
    ]);

    selectOrderBy.mockResolvedValueOnce([{ id: "12121212-1212-4121-8121-121212121212" }]);

    await expect(
      submitDraftInspection(
        { inspectionId: savedInspectionRow.id, confirmSkippedPlannedAreas: false },
        starter,
      ),
    ).resolves.toEqual({
      id: savedInspectionRow.id,
      status: "submitted",
      ticketCount: 1,
      alreadySubmitted: false,
    });

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "submitted",
        submittedByAuthUserId: starter.authUserId,
        submittedByEmail: starter.email,
      }),
    );
    expect(insertValues).toHaveBeenCalledWith([
      expect.objectContaining({
        status: "open",
        inspectionId: savedInspectionRow.id,
        areaInspectionId: savedAreaInspectionRow.id,
        inspectionItemId: savedInspectionItemRow.id,
        title: `${savedAreaInspectionRow.areaNameSnapshot} — ${savedInspectionItemRow.itemNameSnapshot}`,
      }),
    ]);
    expect(insertValues.mock.calls.at(-1)?.[0][0]).not.toHaveProperty("ticketNumber");
  });

  it("treats already-submitted inspections as successful retries without duplicate Tickets", async () => {
    selectLimit.mockResolvedValueOnce([submittedInspectionRow]);
    selectOrderBy.mockResolvedValueOnce([
      { id: "12121212-1212-4121-8121-121212121212" },
      { id: "23232323-2323-4232-8232-232323232323" },
    ]);

    await expect(
      submitDraftInspection(
        { inspectionId: submittedInspectionRow.id, confirmSkippedPlannedAreas: false },
        starter,
      ),
    ).resolves.toEqual({
      id: submittedInspectionRow.id,
      status: "submitted",
      ticketCount: 2,
      alreadySubmitted: true,
    });

    expect(updateSet).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("discards Draft Inspections by deleting the draft root row and returning deleted Before Photo paths", async () => {
    selectLimit.mockResolvedValueOnce([{ id: savedInspectionRow.id }]);
    selectOrderBy.mockResolvedValueOnce([{ storagePath: beforePhotoEvidenceRow.storagePath }]);

    await expect(
      discardDraftInspection({ inspectionId: savedInspectionRow.id }),
    ).resolves.toEqual({
      discardedInspectionId: savedInspectionRow.id,
      removedStoragePaths: [beforePhotoEvidenceRow.storagePath],
    });

    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("rejects submitted Inspection discard attempts", async () => {
    selectLimit.mockResolvedValueOnce([]);

    await expect(
      discardDraftInspection({ inspectionId: submittedInspectionRow.id }),
    ).rejects.toBeInstanceOf(DraftInspectionNotFoundError);

    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it("rejects submitted Inspection item edits", async () => {
    selectLimit.mockResolvedValueOnce([]);

    await expect(
      saveDraftInspectionItemResult({
        inspectionId: submittedInspectionRow.id,
        itemId: savedInspectionItemRow.id,
        resultStatus: "pass",
        resultNote: "Changed after submission",
      }),
    ).rejects.toBeInstanceOf(DraftInspectionNotFoundError);

    expect(updateSet).not.toHaveBeenCalled();
  });

  it("rejects submitted Inspection Before Photo changes", async () => {
    selectLimit.mockResolvedValueOnce([]);

    await expect(
      addDraftInspectionItemBeforePhoto({
        inspectionId: submittedInspectionRow.id,
        itemId: savedInspectionItemRow.id,
        storagePath: beforePhotoEvidenceRow.storagePath,
        uploadedByAuthUserId: starter.authUserId,
      }),
    ).rejects.toBeInstanceOf(DraftInspectionNotFoundError);

    expect(insertValues).not.toHaveBeenCalled();
    expect(updateSet).not.toHaveBeenCalled();
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
