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
} = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
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
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db }));

const {
  archiveBuilding,
  archiveClient,
  createBuilding,
  createClient,
  getBuilding,
  getClient,
  listBuildings,
  listClients,
  restoreBuilding,
  restoreClient,
  updateBuilding,
  updateClient,
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

    expect(db).not.toHaveProperty("delete");
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

    expect(db).not.toHaveProperty("delete");
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
});
