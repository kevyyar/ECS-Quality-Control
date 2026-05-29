import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  createArea,
  updateArea,
  archiveArea,
  restoreArea,
  isActiveAreaParentsRequiredError,
  isSetupRecordNotFoundError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  createArea: vi.fn(),
  updateArea: vi.fn(),
  archiveArea: vi.fn(),
  restoreArea: vi.fn(),
  isActiveAreaParentsRequiredError: (
    error: unknown,
  ): error is { fields: readonly ("buildingId" | "areaTypeId")[] } =>
    error instanceof Error && error.name === "ActiveAreaParentsRequiredError",
  isSetupRecordNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "SetupRecordNotFoundError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/client-building-setup/repository", () => ({
  createArea,
  updateArea,
  archiveArea,
  restoreArea,
  isActiveAreaParentsRequiredError,
  isSetupRecordNotFoundError,
}));

const {
  archiveAreaAction,
  createAreaAction,
  restoreAreaAction,
  updateAreaAction,
} = await import("./actions");

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function setupRecordNotFoundError(): Error {
  const error = new Error("Area setup record was not found.");
  error.name = "SetupRecordNotFoundError";

  return error;
}

type AreaParentField = "buildingId" | "areaTypeId";

function activeAreaParentsRequiredError(
  fields: readonly AreaParentField[],
): Error & { fields: readonly AreaParentField[] } {
  const error = new Error("Area must belong to active setup parents.") as Error & {
    fields: readonly AreaParentField[];
  };
  error.name = "ActiveAreaParentsRequiredError";
  error.fields = fields;

  return error;
}

const areaRecord = {
  id: "77777777-7777-4777-8777-777777777777",
  buildingId: "33333333-3333-4333-8333-333333333333",
  buildingName: "North Tower",
  clientId: "11111111-1111-4111-8111-111111111111",
  clientName: "Acme Facilities",
  areaTypeId: "55555555-5555-4555-8555-555555555555",
  areaTypeName: "Restroom",
  name: "First Floor Restroom",
  archivedAt: null,
  buildingArchivedAt: null,
  clientArchivedAt: null,
  areaTypeArchivedAt: null,
  createdAt: new Date("2026-05-28T00:00:00Z"),
  updatedAt: new Date("2026-05-28T00:00:00Z"),
  isArchived: false,
  isBuildingArchived: false,
  isClientArchived: false,
  isAreaTypeArchived: false,
  isActive: true,
};

describe("Area setup actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue({
      authUserId: "auth-user-id",
      email: "supervisor@example.com",
      capabilities: ["supervisor"],
    });
    createArea.mockResolvedValue(areaRecord);
    updateArea.mockResolvedValue(areaRecord);
    archiveArea.mockResolvedValue({
      ...areaRecord,
      archivedAt: new Date("2026-05-28T01:00:00Z"),
      isArchived: true,
      isActive: false,
    });
    restoreArea.mockResolvedValue(areaRecord);
  });

  it("requires Supervisor setup capability before creating Areas", async () => {
    await createAreaAction(
      { status: "idle" },
      formData({
        buildingId: areaRecord.buildingId,
        areaTypeId: areaRecord.areaTypeId,
        name: "First Floor Restroom",
      }),
    );

    expect(requireProtectedAction).toHaveBeenCalledWith("manageSetup");
  });

  it("does not persist when setup capability fails", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      createAreaAction(
        { status: "idle" },
        formData({
          buildingId: areaRecord.buildingId,
          areaTypeId: areaRecord.areaTypeId,
          name: "First Floor Restroom",
        }),
      ),
    ).rejects.toThrow("redirect:/forbidden");

    expect(createArea).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without creating invalid Areas", async () => {
    await expect(
      createAreaAction(
        { status: "idle" },
        formData({ buildingId: "not-a-building", areaTypeId: "not-a-type", name: " " }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {
        buildingId: "Select an active Building.",
        areaTypeId: "Select an active Area Type.",
        name: "Area name is required.",
      },
      values: { buildingId: "not-a-building", areaTypeId: "not-a-type", name: "" },
    });

    expect(createArea).not.toHaveBeenCalled();
  });

  it("returns only a Building field error when the selected Building is no longer active", async () => {
    createArea.mockRejectedValueOnce(activeAreaParentsRequiredError(["buildingId"]));

    await expect(
      createAreaAction(
        { status: "idle" },
        formData({
          buildingId: areaRecord.buildingId,
          areaTypeId: areaRecord.areaTypeId,
          name: "First Floor Restroom",
        }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { buildingId: "Select an active Building." },
      values: {
        buildingId: areaRecord.buildingId,
        areaTypeId: areaRecord.areaTypeId,
        name: "First Floor Restroom",
      },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns only an Area Type field error when the selected Area Type is no longer active", async () => {
    createArea.mockRejectedValueOnce(activeAreaParentsRequiredError(["areaTypeId"]));

    await expect(
      createAreaAction(
        { status: "idle" },
        formData({
          buildingId: areaRecord.buildingId,
          areaTypeId: areaRecord.areaTypeId,
          name: "First Floor Restroom",
        }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { areaTypeId: "Select an active Area Type." },
      values: {
        buildingId: areaRecord.buildingId,
        areaTypeId: areaRecord.areaTypeId,
        name: "First Floor Restroom",
      },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("creates normalized Areas and revalidates setup views", async () => {
    await expect(
      createAreaAction(
        { status: "idle" },
        formData({
          buildingId: areaRecord.buildingId,
          areaTypeId: areaRecord.areaTypeId,
          name: " First Floor Restroom ",
        }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Area saved.",
    });

    expect(createArea).toHaveBeenCalledWith({
      buildingId: areaRecord.buildingId,
      areaTypeId: areaRecord.areaTypeId,
      name: "First Floor Restroom",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/areas/${areaRecord.id}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/buildings/${areaRecord.buildingId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/setup/building-inspection-plans");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/setup/building-inspection-plans/${areaRecord.buildingId}`,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/inspections/drafts");
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/area-types/${areaRecord.areaTypeId}`);
  });

  it("updates Areas by id and revalidates their detail page", async () => {
    await expect(
      updateAreaAction(
        { status: "idle" },
        formData({ id: areaRecord.id, name: " Renamed Area " }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Area saved.",
    });

    expect(updateArea).toHaveBeenCalledWith(areaRecord.id, {
      name: "Renamed Area",
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/areas/${areaRecord.id}`);
  });

  it("returns an error state when the Area no longer exists during update", async () => {
    updateArea.mockRejectedValueOnce(setupRecordNotFoundError());

    await expect(
      updateAreaAction(
        { status: "idle" },
        formData({ id: areaRecord.id, name: "Renamed Area" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "A valid Area is required." },
      values: { buildingId: "", areaTypeId: "", name: "" },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("archives and restores Areas instead of deleting them", async () => {
    await archiveAreaAction(formData({ id: areaRecord.id }));
    await restoreAreaAction(formData({ id: areaRecord.id }));

    expect(archiveArea).toHaveBeenCalledWith(areaRecord.id);
    expect(restoreArea).toHaveBeenCalledWith(areaRecord.id);
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/areas/${areaRecord.id}`);
  });

  it("ignores stale Area archive requests", async () => {
    archiveArea.mockRejectedValueOnce(setupRecordNotFoundError());

    await archiveAreaAction(formData({ id: areaRecord.id }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
