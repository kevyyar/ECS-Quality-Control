import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  saveBuildingInspectionPlan,
  isActiveBuildingInspectionPlanBuildingRequiredError,
  isActiveBuildingInspectionPlanEntriesRequiredError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  saveBuildingInspectionPlan: vi.fn(),
  isActiveBuildingInspectionPlanBuildingRequiredError: (error: unknown) =>
    error instanceof Error && error.name === "ActiveBuildingInspectionPlanBuildingRequiredError",
  isActiveBuildingInspectionPlanEntriesRequiredError: (error: unknown) =>
    error instanceof Error && error.name === "ActiveBuildingInspectionPlanEntriesRequiredError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/client-building-setup/repository", () => ({
  saveBuildingInspectionPlan,
  isActiveBuildingInspectionPlanBuildingRequiredError,
  isActiveBuildingInspectionPlanEntriesRequiredError,
}));

const { saveBuildingInspectionPlanAction } = await import("./actions");

const buildingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const areaId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const templateId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

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

function validPlanFormData(): FormData {
  return formData({
    buildingId,
    areaId: [areaId],
    inspectionTemplateId: [templateId],
  });
}

function activeBuildingRequiredError(): Error {
  const error = new Error("Building Inspection Plan must belong to an active Building.");
  error.name = "ActiveBuildingInspectionPlanBuildingRequiredError";

  return error;
}

function activeEntriesRequiredError(): Error & {
  entryErrors: Array<{ areaId?: string; inspectionTemplateId?: string }>;
} {
  const error = new Error("Building Inspection Plan entries must use active setup records.") as Error & {
    entryErrors: Array<{ areaId?: string; inspectionTemplateId?: string }>;
  };
  error.name = "ActiveBuildingInspectionPlanEntriesRequiredError";
  error.entryErrors = [
    {
      areaId: "Select an active Area.",
      inspectionTemplateId: "Select an active Inspection Template.",
    },
  ];

  return error;
}

describe("Building Inspection Plan setup actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue({
      authUserId: "auth-user-id",
      email: "supervisor@example.com",
      capabilities: ["supervisor"],
    });
    saveBuildingInspectionPlan.mockResolvedValue({
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      buildingId,
      buildingName: "HQ",
      clientId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      clientName: "ECS",
      buildingArchivedAt: null,
      clientArchivedAt: null,
      createdAt: new Date("2026-05-28T00:00:00Z"),
      updatedAt: new Date("2026-05-28T00:00:00Z"),
      isBuildingActive: true,
      entries: [],
    });
  });

  it("requires Supervisor setup capability before saving a Building Inspection Plan", async () => {
    await saveBuildingInspectionPlanAction({ status: "idle" }, validPlanFormData());

    expect(requireProtectedAction).toHaveBeenCalledWith("manageSetup");
  });

  it("does not persist when Manager-only users fail setup capability", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      saveBuildingInspectionPlanAction({ status: "idle" }, validPlanFormData()),
    ).rejects.toThrow("redirect:/forbidden");

    expect(saveBuildingInspectionPlan).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without saving invalid Building Inspection Plans", async () => {
    await expect(
      saveBuildingInspectionPlanAction(
        { status: "idle" },
        formData({ buildingId: "not-a-building", areaId: "", inspectionTemplateId: "" }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { buildingId: "Select an active Building." },
      entryErrors: [
        {
          areaId: "Select an active Area.",
          inspectionTemplateId: "Select an active Inspection Template.",
        },
      ],
      values: {
        buildingId: "not-a-building",
        entries: [{ areaId: "", inspectionTemplateId: "" }],
      },
    });

    expect(saveBuildingInspectionPlan).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps stale Building errors back to the Building field", async () => {
    saveBuildingInspectionPlan.mockRejectedValueOnce(activeBuildingRequiredError());

    await expect(
      saveBuildingInspectionPlanAction({ status: "idle" }, validPlanFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: { buildingId: "Select an active Building." },
      entryErrors: [],
      values: {
        buildingId,
        entries: [{ areaId, inspectionTemplateId: templateId }],
      },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps stale Area and Inspection Template errors back to entry fields", async () => {
    saveBuildingInspectionPlan.mockRejectedValueOnce(activeEntriesRequiredError());

    await expect(
      saveBuildingInspectionPlanAction({ status: "idle" }, validPlanFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: {},
      entryErrors: [
        {
          areaId: "Select an active Area.",
          inspectionTemplateId: "Select an active Inspection Template.",
        },
      ],
      values: {
        buildingId,
        entries: [{ areaId, inspectionTemplateId: templateId }],
      },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("saves normalized plans and revalidates setup, plan, Building detail, and draft views", async () => {
    await expect(
      saveBuildingInspectionPlanAction(
        { status: "idle" },
        formData({
          buildingId: ` ${buildingId} `,
          areaId: [` ${areaId} `],
          inspectionTemplateId: [` ${templateId} `],
        }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Building Inspection Plan saved.",
    });

    expect(saveBuildingInspectionPlan).toHaveBeenCalledWith({
      buildingId,
      entries: [{ areaId, inspectionTemplateId: templateId, position: 1 }],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/setup");
    expect(revalidatePath).toHaveBeenCalledWith("/setup/building-inspection-plans");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/setup/building-inspection-plans/${buildingId}`,
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/setup/buildings/${buildingId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/inspections/drafts");
  });
});
