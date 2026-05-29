"use server";

import { revalidatePath } from "next/cache";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  parseIdFormData,
  parseInspectionTemplateFormData,
  type InspectionTemplateFieldErrors,
  type InspectionTemplateFormValues,
  type InspectionTemplateItemFieldErrors,
} from "@/lib/client-building-setup/model";
import {
  archiveInspectionTemplate,
  createInspectionTemplate,
  duplicateInspectionTemplate,
  isSetupRecordNotFoundError,
  restoreInspectionTemplate,
  updateInspectionTemplate,
} from "@/lib/client-building-setup/repository";

import { revalidateBuildingInspectionPlanViews } from "../building-inspection-plans/revalidation";

export type InspectionTemplateSetupActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      errors: InspectionTemplateFieldErrors;
      itemErrors: InspectionTemplateItemFieldErrors[];
      values: InspectionTemplateFormValues;
    };

function revalidateInspectionTemplateSetupViews(templateId?: string): void {
  revalidatePath("/setup");
  revalidatePath("/setup/inspection-templates");
  revalidateBuildingInspectionPlanViews();

  if (templateId) {
    revalidatePath(`/setup/inspection-templates/${templateId}`);
  }
}

function emptyInspectionTemplateValues(): InspectionTemplateFormValues {
  return { name: "", description: "", sections: [], items: [] };
}

function invalidInspectionTemplateIdState(): InspectionTemplateSetupActionState {
  return {
    status: "error",
    errors: { name: "A valid Inspection Template is required." },
    itemErrors: [],
    values: emptyInspectionTemplateValues(),
  };
}

export async function createInspectionTemplateAction(
  _previousState: InspectionTemplateSetupActionState,
  formData: FormData,
): Promise<InspectionTemplateSetupActionState> {
  await requireProtectedAction("manageSetup");

  const result = parseInspectionTemplateFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      itemErrors: result.itemErrors,
      values: result.values,
    };
  }

  const template = await createInspectionTemplate(result.data);
  revalidateInspectionTemplateSetupViews(template.id);

  return { status: "success", message: "Inspection Template saved." };
}

export async function updateInspectionTemplateAction(
  _previousState: InspectionTemplateSetupActionState,
  formData: FormData,
): Promise<InspectionTemplateSetupActionState> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return invalidInspectionTemplateIdState();
  }

  const result = parseInspectionTemplateFormData(formData);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      itemErrors: result.itemErrors,
      values: result.values,
    };
  }

  let template: Awaited<ReturnType<typeof updateInspectionTemplate>>;

  try {
    template = await updateInspectionTemplate(idResult.id, result.data);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return invalidInspectionTemplateIdState();
    }

    throw error;
  }

  revalidateInspectionTemplateSetupViews(template.id);

  return { status: "success", message: "Inspection Template saved." };
}

export async function duplicateInspectionTemplateAction(
  formData: FormData,
): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let template: Awaited<ReturnType<typeof duplicateInspectionTemplate>>;

  try {
    template = await duplicateInspectionTemplate(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateInspectionTemplateSetupViews(template.id);
}

export async function archiveInspectionTemplateAction(
  formData: FormData,
): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let template: Awaited<ReturnType<typeof archiveInspectionTemplate>>;

  try {
    template = await archiveInspectionTemplate(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateInspectionTemplateSetupViews(template.id);
}

export async function restoreInspectionTemplateAction(
  formData: FormData,
): Promise<void> {
  await requireProtectedAction("manageSetup");

  const idResult = parseIdFormData(formData);

  if (!idResult.ok) {
    return;
  }

  let template: Awaited<ReturnType<typeof restoreInspectionTemplate>>;

  try {
    template = await restoreInspectionTemplate(idResult.id);
  } catch (error) {
    if (isSetupRecordNotFoundError(error)) {
      return;
    }

    throw error;
  }

  revalidateInspectionTemplateSetupViews(template.id);
}
