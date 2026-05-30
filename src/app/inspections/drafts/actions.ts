"use server";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseAddOneOffAreaInspectionFormData,
  parseDiscardDraftInspectionFormData,
  parseSaveDraftInspectionItemResultFormData,
  parseSkipDraftAreaInspectionFormData,
  parseStartDraftInspectionFormData,
  parseSubmitDraftInspectionFormData,
  parseUnskipDraftAreaInspectionFormData,
  type AddOneOffAreaInspectionFieldErrors,
  type AddOneOffAreaInspectionFormValues,
  type AreaInspectionIdentityFieldErrors,
  type AreaInspectionIdentityFormValues,
  type DraftInspectionIdentityFieldErrors,
  type DraftInspectionIdentityFormValues,
  type DraftSubmissionValidation,
  type SaveDraftInspectionItemResultFieldErrors,
  type SaveDraftInspectionItemResultFormValues,
  type SkipDraftAreaInspectionFieldErrors,
  type SkipDraftAreaInspectionFormValues,
  type StartDraftInspectionFieldErrors,
  type StartDraftInspectionFormValues,
} from "@/lib/inspections/drafts/model";
import {
  addOneOffAreaInspection,
  discardDraftInspection,
  isActiveBuildingInspectionPlanRequiredForDraftError,
  isActiveBuildingRequiredForDraftError,
  isActiveDraftInspectionAlreadyExistsError,
  isActiveOneOffAreaInspectionSetupRequiredError,
  isDraftInspectionMutationNotAllowedError,
  isDraftInspectionNotFoundError,
  isDraftSubmissionValidationError,
  saveDraftInspectionItemResult,
  skipDraftAreaInspection,
  startDraftInspection,
  submitDraftInspection,
  unskipDraftAreaInspection,
} from "@/lib/inspections/drafts/repository";

import { revalidateDraftInspectionViews } from "./revalidation";

type ActionErrorState<TValues, TErrors> = {
  status: "error";
  errors: TErrors;
  values: TValues;
  formError?: string;
};

type DraftMutationSuccessState = {
  status: "success";
  message: string;
  draftInspectionId: string;
};

export type StartDraftInspectionActionState =
  | { status: "idle" }
  | DraftMutationSuccessState
  | ActionErrorState<StartDraftInspectionFormValues, StartDraftInspectionFieldErrors>;

export type SaveDraftInspectionItemResultActionState =
  | { status: "idle" }
  | DraftMutationSuccessState
  | ActionErrorState<
      SaveDraftInspectionItemResultFormValues,
      SaveDraftInspectionItemResultFieldErrors
    >;

export type SkipDraftAreaInspectionActionState =
  | { status: "idle" }
  | DraftMutationSuccessState
  | ActionErrorState<SkipDraftAreaInspectionFormValues, SkipDraftAreaInspectionFieldErrors>;

export type UnskipDraftAreaInspectionActionState =
  | { status: "idle" }
  | DraftMutationSuccessState
  | ActionErrorState<AreaInspectionIdentityFormValues, AreaInspectionIdentityFieldErrors>;

export type AddOneOffAreaInspectionActionState =
  | { status: "idle" }
  | DraftMutationSuccessState
  | ActionErrorState<AddOneOffAreaInspectionFormValues, AddOneOffAreaInspectionFieldErrors>;

export type SubmitDraftInspectionActionState =
  | { status: "idle" }
  | {
      status: "success";
      message: string;
      submittedInspectionId: string;
      ticketCount: number;
    }
  | (ActionErrorState<DraftInspectionIdentityFormValues, DraftInspectionIdentityFieldErrors> & {
      validation?: DraftSubmissionValidation;
    });

export type DiscardDraftInspectionActionState =
  | { status: "idle" }
  | {
      status: "success";
      message: string;
      discardedInspectionId: string;
    }
  | ActionErrorState<DraftInspectionIdentityFormValues, DraftInspectionIdentityFieldErrors>;

function draftMutationErrorMessage(error: unknown): string | undefined {
  if (isDraftInspectionNotFoundError(error)) {
    return "Draft Inspection was not found.";
  }

  if (isDraftInspectionMutationNotAllowedError(error)) {
    return "Draft Inspection cannot be changed this way.";
  }

  return undefined;
}

function ticketMessage(ticketCount: number): string {
  if (ticketCount === 0) {
    return "Draft Inspection submitted. No Tickets created.";
  }

  if (ticketCount === 1) {
    return "Draft Inspection submitted. 1 Ticket created.";
  }

  return `Draft Inspection submitted. ${ticketCount} Tickets created.`;
}

function saveItemValues(
  data: Parameters<typeof saveDraftInspectionItemResult>[0],
): SaveDraftInspectionItemResultFormValues {
  return {
    inspectionId: data.inspectionId,
    itemId: data.itemId,
    resultStatus: data.resultStatus ?? "",
    resultNote: data.resultNote,
  };
}

export async function startDraftInspectionAction(
  _previousState: StartDraftInspectionActionState,
  formData: FormData,
): Promise<StartDraftInspectionActionState> {
  const user = await requireProtectedAction("editDraftInspection");
  const result = parseStartDraftInspectionFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  try {
    const draft = await startDraftInspection(result.data, user);

    revalidateDraftInspectionViews(draft.id);

    return {
      status: "success",
      message: "Draft Inspection started.",
      draftInspectionId: draft.id,
    };
  } catch (error) {
    if (isActiveBuildingRequiredForDraftError(error)) {
      return {
        status: "error",
        errors: { buildingId: "Select an active Building." },
        values: { buildingId: result.data.buildingId },
      };
    }

    if (isActiveBuildingInspectionPlanRequiredForDraftError(error)) {
      return {
        status: "error",
        errors: {
          buildingId: "Select a Building with an active Building Inspection Plan.",
        },
        values: { buildingId: result.data.buildingId },
      };
    }

    if (isActiveDraftInspectionAlreadyExistsError(error)) {
      return {
        status: "error",
        errors: {
          buildingId: "This Building already has an active Draft Inspection.",
        },
        values: { buildingId: result.data.buildingId },
      };
    }

    throw error;
  }
}

export async function saveDraftInspectionItemResultAction(
  _previousState: SaveDraftInspectionItemResultActionState,
  formData: FormData,
): Promise<SaveDraftInspectionItemResultActionState> {
  await requireProtectedAction("editDraftInspection");
  const result = parseSaveDraftInspectionItemResultFormData(formData);

  if (!result.ok) {
    return { status: "error", errors: result.errors, values: result.values };
  }

  try {
    const draft = await saveDraftInspectionItemResult(result.data);
    revalidateDraftInspectionViews(draft.id);

    return {
      status: "success",
      message: "Item result saved.",
      draftInspectionId: draft.id,
    };
  } catch (error) {
    const formError = draftMutationErrorMessage(error);

    if (formError) {
      return {
        status: "error",
        errors: {},
        values: saveItemValues(result.data),
        formError,
      };
    }

    throw error;
  }
}

export async function skipDraftAreaInspectionAction(
  _previousState: SkipDraftAreaInspectionActionState,
  formData: FormData,
): Promise<SkipDraftAreaInspectionActionState> {
  await requireProtectedAction("editDraftInspection");
  const result = parseSkipDraftAreaInspectionFormData(formData);

  if (!result.ok) {
    return { status: "error", errors: result.errors, values: result.values };
  }

  try {
    const draft = await skipDraftAreaInspection(result.data);
    revalidateDraftInspectionViews(draft.id);

    return {
      status: "success",
      message: "Area Inspection skipped.",
      draftInspectionId: draft.id,
    };
  } catch (error) {
    const formError = draftMutationErrorMessage(error);

    if (formError) {
      return { status: "error", errors: {}, values: result.data, formError };
    }

    throw error;
  }
}

export async function unskipDraftAreaInspectionAction(
  _previousState: UnskipDraftAreaInspectionActionState,
  formData: FormData,
): Promise<UnskipDraftAreaInspectionActionState> {
  await requireProtectedAction("editDraftInspection");
  const result = parseUnskipDraftAreaInspectionFormData(formData);

  if (!result.ok) {
    return { status: "error", errors: result.errors, values: result.values };
  }

  try {
    const draft = await unskipDraftAreaInspection(result.data);
    revalidateDraftInspectionViews(draft.id);

    return {
      status: "success",
      message: "Area Inspection unskipped.",
      draftInspectionId: draft.id,
    };
  } catch (error) {
    const formError = draftMutationErrorMessage(error);

    if (formError) {
      return { status: "error", errors: {}, values: result.data, formError };
    }

    throw error;
  }
}

export async function addOneOffAreaInspectionAction(
  _previousState: AddOneOffAreaInspectionActionState,
  formData: FormData,
): Promise<AddOneOffAreaInspectionActionState> {
  await requireProtectedAction("editDraftInspection");
  const result = parseAddOneOffAreaInspectionFormData(formData);

  if (!result.ok) {
    return { status: "error", errors: result.errors, values: result.values };
  }

  try {
    const draft = await addOneOffAreaInspection(result.data);
    revalidateDraftInspectionViews(draft.id);

    return {
      status: "success",
      message: "One-off Area Inspection added.",
      draftInspectionId: draft.id,
    };
  } catch (error) {
    if (isActiveOneOffAreaInspectionSetupRequiredError(error)) {
      return { status: "error", errors: error.fields, values: result.data };
    }

    const formError = draftMutationErrorMessage(error);

    if (formError) {
      return { status: "error", errors: {}, values: result.data, formError };
    }

    throw error;
  }
}

export async function submitDraftInspectionAction(
  _previousState: SubmitDraftInspectionActionState,
  formData: FormData,
): Promise<SubmitDraftInspectionActionState> {
  const user = await requireProtectedAction("submitDraftInspection");
  const result = parseSubmitDraftInspectionFormData(formData);

  if (!result.ok) {
    return { status: "error", errors: result.errors, values: result.values };
  }

  try {
    const submitted = await submitDraftInspection(result.data, user);
    revalidateDraftInspectionViews(submitted.id);

    return {
      status: "success",
      message: ticketMessage(submitted.ticketCount),
      submittedInspectionId: submitted.id,
      ticketCount: submitted.ticketCount,
    };
  } catch (error) {
    if (isDraftSubmissionValidationError(error)) {
      return {
        status: "error",
        errors: {},
        values: result.data,
        validation: error.validation,
      };
    }

    const formError = draftMutationErrorMessage(error);

    if (formError) {
      return { status: "error", errors: {}, values: result.data, formError };
    }

    throw error;
  }
}

export async function discardDraftInspectionAction(
  _previousState: DiscardDraftInspectionActionState,
  formData: FormData,
): Promise<DiscardDraftInspectionActionState> {
  await requireProtectedAction("editDraftInspection");
  const result = parseDiscardDraftInspectionFormData(formData);

  if (!result.ok) {
    return { status: "error", errors: result.errors, values: result.values };
  }

  try {
    const discarded = await discardDraftInspection(result.data);
    revalidateDraftInspectionViews(discarded.discardedInspectionId);

    return {
      status: "success",
      message: "Draft Inspection discarded.",
      discardedInspectionId: discarded.discardedInspectionId,
    };
  } catch (error) {
    const formError = draftMutationErrorMessage(error);

    if (formError) {
      return { status: "error", errors: {}, values: result.data, formError };
    }

    throw error;
  }
}
