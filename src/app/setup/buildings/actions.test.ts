import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  createBuilding,
  updateBuilding,
  archiveBuilding,
  restoreBuilding,
  isSetupRecordNotFoundError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  createBuilding: vi.fn(),
  updateBuilding: vi.fn(),
  archiveBuilding: vi.fn(),
  restoreBuilding: vi.fn(),
  isSetupRecordNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "SetupRecordNotFoundError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/client-building-setup/repository", () => ({
  createBuilding,
  updateBuilding,
  archiveBuilding,
  restoreBuilding,
  isSetupRecordNotFoundError,
}));

const {
  archiveBuildingAction,
  createBuildingAction,
  restoreBuildingAction,
  updateBuildingAction,
} = await import("./actions");

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function setupRecordNotFoundError(): Error {
  const error = new Error("Building setup record was not found.");
  error.name = "SetupRecordNotFoundError";

  return error;
}

const buildingRecord = {
  id: "33333333-3333-4333-8333-333333333333",
  clientId: "11111111-1111-4111-8111-111111111111",
  clientName: "Acme Facilities",
  name: "North Tower",
  archivedAt: null,
  clientArchivedAt: null,
  createdAt: new Date("2026-05-28T00:00:00Z"),
  updatedAt: new Date("2026-05-28T00:00:00Z"),
  isArchived: false,
  isParentArchived: false,
  isActive: true,
};

describe("Building setup actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue({
      authUserId: "auth-user-id",
      email: "supervisor@example.com",
      capabilities: ["supervisor"],
    });
    createBuilding.mockResolvedValue(buildingRecord);
    updateBuilding.mockResolvedValue(buildingRecord);
    archiveBuilding.mockResolvedValue({
      ...buildingRecord,
      archivedAt: new Date("2026-05-28T01:00:00Z"),
      isArchived: true,
      isActive: false,
    });
    restoreBuilding.mockResolvedValue(buildingRecord);
  });

  it("requires Supervisor setup capability before creating Buildings", async () => {
    await createBuildingAction(
      { status: "idle" },
      formData({ clientId: buildingRecord.clientId, name: "North Tower" }),
    );

    expect(requireProtectedAction).toHaveBeenCalledWith("manageSetup");
  });

  it("does not persist when setup capability fails", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      createBuildingAction(
        { status: "idle" },
        formData({ clientId: buildingRecord.clientId, name: "North Tower" }),
      ),
    ).rejects.toThrow("redirect:/forbidden");

    expect(createBuilding).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without creating invalid Buildings", async () => {
    await expect(
      createBuildingAction(
        { status: "idle" },
        formData({ clientId: "not-a-client", name: " " }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {
        clientId: "Select an active Client.",
        name: "Building name is required.",
      },
      values: { clientId: "not-a-client", name: "" },
    });

    expect(createBuilding).not.toHaveBeenCalled();
  });

  it("returns a field error when the selected Client is no longer active", async () => {
    createBuilding.mockRejectedValueOnce(
      new Error("Building must belong to an active Client."),
    );

    await expect(
      createBuildingAction(
        { status: "idle" },
        formData({ clientId: buildingRecord.clientId, name: "North Tower" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { clientId: "Select an active Client." },
      values: { clientId: buildingRecord.clientId, name: "North Tower" },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("creates normalized Buildings and revalidates setup views", async () => {
    await expect(
      createBuildingAction(
        { status: "idle" },
        formData({ clientId: buildingRecord.clientId, name: " North Tower " }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Building saved.",
    });

    expect(createBuilding).toHaveBeenCalledWith({
      clientId: buildingRecord.clientId,
      name: "North Tower",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/setup/buildings");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/buildings/${buildingRecord.id}`);
    expect(revalidatePath).toHaveBeenCalledWith("/setup/building-inspection-plans");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/setup/building-inspection-plans/${buildingRecord.id}`,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/inspections/drafts");
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/clients/${buildingRecord.clientId}`);
  });

  it("updates Buildings by id and revalidates their detail page", async () => {
    await expect(
      updateBuildingAction(
        { status: "idle" },
        formData({ id: buildingRecord.id, name: " Renamed Building " }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Building saved.",
    });

    expect(updateBuilding).toHaveBeenCalledWith(buildingRecord.id, {
      name: "Renamed Building",
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/buildings/${buildingRecord.id}`);
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
  });

  it("returns an error state when the Building no longer exists during update", async () => {
    updateBuilding.mockRejectedValueOnce(setupRecordNotFoundError());

    await expect(
      updateBuildingAction(
        { status: "idle" },
        formData({ id: buildingRecord.id, name: "Renamed Building" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "A valid Building is required." },
      values: { clientId: "", name: "" },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("archives and restores Buildings instead of deleting them", async () => {
    await archiveBuildingAction(formData({ id: buildingRecord.id }));
    await restoreBuildingAction(formData({ id: buildingRecord.id }));

    expect(archiveBuilding).toHaveBeenCalledWith(buildingRecord.id);
    expect(restoreBuilding).toHaveBeenCalledWith(buildingRecord.id);
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/buildings/${buildingRecord.id}`);
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
  });

  it("ignores stale Building archive requests", async () => {
    archiveBuilding.mockRejectedValueOnce(setupRecordNotFoundError());

    await archiveBuildingAction(formData({ id: buildingRecord.id }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
