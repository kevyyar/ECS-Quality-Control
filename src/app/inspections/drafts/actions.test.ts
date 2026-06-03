import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePath,
  redirect,
  requireProtectedAction,
  startDraftInspection,
  saveDraftInspectionItemResult,
  skipDraftAreaInspection,
  unskipDraftAreaInspection,
  addOneOffAreaInspection,
  addDraftInspectionItemBeforePhoto,
  submitDraftInspection,
  discardDraftInspection,
  removeDraftInspectionItemBeforePhoto,
  processInspectionPhoto,
  uploadInspectionEvidencePhoto,
  removeInspectionEvidencePhoto,
  isActiveBuildingRequiredForDraftError,
  isActiveBuildingInspectionPlanRequiredForDraftError,
  isActiveDraftInspectionAlreadyExistsError,
  isActiveOneOffAreaInspectionSetupRequiredError,
  isDraftInspectionMutationNotAllowedError,
  isDraftInspectionNotFoundError,
  isDraftSubmissionConfirmationRequiredError,
  isDraftSubmissionValidationError,
} = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  requireProtectedAction: vi.fn(),
  startDraftInspection: vi.fn(),
  saveDraftInspectionItemResult: vi.fn(),
  skipDraftAreaInspection: vi.fn(),
  unskipDraftAreaInspection: vi.fn(),
  addOneOffAreaInspection: vi.fn(),
  addDraftInspectionItemBeforePhoto: vi.fn(),
  submitDraftInspection: vi.fn(),
  discardDraftInspection: vi.fn(),
  removeDraftInspectionItemBeforePhoto: vi.fn(),
  processInspectionPhoto: vi.fn(),
  uploadInspectionEvidencePhoto: vi.fn(),
  removeInspectionEvidencePhoto: vi.fn(),
  isActiveBuildingRequiredForDraftError: (error: unknown) =>
    error instanceof Error && error.name === "ActiveBuildingRequiredForDraftError",
  isActiveBuildingInspectionPlanRequiredForDraftError: (error: unknown) =>
    error instanceof Error &&
    error.name === "ActiveBuildingInspectionPlanRequiredForDraftError",
  isActiveDraftInspectionAlreadyExistsError: (error: unknown) =>
    error instanceof Error && error.name === "ActiveDraftInspectionAlreadyExistsError",
  isActiveOneOffAreaInspectionSetupRequiredError: (
    error: unknown,
  ): error is Error & { fields: Partial<Record<"areaId" | "inspectionTemplateId", string>> } =>
    error instanceof Error && error.name === "ActiveOneOffAreaInspectionSetupRequiredError",
  isDraftInspectionMutationNotAllowedError: (error: unknown) =>
    error instanceof Error && error.name === "DraftInspectionMutationNotAllowedError",
  isDraftInspectionNotFoundError: (error: unknown) =>
    error instanceof Error && error.name === "DraftInspectionNotFoundError",
  isDraftSubmissionConfirmationRequiredError: (error: unknown) =>
    error instanceof Error && error.name === "DraftSubmissionConfirmationRequiredError",
  isDraftSubmissionValidationError: (
    error: unknown,
  ): error is Error & { validation: { ok: false; errors: { inspection?: string } } } =>
    error instanceof Error && error.name === "DraftSubmissionValidationError",
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireProtectedAction }));
vi.mock("@/lib/inspections/evidence/photo-processing", () => ({
  processInspectionPhoto,
}));
vi.mock("@/lib/inspections/evidence/storage", () => ({
  uploadInspectionEvidencePhoto,
  removeInspectionEvidencePhoto,
}));
vi.mock("@/lib/inspections/drafts/repository", () => ({
  startDraftInspection,
  saveDraftInspectionItemResult,
  skipDraftAreaInspection,
  unskipDraftAreaInspection,
  addOneOffAreaInspection,
  addDraftInspectionItemBeforePhoto,
  submitDraftInspection,
  discardDraftInspection,
  removeDraftInspectionItemBeforePhoto,
  isActiveBuildingRequiredForDraftError,
  isActiveBuildingInspectionPlanRequiredForDraftError,
  isActiveDraftInspectionAlreadyExistsError,
  isActiveOneOffAreaInspectionSetupRequiredError,
  isDraftInspectionMutationNotAllowedError,
  isDraftInspectionNotFoundError,
  isDraftSubmissionConfirmationRequiredError,
  isDraftSubmissionValidationError,
}));

const {
  addDraftInspectionItemBeforePhotoAction,
  addOneOffAreaInspectionAction,
  discardDraftInspectionAction,
  removeDraftInspectionItemBeforePhotoAction,
  saveDraftInspectionItemResultAction,
  skipDraftAreaInspectionAction,
  startDraftInspectionAction,
  submitDraftInspectionAction,
  unskipDraftAreaInspectionAction,
} = await import("./actions");

const buildingId = "33333333-3333-4333-8333-333333333333";
const draftInspectionId = "abababab-abab-4aba-8aba-abababababab";
const areaInspectionId = "44444444-4444-4444-8444-444444444444";
const itemId = "55555555-5555-4555-8555-555555555555";
const areaId = "66666666-6666-4666-8666-666666666666";
const inspectionTemplateId = "77777777-7777-4777-8777-777777777777";
const evidenceId = "10101010-1010-4101-8101-101010101010";
const storagePath = `${draftInspectionId}/${itemId}/photo.jpg`;
const processedPhoto = { buffer: Buffer.from("processed-photo"), contentType: "image/jpeg" };
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

function validItemResultFormData(): FormData {
  return formData({
    inspectionId: draftInspectionId,
    itemId,
    resultStatus: "fail",
    resultNote: "  Repair dispenser  ",
  });
}

function validSkipFormData(): FormData {
  return formData({
    inspectionId: draftInspectionId,
    areaInspectionId,
    skipReason: "  Tenant closed area  ",
  });
}

function validAreaInspectionIdentityFormData(): FormData {
  return formData({ inspectionId: draftInspectionId, areaInspectionId });
}

function validOneOffFormData(): FormData {
  return formData({ inspectionId: draftInspectionId, areaId, inspectionTemplateId });
}

function validDraftIdentityFormData(): FormData {
  return formData({ inspectionId: draftInspectionId });
}

function validBeforePhotoFormData(): FormData {
  const data = formData({ inspectionId: draftInspectionId, itemId });
  data.set("photo", new File(["photo"], "before.jpg", { type: "image/jpeg" }));

  return data;
}

function validBeforePhotoRemovalFormData(): FormData {
  return formData({ inspectionId: draftInspectionId, itemId, evidenceId });
}

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;

  return error;
}

function oneOffSetupError(
  fields: Partial<Record<"areaId" | "inspectionTemplateId", string>>,
): Error & { fields: Partial<Record<"areaId" | "inspectionTemplateId", string>> } {
  const error = namedError("ActiveOneOffAreaInspectionSetupRequiredError") as Error & {
    fields: Partial<Record<"areaId" | "inspectionTemplateId", string>>;
  };
  error.fields = fields;

  return error;
}

function submissionValidationError(): Error & {
  validation: { ok: false; errors: { inspection: string } };
} {
  const error = namedError("DraftSubmissionValidationError") as Error & {
    validation: { ok: false; errors: { inspection: string } };
  };
  error.validation = {
    ok: false,
    errors: { inspection: "Submit at least one non-skipped Area Inspection." },
  };

  return error;
}

describe("Draft Inspection actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireProtectedAction.mockResolvedValue(supervisor);
    startDraftInspection.mockResolvedValue({ id: draftInspectionId, buildingId });
    saveDraftInspectionItemResult.mockResolvedValue({ id: draftInspectionId, removedStoragePaths: [] });
    skipDraftAreaInspection.mockResolvedValue({ id: draftInspectionId, removedStoragePaths: [] });
    unskipDraftAreaInspection.mockResolvedValue({ id: draftInspectionId });
    addOneOffAreaInspection.mockResolvedValue({ id: draftInspectionId });
    processInspectionPhoto.mockResolvedValue(processedPhoto);
    uploadInspectionEvidencePhoto.mockResolvedValue(storagePath);
    removeInspectionEvidencePhoto.mockResolvedValue(undefined);
    addDraftInspectionItemBeforePhoto.mockResolvedValue({ id: draftInspectionId });
    removeDraftInspectionItemBeforePhoto.mockResolvedValue({
      draft: { id: draftInspectionId },
      storagePath,
    });
    submitDraftInspection.mockResolvedValue({
      id: draftInspectionId,
      status: "submitted",
      ticketCount: 1,
      alreadySubmitted: false,
    });
    discardDraftInspection.mockResolvedValue({
      discardedInspectionId: draftInspectionId,
      removedStoragePaths: [],
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

  it("saves normalized item results through the draft-edit capability", async () => {
    await expect(
      saveDraftInspectionItemResultAction({ status: "idle" }, validItemResultFormData()),
    ).resolves.toEqual({
      status: "success",
      message: "Item result saved.",
      draftInspectionId,
      values: {
        inspectionId: draftInspectionId,
        itemId,
        resultStatus: "fail",
        resultNote: "Repair dispenser",
      },
    });

    expect(requireProtectedAction).toHaveBeenCalledWith("editDraftInspection");
    expect(saveDraftInspectionItemResult).toHaveBeenCalledWith({
      inspectionId: draftInspectionId,
      itemId,
      resultStatus: "fail",
      resultNote: "Repair dispenser",
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/drafts/${draftInspectionId}`);
  });

  it("removes orphaned Before Photo objects after item result cleanup", async () => {
    saveDraftInspectionItemResult.mockResolvedValueOnce({
      id: draftInspectionId,
      removedStoragePaths: [storagePath],
    });

    await expect(
      saveDraftInspectionItemResultAction({ status: "idle" }, validItemResultFormData()),
    ).resolves.toMatchObject({ status: "success", draftInspectionId });

    expect(removeInspectionEvidencePhoto).toHaveBeenCalledWith(storagePath);
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/drafts/${draftInspectionId}`);
  });

  it("does not save item results when Manager-only users fail draft-edit capability", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      saveDraftInspectionItemResultAction({ status: "idle" }, validItemResultFormData()),
    ).rejects.toThrow("redirect:/forbidden");

    expect(saveDraftInspectionItemResult).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns item result field errors without saving invalid input", async () => {
    await expect(
      saveDraftInspectionItemResultAction(
        { status: "idle" },
        formData({
          inspectionId: draftInspectionId,
          itemId: "not-an-item",
          resultStatus: "maybe",
          resultNote: "",
        }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: {
        itemId: "Select an inspection item.",
        resultStatus: "Select Pass, Fail, Not Applicable, or Unanswered.",
      },
      values: {
        inspectionId: draftInspectionId,
        itemId: "not-an-item",
        resultStatus: "maybe",
        resultNote: "",
      },
    });

    expect(saveDraftInspectionItemResult).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps skipped item edits to a form error", async () => {
    saveDraftInspectionItemResult.mockRejectedValueOnce(
      namedError("DraftInspectionMutationNotAllowedError"),
    );

    await expect(
      saveDraftInspectionItemResultAction({ status: "idle" }, validItemResultFormData()),
    ).resolves.toMatchObject({
      status: "error",
      errors: {},
      formError: "Draft Inspection cannot be changed this way.",
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("attaches Before Photos through draft-edit capability", async () => {
    await expect(
      addDraftInspectionItemBeforePhotoAction(
        { status: "idle" },
        validBeforePhotoFormData(),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Before Photo attached.",
      draftInspectionId,
    });

    expect(requireProtectedAction).toHaveBeenCalledWith("editDraftInspection");
    expect(processInspectionPhoto).toHaveBeenCalledWith(expect.any(File));
    expect(uploadInspectionEvidencePhoto).toHaveBeenCalledWith({
      inspectionId: draftInspectionId,
      itemId,
      photo: processedPhoto,
    });
    expect(addDraftInspectionItemBeforePhoto).toHaveBeenCalledWith({
      inspectionId: draftInspectionId,
      itemId,
      storagePath,
      uploadedByAuthUserId: supervisor.authUserId,
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/drafts/${draftInspectionId}`);
  });

  it("requires a selected Before Photo before upload", async () => {
    await expect(
      addDraftInspectionItemBeforePhotoAction(
        { status: "idle" },
        formData({ inspectionId: draftInspectionId, itemId }),
      ),
    ).resolves.toEqual({
      status: "error",
      errors: { photo: "Choose a Before Photo." },
      values: { inspectionId: draftInspectionId, itemId },
    });

    expect(processInspectionPhoto).not.toHaveBeenCalled();
    expect(uploadInspectionEvidencePhoto).not.toHaveBeenCalled();
    expect(addDraftInspectionItemBeforePhoto).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("removes uploaded Before Photo objects when metadata attach fails", async () => {
    addDraftInspectionItemBeforePhoto.mockRejectedValueOnce(
      namedError("DraftInspectionMutationNotAllowedError"),
    );

    await expect(
      addDraftInspectionItemBeforePhotoAction(
        { status: "idle" },
        validBeforePhotoFormData(),
      ),
    ).resolves.toMatchObject({
      status: "error",
      errors: {},
      formError: "Draft Inspection cannot be changed this way.",
    });

    expect(removeInspectionEvidencePhoto).toHaveBeenCalledWith(storagePath);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("removes Before Photos using the repository-owned storage path", async () => {
    await expect(
      removeDraftInspectionItemBeforePhotoAction(
        { status: "idle" },
        validBeforePhotoRemovalFormData(),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Before Photo removed.",
      draftInspectionId,
    });

    expect(requireProtectedAction).toHaveBeenCalledWith("editDraftInspection");
    expect(removeDraftInspectionItemBeforePhoto).toHaveBeenCalledWith({
      inspectionId: draftInspectionId,
      itemId,
      evidenceId,
    });
    expect(removeInspectionEvidencePhoto).toHaveBeenCalledWith(storagePath);
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/drafts/${draftInspectionId}`);
  });

  it("skips and unskips planned Area Inspections through draft-edit capability", async () => {
    await expect(
      skipDraftAreaInspectionAction({ status: "idle" }, validSkipFormData()),
    ).resolves.toEqual({
      status: "success",
      message: "Area Inspection skipped.",
      draftInspectionId,
    });

    expect(skipDraftAreaInspection).toHaveBeenCalledWith({
      inspectionId: draftInspectionId,
      areaInspectionId,
      skipReason: "Tenant closed area",
    });

    await expect(
      unskipDraftAreaInspectionAction(
        { status: "idle" },
        validAreaInspectionIdentityFormData(),
      ),
    ).resolves.toEqual({
      status: "success",
      message: "Area Inspection unskipped.",
      draftInspectionId,
    });

    expect(unskipDraftAreaInspection).toHaveBeenCalledWith({
      inspectionId: draftInspectionId,
      areaInspectionId,
    });
    expect(requireProtectedAction).toHaveBeenCalledWith("editDraftInspection");
  });

  it("removes orphaned Before Photo objects after skipping an area", async () => {
    skipDraftAreaInspection.mockResolvedValueOnce({
      id: draftInspectionId,
      removedStoragePaths: [storagePath],
    });

    await expect(
      skipDraftAreaInspectionAction({ status: "idle" }, validSkipFormData()),
    ).resolves.toMatchObject({ status: "success", draftInspectionId });

    expect(removeInspectionEvidencePhoto).toHaveBeenCalledWith(storagePath);
  });

  it("adds one-off Area Inspections and maps inactive setup errors", async () => {
    addOneOffAreaInspection.mockRejectedValueOnce(
      oneOffSetupError({ areaId: "Select an active Area for this Building." }),
    );

    await expect(
      addOneOffAreaInspectionAction({ status: "idle" }, validOneOffFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: { areaId: "Select an active Area for this Building." },
      values: { inspectionId: draftInspectionId, areaId, inspectionTemplateId },
    });

    expect(revalidatePath).not.toHaveBeenCalled();

    addOneOffAreaInspection.mockResolvedValueOnce({ id: draftInspectionId });

    await expect(
      addOneOffAreaInspectionAction({ status: "idle" }, validOneOffFormData()),
    ).resolves.toEqual({
      status: "success",
      message: "One-off Area Inspection added.",
      draftInspectionId,
    });
  });

  it("submits valid Draft Inspections and redirects to the submitted Inspection", async () => {
    await expect(
      submitDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).rejects.toThrow(`NEXT_REDIRECT:/inspections/${draftInspectionId}`);

    expect(requireProtectedAction).toHaveBeenCalledWith("submitDraftInspection");
    expect(submitDraftInspection).toHaveBeenCalledWith(
      { inspectionId: draftInspectionId, confirmSkippedPlannedAreas: false },
      supervisor,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/inspections");
    expect(revalidatePath).toHaveBeenCalledWith("/tickets");
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/drafts/${draftInspectionId}`);
    expect(redirect).toHaveBeenCalledWith(`/inspections/${draftInspectionId}`);
  });

  it("maps already-submitted retries to a success message", async () => {
    submitDraftInspection.mockResolvedValueOnce({
      id: draftInspectionId,
      status: "submitted",
      ticketCount: 2,
      alreadySubmitted: true,
    });

    await expect(
      submitDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).rejects.toThrow(`NEXT_REDIRECT:/inspections/${draftInspectionId}`);

    expect(revalidatePath).toHaveBeenCalledWith("/inspections");
    expect(revalidatePath).toHaveBeenCalledWith("/tickets");
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/drafts/${draftInspectionId}`);
    expect(redirect).toHaveBeenCalledWith(`/inspections/${draftInspectionId}`);
  });

  it("returns submission validation errors without revalidating unchanged Drafts", async () => {
    submitDraftInspection.mockRejectedValueOnce(submissionValidationError());

    await expect(
      submitDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: {},
      values: { inspectionId: draftInspectionId },
      validation: {
        ok: false,
        errors: { inspection: "Submit at least one non-skipped Area Inspection." },
      },
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns an error when skipped planned Area confirmation is missing", async () => {
    const error = new Error("confirmation required");
    error.name = "DraftSubmissionConfirmationRequiredError";
    submitDraftInspection.mockRejectedValueOnce(error);

    await expect(
      submitDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).resolves.toEqual({
      status: "error",
      errors: {},
      values: { inspectionId: draftInspectionId },
      formError: "Confirm the skipped planned Area Inspections before final submit.",
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not submit when Manager-only users fail submit capability", async () => {
    requireProtectedAction.mockRejectedValueOnce(new Error("redirect:/forbidden"));

    await expect(
      submitDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).rejects.toThrow("redirect:/forbidden");

    expect(submitDraftInspection).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("discards Draft Inspections and redirects to active drafts", async () => {
    await expect(
      discardDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/inspections/drafts");

    expect(requireProtectedAction).toHaveBeenCalledWith("editDraftInspection");
    expect(discardDraftInspection).toHaveBeenCalledWith({ inspectionId: draftInspectionId });
    expect(revalidatePath).toHaveBeenCalledWith("/inspections");
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/drafts/${draftInspectionId}`);
    expect(redirect).toHaveBeenCalledWith("/inspections/drafts");
  });

  it("removes orphaned Before Photo objects after discarding a draft", async () => {
    discardDraftInspection.mockResolvedValueOnce({
      discardedInspectionId: draftInspectionId,
      removedStoragePaths: [storagePath],
    });

    await expect(
      discardDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/inspections/drafts");

    expect(removeInspectionEvidencePhoto).toHaveBeenCalledWith(storagePath);
  });

  it("maps missing Draft mutations to form errors", async () => {
    discardDraftInspection.mockRejectedValueOnce(namedError("DraftInspectionNotFoundError"));

    await expect(
      discardDraftInspectionAction({ status: "idle" }, validDraftIdentityFormData()),
    ).resolves.toMatchObject({
      status: "error",
      errors: {},
      formError: "Draft Inspection was not found.",
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
