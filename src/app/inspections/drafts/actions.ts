"use server";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseStartDraftInspectionFormData,
  type StartDraftInspectionFieldErrors,
  type StartDraftInspectionFormValues,
} from "@/lib/inspections/drafts/model";
import {
  isActiveBuildingInspectionPlanRequiredForDraftError,
  isActiveBuildingRequiredForDraftError,
  isActiveDraftInspectionAlreadyExistsError,
  startDraftInspection,
} from "@/lib/inspections/drafts/repository";

import { revalidateDraftInspectionViews } from "./revalidation";

export type StartDraftInspectionActionState =
  | { status: "idle" }
  | {
      status: "success";
      message: string;
      draftInspectionId: string;
    }
  | {
      status: "error";
      errors: StartDraftInspectionFieldErrors;
      values: StartDraftInspectionFormValues;
    };

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
