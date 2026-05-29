"use server";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseBuildingInspectionPlanFormData,
  type BuildingInspectionPlanFieldErrors,
  type BuildingInspectionPlanFormValues,
  type BuildingInspectionPlanEntryFieldErrors,
} from "@/lib/client-building-setup/model";
import {
  isActiveBuildingInspectionPlanBuildingRequiredError,
  isActiveBuildingInspectionPlanEntriesRequiredError,
  saveBuildingInspectionPlan,
} from "@/lib/client-building-setup/repository";

import { revalidateBuildingInspectionPlanViews } from "./revalidation";

export type BuildingInspectionPlanSetupActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      errors: BuildingInspectionPlanFieldErrors;
      entryErrors: BuildingInspectionPlanEntryFieldErrors[];
      values: BuildingInspectionPlanFormValues;
};

export async function saveBuildingInspectionPlanAction(
  _previousState: BuildingInspectionPlanSetupActionState,
  formData: FormData,
): Promise<BuildingInspectionPlanSetupActionState> {
  await requireProtectedAction("manageSetup");

  const result = parseBuildingInspectionPlanFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      entryErrors: result.entryErrors,
      values: result.values,
    };
  }

  try {
    await saveBuildingInspectionPlan(result.data);
  } catch (error) {
    if (isActiveBuildingInspectionPlanBuildingRequiredError(error)) {
      return {
        status: "error",
        errors: { buildingId: "Select an active Building." },
        entryErrors: [],
        values: {
          buildingId: result.data.buildingId,
          entries: result.data.entries.map((entry) => ({
            areaId: entry.areaId,
            inspectionTemplateId: entry.inspectionTemplateId,
          })),
        },
      };
    }

    if (isActiveBuildingInspectionPlanEntriesRequiredError(error)) {
      return {
        status: "error",
        errors: {},
        entryErrors: error.entryErrors,
        values: {
          buildingId: result.data.buildingId,
          entries: result.data.entries.map((entry) => ({
            areaId: entry.areaId,
            inspectionTemplateId: entry.inspectionTemplateId,
          })),
        },
      };
    }

    throw error;
  }

  revalidateBuildingInspectionPlanViews(result.data.buildingId);

  return { status: "success", message: "Building Inspection Plan saved." };
}
