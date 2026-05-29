import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  isSetupRecordNotFoundError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  archiveClient: vi.fn(),
  restoreClient: vi.fn(),
  isSetupRecordNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "SetupRecordNotFoundError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/client-building-setup/repository", () => ({
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  isSetupRecordNotFoundError,
}));

const {
  archiveClientAction,
  createClientAction,
  restoreClientAction,
  updateClientAction,
} = await import("./actions");

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function setupRecordNotFoundError(): Error {
  const error = new Error("Client setup record was not found.");
  error.name = "SetupRecordNotFoundError";

  return error;
}

const clientRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Acme Facilities",
  archivedAt: null,
  createdAt: new Date("2026-05-28T00:00:00Z"),
  updatedAt: new Date("2026-05-28T00:00:00Z"),
  isArchived: false,
};

describe("Client setup actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue({
      authUserId: "auth-user-id",
      email: "supervisor@example.com",
      capabilities: ["supervisor"],
    });
    createClient.mockResolvedValue(clientRecord);
    updateClient.mockResolvedValue(clientRecord);
    archiveClient.mockResolvedValue({
      ...clientRecord,
      archivedAt: new Date("2026-05-28T01:00:00Z"),
      isArchived: true,
    });
    restoreClient.mockResolvedValue(clientRecord);
  });

  it("requires Supervisor setup capability before creating Clients", async () => {
    await createClientAction({ status: "idle" }, formData({ name: "Acme Facilities" }));

    expect(requireProtectedAction).toHaveBeenCalledWith("manageSetup");
  });

  it("does not persist when setup capability fails", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      createClientAction({ status: "idle" }, formData({ name: "Acme Facilities" })),
    ).rejects.toThrow("redirect:/forbidden");

    expect(createClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without creating invalid Clients", async () => {
    await expect(
      createClientAction({ status: "idle" }, formData({ name: " " })),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "Client name is required." },
      values: { name: "" },
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates normalized Clients and revalidates setup views", async () => {
    await expect(
      createClientAction({ status: "idle" }, formData({ name: " Acme Facilities " })),
    ).resolves.toEqual({
      status: "success",
      message: "Client saved.",
    });

    expect(createClient).toHaveBeenCalledWith({ name: "Acme Facilities" });
    expect(revalidatePath).toHaveBeenCalledWith("/setup");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/clients");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/clients/11111111-1111-4111-8111-111111111111");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/buildings");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/building-inspection-plans");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/setup/building-inspection-plans/[buildingId]",
      "page",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/inspections/drafts");
  });

  it("updates Clients by id and revalidates their detail page", async () => {
    await expect(
      updateClientAction(
        { status: "idle" },
        formData({ id: clientRecord.id, name: " Renamed Client " }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Client saved.",
    });

    expect(updateClient).toHaveBeenCalledWith(clientRecord.id, {
      name: "Renamed Client",
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/clients/${clientRecord.id}`);
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
  });

  it("returns an error state when the Client no longer exists during update", async () => {
    updateClient.mockRejectedValueOnce(setupRecordNotFoundError());

    await expect(
      updateClientAction(
        { status: "idle" },
        formData({ id: clientRecord.id, name: "Renamed Client" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "A valid Client is required." },
      values: { name: "" },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("archives and restores Clients instead of deleting them", async () => {
    await archiveClientAction(formData({ id: clientRecord.id }));
    await restoreClientAction(formData({ id: clientRecord.id }));

    expect(archiveClient).toHaveBeenCalledWith(clientRecord.id);
    expect(restoreClient).toHaveBeenCalledWith(clientRecord.id);
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/clients/${clientRecord.id}`);
    expect(revalidatePath).toHaveBeenCalledWith("/setup/areas");
  });

  it("ignores stale Client archive requests", async () => {
    archiveClient.mockRejectedValueOnce(setupRecordNotFoundError());

    await archiveClientAction(formData({ id: clientRecord.id }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
