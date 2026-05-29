import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  db,
  selectFrom,
  selectInnerJoin,
  selectWhere,
  selectForUpdate,
  selectOrderBy,
  insertValues,
  insertReturning,
  updateSet,
  updateWhere,
  updateReturning,
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
  selectWhere: vi.fn(),
  selectForUpdate: vi.fn(),
  selectOrderBy: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
  deleteWhere: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const {
  ActiveAreaParentsRequiredError,
  archiveArea,
  archiveAreaType,
  archiveBuilding,
  archiveClient,
  archiveInspectionTemplate,
  createArea,
  createAreaType,
  createBuilding,
  createClient,
  createInspectionTemplate,
  duplicateInspectionTemplate,
  getArea,
  getAreaType,
  getBuilding,
  getClient,
  listAreaTypes,
  listAreas,
  listBuildings,
  listClients,
  restoreArea,
  restoreInspectionTemplate,
  restoreAreaType,
  restoreBuilding,
  restoreClient,
  updateArea,
  updateAreaType,
  updateBuilding,
  updateClient,
  updateInspectionTemplate,
} = await import("./repository");

const createdAt = new Date("2026-05-28T00:00:00Z");
const updatedAt = new Date("2026-05-28T00:00:00Z");
const archivedAt = new Date("2026-05-28T01:00:00Z");

const activeClientRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Acme Facilities",
  archivedAt: null,
  createdAt,
  updatedAt,
};

const archivedClientRow = {
  ...activeClientRow,
  id: "22222222-2222-4222-8222-222222222222",
  name: "Archived Client",
  archivedAt,
};

const activeBuildingRow = {
  building: {
    id: "33333333-3333-4333-8333-333333333333",
    clientId: activeClientRow.id,
    name: "North Tower",
    archivedAt: null,
    createdAt,
    updatedAt,
  },
  client: {
    name: activeClientRow.name,
    archivedAt: null,
  },
};

const buildingUnderArchivedClientRow = {
  building: {
    ...activeBuildingRow.building,
    id: "44444444-4444-4444-8444-444444444444",
    clientId: archivedClientRow.id,
  },
  client: {
    name: archivedClientRow.name,
    archivedAt,
  },
};

const activeAreaTypeRow = {
  id: "55555555-5555-4555-8555-555555555555",
  name: "Restroom",
  archivedAt: null,
  createdAt,
  updatedAt,
};

const archivedAreaTypeRow = {
  ...activeAreaTypeRow,
  id: "66666666-6666-4666-8666-666666666666",
  name: "Archived Area Type",
  archivedAt,
};

const activeAreaRow = {
  area: {
    id: "77777777-7777-4777-8777-777777777777",
    buildingId: activeBuildingRow.building.id,
    areaTypeId: activeAreaTypeRow.id,
    name: "First Floor Restroom",
    archivedAt: null,
    createdAt,
    updatedAt,
  },
  building: {
    id: activeBuildingRow.building.id,
    name: activeBuildingRow.building.name,
    archivedAt: null,
  },
  client: {
    id: activeClientRow.id,
    name: activeClientRow.name,
    archivedAt: null,
  },
  areaType: {
    name: activeAreaTypeRow.name,
    archivedAt: null,
  },
};

const areaUnderArchivedClientRow = {
  ...activeAreaRow,
  area: {
    ...activeAreaRow.area,
    id: "88888888-8888-4888-8888-888888888888",
    buildingId: buildingUnderArchivedClientRow.building.id,
  },
  building: {
    id: buildingUnderArchivedClientRow.building.id,
    name: buildingUnderArchivedClientRow.building.name,
    archivedAt: null,
  },
  client: {
    id: archivedClientRow.id,
    name: archivedClientRow.name,
    archivedAt,
  },
};

const areaWithArchivedAreaTypeRow = {
  ...activeAreaRow,
  area: {
    ...activeAreaRow.area,
    id: "99999999-9999-4999-8999-999999999999",
    areaTypeId: archivedAreaTypeRow.id,
  },
  areaType: {
    name: archivedAreaTypeRow.name,
    archivedAt,
  },
};

const activeInspectionTemplateRow = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Restroom Standard",
  description: "Weekly restroom checks",
  archivedAt: null,
  createdAt,
  updatedAt,
};

const archivedInspectionTemplateRow = {
  ...activeInspectionTemplateRow,
  archivedAt,
};

const copiedInspectionTemplateRow = {
  ...activeInspectionTemplateRow,
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  name: "Restroom Standard Copy",
};

const inspectionTemplateSectionRow = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  templateId: activeInspectionTemplateRow.id,
  name: "Fixtures",
  position: 1,
  createdAt,
  updatedAt,
};

const copiedInspectionTemplateSectionRow = {
  ...inspectionTemplateSectionRow,
  id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  templateId: copiedInspectionTemplateRow.id,
};

const inspectionTemplateItemRow = {
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  templateId: activeInspectionTemplateRow.id,
  sectionId: inspectionTemplateSectionRow.id,
  name: "Mirrors",
  description: "No streaks",
  position: 1,
  createdAt,
  updatedAt,
};

const copiedInspectionTemplateItemRow = {
  ...inspectionTemplateItemRow,
  id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  templateId: copiedInspectionTemplateRow.id,
  sectionId: copiedInspectionTemplateSectionRow.id,
};

function mockHydratedInspectionTemplate(
  row: typeof activeInspectionTemplateRow | typeof archivedInspectionTemplateRow,
  sections = [inspectionTemplateSectionRow],
  items = [inspectionTemplateItemRow],
): void {
  const selectLimit = vi.fn().mockResolvedValueOnce([row]);
  selectWhere.mockReturnValueOnce({ limit: selectLimit });
  selectOrderBy.mockResolvedValueOnce(sections).mockResolvedValueOnce(items);
}

describe("Client and Building setup repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    selectFrom.mockReturnValue({
      innerJoin: selectInnerJoin,
      where: selectWhere,
      orderBy: selectOrderBy,
      limit: vi.fn(),
    });
    selectInnerJoin.mockReturnValue({
      innerJoin: selectInnerJoin,
      where: selectWhere,
      orderBy: selectOrderBy,
    });
    selectForUpdate.mockReturnValue({ limit: vi.fn() });
    selectWhere.mockReturnValue({
      for: selectForUpdate,
      orderBy: selectOrderBy,
      limit: vi.fn(),
    });
    db.select.mockReturnValue({ from: selectFrom });
    db.transaction.mockImplementation(async (callback) => callback(db));

    insertValues.mockReturnValue({ returning: insertReturning });
    db.insert.mockReturnValue({ values: insertValues });

    updateSet.mockReturnValue({ where: updateWhere });
    updateWhere.mockReturnValue({ returning: updateReturning });
    db.update.mockReturnValue({ set: updateSet });
    db.delete.mockReturnValue({ where: deleteWhere });
  });

  it("returns null for malformed Client and Building ids", async () => {
    await expect(getClient("not-a-uuid")).resolves.toBeNull();
    await expect(getBuilding("not-a-uuid")).resolves.toBeNull();

    expect(db.select).not.toHaveBeenCalled();
  });

  it("creates Clients with normalized setup input", async () => {
    insertReturning.mockResolvedValueOnce([activeClientRow]);

    await expect(createClient({ name: "Acme Facilities" })).resolves.toEqual({
      ...activeClientRow,
      isArchived: false,
    });

    expect(insertValues).toHaveBeenCalledWith({ name: "Acme Facilities" });
  });

  it("lists active Clients without returning archived Clients", async () => {
    selectOrderBy.mockResolvedValueOnce([activeClientRow]);

    await expect(listClients()).resolves.toEqual([
      { ...activeClientRow, isArchived: false },
    ]);

    expect(selectWhere).toHaveBeenCalledTimes(1);
  });

  it("can list historical Clients including archived records", async () => {
    selectOrderBy.mockResolvedValueOnce([activeClientRow, archivedClientRow]);

    await expect(listClients({ visibility: "historical" })).resolves.toEqual([
      { ...activeClientRow, isArchived: false },
      { ...archivedClientRow, isArchived: true },
    ]);

    expect(selectWhere).not.toHaveBeenCalled();
  });

  it("archives and restores Clients without deleting records", async () => {
    updateReturning
      .mockResolvedValueOnce([archivedClientRow])
      .mockResolvedValueOnce([activeClientRow]);

    await expect(archiveClient(activeClientRow.id)).resolves.toEqual({
      ...archivedClientRow,
      isArchived: true,
    });
    await expect(restoreClient(activeClientRow.id)).resolves.toEqual({
      ...activeClientRow,
      isArchived: false,
    });

    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws a not-found error when a Client mutation matches no rows", async () => {
    updateReturning.mockResolvedValueOnce([]);

    await expect(
      updateClient(activeClientRow.id, { name: "Renamed Client" }),
    ).rejects.toMatchObject({
      name: "SetupRecordNotFoundError",
      message: "Client setup record was not found.",
    });
  });

  it("requires an active parent Client before creating a Building", async () => {
    const selectLimit = vi.fn().mockResolvedValueOnce([activeClientRow]);
    selectWhere.mockReturnValueOnce({
      for: vi.fn(() => ({ limit: selectLimit })),
    });
    insertReturning.mockResolvedValueOnce([activeBuildingRow.building]);
    selectOrderBy.mockResolvedValueOnce([activeBuildingRow]);

    await expect(
      createBuilding({ clientId: activeClientRow.id, name: "North Tower" }),
    ).resolves.toEqual({
      ...activeBuildingRow.building,
      clientName: activeClientRow.name,
      clientArchivedAt: null,
      isArchived: false,
      isParentArchived: false,
      isActive: true,
    });

    expect(insertValues).toHaveBeenCalledWith({
      clientId: activeClientRow.id,
      name: "North Tower",
    });
  });

  it("rejects Building creation under an archived Client", async () => {
    const selectLimit = vi.fn().mockResolvedValueOnce([archivedClientRow]);
    selectWhere.mockReturnValueOnce({
      for: vi.fn(() => ({ limit: selectLimit })),
    });

    await expect(
      createBuilding({ clientId: archivedClientRow.id, name: "South Tower" }),
    ).rejects.toThrow("Building must belong to an active Client.");

    expect(insertValues).not.toHaveBeenCalled();
  });

  it("lists active Buildings only when both Building and Client are active", async () => {
    selectOrderBy.mockResolvedValueOnce([activeBuildingRow]);

    await expect(listBuildings()).resolves.toEqual([
      {
        ...activeBuildingRow.building,
        clientName: activeClientRow.name,
        clientArchivedAt: null,
        isArchived: false,
        isParentArchived: false,
        isActive: true,
      },
    ]);

    expect(selectWhere).toHaveBeenCalledTimes(1);
  });

  it("can list historical Buildings under archived Clients", async () => {
    selectOrderBy.mockResolvedValueOnce([
      activeBuildingRow,
      buildingUnderArchivedClientRow,
    ]);

    await expect(listBuildings({ visibility: "historical" })).resolves.toEqual([
      {
        ...activeBuildingRow.building,
        clientName: activeClientRow.name,
        clientArchivedAt: null,
        isArchived: false,
        isParentArchived: false,
        isActive: true,
      },
      {
        ...buildingUnderArchivedClientRow.building,
        clientName: archivedClientRow.name,
        clientArchivedAt: archivedAt,
        isArchived: false,
        isParentArchived: true,
        isActive: false,
      },
    ]);
  });

  it("restores a Building without making it active while its parent Client is archived", async () => {
    updateReturning.mockResolvedValueOnce([
      buildingUnderArchivedClientRow.building,
    ]);
    selectOrderBy.mockResolvedValueOnce([buildingUnderArchivedClientRow]);

    await expect(restoreBuilding(buildingUnderArchivedClientRow.building.id)).resolves.toEqual({
      ...buildingUnderArchivedClientRow.building,
      clientName: archivedClientRow.name,
      clientArchivedAt: archivedAt,
      isArchived: false,
      isParentArchived: true,
      isActive: false,
    });
  });

  it("archives Buildings instead of deleting them", async () => {
    const archivedBuildingRow = {
      ...activeBuildingRow.building,
      archivedAt,
    };
    updateReturning.mockResolvedValueOnce([archivedBuildingRow]);
    selectOrderBy.mockResolvedValueOnce([
      { ...activeBuildingRow, building: archivedBuildingRow },
    ]);

    await expect(archiveBuilding(activeBuildingRow.building.id)).resolves.toEqual({
      ...archivedBuildingRow,
      clientName: activeClientRow.name,
      clientArchivedAt: null,
      isArchived: true,
      isParentArchived: false,
      isActive: false,
    });

    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws a not-found error when a Building mutation matches no rows", async () => {
    updateReturning.mockResolvedValueOnce([]);

    await expect(
      updateBuilding(activeBuildingRow.building.id, { name: "Renamed Building" }),
    ).rejects.toMatchObject({
      name: "SetupRecordNotFoundError",
      message: "Building setup record was not found.",
    });
  });

  it("returns null for malformed Area Type and Area ids", async () => {
    await expect(getAreaType("not-a-uuid")).resolves.toBeNull();
    await expect(getArea("not-a-uuid")).resolves.toBeNull();

    expect(db.select).not.toHaveBeenCalled();
  });

  it("creates Area Types with normalized setup input", async () => {
    insertReturning.mockResolvedValueOnce([activeAreaTypeRow]);

    await expect(createAreaType({ name: "Restroom" })).resolves.toEqual({
      ...activeAreaTypeRow,
      isArchived: false,
    });

    expect(insertValues).toHaveBeenCalledWith({ name: "Restroom" });
  });

  it("lists active Area Types without returning archived Area Types", async () => {
    selectOrderBy.mockResolvedValueOnce([activeAreaTypeRow]);

    await expect(listAreaTypes()).resolves.toEqual([
      { ...activeAreaTypeRow, isArchived: false },
    ]);

    expect(selectWhere).toHaveBeenCalledTimes(1);
  });

  it("can list historical Area Types including archived records", async () => {
    selectOrderBy.mockResolvedValueOnce([activeAreaTypeRow, archivedAreaTypeRow]);

    await expect(listAreaTypes({ visibility: "historical" })).resolves.toEqual([
      { ...activeAreaTypeRow, isArchived: false },
      { ...archivedAreaTypeRow, isArchived: true },
    ]);

    expect(selectWhere).not.toHaveBeenCalled();
  });

  it("archives and restores Area Types without deleting records", async () => {
    updateReturning
      .mockResolvedValueOnce([archivedAreaTypeRow])
      .mockResolvedValueOnce([activeAreaTypeRow]);

    await expect(archiveAreaType(activeAreaTypeRow.id)).resolves.toEqual({
      ...archivedAreaTypeRow,
      isArchived: true,
    });
    await expect(restoreAreaType(activeAreaTypeRow.id)).resolves.toEqual({
      ...activeAreaTypeRow,
      isArchived: false,
    });

    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws a not-found error when an Area Type mutation matches no rows", async () => {
    updateReturning.mockResolvedValueOnce([]);

    await expect(
      updateAreaType(activeAreaTypeRow.id, { name: "Renamed Area Type" }),
    ).rejects.toMatchObject({
      name: "SetupRecordNotFoundError",
      message: "Area Type setup record was not found.",
    });
  });

  it("requires active Building, Client, and Area Type parents before creating an Area", async () => {
    const buildingLimit = vi.fn().mockResolvedValueOnce([{
      building: activeBuildingRow.building,
      client: { archivedAt: null },
    }]);
    const areaTypeLimit = vi.fn().mockResolvedValueOnce([activeAreaTypeRow]);
    selectWhere
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: buildingLimit })) })
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: areaTypeLimit })) });
    insertReturning.mockResolvedValueOnce([activeAreaRow.area]);
    selectOrderBy.mockResolvedValueOnce([activeAreaRow]);

    await expect(
      createArea({
        buildingId: activeBuildingRow.building.id,
        areaTypeId: activeAreaTypeRow.id,
        name: "First Floor Restroom",
      }),
    ).resolves.toEqual({
      ...activeAreaRow.area,
      buildingName: activeBuildingRow.building.name,
      clientId: activeClientRow.id,
      clientName: activeClientRow.name,
      areaTypeName: activeAreaTypeRow.name,
      buildingArchivedAt: null,
      clientArchivedAt: null,
      areaTypeArchivedAt: null,
      isArchived: false,
      isBuildingArchived: false,
      isClientArchived: false,
      isAreaTypeArchived: false,
      isActive: true,
    });

    expect(insertValues).toHaveBeenCalledWith({
      buildingId: activeBuildingRow.building.id,
      areaTypeId: activeAreaTypeRow.id,
      name: "First Floor Restroom",
    });
  });

  it("rejects Area creation under an archived Building", async () => {
    const buildingLimit = vi.fn().mockResolvedValueOnce([{
      building: { ...activeBuildingRow.building, archivedAt },
      client: { archivedAt: null },
    }]);
    const areaTypeLimit = vi.fn().mockResolvedValueOnce([activeAreaTypeRow]);
    selectWhere
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: buildingLimit })) })
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: areaTypeLimit })) });

    const result = createArea({
      buildingId: activeBuildingRow.building.id,
      areaTypeId: activeAreaTypeRow.id,
      name: "First Floor Restroom",
    });

    await expect(result).rejects.toBeInstanceOf(ActiveAreaParentsRequiredError);
    await expect(result).rejects.toMatchObject({
      fields: ["buildingId"],
    });

    expect(insertValues).not.toHaveBeenCalled();
  });

  it("rejects Area creation under an archived Client", async () => {
    const buildingLimit = vi.fn().mockResolvedValueOnce([{
      building: activeBuildingRow.building,
      client: { archivedAt },
    }]);
    const areaTypeLimit = vi.fn().mockResolvedValueOnce([activeAreaTypeRow]);
    selectWhere
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: buildingLimit })) })
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: areaTypeLimit })) });

    await expect(
      createArea({
        buildingId: activeBuildingRow.building.id,
        areaTypeId: activeAreaTypeRow.id,
        name: "First Floor Restroom",
      }),
    ).rejects.toMatchObject({
      name: "ActiveAreaParentsRequiredError",
      fields: ["buildingId"],
    });

    expect(insertValues).not.toHaveBeenCalled();
  });

  it("rejects Area creation with an archived Area Type", async () => {
    const buildingLimit = vi.fn().mockResolvedValueOnce([{
      building: activeBuildingRow.building,
      client: { archivedAt: null },
    }]);
    const areaTypeLimit = vi.fn().mockResolvedValueOnce([archivedAreaTypeRow]);
    selectWhere
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: buildingLimit })) })
      .mockReturnValueOnce({ for: vi.fn(() => ({ limit: areaTypeLimit })) });

    await expect(
      createArea({
        buildingId: activeBuildingRow.building.id,
        areaTypeId: archivedAreaTypeRow.id,
        name: "First Floor Restroom",
      }),
    ).rejects.toMatchObject({
      name: "ActiveAreaParentsRequiredError",
      fields: ["areaTypeId"],
    });

    expect(insertValues).not.toHaveBeenCalled();
  });

  it("lists active Areas only when Area and all parents are active", async () => {
    selectOrderBy.mockResolvedValueOnce([activeAreaRow]);

    await expect(listAreas()).resolves.toEqual([
      {
        ...activeAreaRow.area,
        buildingName: activeBuildingRow.building.name,
        clientId: activeClientRow.id,
        clientName: activeClientRow.name,
        areaTypeName: activeAreaTypeRow.name,
        buildingArchivedAt: null,
        clientArchivedAt: null,
        areaTypeArchivedAt: null,
        isArchived: false,
        isBuildingArchived: false,
        isClientArchived: false,
        isAreaTypeArchived: false,
        isActive: true,
      },
    ]);

    expect(selectWhere).toHaveBeenCalledTimes(1);
  });

  it("can list historical Areas under archived Clients or Area Types", async () => {
    selectOrderBy.mockResolvedValueOnce([
      activeAreaRow,
      areaUnderArchivedClientRow,
      areaWithArchivedAreaTypeRow,
    ]);

    await expect(listAreas({ visibility: "historical" })).resolves.toEqual([
      expect.objectContaining({
        id: activeAreaRow.area.id,
        isActive: true,
      }),
      expect.objectContaining({
        id: areaUnderArchivedClientRow.area.id,
        isClientArchived: true,
        isActive: false,
      }),
      expect.objectContaining({
        id: areaWithArchivedAreaTypeRow.area.id,
        isAreaTypeArchived: true,
        isActive: false,
      }),
    ]);
  });

  it("restores an Area without making it active while a parent is archived", async () => {
    updateReturning.mockResolvedValueOnce([areaUnderArchivedClientRow.area]);
    selectOrderBy.mockResolvedValueOnce([areaUnderArchivedClientRow]);

    await expect(restoreArea(areaUnderArchivedClientRow.area.id)).resolves.toEqual(
      expect.objectContaining({
        id: areaUnderArchivedClientRow.area.id,
        isArchived: false,
        isClientArchived: true,
        isActive: false,
      }),
    );
  });

  it("archives Areas instead of deleting them", async () => {
    const archivedAreaRow = {
      ...activeAreaRow.area,
      archivedAt,
    };
    updateReturning.mockResolvedValueOnce([archivedAreaRow]);
    selectOrderBy.mockResolvedValueOnce([
      { ...activeAreaRow, area: archivedAreaRow },
    ]);

    await expect(archiveArea(activeAreaRow.area.id)).resolves.toEqual(
      expect.objectContaining({
        id: activeAreaRow.area.id,
        isArchived: true,
        isActive: false,
      }),
    );

    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws a not-found error when an Area mutation matches no rows", async () => {
    updateReturning.mockResolvedValueOnce([]);

    await expect(
      updateArea(activeAreaRow.area.id, { name: "Renamed Area" }),
    ).rejects.toMatchObject({
      name: "SetupRecordNotFoundError",
      message: "Area setup record was not found.",
    });
  });

  it("creates Inspection Templates with optional sections and ordered items", async () => {
    insertReturning
      .mockResolvedValueOnce([activeInspectionTemplateRow])
      .mockResolvedValueOnce([inspectionTemplateSectionRow])
      .mockResolvedValueOnce([inspectionTemplateItemRow]);

    await expect(
      createInspectionTemplate({
        name: "Restroom Standard",
        description: "Weekly restroom checks",
        sections: [{ name: "Fixtures", position: 1 }],
        items: [
          {
            name: "Mirrors",
            description: "No streaks",
            sectionName: "Fixtures",
            position: 1,
          },
        ],
      }),
    ).resolves.toEqual({
      ...activeInspectionTemplateRow,
      isArchived: false,
      sections: [inspectionTemplateSectionRow],
      items: [
        {
          ...inspectionTemplateItemRow,
          sectionName: "Fixtures",
        },
      ],
    });

    expect(insertValues).toHaveBeenNthCalledWith(1, {
      name: "Restroom Standard",
      description: "Weekly restroom checks",
    });
    expect(insertValues).toHaveBeenNthCalledWith(2, [
      {
        templateId: activeInspectionTemplateRow.id,
        position: 1,
        name: "Fixtures",
      },
    ]);
    expect(insertValues).toHaveBeenNthCalledWith(3, [
      {
        templateId: activeInspectionTemplateRow.id,
        sectionId: inspectionTemplateSectionRow.id,
        position: 1,
        name: "Mirrors",
        description: "No streaks",
      },
    ]);
  });

  it("updates Inspection Templates by replacing editable content", async () => {
    updateReturning.mockResolvedValueOnce([{
      ...activeInspectionTemplateRow,
      name: "Restroom Detailed",
      description: null,
    }]);
    insertReturning
      .mockResolvedValueOnce([inspectionTemplateSectionRow])
      .mockResolvedValueOnce([inspectionTemplateItemRow]);

    await expect(
      updateInspectionTemplate(activeInspectionTemplateRow.id, {
        name: "Restroom Detailed",
        description: "",
        sections: [{ name: "Fixtures", position: 1 }],
        items: [
          {
            name: "Mirrors",
            description: "No streaks",
            sectionName: "Fixtures",
            position: 1,
          },
        ],
      }),
    ).resolves.toEqual({
      ...activeInspectionTemplateRow,
      name: "Restroom Detailed",
      description: null,
      isArchived: false,
      sections: [inspectionTemplateSectionRow],
      items: [{ ...inspectionTemplateItemRow, sectionName: "Fixtures" }],
    });

    expect(updateSet).toHaveBeenCalledWith({
      name: "Restroom Detailed",
      description: null,
      updatedAt: expect.anything(),
    });
    expect(deleteWhere).toHaveBeenCalledTimes(2);
    expect(insertValues).toHaveBeenNthCalledWith(1, [
      {
        templateId: activeInspectionTemplateRow.id,
        position: 1,
        name: "Fixtures",
      },
    ]);
    expect(insertValues).toHaveBeenNthCalledWith(2, [
      {
        templateId: activeInspectionTemplateRow.id,
        sectionId: inspectionTemplateSectionRow.id,
        position: 1,
        name: "Mirrors",
        description: "No streaks",
      },
    ]);
  });

  it("throws a not-found error when an Inspection Template update matches no rows", async () => {
    updateReturning.mockResolvedValueOnce([]);

    await expect(
      updateInspectionTemplate(activeInspectionTemplateRow.id, {
        name: "Missing Template",
        description: "",
        sections: [],
        items: [
          {
            name: "Mirrors",
            description: "No streaks",
            sectionName: null,
            position: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      name: "SetupRecordNotFoundError",
      message: "Inspection Template setup record was not found.",
    });

    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it("duplicates Inspection Templates with sections and items", async () => {
    const sourceLimit = vi.fn().mockResolvedValueOnce([activeInspectionTemplateRow]);
    selectWhere.mockReturnValueOnce({ for: vi.fn(() => ({ limit: sourceLimit })) });
    selectOrderBy
      .mockResolvedValueOnce([inspectionTemplateSectionRow])
      .mockResolvedValueOnce([inspectionTemplateItemRow]);
    insertReturning
      .mockResolvedValueOnce([copiedInspectionTemplateRow])
      .mockResolvedValueOnce([copiedInspectionTemplateSectionRow])
      .mockResolvedValueOnce([copiedInspectionTemplateItemRow]);

    await expect(duplicateInspectionTemplate(activeInspectionTemplateRow.id)).resolves.toEqual({
      ...copiedInspectionTemplateRow,
      isArchived: false,
      sections: [copiedInspectionTemplateSectionRow],
      items: [{ ...copiedInspectionTemplateItemRow, sectionName: "Fixtures" }],
    });

    expect(insertValues).toHaveBeenNthCalledWith(1, {
      name: "Restroom Standard Copy",
      description: "Weekly restroom checks",
    });
    expect(insertValues).toHaveBeenNthCalledWith(2, [
      {
        templateId: copiedInspectionTemplateRow.id,
        position: 1,
        name: "Fixtures",
      },
    ]);
    expect(insertValues).toHaveBeenNthCalledWith(3, [
      {
        templateId: copiedInspectionTemplateRow.id,
        sectionId: copiedInspectionTemplateSectionRow.id,
        position: 1,
        name: "Mirrors",
        description: "No streaks",
      },
    ]);
  });

  it("keeps duplicated Inspection Template names within the setup name limit", async () => {
    const sourceName = "a".repeat(160);
    const copyName = `${"a".repeat(155)} Copy`;
    const source = { ...activeInspectionTemplateRow, name: sourceName };
    const copy = { ...copiedInspectionTemplateRow, name: copyName };
    const sourceLimit = vi.fn().mockResolvedValueOnce([source]);
    selectWhere.mockReturnValueOnce({ for: vi.fn(() => ({ limit: sourceLimit })) });
    selectOrderBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    insertReturning.mockResolvedValueOnce([copy]);

    await expect(duplicateInspectionTemplate(activeInspectionTemplateRow.id)).resolves.toEqual({
      ...copy,
      isArchived: false,
      sections: [],
      items: [],
    });

    expect(insertValues).toHaveBeenCalledWith({
      name: copyName,
      description: "Weekly restroom checks",
    });
  });

  it("archives and restores Inspection Templates without deleting records", async () => {
    updateReturning
      .mockResolvedValueOnce([archivedInspectionTemplateRow])
      .mockResolvedValueOnce([activeInspectionTemplateRow]);
    mockHydratedInspectionTemplate(archivedInspectionTemplateRow);

    await expect(archiveInspectionTemplate(activeInspectionTemplateRow.id)).resolves.toEqual(
      expect.objectContaining({
        id: activeInspectionTemplateRow.id,
        isArchived: true,
      }),
    );

    mockHydratedInspectionTemplate(activeInspectionTemplateRow);

    await expect(restoreInspectionTemplate(activeInspectionTemplateRow.id)).resolves.toEqual(
      expect.objectContaining({
        id: activeInspectionTemplateRow.id,
        isArchived: false,
      }),
    );

    expect(db.delete).not.toHaveBeenCalled();
  });
});
