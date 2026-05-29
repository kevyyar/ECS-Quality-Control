import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  createInspectionTemplate,
  updateInspectionTemplate,
  duplicateInspectionTemplate,
  archiveInspectionTemplate,
  restoreInspectionTemplate,
  isSetupRecordNotFoundError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  createInspectionTemplate: vi.fn(),
  updateInspectionTemplate: vi.fn(),
  duplicateInspectionTemplate: vi.fn(),
  archiveInspectionTemplate: vi.fn(),
  restoreInspectionTemplate: vi.fn(),
  isSetupRecordNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "SetupRecordNotFoundError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/client-building-setup/repository", () => ({
  createInspectionTemplate,
  updateInspectionTemplate,
  duplicateInspectionTemplate,
  archiveInspectionTemplate,
  restoreInspectionTemplate,
  isSetupRecordNotFoundError,
}));

const {
  archiveInspectionTemplateAction,
  createInspectionTemplateAction,
  duplicateInspectionTemplateAction,
  restoreInspectionTemplateAction,
  updateInspectionTemplateAction,
} = await import("./actions");

function formData(values: Record<string, string | string[]>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => data.append(key, entry));
      return;
    }

    data.set(key, value);
  });

  return data;
}

function setupRecordNotFoundError(): Error {
  const error = new Error("Inspection Template setup record was not found.");
  error.name = "SetupRecordNotFoundError";

  return error;
}

const templateRecord = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Restroom Standard",
  description: "Weekly restroom checks",
  archivedAt: null,
  createdAt: new Date("2026-05-28T00:00:00Z"),
  updatedAt: new Date("2026-05-28T00:00:00Z"),
  isArchived: false,
  sections: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Fixtures",
      position: 1,
      createdAt: new Date("2026-05-28T00:00:00Z"),
      updatedAt: new Date("2026-05-28T00:00:00Z"),
    },
  ],
  items: [
    {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      sectionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      sectionName: "Fixtures",
      name: "Mirrors",
      description: "No streaks",
      position: 1,
      createdAt: new Date("2026-05-28T00:00:00Z"),
      updatedAt: new Date("2026-05-28T00:00:00Z"),
    },
  ],
};

const validTemplateFormData = () =>
  formData({
    name: " Restroom Standard ",
    description: " Weekly restroom checks ",
    itemName: [" Mirrors ", " Floors "],
    itemDescription: [" No streaks ", " Clean and dry "],
    itemSectionName: [" Fixtures ", " Floors "],
  });

describe("Inspection Template setup actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue({
      authUserId: "auth-user-id",
      email: "supervisor@example.com",
      capabilities: ["supervisor"],
    });
    createInspectionTemplate.mockResolvedValue(templateRecord);
    updateInspectionTemplate.mockResolvedValue(templateRecord);
    duplicateInspectionTemplate.mockResolvedValue({
      ...templateRecord,
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Restroom Standard Copy",
    });
    archiveInspectionTemplate.mockResolvedValue({
      ...templateRecord,
      archivedAt: new Date("2026-05-28T01:00:00Z"),
      isArchived: true,
    });
    restoreInspectionTemplate.mockResolvedValue(templateRecord);
  });

  it("requires Supervisor setup capability before every Inspection Template mutation", async () => {
    await createInspectionTemplateAction({ status: "idle" }, validTemplateFormData());
    await updateInspectionTemplateAction(
      { status: "idle" },
      formData({ id: templateRecord.id, name: "Restroom", itemName: "Mirrors" }),
    );
    await duplicateInspectionTemplateAction(formData({ id: templateRecord.id }));
    await archiveInspectionTemplateAction(formData({ id: templateRecord.id }));
    await restoreInspectionTemplateAction(formData({ id: templateRecord.id }));

    expect(requireProtectedAction).toHaveBeenCalledTimes(5);
    expect(requireProtectedAction).toHaveBeenCalledWith("manageSetup");
  });

  it("does not persist when setup capability fails", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      createInspectionTemplateAction({ status: "idle" }, validTemplateFormData()),
    ).rejects.toThrow("redirect:/forbidden");

    expect(createInspectionTemplate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without creating invalid Inspection Templates", async () => {
    await expect(
      createInspectionTemplateAction(
        { status: "idle" },
        formData({ name: " ", description: "", itemName: " ", itemDescription: "No streaks" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "Inspection Template name is required." },
      itemErrors: [{ name: "Inspection Template item name is required." }],
      values: {
        name: "",
        description: "",
        sections: [],
        items: [{ name: "", description: "No streaks", sectionName: "" }],
      },
    });

    expect(createInspectionTemplate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("creates normalized Inspection Templates and revalidates setup views", async () => {
    await expect(
      createInspectionTemplateAction({ status: "idle" }, validTemplateFormData()),
    ).resolves.toEqual({
      status: "success",
      message: "Inspection Template saved.",
    });

    expect(createInspectionTemplate).toHaveBeenCalledWith({
      name: "Restroom Standard",
      description: "Weekly restroom checks",
      sections: [
        { name: "Fixtures", position: 1 },
        { name: "Floors", position: 2 },
      ],
      items: [
        {
          name: "Mirrors",
          description: "No streaks",
          sectionName: "Fixtures",
          position: 1,
        },
        {
          name: "Floors",
          description: "Clean and dry",
          sectionName: "Floors",
          position: 2,
        },
      ],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/setup");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/inspection-templates");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/setup/inspection-templates/${templateRecord.id}`,
    );
  });

  it("returns validation errors without updating invalid Inspection Templates", async () => {
    await expect(
      updateInspectionTemplateAction(
        { status: "idle" },
        formData({ id: templateRecord.id, name: "Restroom", itemName: " " }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {},
      itemErrors: [{ name: "Inspection Template item name is required." }],
      values: {
        name: "Restroom",
        description: "",
        sections: [],
        items: [{ name: "", description: "", sectionName: "" }],
      },
    });

    expect(updateInspectionTemplate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("updates Inspection Templates by id and revalidates their detail page", async () => {
    await expect(
      updateInspectionTemplateAction(
        { status: "idle" },
        formData({
          id: templateRecord.id,
          name: " Restroom Detailed ",
          description: " ",
          itemName: " Mirrors ",
          itemDescription: " No streaks ",
          itemSectionName: " Fixtures ",
        }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Inspection Template saved.",
    });

    expect(updateInspectionTemplate).toHaveBeenCalledWith(templateRecord.id, {
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
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      `/setup/inspection-templates/${templateRecord.id}`,
    );
  });

  it("returns an error state when the Inspection Template no longer exists during update", async () => {
    updateInspectionTemplate.mockRejectedValueOnce(setupRecordNotFoundError());

    await expect(
      updateInspectionTemplateAction(
        { status: "idle" },
        formData({ id: templateRecord.id, name: "Restroom", itemName: "Mirrors" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { name: "A valid Inspection Template is required." },
      itemErrors: [],
      values: { name: "", description: "", sections: [], items: [] },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("duplicates, archives, and restores Inspection Templates instead of deleting them", async () => {
    await duplicateInspectionTemplateAction(formData({ id: templateRecord.id }));
    await archiveInspectionTemplateAction(formData({ id: templateRecord.id }));
    await restoreInspectionTemplateAction(formData({ id: templateRecord.id }));

    expect(duplicateInspectionTemplate).toHaveBeenCalledWith(templateRecord.id);
    expect(archiveInspectionTemplate).toHaveBeenCalledWith(templateRecord.id);
    expect(restoreInspectionTemplate).toHaveBeenCalledWith(templateRecord.id);
    expect(revalidatePath).toHaveBeenCalledWith(
      "/setup/inspection-templates/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/setup/inspection-templates/${templateRecord.id}`,
    );
  });

  it("ignores invalid and stale id-only Inspection Template requests", async () => {
    archiveInspectionTemplate.mockRejectedValueOnce(setupRecordNotFoundError());

    await duplicateInspectionTemplateAction(formData({ id: "not-a-template" }));
    await archiveInspectionTemplateAction(formData({ id: templateRecord.id }));

    expect(duplicateInspectionTemplate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
