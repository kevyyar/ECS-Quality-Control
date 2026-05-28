"use server";

import { revalidatePath } from "next/cache";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseAreaTypeFormData,
  parseIdFormData,
  type AreaTypeFieldErrors,
  type AreaTypeFormValues,
} from "@/lib/client-building-setup/model";
import {
  archiveAreaType,
  createAreaType,
  isSetupRecordNotFoundError,
  restoreAreaType,
  updateAreaType,
} from "@/lib/client-building-setup/repository";

export type AreaTypeSetupActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      errors: AreaTypeFieldErrors;
      values: AreaTypeFormValues;
    };

function revalidateAreaTypeSetupViews(areaTypeId?: string): void {
  revalidatePath("/setup");
  revalidatePath("/setup/area-types");
  revalidatePath("/setup/areas");

  if (areaTypeId) {
    revalidatePath(`/setup/area-types/${areaTypeId}`);
  }
}

function invalidAreaTypeIdState(): AreaTypeSetupActionState {
  return {
    status: "error",
    errors: { name: "A valid Area Type is required." },
    values: { name: "" },
  };
}

export async function createAreaTypeAction(
  _previousState: AreaTypeSetupActionState,
  formData: FormData,
): Promise<AreaTypeSetupActionState> {
  await requireProtectedAction("manageSetup");

  const result = parseAreaTypeFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  const areaType = await createAreaType(result.data);
  revalidateAreaTypeSetupViews(areaType.id);

  return { status: "success", message: "Area Type saved." };
}

export async function updateAreaTypeAction(
  _previousState: AreaTypeSetupActionState,
  formData: FormData,
): Promise<AreaTypeSetupActionState> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return invalidAreaTypeIdState();
  }

  const result = parseAreaTypeFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values: result.values,
    };
  }

  let areaType: Awaited<ReturnType<typeof updateAreaType>>;

  try {
    areaType = await updateAreaType(idResult.id, result.data);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return invalidAreaTypeIdState();
    }

    throw error;
  }

  revalidateAreaTypeSetupViews(areaType.id);

  return { status: "success", message: "Area Type saved." };
}

export async function archiveAreaTypeAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let areaType: Awaited<ReturnType<typeof archiveAreaType>>;

  try {
    areaType = await archiveAreaType(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateAreaTypeSetupViews(areaType.id);
}

export async function restoreAreaTypeAction(formData: FormData): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let areaType: Awaited<ReturnType<typeof restoreAreaType>>;

  try {
    areaType = await restoreAreaType(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateAreaTypeSetupViews(areaType.id);
}
