"use server";

import { revalidatePath } from "next/cache";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseAreaFormData,
  parseAreaNameFormData,
  parseIdFormData,
  type AreaFieldErrors,
  type AreaFormValues,
} from "@/lib/client-building-setup/model";
import {
  archiveArea,
  createArea,
  isActiveAreaParentsRequiredError,
  isSetupRecordNotFoundError,
  restoreArea,
  updateArea,
} from "@/lib/client-building-setup/repository";

export type AreaSetupActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      errors: AreaFieldErrors;
      values: AreaFormValues;
    };

function revalidateAreaSetupViews(
  areaId?: string,
  buildingId?: string,
  areaTypeId?: string,
): void {
  revalidatePath("/setup");
  revalidatePath("/setup/areas");

  if (areaId) {
    revalidatePath(`/setup/areas/${areaId}`);
  }

  if (buildingId) {
    revalidatePath(`/setup/buildings/${buildingId}`);
  }

  if (areaTypeId) {
    revalidatePath(`/setup/area-types/${areaTypeId}`);
  }
}

function invalidAreaIdState(): AreaSetupActionState {
  return {
    status: "error",
    errors: { name: "A valid Area is required." },
    values: { buildingId: "", areaTypeId: "", name: "" },
  };
}

function activeParentsRequiredState(
  values: AreaFormValues,
  fields: readonly (keyof Pick<AreaFieldErrors, "buildingId" | "areaTypeId">)[],
): AreaSetupActionState {
  const errors: AreaFieldErrors = {};

  if (fields.includes("buildingId")) {
    errors.buildingId = "Select an active Building.";
  }

  if (fields.includes("areaTypeId")) {
    errors.areaTypeId = "Select an active Area Type.";
  }

  return { status: "error", errors, values };
}

export async function createAreaAction(
  _previousState: AreaSetupActionState,
  formData: FormData,
): Promise<AreaSetupActionState> {
  await requireProtectedAction("manageSetup");

  const result = parseAreaFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  let area: Awaited<ReturnType<typeof createArea>>;

  try {
    area = await createArea(result.data);
  } catch (error) {
    if (isActiveAreaParentsRequiredError(error)) {
      return activeParentsRequiredState(result.data, error.fields);
    }

    throw error;
  }

  revalidateAreaSetupViews(area.id, area.buildingId, area.areaTypeId);

  return { status: "success", message: "Area saved." };
}

export async function updateAreaAction(
  _previousState: AreaSetupActionState,
  formData: FormData,
): Promise<AreaSetupActionState> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return invalidAreaIdState();
  }

  const nameResult = parseAreaNameFormData(formData);

  if (!nameResult.ok) {
    return {
      status: "error",
      errors: { name: nameResult.error },
      values: { buildingId: "", areaTypeId: "", name: nameResult.value },
    };
  }

  let area: Awaited<ReturnType<typeof updateArea>>;

  try {
    area = await updateArea(idResult.id, { name: nameResult.name });
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return invalidAreaIdState();
    }

    throw error;
  }

  revalidateAreaSetupViews(area.id, area.buildingId, area.areaTypeId);

  return { status: "success", message: "Area saved." };
}

export async function archiveAreaAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let area: Awaited<ReturnType<typeof archiveArea>>;

  try {
    area = await archiveArea(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateAreaSetupViews(area.id, area.buildingId, area.areaTypeId);
}

export async function restoreAreaAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let area: Awaited<ReturnType<typeof restoreArea>>;

  try {
    area = await restoreArea(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateAreaSetupViews(area.id, area.buildingId, area.areaTypeId);
}
