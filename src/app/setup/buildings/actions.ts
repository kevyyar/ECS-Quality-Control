"use server";

import { revalidatePath } from "next/cache";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseBuildingNameFormData,
  parseBuildingFormData,
  parseIdFormData,
  type BuildingFieldErrors,
  type BuildingFormValues,
} from "@/lib/client-building-setup/model";
import {
  archiveBuilding,
  createBuilding,
  isSetupRecordNotFoundError,
  restoreBuilding,
  updateBuilding,
} from "@/lib/client-building-setup/repository";

export type BuildingSetupActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      errors: BuildingFieldErrors;
      values: BuildingFormValues;
    };

function revalidateBuildingSetupViews(buildingId?: string, clientId?: string): void {
  revalidatePath("/setup");
  revalidatePath("/setup/buildings");
  revalidatePath("/setup/areas");

  if (buildingId) {
    revalidatePath(`/setup/buildings/${buildingId}`);
  }

  if (clientId) {
    revalidatePath(`/setup/clients/${clientId}`);
  }
}

function invalidBuildingIdState(): BuildingSetupActionState {
  return {
    status: "error",
    errors: { name: "A valid Building is required." },
    values: { clientId: "", name: "" },
  };
}

function activeClientRequiredState(
  values: BuildingFormValues,
): BuildingSetupActionState {
  return {
    status: "error",
    errors: { clientId: "Select an active Client." },
    values,
  };
}

function isActiveClientError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message === "Building must belong to an active Client."
  );
}

export async function createBuildingAction(
  _previousState: BuildingSetupActionState,
  formData: FormData,
): Promise<BuildingSetupActionState> {
  await requireProtectedAction("manageSetup");

  const result = parseBuildingFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  let building: Awaited<ReturnType<typeof createBuilding>>;

  try {
    building = await createBuilding(result.data);
  } catch (error) {
    if (isActiveClientError(error)) {
      return activeClientRequiredState(result.data);
    }

    throw error;
  }

  revalidateBuildingSetupViews(building.id, building.clientId);

  return { status: "success", message: "Building saved." };
}

export async function updateBuildingAction(
  _previousState: BuildingSetupActionState,
  formData: FormData,
): Promise<BuildingSetupActionState> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return invalidBuildingIdState();
  }

  const nameResult = parseBuildingNameFormData(formData);

  if (!nameResult.ok) {
    return {
      status: "error",
      errors: { name: nameResult.error },
      values: { clientId: "", name: nameResult.value },
    };
  }

  let building: Awaited<ReturnType<typeof updateBuilding>>;

  try {
    building = await updateBuilding(idResult.id, { name: nameResult.name });
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return invalidBuildingIdState();
    }

    throw error;
  }

  revalidateBuildingSetupViews(building.id, building.clientId);

  return { status: "success", message: "Building saved." };
}

export async function archiveBuildingAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let building: Awaited<ReturnType<typeof archiveBuilding>>;

  try {
    building = await archiveBuilding(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateBuildingSetupViews(building.id, building.clientId);
}

export async function restoreBuildingAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let building: Awaited<ReturnType<typeof restoreBuilding>>;

  try {
    building = await restoreBuilding(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateBuildingSetupViews(building.id, building.clientId);
}
