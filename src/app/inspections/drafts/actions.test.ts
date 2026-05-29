import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  requireProtectedAction,
  startDraftInspection,
  isActiveBuildingRequiredForDraftError,
  isActiveBuildingInspectionPlanRequiredForDraftError,
  isActiveDraftInspectionAlreadyExistsError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireProtectedAction: vi.fn(),
  startDraftInspection: vi.fn(),
  isActiveBuildingRequiredForDraftError: (error: unknown) =>
    error instanceof Error && error.name === "ActiveBuildingRequiredForDraftError",
  isActiveBuildingInspectionPlanRequiredForDraftError: (error: unknown) =>
    error instanceof Error &&
    error.name === "ActiveBuildingInspectionPlanRequiredForDraftError",
  isActiveDraftInspectionAlreadyExistsError: (error: unknown) =>
    error instanceof Error && error.name === "ActiveDraftInspectionAlreadyExistsError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/inspections/drafts/repository", () => ({
  startDraftInspection,
  isActiveBuildingRequiredForDraftError,
  isActiveBuildingInspectionPlanRequiredForDraftError,
  isActiveDraftInspectionAlreadyExistsError,
}));

const { startDraftInspectionAction } = await import("./actions");

const buildingId = "33333333-3333-4333-8333-333333333333";
const draftInspectionId = "abababab-abab-4aba-8aba-abababababab";
const supervisor = {
  authUserId: "99999999-9999-4999-8999-999999999999",
  email: "supervisor@example.com",
  capabilities: ["supervisor"],
};

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function validDraftFormData(): FormData {
  return formData({ buildingId });
}

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;

  return error;
}

describe("Draft Inspection actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue(supervisor);
    startDraftInspection.mockResolvedValue({
      id: draftInspectionId,
      buildingId,
    });
  });

  it("requires Supervisor draft-edit capability before starting a Draft Inspection", async () => {
    await startDraftInspectionAction({ status: "idle" }, validDraftFormData());

    expect(requireProtectedAction).toHaveBeenCalledWith("editDraftInspection");
  });

  it("does not start drafts when Manager-only users fail draft-edit capability", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      startDraftInspectionAction({ status: "idle" }, validDraftFormData()),
    ).rejects.toThrow("redirect:/forbidden");

    expect(startDraftInspection).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns validation errors without starting a Draft Inspection", async () => {
    await expect(
      startDraftInspectionAction({ status: "idle" }, formData({ buildingId: "" })),
    ).resolves.toEqual({
      status: "error",
      errors: { buildingId: "Select a Building." },
      values: { buildingId: "" },
    });

    expect(startDraftInspection).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps inactive Building errors back to the Building field", async () => {
    startDraftInspection.mockRejectedValueOnce(
      namedError("ActiveBuildingRequiredForDraftError"),
    );

    await expect(
      startDraftInspectionAction({ status: "idle" }, validDraftFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: { buildingId: "Select an active Building." },
      values: { buildingId },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps missing active plan errors back to the Building field", async () => {
    startDraftInspection.mockRejectedValueOnce(
      namedError("ActiveBuildingInspectionPlanRequiredForDraftError"),
    );

    await expect(
      startDraftInspectionAction({ status: "idle" }, validDraftFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: {
        buildingId: "Select a Building with an active Building Inspection Plan.",
      },
      values: { buildingId },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps existing active Draft errors back to the Building field", async () => {
    startDraftInspection.mockRejectedValueOnce(
      namedError("ActiveDraftInspectionAlreadyExistsError"),
    );

    await expect(
      startDraftInspectionAction({ status: "idle" }, validDraftFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: { buildingId: "This Building already has an active Draft Inspection." },
      values: { buildingId },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("starts a normalized Draft Inspection and revalidates active Draft views", async () => {
    await expect(
      startDraftInspectionAction(
        { status: "idle" },
        formData({ buildingId: ` ${buildingId} ` }),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Draft Inspection started.",
      draftInspectionId,
    });

    expect(startDraftInspection).toHaveBeenCalledWith({ buildingId }, supervisor);
    expect(revalidatePath).toHaveBeenCalledWith("/inspections/drafts");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/inspections/drafts/${draftInspectionId}`,
    );
  });
});
