import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  createAreaType,
  updateAreaType,
  archiveAreaType,
  restoreAreaType,
  isSetupRecordNotFoundError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  createAreaType: vi.fn(),
  updateAreaType: vi.fn(),
  archiveAreaType: vi.fn(),
  restoreAreaType: vi.fn(),
  isSetupRecordNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "SetupRecordNotFoundError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/client-building-setup/repository", () => ({
  createAreaType,
  updateAreaType,
  archiveAreaType,
  restoreAreaType,
  isSetupRecordNotFoundError,
}));

const {
  archiveAreaTypeAction,
  createAreaTypeAction,
  restoreAreaTypeAction,
  updateAreaTypeAction,
} = await import("./actions");

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function setupRecordNotFoundError(): Error {
  const error = new Error("Area Type setup record was not found.");
  error.name = "SetupRecordNotFoundError";

  return error;
}

const areaTypeRecord = {
  id: "55555555-5555-4555-8555-555555555555",
  name: "Restroom",
  archivedAt: null,
  createdAt: new Date("2026-05-28T00:00:00Z"),
  updatedAt: new Date("2026-05-28T00:00:00Z"),
  isArchived: false,
};

describe("Area Type setup actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue({
      authUserId: "auth-user-id",
      email: "supervisor@example.com",
      capabilities: ["supervisor"],
    });
    createAreaType.mockResolvedValue(areaTypeRecord);
    updateAreaType.mockResolvedValue(areaTypeRecord);
    archiveAreaType.mockResolvedValue({
      ...areaTypeRecord,
      archivedAt: new Date("2026-05-28T01:00:00Z"),
      isArchived: true,
    });
    restoreAreaType.mockResolvedValue(areaTypeRecord);
  });

  it("requires Supervisor setup capability before creating Area Types", async () => {
    await createAreaTypeAction({ status: "idle" }, formData({ name: "Restroom" }));

    expect(requireProtectedAction).toHaveBeenCalledWith("manageSetup");
  });

  it("does not persist when setup capability fails", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      createAreaTypeAction({ status: "idle" }, formData({ name: "Restroom" })),
    ).rejects.toThrow("redirect:/forbidden");

    expect(createAreaType).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without creating invalid Area Types", async () => {
    await expect(
      createAreaTypeAction({ status: "idle" }, formData({ name: " " })),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "Area Type name is required." },
      values: { name: "" },
    });

    expect(createAreaType).not.toHaveBeenCalled();
  });

  it("creates normalized Area Types and revalidates setup views", async () => {
    await expect(
      createAreaTypeAction({ status: "idle" }, formData({ name: " Restroom " })),
    ).resolves.toEqual({
      status: "success",
      message: "Area Type saved.",
    });

    expect(createAreaType).toHaveBeenCalledWith({ name: "Restroom" });
    expect(revalidatePath).toHaveBeenCalledWith("/setup");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/area-types");
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/area-types/${areaTypeRecord.id}`);
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
  });

  it("updates Area Types by id and revalidates their detail page", async () => {
    await expect(
      updateAreaTypeAction(
        { status: "idle" },
        formData({ id: areaTypeRecord.id, name: " Renamed Area Type " }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Area Type saved.",
    });

    expect(updateAreaType).toHaveBeenCalledWith(areaTypeRecord.id, {
      name: "Renamed Area Type",
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/area-types/${areaTypeRecord.id}`);
  });

  it("returns an error state when the Area Type no longer exists during update", async () => {
    updateAreaType.mockRejectedValueOnce(setupRecordNotFoundError());

    await expect(
      updateAreaTypeAction(
        { status: "idle" },
        formData({ id: areaTypeRecord.id, name: "Renamed Area Type" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "A valid Area Type is required." },
      values: { name: "" },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("archives and restores Area Types instead of deleting them", async () => {
    await archiveAreaTypeAction(formData({ id: areaTypeRecord.id }));
    await restoreAreaTypeAction(formData({ id: areaTypeRecord.id }));

    expect(archiveAreaType).toHaveBeenCalledWith(areaTypeRecord.id);
    expect(restoreAreaType).toHaveBeenCalledWith(areaTypeRecord.id);
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/area-types/${areaTypeRecord.id}`);
  });

  it("ignores stale Area Type archive requests", async () => {
    archiveAreaType.mockRejectedValueOnce(setupRecordNotFoundError());

    await archiveAreaTypeAction(formData({ id: areaTypeRecord.id }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
